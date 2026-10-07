import assert from 'node:assert/strict'
import {createServer} from 'node:http'
import {once} from 'node:events'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {createMockApi} from './api.mjs'
import {createContentRepository} from './content-repository.mjs'
import {createMockMiddleware} from './http.mjs'
import {findOperation,checkApiResponse,operations} from './api-contracts.mjs'
import {seedWorlds,opponents} from './content-seed.mjs'
import {createSessionSnapshot,isDynamic} from '../src/lib/session-snapshot.js'
import {demoScreens} from './bootstrap.mjs'

export {redactApi as redact} from '../src/lib/redact-api.js'
import {redactApi as redact} from '../src/lib/redact-api.js'
export async function verifyContract(){
 const directory=mkdtempSync(join(tmpdir(),'kidsverse-contract-')),filename=join(directory,'content.sqlite'),captures=[],covered=new Set(),adminKey='isolated-test-admin'
 let api,repo,server,base,token
 const open=async()=>{repo=createContentRepository({filename});api=createMockApi({contentRepository:repo,contentAdminKey:adminKey});server=createServer(createMockMiddleware(api));server.listen(0,'127.0.0.1');await once(server,'listening');base=`http://127.0.0.1:${server.address().port}`}
 const close=async()=>{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));api.close()}
 const call=async(method,path,body={},options={})=>{
  const started=Date.now(),headers={Accept:'application/json',...(options.token===null?{}:{Authorization:`Bearer ${options.token||token||''}`}),...(options.admin?{'X-Mock-Content-Admin-Key':adminKey}:{}),...(method==='GET'?{}:{'Content-Type':'application/json'}),...(options.key?{'Idempotency-Key':options.key}:{}),...(options.proof?{'X-Parent-PIN-Proof':options.proof}:{})}
  const r=await fetch(base+path,{method,headers,...(method==='GET'?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(10000)}),data=r.status===204?null:await r.json(),response={status:r.status,data}
  assert.equal(r.status,options.status||findOperation(method,path)?.status||200,`${method} ${path}: ${JSON.stringify(data)}`)
  const contract=checkApiResponse(method,path,response);assert.ok(contract.valid,`${method} ${path} response schema: ${JSON.stringify(contract.errors)}`)
  const operation=findOperation(method,path),capture={id:captures.length+1,method,path,request:method==='GET'?null:redact(body),status:r.status,response:redact(data),ms:Date.now()-started,operation:operation.path,role:operation.role,origin:operation.origin}
  captures.push(capture);if(r.ok)covered.add(method+' '+operation.path)
  return data
 }
 await open()
 try{
  for(const path of ['/health','/health/database','/openapi.json','/openapi/assessments.json','/interests','/goals','/avatar/characters','/avatar/items'])await call('GET',path)
  const demo=await call('POST','/demo/login',{});token=demo.token
  // Every aggregate resource is verified over HTTP, and independently verified
  // to be served from a single login snapshot without a second browser fetch.
  const values=new Map(),cache=createSessionSnapshot({getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)})
  cache.seed(demo.bootstrap);let cachedReads=0
  for(const [path,payload]of Object.entries(demo.bootstrap.resources)){
    const response=cache.request('GET',path,{},token)
    if(isDynamic(path))assert.equal(response,null)
    else {assert.deepEqual(response?.data,payload);cachedReads++}
    assert.deepEqual(await call('GET',path),payload,`Bootstrap differs from HTTP: ${path}`)
  }
  const worlds=structuredClone(repo.worlds()),sid=demo.students[0].id
  const curriculum=await call('GET','/curriculums');await call('GET',`/curriculums/${curriculum.curriculums[0].id}`);await call('GET','/curriculum/tree?grade=4&board=CBSE')
  const interests=await call('GET','/interests'),goals=await call('GET','/goals'),characters=await call('GET','/avatar/characters'),items=await call('GET','/avatar/items')
  const registered=await call('POST','/auth/parent/signup',{email:'api-coverage@example.test',password:'coverage-password'}),parentToken=registered.token
  const child=await call('POST','/students',{name:'Coverage Explorer'},{token:parentToken,key:'child-create'})
  assert.equal((await call('POST','/students',{name:'Coverage Explorer'},{token:parentToken,key:'child-create'})).id,child.id)
  const verification=await call('POST','/parent/verification/start',{student_id:child.id,full_name:'Coverage Parent',relationship:'parent',phone:'+919876543210'},{token:parentToken})
  await call('POST','/parent/verification/verify',{challenge_id:verification.challenge_id,code:verification.dev_code},{token:parentToken})
  const root=`/students/${child.id}`
  await call('PATCH',root+'/grade-board',{grade:'4',board:'CBSE'},{token:parentToken})
  await call('PUT',root+'/avatar',{character_id:characters.characters[0].id,outfit_item_id:items.items[0].id},{token:parentToken})
  await call('PUT',root+'/interests',{interest_ids:interests.interests.slice(0,2).map(x=>x.id)},{token:parentToken})
  await call('PUT',root+'/goals',{goal_ids:[goals.goals[0].id]},{token:parentToken})
  await call('POST',root+'/onboarding/steps/lobby/complete',{},{token:parentToken});await call('POST',root+'/nova/greet',{},{token:parentToken})
  await call('PUT','/parent/pin',{pin:'1357',current_password:'coverage-password'},{token:parentToken})
  const proof=await call('POST','/parent/pin/verify',{pin:'1357'},{token:parentToken});await call('POST','/parent/pin/authorize',{proof_token:proof.proof_token},{token:parentToken})
  await call('GET','/parent/overview',{},{token:parentToken,proof:proof.proof_token})
  await call('PATCH',`/students/${sid}/settings`,{sound:false,zoom:1.1});await call('POST',`/students/${sid}/break-passes`,{})
  await call('POST',`/students/${sid}/nova/messages`,{message:'Help me understand this lesson',mission_id:worlds[1].missionId})
  for(const id of ['read-together','talk-nova','raise-flag'])await call('POST',`/students/${sid}/companion-activities/${id}/complete`,{})
  await call('GET',`/students/${sid}/companion-activities`)
  await call('POST',`${root}/missions/${worlds[0].missionId}/start`,{},{token:parentToken})
  await call('POST',`${root}/missions/${worlds[0].missionId}/complete`,{score:100},{token:parentToken})
  const completed=[]
  for(const w of worlds){
   for(const [mode,id,bank,prefix]of [['cfu',w.missionId,w.cfuQuestions,'missions'],['test',w.testId,w.questions,'tests'],['challenge',w.challengeTestId,w.challengeQuestions,'tests']]){
    const start=await call('POST',`/students/${sid}/${prefix}/${id}/attempts`,{}),attempt=`/${prefix}/attempts/${start.attempt_id}`
    await call('GET',attempt)
    for(let order=1;order<=bank.length;order++){const fetched=await call('GET',attempt+`/questions/${order}`),q=bank.find(q=>q.id===fetched.id);await call('POST',attempt+'/answers',{question_id:q.id,selected_answer:q.answer})}
    await call('POST',attempt+'/complete',{});const result=await call('GET',attempt+'/result');await call('GET',attempt+'/review');assert.equal(result.score,100);completed.push([attempt,result])
   }
   const battle=await call('POST',`/students/${sid}/challenge-battles`,{challenge_id:w.challengeId,opponent_id:opponents[0].id}),attempt=`/challenge-battles/${battle.battle_id}`
   await call('GET',attempt);for(let order=1;order<=battle.total_questions;order++){const fetched=await call('GET',attempt+`/questions/${order}`),q=w.battleQuestions.find(q=>q.id===fetched.id);await call('POST',attempt+'/answers',{question_id:q.id,selected_answer:q.answer})}
   await call('POST',attempt+'/complete',{});const result=await call('GET',attempt+'/result');await call('GET',attempt+'/review');assert.equal(result.score,100);completed.push([attempt,result])
  }
  for(const path of [`/students/${sid}/attempts`,`/students/${sid}/profile/cards`,`/students/${sid}/profile/our-journey`,'/parent/overview','/parent/evidence','/parent/plan'])await call('GET',path)
  assert.equal((await call('GET','/parent/evidence')).students[0].evidence.length,20)
  // Every catalogue CRUD operation, including duplicate conflict and references.
  let c=await call('POST','/curriculums',{board:'ICSE',grade:'Grade 5',name:'ICSE Grade 5',description:'Isolated authored catalogue'},{admin:true})
  await call('PATCH',`/curriculums/${c.id}`,{description:'Updated description'},{admin:true})
  let s=await call('POST',`/curriculums/${c.id}/subjects`,{name:'Science'},{admin:true});await call('PATCH',`/subjects/${s.id}`,{name:'Plant Science'},{admin:true})
  let t=await call('POST',`/subjects/${s.id}/topics`,{name:'Plants'},{admin:true});await call('PATCH',`/topics/${t.id}`,{name:'Plant Growth'},{admin:true})
  let concept=await call('POST',`/topics/${t.id}/concepts`,{name:'Roots',learning_objective:'Identify roots'},{admin:true});await call('PATCH',`/concepts/${concept.id}`,{learning_objective:'Explain roots'},{admin:true})
  await call('GET',`/curriculums/${c.id}`)
  await call('DELETE',`/curriculums/${c.id}`,{},{admin:true,status:409})
  for(const [table,id]of [['concepts',concept.id],['topics',t.id],['subjects',s.id],['curriculums',c.id]])await call('DELETE',`/${table}/${id}`,{},{admin:true})
  let theme=await call('POST','/themes',{name:'Space Lab',description:'Space adventures',icon_asset:'/art/space.svg'},{admin:true});await call('PATCH',`/themes/${theme.id}`,{description:'Updated space theme'},{admin:true});await call('DELETE',`/themes/${theme.id}`,{},{admin:true})
  const content={...structuredClone(seedWorlds[0].pkg.studio),content_type:'concept_package',curriculum:{...seedWorlds[0].pkg.studio.curriculum,grade:'Grade 4'}}
  content.concept.name='Full contract authored concept'
  const draft=await call('POST','/admin/content/drafts',content,{admin:true}),packageRoot=`/admin/content/packages/${draft.data.package_id}`
  await call('GET',packageRoot,{},{admin:true});await call('POST',packageRoot+'/publish',{expected_version:1},{admin:true})
  content.learning_content.explanation='A new published lesson explanation.'
  await call('PUT',packageRoot,{expected_version:1,content},{admin:true});await call('POST',packageRoot+'/publish',{expected_version:2},{admin:true});await call('POST',packageRoot+'/unpublish',{expected_version:2},{admin:true});await call('DELETE',packageRoot,{},{admin:true})
  content.concept.name='Immediate-feed concept';await call('POST','/admin/content/feed',content,{admin:true,key:'feed-once'});await call('GET','/admin/content/packages',{},{admin:true})
  await call('POST','/auth/parent/login',{email:registered.parent.email,password:'coverage-password'})
  await call('POST','/auth/parent/forgot-password',{email:registered.parent.email})
  const outbox=await call('GET','/__mock/outbox',{},{admin:true}),reset_token=outbox.messages.at(-1).reset_token
  await call('POST','/auth/parent/reset-password',{reset_token,password:'replacement-password'})
  const login=await call('POST','/auth/parent/login',{email:registered.parent.email,password:'replacement-password'})
  await call('POST','/auth/parent/logout',{},{token:login.token})
  await call('GET','/parent/me',{},{token:login.token,status:401})
  await call('GET',`/students/${sid}/home`,{},{token:parentToken,status:401})
  const outsider=await call('POST','/demo/login',{})
  await call('GET',`/students/${sid}/home`,{},{token:outsider.token,status:403})
  await call('POST',`/tests/attempts/${completed[1][0].split('/').at(-1)}/answers`,{question_id:worlds[0].questions[0].id,selected_answer:'option_99'},{status:400})
  await call('PATCH',`/students/${sid}/settings`,{unknown:true},{status:400})
  await close();await open()
  const after=await call('GET',`/students/${sid}/home`);assert.equal(after.stats.total_xp,320+worlds.reduce((n,w)=>n+w.pkg.mission.xp+150,0))
  for(const [path,result]of completed)assert.deepEqual(await call('GET',path+'/result'),result)
  const missing=operations.filter(o=>!covered.has(o.method+' '+o.path));assert.deepEqual(missing.map(o=>o.method+' '+o.path),[])
  const screenReport=demoScreens.map(screen=>{
   const templates=screenOperations[screen.id]||[]
   assert.ok(screen.id===1||templates.length,`No contract mapped to screen ${screen.id}`)
   const slug=({19:'literacy',20:'evs',22:'literacy',23:'evs',24:'computer',25:'general',32:'literacy',33:'literacy',34:'literacy',35:'literacy',36:'literacy'})[screen.id]||'maths',world=worlds.find(w=>w.slug===slug)
   const matches=templates.map(key=>{const capture=captures.find(c=>{
    if(c.status>=400||c.method+' '+c.operation!==key)return false
    if(c.operation==='/missions/{mission_id}')return c.path===`/missions/${world.missionId}`
    if(c.operation===sr+'/journey')return c.path.includes(`subject=${slug}`)
    if(c.operation===sr+'/topics/{topic_id}')return c.path.endsWith('/'+world.topicId)
    if(c.operation===sr+'/companion-activities/{activity_id}/complete')return c.path.endsWith('/'+(screen.id===48?'talk-nova':'read-together')+'/complete')
    return true
   });assert.ok(capture,`No successful HTTP evidence: screen ${screen.id}, ${key}`);return capture.id})
   return {id:screen.id,name:screen.name,route:screen.route,status:screen.id===1?'local_ui':'verified_api_contract',capture_ids:matches,note:[27,28,29,30,31,32,33,34,35,36].includes(screen.id)?'Shared GET mission response supplies all learning steps. No extra request per step.':screen.id===1?'Landing requires no backend data.':'HTTP action verified. This report does not claim browser interaction verification.'}
  })
  return {generated_at:new Date().toISOString(),source:'local_mock_only',transport:'actual HTTP on isolated loopback server',operations:operations.length,verified_operations:covered.size,screens:screenReport,bootstrap:{network_calls:1,cached_resource_reads:cachedReads},restart_verified:true,captures}
 }finally{await close();rmSync(directory,{recursive:true})}
}

