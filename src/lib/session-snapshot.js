// Read-through cache only: authoritative writes, validation and rewards stay on
// the mock HTTP server. Never synthesize a successful mutation in the browser.
export const SNAPSHOT_KEY='kidsverse-mock-bootstrap-v2'
export const resourceKey=path=>{const u=new URL(path,'http://mock.local');u.searchParams.sort();return u.pathname+(u.searchParams.size?'?'+u.searchParams:'')}
export const isDynamic=path=>/^\/parent\/(pin|overview|evidence|plan)(\/|$)/.test(path)||/^\/(tests|missions)\/attempts\//.test(path)||/^\/challenge-battles\//.test(path)||/\/(tests|missions)\/[^/]+\/attempts$/.test(path)||/\/challenge-battles$/.test(path)||/^\/students\/[^/]+\/attempts$/.test(path)
const isPublicCatalog=path=>/^\/(?:interests|goals|avatar\/(?:characters|items)|curriculums|themes)(?:\?|$)/.test(path)
export function createSessionSnapshot(storage) {
 const read=()=>{try{return JSON.parse(storage.getItem(SNAPSHOT_KEY)||'null')}catch{return null}}
 const save=value=>storage.setItem(SNAPSHOT_KEY,JSON.stringify(value))
 return {
  get value(){return read()},
  seed(snapshot){save({...snapshot,revision:0,resources:Object.fromEntries(Object.entries(snapshot.resources).map(([k,v])=>[resourceKey(k),v]))})},
  clear(){storage.removeItem(SNAPSHOT_KEY)},
  request(method,path,body={},token){
   const value=read()
   if(!value||value.session_id!==token||method!=='GET'||isDynamic(path))return null
   if(value.expires_at&&Date.now()>=Date.parse(value.expires_at)){storage.removeItem(SNAPSHOT_KEY);return null}
   const data=value.resources[resourceKey(path)]
   return data===undefined?null:{status:200,data:structuredClone(data),transport:'session-cache'}
  },
  put(path,data,token,revision){
   const value=read();if(!value||value.session_id!==token||value.revision!==revision||isDynamic(path))return
   value.resources[resourceKey(path)]=structuredClone(data)
   if(path==='/parent/students')value.students=structuredClone(data.students)
   save(value)
  },
  invalidate(token,mutationPath){
   const value=read();if(!value||value.session_id!==token)return
   // Learner/account writes cannot change these public catalogs. Retain the
   // backend bootstrap copies while invalidating all mutable account data.
   // Explicit full invalidation and content administration still clear all.
   const learnerWrite=/^\/(?:auth\/parent|parent|students|(?:tests|missions)\/attempts|challenge-battles)(?:\/|$)/.test(mutationPath||'')
   value.resources=learnerWrite?Object.fromEntries(Object.entries(value.resources).filter(([path])=>isPublicCatalog(path))):{}
   value.revision++;save(value)
  }
 }
}
