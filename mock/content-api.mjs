import {createHash,timingSafeEqual} from 'node:crypto'
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {randomBytes} from 'node:crypto'
import {fileURLToPath} from 'node:url'
import {reject} from './contracts.mjs'
import {validateApiRequest} from './api-contracts.mjs'

export function localContentAdminKey(){
  if(process.env.KIDSVERSE_MOCK_CONTENT_ADMIN_KEY)return process.env.KIDSVERSE_MOCK_CONTENT_ADMIN_KEY
  const directory=fileURLToPath(new URL('../.mock-data/',import.meta.url)),filename=fileURLToPath(new URL('../.mock-data/content-admin.key',import.meta.url))
  mkdirSync(directory,{recursive:true})
  try{return readFileSync(filename,'utf8').trim()}catch(error){if(error.code!=='ENOENT')throw error}
  const key=randomBytes(32).toString('hex')
  try{writeFileSync(filename,key,{flag:'wx'});return key}catch(error){if(error.code!=='EEXIST')throw error;return readFileSync(filename,'utf8').trim()}
}

export function createContentApi(repository,{adminKey}={}){
  const digest=v=>createHash('sha256').update(v).digest()
  const authorize=context=>{if(!adminKey||typeof context.contentAdminKey!=='string'||!timingSafeEqual(digest(adminKey),digest(context.contentAdminKey)))reject(403,'Local content admin key required. Parent tokens cannot author content.')}
  const shape=(body,fields,required=fields)=>{
    if(!body||typeof body!=='object'||Array.isArray(body))reject(400,'Request must be a JSON object')
    for(const k of Object.keys(body))if(!fields.includes(k))reject(400,`Unknown field: ${k}`)
    for(const k of required)if(typeof body[k]!=='string'||!body[k].trim()||body[k].length>4000)reject(400,`Invalid or missing ${k}`)
    for(const [k,v]of Object.entries(body))if(typeof v!=='string'||v.length>4000)reject(400,`Invalid ${k}`)
  }
  return (method,pathname,body,context={})=>{
    const url=new URL(pathname,'http://mock.local'),path=url.pathname,filters=Object.fromEntries(url.searchParams)
    const ok=(data,status=200)=>({status,data})
    const create=path.match(/^\/(curriculums|themes)$|^\/curriculums\/([^/]+)\/subjects$|^\/subjects\/([^/]+)\/topics$|^\/topics\/([^/]+)\/concepts$/)
    if(method==='POST'&&create){
      authorize(context)
      validateApiRequest(method,path,body)
      const table=create[1]||(create[2]?'subjects':create[3]?'topics':'concepts')
      const fields=table==='curriculums'?['board','grade','name','description']:table==='themes'?['name','description','icon_asset']:table==='concepts'?['name','learning_objective']:['name']
      shape(body,fields,fields.filter(k=>!['description','icon_asset'].includes(k)))
      return ok(repository.createEntity(table,body,create[2]||create[3]||create[4]),201)
    }
    const entity=path.match(/^\/(curriculums|subjects|topics|concepts|themes)\/([^/]+)$/)
    if(entity&&['PATCH','DELETE'].includes(method)){
      authorize(context)
      validateApiRequest(method,path,body)
      const fields={curriculums:['board','grade','name','description'],subjects:['name'],topics:['name'],concepts:['name','learning_objective'],themes:['name','description','icon_asset']}[entity[1]]
      shape(body,method==='DELETE'?[]:fields,[])
      if(method==='PATCH'&&!Object.keys(body).length)reject(400,'Supply at least one metadata field')
      const data=repository.mutateEntity(entity[1],entity[2],method,body)
      return ok(data,method==='DELETE'?204:200)
    }
    if(path.startsWith('/admin/content/')){
      authorize(context)
      validateApiRequest(method,path,body)
      if(path==='/admin/content/feed'){
        if(method!=='POST')reject(405,'Use POST for content ingestion')
        return ok(repository.feed(body),201)
      }
      if(path==='/admin/content/drafts'){
        if(method!=='POST')reject(405,'Use POST to create a draft')
        return ok(repository.feed(body,{},false),201)
      }
      if(path==='/admin/content/packages'){
        if(method!=='GET')reject(405,'Use GET for content packages')
        const packages=repository.list(filters);return ok({count:packages.length,packages})
      }
      const detail=path.match(/^\/admin\/content\/packages\/([^/]+)$/)
      if(detail){
        if(method==='GET')return ok(repository.detail(detail[1],filters.version===undefined?undefined:Number(filters.version)))
        if(method==='PUT'){
          if(!body||Object.keys(body).some(k=>!['expected_version','content'].includes(k))||!Number.isInteger(body.expected_version)||body.expected_version<1)reject(400,'Update requires content and expected_version')
          repository.detail(detail[1]);return ok(repository.feed(body.content,{},false,{id:detail[1],version:body.expected_version}))
        }
        if(method==='DELETE'){shape(body,[]);return ok(repository.publication(detail[1],'archive'))}
        reject(405,'Use GET, PUT or DELETE for content packages')
      }
      const publish=path.match(/^\/admin\/content\/packages\/([^/]+)\/(publish|unpublish)$/)
      if(publish){
        if(method!=='POST')reject(405,'Use POST for publication')
        if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).some(k=>k!=='expected_version')||!Number.isInteger(body.expected_version)||body.expected_version<1)reject(400,'Publication requires expected_version')
        const current=repository.detail(publish[1]);if(current.latest_version!==body.expected_version)reject(409,'Content version changed; reload before publication')
        return ok(repository.publication(publish[1],publish[2],body.expected_version))
      }
      reject(404,'Content admin route not implemented')
    }
    if(method!=='GET')return null
    if(path==='/curriculums')return ok({curriculums:repository.curriculums(filters)})
    if(path==='/themes')return ok({themes:repository.themes()})
    if(path==='/curriculum/tree'){const topics=repository.tree(filters);return ok({filter:{grade:filters.grade||null,board:filters.board||null,subject:filters.subject||null,curriculum_id:filters.curriculum_id||null},count:topics.length,topics})}
    const curriculum=path.match(/^\/curriculums\/([^/]+)$/)
    if(curriculum){const row=repository.curriculums().find(r=>r.id===curriculum[1]);if(!row)reject(404,'Curriculum not found');return ok({...row,subjects:repository.catalogueTree(row.id),topics:repository.tree({curriculum_id:row.id})})}
    return null
  }
}