const get=p=>'GET '+p,post=p=>'POST '+p,put=p=>'PUT '+p
const sr='/students/{student_id}',mission='/missions/{mission_id}',cfu='/missions/attempts/{attempt_id}',test='/tests/attempts/{attempt_id}',battle='/challenge-battles/{battle_id}'
const lesson=[get(mission)],topic=[get(sr+'/topics/{topic_id}')],journey=[get(sr+'/journey')]
export const screenOperations={
 1:[],2:[post('/auth/parent/login'),post('/demo/login')],3:[post('/auth/parent/forgot-password'),post('/auth/parent/reset-password')],4:[post('/auth/parent/signup')],5:[post('/students')],6:[post('/parent/verification/start')],7:[post('/parent/verification/verify')],8:['PATCH '+sr+'/grade-board'],9:[get('/avatar/characters'),get('/avatar/items'),put(sr+'/avatar')],10:[get('/interests'),put(sr+'/interests')],11:[get('/goals'),put(sr+'/goals')],12:[post(sr+'/nova/greet')],13:[get(sr+'/onboarding/status'),get(sr+'/home')],14:[get(sr+'/home')],15:[get(sr+'/settings'),'PATCH '+sr+'/settings'],16:[get(sr+'/nova/messages'),post(sr+'/nova/messages')],17:[get(sr+'/subjects')],18:journey,19:journey,20:journey,21:topic,22:topic,23:topic,24:topic,25:topic,
 26:[...lesson,post(sr+'/missions/{mission_id}/start')],27:lesson,28:lesson,29:lesson,30:lesson,31:lesson,32:lesson,33:lesson,34:lesson,35:lesson,36:lesson,
 37:[post(sr+'/missions/{mission_id}/attempts'),get(cfu+'/questions/{order}'),post(cfu+'/answers')],38:[post(cfu+'/complete'),get(cfu+'/result')],39:[get(cfu+'/review')],40:[get('/topics/{topic_id}/tests')],41:[get('/tests/{test_id}'),post(sr+'/tests/{test_id}/attempts')],42:[get(test+'/questions/{order}'),post(test+'/answers')],43:[get(test+'/questions/{order}')],44:[post(test+'/complete'),get(test+'/result')],45:[get(test+'/review')],46:[get(sr+'/extra-learning')],47:[get(sr+'/companion-activities'),post(sr+'/companion-activities/{activity_id}/complete')],48:[get(sr+'/companion-activities'),post(sr+'/companion-activities/{activity_id}/complete')],49:[get('/challenges')],50:[get('/challenges/{challenge_id}/opponents')],51:[get('/challenges/{challenge_id}/preview')],52:[post(sr+'/challenge-battles'),get(battle+'/questions/{order}'),post(battle+'/answers')],53:[post(battle+'/complete'),get(battle+'/result')],54:[get('/challenges/{challenge_id}/leaderboard')],55:[get(sr+'/profile'),get(sr+'/profile/cards')],56:[get(sr+'/profile/our-journey')],57:[get(sr+'/break-passes'),post(sr+'/break-passes')],58:[get('/parent/pin'),post('/parent/pin/verify'),post('/parent/pin/authorize')],59:[get('/parent/students')],60:[get('/parent/overview')],61:[get('/parent/evidence')],62:[get('/parent/plan')],
}
