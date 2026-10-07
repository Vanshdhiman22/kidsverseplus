import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createMockApi} from './api.mjs'
import {createSessionSnapshot,isDynamic} from '../src/lib/session-snapshot.js'
const store=()=>{const m=new Map();return {getItem:k=>m.get(k),setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)}}
test('one bootstrap covers all 62 entries and every ordinary resource read is served from session cache',async()=>{
 const handle=createMockApi(),res=await handle('POST','/demo/login',{})
 assert.equal(res.status,200);assert.equal(res.data.bootstrap.screens.length,62)
 const storage=store(),snapshot=createSessionSnapshot(storage);snapshot.seed(res.data.bootstrap)
 assert.ok(Object.keys(res.data.bootstrap.resources).length>100)
 assert.ok(res.data.bootstrap.demo.result.review.every(q=>q.question.includes('(presentation only)')))
 for(const [path,expected]of Object.entries(res.data.bootstrap.resources)){
  const response=snapshot.request('GET',path,{},res.data.token)
  if(isDynamic(path))assert.equal(response,null)
  else assert.deepEqual(response.data,expected)
 }
 const restored=createSessionSnapshot(storage);assert.equal(restored.request('GET','/parent/me',{},res.data.token).data.email,'demo@kidsverse.local')
 assert.equal(restored.request('GET','/parent/me',{},'another-login'),null)
 const sid=res.data.students[0].id,w=res.data.bootstrap.demo.worlds[0]
 assert.equal(snapshot.request('POST',`/students/${sid}/tests/${w.testId}/attempts`,{},res.data.token),null)
 assert.equal(isDynamic('/challenge-battles/abc/answers'),true)
})
test('mock test and challenge have complete question-answer-result lifecycles',async()=>{
 const handle=createMockApi(),{data}=await handle('POST','/demo/login',{}),sid=data.students[0].id,w=data.bootstrap.demo.worlds[0]
 const call=(method,path,body={})=>handle(method,path,body,data.token)
 const {data:attempt}=await call('POST',`/students/${sid}/tests/${w.testId}/attempts`)
 const q=(await call('GET',`/tests/attempts/${attempt.attempt_id}/questions/1`)).data;assert.ok(q.hints.length)
 assert.equal((await call('POST',`/tests/attempts/${attempt.attempt_id}/answers`,{question_id:q.id,selected_answer:q.options[0].key})).status,200)
 assert.equal((await call('POST',`/tests/attempts/${attempt.attempt_id}/complete`)).status,200)
 assert.equal((await call('GET',`/tests/attempts/${attempt.attempt_id}/result`)).status,200)
 const opponents=data.bootstrap.resources[`/challenges/${w.challengeId}/opponents`].opponents
 const {data:battle}=await call('POST',`/students/${sid}/challenge-battles`,{challenge_id:w.challengeId,opponent_id:opponents[0].id})
 assert.equal(battle.total_questions,3)
 assert.equal(battle.questions,undefined)
 for(let order=1;order<=battle.total_questions;order++){const q=(await call('GET',`/challenge-battles/${battle.battle_id}/questions/${order}`)).data;assert.equal((await call('POST',`/challenge-battles/${battle.battle_id}/answers`,{question_id:q.id,selected_answer:q.options[0].key})).status,200)}
 assert.equal((await call('POST',`/challenge-battles/${battle.battle_id}/complete`,{score:100})).status,200)
 const result=await call('GET',`/challenge-battles/${battle.battle_id}/result`);assert.equal(result.status,200);assert.equal(result.data.questions,undefined)
})
test('writes never succeed in cache; invalidation rejects stale in-flight reads',async()=>{
 const {data}=await createMockApi()('POST','/demo/login',{}),storage=store(),snapshot=createSessionSnapshot(storage);snapshot.seed(data.bootstrap)
 const sid=data.students[0].id,path=`/students/${sid}/settings`
 assert.equal(snapshot.request('PATCH',path,{sound:false},data.token),null)
 const revision=snapshot.value.revision
 snapshot.invalidate(data.token)
 snapshot.put(path,{sound:true},data.token,revision)
 assert.equal(snapshot.request('GET',path,{},data.token),null)
 snapshot.put(path,{sound:false},data.token,snapshot.value.revision)
 assert.equal(createSessionSnapshot(storage).request('GET',path,{},data.token).data.sound,false)
 snapshot.clear();assert.equal(snapshot.request('GET','/parent/me',{},data.token),null)
})
test('learner writes retain public catalogs but invalidate mutable data and reject stale reads',async()=>{
 const handle=createMockApi(),{data}=await handle('POST','/demo/login',{}),snapshot=createSessionSnapshot(store())
 try {
  snapshot.seed(data.bootstrap)
  const home=`/students/${data.students[0].id}/home`,revision=snapshot.value.revision
  snapshot.invalidate(data.token,'/parent/verification/start')
  for(const path of ['/goals','/interests','/avatar/characters','/avatar/items']){
   assert.deepEqual(snapshot.request('GET',path,{},data.token).data,data.bootstrap.resources[path])
  }
  assert.equal(snapshot.request('GET',home,{},data.token),null)
  assert.equal(snapshot.request('GET','/parent/me',{},data.token),null)
  snapshot.put(home,{stats:{total_xp:-1}},data.token,revision)
  assert.equal(snapshot.request('GET',home,{},data.token),null)
  snapshot.invalidate(data.token,'/admin/content/packages/example/publish')
  assert.equal(snapshot.request('GET','/goals',{},data.token),null)
 } finally {handle.close()}
})
