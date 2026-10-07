// Reproducible HTTP evidence using a temporary disk database, never the user's DB.
import assert from 'node:assert/strict'
import {createServer} from 'node:http'
import {once} from 'node:events'
import {mkdtemp,rm,mkdir,writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join,resolve,basename} from 'node:path'
import {randomBytes} from 'node:crypto'
import {createContentRepository} from '../mock/content-repository.mjs'
import {createMockApi} from '../mock/api.mjs'
import {createMockMiddleware} from '../mock/http.mjs'
import {seedWorlds,opponents} from '../mock/content-seed.mjs'

const directory=await mkdtemp(join(tmpdir(),'kidsverse-db-proof-'))
const filename=join(directory,'content.sqlite'),adminKey=randomBytes(32).toString('hex')
let api,server,repo,base,token=''
const calls=[]
async function start(){
 repo=createContentRepository({filename,seed:false})
 api=createMockApi({contentRepository:repo,contentAdminKey:adminKey})
 server=createServer(createMockMiddleware(api));server.listen(0,'127.0.0.1');await once(server,'listening')
 base=`http://127.0.0.1:${server.address().port}`
}
async function stop(){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));api.close()}
async function call(method,path,body,expected=200,{admin=false,record=true,key}={}){
 const response=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`} : {}),...(admin?{'X-Mock-Content-Admin-Key':adminKey}:{}),...(key?{'Idempotency-Key':key}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(10000)})
 const data=response.status===204?null:await response.json()
 if(record)calls.push({method,path,request:body??null,status:response.status,response:data})
 assert.equal(response.status,expected,`${method} ${path}: ${JSON.stringify(data)}`)
 return data
}
try{
 await start()
 const body=structuredClone(seedWorlds[0].pkg.studio);body.content_type='concept_package';body.curriculum.grade='Grade 4'
 await call('GET','/health/database')
 await call('POST','/admin/content/feed',body,403)
 const saved=await call('POST','/admin/content/feed',body,201,{admin:true,key:'proof-feed'})
 assert.deepEqual(await call('POST','/admin/content/feed',body,201,{admin:true,key:'proof-feed'}),saved)
 const linked=saved.data
 await call('GET',`/admin/content/packages/${linked.package_id}`,undefined,200,{admin:true})
 await call('GET','/curriculum/tree?grade=4&board=CBSE&subject=maths')
 const auth=await call('POST','/demo/login',{},200,{record:false});token=auth.token
 assert.equal(auth.bootstrap.screens.length,62)
 const sid=auth.students[0].id,w=repo.worlds()[0]
 await call('GET',`/students/${sid}/topics/${w.topicId}`)
 await call('GET',`/missions/${w.missionId}`)
 await call('POST',`/students/${sid}/missions/${w.missionId}/start`,{})
 const learning=await call('POST',`/students/${sid}/missions/${w.missionId}/attempts`,{},201)
 const learningRoot=`/missions/attempts/${learning.attempt_id}`
 await call('GET',learningRoot)
 await call('GET',learningRoot+'/review',undefined,409)
 await call('POST',learningRoot+'/complete',{score:100},400)
 for(const q of w.cfuQuestions){
  await call('GET',learningRoot+`/questions/${q.order_index}`)
  await call('POST',learningRoot+'/answers',{question_id:q.id,selected_answer:q.answer})
 }
 const learningResult=await call('POST',learningRoot+'/complete',{})
 assert.equal(learningResult.score,100);assert.equal(learningResult.xp_awarded,w.pkg.mission.xp)
 assert.deepEqual(await call('POST',learningRoot+'/complete',{}),learningResult)
 await call('GET',learningRoot+'/result');await call('GET',learningRoot+'/review')
 // Legacy completion remains available and cannot reward an already completed mission twice.
 await call('POST',`/students/${sid}/missions/${w.missionId}/complete`,{score:100})
 await call('GET',`/topics/${w.topicId}/tests`)
 for(const [testId,bank] of [[w.testId,w.questions],[w.challengeTestId,w.challengeQuestions]]){
  const a=await call('POST',`/students/${sid}/tests/${testId}/attempts`,{},201)
  for(let order=1;order<=a.total_questions;order++){
   const returned=await call('GET',`/tests/attempts/${a.attempt_id}/questions/${order}`),q=bank.find(q=>q.id===returned.id)
   assert.equal(returned.answer,undefined)
   await call('POST',`/tests/attempts/${a.attempt_id}/answers`,{question_id:q.id,selected_answer:q.answer})
  }
  assert.equal((await call('POST',`/tests/attempts/${a.attempt_id}/complete`,{})).score,100)
  await call('GET',`/tests/attempts/${a.attempt_id}/result`)
  await call('GET',`/tests/attempts/${a.attempt_id}/review`)
 }
 const battle=await call('POST',`/students/${sid}/challenge-battles`,{challenge_id:w.challengeId,opponent_id:opponents[0].id},201)
 for(let order=1;order<=battle.total_questions;order++){
  const returned=await call('GET',`/challenge-battles/${battle.battle_id}/questions/${order}`),q=w.battleQuestions.find(q=>q.id===returned.id)
  await call('POST',`/challenge-battles/${battle.battle_id}/answers`,{question_id:q.id,selected_answer:q.answer})
 }
 assert.equal((await call('POST',`/challenge-battles/${battle.battle_id}/complete`,{score:0})).score,100)
 await call('GET',`/challenge-battles/${battle.battle_id}/result`)
 await call('GET',`/challenge-battles/${battle.battle_id}/review`)
 const expectedTotalXp=(await call('GET',`/students/${sid}/home`)).stats.total_xp
 await stop();await start()
 assert.equal((await call('GET',`/students/${sid}/home`)).stats.total_xp,expectedTotalXp)
 assert.equal((await call('GET',learningRoot+'/review')).content_version,1)
 assert.equal((await call('GET',`/challenge-battles/${battle.battle_id}/result`)).score,100)
 assert.equal((await call('GET',`/missions/${w.missionId}`)).content_version,1)
 await call('GET','/health/database')
 const output=new URL('../docs/verification/db-content-api-responses.json',import.meta.url)
 await mkdir(new URL('../docs/verification/',import.meta.url),{recursive:true})
 await writeFile(output,JSON.stringify({generated_at:new Date().toISOString(),source:'actual-local-mock-http',database:'temporary-disk-sqlite',note:'Isolated content DB. Login credentials omitted. New CFU, Test, Challenge practice and Battle are server scored. Legacy mission score completion is still available. Content, session, progress, CFU review and Battle result persistence verified across restart.',bootstrap_screens:62,restart_persistence_verified:true,calls},null,2))
 console.log(`${calls.length} recorded HTTP responses; Learn/Test/Challenge/Battle and content restart verified.`)
}finally{
 if(server?.listening)await stop()
 const target=resolve(directory),root=resolve(tmpdir())
 assert.equal(resolve(target,'..'),root);assert.ok(basename(target).startsWith('kidsverse-db-proof-'))
 await rm(target,{recursive:true,force:true})
}
