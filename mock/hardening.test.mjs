import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createMockApi} from './api.mjs'
import {worlds,opponents} from './gameplay.mjs'

async function fixture(options) {
 const api=createMockApi(options),{data:a}=await api('POST','/demo/login',{}),{data:b}=await api('POST','/demo/login',{})
 const sid=a.students[0].id,w=worlds[0],call=(method,path,body={})=>api(method,path,body,a.token)
 return {api,a,b,sid,w,call}
}
test('documented public content reads work without login and invalid filters do not silently fall back',async()=>{
 const api=createMockApi(),w=worlds[0]
 for(const path of [`/subjects/${w.id}/topics`,`/missions/${w.missionId}`,`/topics/${w.topicId}/tests`,`/tests/${w.testId}`,`/challenges/${w.challengeId}/opponents`,`/challenges/${w.challengeId}/preview`])assert.equal((await api('GET',path)).status,200,path)
 assert.equal((await api('GET','/avatar/items?category=hair')).data.items.length,0)
 assert.equal((await api('GET','/avatar/items?category=invalid')).status,400)
 assert.equal((await api('GET',`/subjects/${w.id}/topics?grade=Grade+12`)).data.topics.length,0)
 assert.equal((await api('GET',`/challenges/${w.challengeId}/preview?opponent_id=${opponents[2].id}`)).data.opponent.id,opponents[2].id)
 assert.equal((await api('GET','/challenges/unknown/leaderboard')).status,404)
})
test('wrong parent cannot read or mutate children, test attempts or battles',async()=>{
 const {api,a,b,sid,w,call}=await fixture()
 const {data:attempt}=await call('POST',`/students/${sid}/tests/${w.testId}/attempts`)
 const {data:battle}=await call('POST',`/students/${sid}/challenge-battles`,{challenge_id:w.challengeId,opponent_id:opponents[0].id})
 for(const [method,path,body]of [['GET',`/students/${sid}/home`,{}],['PATCH',`/students/${sid}/settings`,{sound:false}],['GET',`/tests/attempts/${attempt.attempt_id}/questions/1`,{}],['POST',`/tests/attempts/${attempt.attempt_id}/complete`,{}],['POST',`/challenge-battles/${battle.battle_id}/complete`,{score:100}]]) {
  const response=await api(method,path,body,b.token);assert.equal(response.status,403,path);assert.equal(response.data.error.code,'FORBIDDEN')
  assert.equal((await api(method,path,body)).status,401)
 }
 assert.equal((await api('POST',`/students/${sid}/tests/${w.testId}/attempts`,{mock_student:{...a.students[0],xp:999999}},a.token)).status,400)
})
test('null, arrays, type confusion, unknown properties and malformed scores fail before mutation',async()=>{
 const {call,sid,w}=await fixture()
 for(const body of [null,[],1,'x',{name:1},{name:'A'},{name:'Valid',parent_id:'other'},{name:'Valid',xp:999}])assert.equal((await call('POST','/students',body)).status,400)
 await call('POST',`/students/${sid}/missions/${w.missionId}/start`)
 for(const score of [null,'100',true,-1,101])assert.equal((await call('POST',`/students/${sid}/missions/${w.missionId}/complete`,{score})).status,400)
 assert.equal((await call('PATCH',`/students/${sid}/settings`,{sound:'false'})).status,400)
 assert.equal((await call('GET',`/students/${sid}/home`)).data.stats.total_xp,320)
})
test('test answers are immutable, replay is safe, incomplete tests score unanswered items zero',async()=>{
 const {call,sid,w}=await fixture(),{data:attempt}=await call('POST',`/students/${sid}/tests/${w.testId}/attempts`),root=`/tests/attempts/${attempt.attempt_id}`
 const delivered=(await call('GET',root+'/questions/1')).data
 assert.equal(delivered.answer,undefined);assert.equal(delivered.explanation,undefined);assert.equal(attempt.first_question,undefined)
 const q=w.questions[0],body={question_id:q.id,selected_answer:q.answer}
 const first=await call('POST',`${root}/answers`,body)
 assert.deepEqual(await call('POST',`${root}/answers`,body),first)
 assert.equal((await call('POST',`${root}/answers`,{...body,selected_answer:q.options.find(o=>o.key!==q.answer).key})).status,409)
 const completed=await call('POST',`${root}/complete`)
 assert.equal(completed.data.correct_count,1);assert.equal(completed.data.total_questions,5);assert.equal(completed.data.score,20)
 assert.deepEqual(await call('POST',`${root}/complete`),completed)
 assert.equal((await call('GET',`${root}/result`)).data.extra_learning.length,1)
 assert.equal((await call('GET',`/students/${sid}/home`)).data.stats.total_xp,330)
 assert.equal((await call('POST',`${root}/answers`,body)).status,400)
})
test('battle ignores forged score, uses separate battle bank, and never awards XP twice',async()=>{
 const {call,sid,w}=await fixture(),{data:battle}=await call('POST',`/students/${sid}/challenge-battles`,{challenge_id:w.challengeId,opponent_id:opponents[0].id}),root=`/challenge-battles/${battle.battle_id}`
 assert.equal((await call('GET',`${root}/result`)).status,409)
 const questions=[];for(let order=1;order<=battle.total_questions;order++)questions.push((await call('GET',root+`/questions/${order}`)).data)
 assert.ok(questions.every(q=>w.battleQuestions.some(t=>t.id===q.id)))
 assert.ok(questions.every(q=>!w.questions.some(t=>t.id===q.id)))
 assert.equal(battle.questions,undefined)
 const done=await call('POST',`${root}/complete`,{score:100})
 assert.equal(done.data.score,0);assert.equal(done.data.result,'loss');assert.equal(done.data.xp_awarded,10)
 assert.deepEqual(await call('POST',`${root}/complete`,{score:100}),done)
 assert.equal((await call('GET',`/students/${sid}/home`)).data.stats.total_xp,330)
})
test('concurrent idempotency retries create one child, payload conflicts and revoked sessions cannot replay',async()=>{
 const {api,a,call}=await fixture(),context={idempotencyKey:'create-child-1'},body={name:'Only Once'}
 const responses=await Promise.all(Array.from({length:8},()=>api('POST','/students',body,a.token,context)))
 assert.ok(responses.every(r=>r.status===201&&r.data.id===responses[0].data.id))
 assert.equal((await call('GET','/parent/students')).data.students.length,3)
 assert.equal((await api('POST','/students',{name:'Changed'},a.token,context)).status,409)
 responses[0].data.name='Tampered';assert.equal((await call('GET','/parent/students')).data.students[2].name,'Only Once')
 await call('POST','/auth/parent/logout')
 assert.equal((await api('POST','/students',body,a.token,context)).status,401)
})
test('sessions expire under a controlled clock; server settings and break passes persist without duplicate use',async()=>{
 let time=Date.parse('2026-10-02T10:00:00Z')
 const {call,sid}=await fixture({clock:()=>time,sessionTtlMs:10000})
 await call('PATCH',`/students/${sid}/settings`,{sound:false})
 assert.equal((await call('GET',`/students/${sid}/settings`)).data.sound,false)
 assert.equal((await call('POST',`/students/${sid}/break-passes`)).data.available,4)
 assert.equal((await call('POST',`/students/${sid}/break-passes`)).data.available,4)
 time+=10001;assert.equal((await call('GET','/parent/me')).status,401)
})
test('streak advances once per UTC day and resets after a skipped day',async()=>{
 let time=Date.parse('2026-10-02T10:00:00Z')
 const {call,sid,w}=await fixture({clock:()=>time,sessionTtlMs:10*86400000})
 async function finish(){const {data:attempt}=await call('POST',`/students/${sid}/tests/${w.testId}/attempts`);await call('POST',`/tests/attempts/${attempt.attempt_id}/complete`);return (await call('GET',`/students/${sid}/home`)).data.stats.day_streak}
 assert.equal(await finish(),1);assert.equal(await finish(),1);time+=86400000;assert.equal(await finish(),2);time+=2*86400000;assert.equal(await finish(),1)
})
