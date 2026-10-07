import test from 'node:test'
import assert from 'node:assert/strict'
import {createMockApi} from './api.mjs'
import {createContentRepository} from './content-repository.mjs'
import {seedWorlds,opponents} from './content-seed.mjs'
test('Test retakes reward score improvement only; Challenge rewards use a separate cap',async()=>{
 const repo=createContentRepository(),api=createMockApi({contentRepository:repo})
 try{
  const auth=(await api('POST','/demo/login')).data,sid=auth.students[0].id,w=repo.worlds()[0],call=(m,p,b={})=>api(m,p,b,auth.token)
  const run=async(id,bank,count)=>{const start=(await call('POST',`/students/${sid}/tests/${id}/attempts`)).data,root=`/tests/attempts/${start.attempt_id}`;for(const q of bank.slice(0,count))await call('POST',root+'/answers',{question_id:q.id,selected_answer:q.answer});await call('POST',root+'/complete');return (await call('GET',root+'/result')).data}
  const first=await run(w.testId,w.questions,1),second=await run(w.testId,w.questions,w.questions.length),third=await run(w.testId,w.questions,w.questions.length)
  assert.equal(first.xp_awarded+second.xp_awarded,w.rules.test.max_xp);assert.equal(third.xp_awarded,0)
  assert.equal((await run(w.challengeTestId,w.challengeQuestions,w.challengeQuestions.length)).xp_awarded,w.rules.challengeTest.max_xp)
  assert.equal((await call('GET',`/students/${sid}/home`)).data.stats.total_xp,320+100)
 }finally{api.close()}
})
test('authored one_time is enforced and remains resumable; battle uses weighted marks',async()=>{
 const repo=createContentRepository(),api=createMockApi({contentRepository:repo})
 try{
  const body={...structuredClone(seedWorlds[0].pkg.studio),content_type:'concept_package',curriculum:{...seedWorlds[0].pkg.studio.curriculum,grade:'Grade 4'}}
  body.test_questions.one_time=true;body.challenge.one_time=true;body.battle_questions[0].marks=8;body.battle_questions[1].marks=1;body.battle_questions[2].marks=1;repo.feed(body)
  const auth=(await api('POST','/demo/login')).data,sid=auth.students[0].id,w=repo.worlds()[0],call=(m,p,b={})=>api(m,p,b,auth.token)
  for(const id of [w.testId,w.challengeTestId]){
   const path=`/students/${sid}/tests/${id}/attempts`,start=(await call('POST',path)).data
   assert.equal((await call('POST',path)).status,409)
   assert.equal((await call('GET',`/tests/attempts/${start.attempt_id}`)).status,200)
   await call('POST',`/tests/attempts/${start.attempt_id}/complete`)
   assert.equal((await call('POST',path)).status,409)
  }
  const start=(await call('POST',`/students/${sid}/challenge-battles`,{challenge_id:w.challengeId,opponent_id:opponents[0].id})).data,root=`/challenge-battles/${start.battle_id}`
  await call('POST',root+'/answers',{question_id:w.battleQuestions[0].id,selected_answer:w.battleQuestions[0].answer})
  assert.equal((await call('POST',root+'/complete')).data.score,80)
 }finally{api.close()}
})
