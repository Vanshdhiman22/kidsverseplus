import test from 'node:test'
import assert from 'node:assert/strict'
import {createMockApi} from './api.mjs'
import {createContentRepository} from './content-repository.mjs'
import {seedWorlds,opponents} from './content-seed.mjs'
import {checkAssessmentResponse,buildAssessmentOpenApi,assessmentOperations} from './assessment-contracts.mjs'
import {createSessionSnapshot,isDynamic} from '../src/lib/session-snapshot.js'

async function fixture(){
 const repo=createContentRepository(),api=createMockApi({contentRepository:repo})
 const auth=(await api('POST','/demo/login')).data,sid=auth.students[0].id,w=structuredClone(repo.worlds()[0])
 const call=async(method,path,body={})=>{
  const r=await api(method,path,body,auth.token)
  if(/\/attempts(?:\/|$)|^\/challenge-battles\//.test(path)||path.endsWith('/challenge-battles')){
   const check=checkAssessmentResponse(method,path,r);assert.ok(check.valid,`${method} ${path}: ${JSON.stringify(check.errors)}`)
  }
  return r
 }
 return {repo,api,auth,sid,w,call}
}
test('CFU is graded by the backend, review opens only after completion and mission reward is issued once',async()=>{
 const {api,sid,w,call}=await fixture()
 try{
  const started=await call('POST',`/students/${sid}/missions/${w.missionId}/attempts`,{})
  assert.equal(started.status,201);assert.equal(started.data.total_questions,w.cfuQuestions.length)
  const root=`/missions/attempts/${started.data.attempt_id}`
  assert.equal(started.data.first_question.answer,undefined)
  assert.equal(started.data.first_question.explanation,undefined)
  assert.equal((await call('GET',root+'/review')).status,409)
  assert.equal((await call('GET',root+'/result')).status,409)
  const forged=await call('POST',root+'/complete',{score:100});assert.equal(forged.status,400)
  assert.equal(forged.data.error.details.violations[0].field,'score')
  assert.equal((await call('POST',root+'/answers',{question_id:w.questions[0].id,selected_answer:'option_1'})).status,400)
  for(const q of w.cfuQuestions){
   assert.equal((await call('GET',root+`/questions/${q.order_index}`)).data.id,q.id)
   const body={question_id:q.id,selected_answer:q.answer},first=await call('POST',root+'/answers',body)
   assert.equal(first.data.is_correct,true);assert.deepEqual(await call('POST',root+'/answers',body),first)
  }
  assert.equal((await call('GET',root)).data.next_question,null)
  const result=await call('POST',root+'/complete',{});assert.equal(result.data.score,100);assert.equal(result.data.xp_awarded,w.pkg.mission.xp)
  assert.deepEqual(await call('POST',root+'/complete',{}),result)
  assert.deepEqual((await call('GET',root+'/result')).data,result.data)
  const review=(await call('GET',root+'/review')).data
  assert.equal(review.items.length,w.cfuQuestions.length);assert.ok(review.items.every(q=>q.is_correct))
  assert.equal((await call('GET',root)).data.status,'completed')
  assert.equal((await call('POST',root+'/answers',{question_id:w.cfuQuestions[0].id,selected_answer:w.cfuQuestions[0].answer})).status,409)
  const second=(await call('POST',`/students/${sid}/missions/${w.missionId}/attempts`,{})).data
  assert.equal((await call('POST',`/missions/attempts/${second.attempt_id}/complete`,{})).data.xp_awarded,0)
  assert.equal((await call('GET',`/students/${sid}/home`)).data.stats.total_xp,320+w.pkg.mission.xp)
 }finally{api.close()}
})
test('CFU ownership, immutable answers, idempotent starts and in-progress state are enforced',async()=>{
 const {api,auth,sid,w,call}=await fixture()
 try{
  const path=`/students/${sid}/missions/${w.missionId}/attempts`,context={idempotencyKey:'cfu-start'}
  const a=await api('POST',path,{},auth.token,context),again=await api('POST',path,{},auth.token,context)
  assert.deepEqual(a,again)
  const root=`/missions/attempts/${a.data.attempt_id}`,other=(await api('POST','/demo/login')).data
  for(const [method,suffix,body]of [['GET','',{}],['GET','/questions/1',{}],['GET','/review',{}],['POST','/answers',{question_id:w.cfuQuestions[0].id,selected_answer:w.cfuQuestions[0].answer}],['POST','/complete',{}]]){
   assert.equal((await api(method,root+suffix,body)).status,401)
   assert.equal((await api(method,root+suffix,body,other.token)).status,403)
  }
  const q=w.cfuQuestions[0],body={question_id:q.id,selected_answer:q.answer}
  await call('POST',root+'/answers',body)
  assert.equal((await call('POST',root+'/answers',{...body,selected_answer:q.options.find(o=>o.key!==q.answer).key})).status,409)
  const status=(await call('GET',root)).data;assert.equal(status.answered_questions,1);assert.equal(status.next_question.id,w.cfuQuestions[1].id)
  assert.equal((await api('DELETE',root,{},auth.token)).status,405)
  const result=(await call('POST',root+'/complete',{})).data
  const expected=q.marks/w.cfuQuestions.reduce((n,q)=>n+q.marks,0)*100
  assert.equal(result.score,expected)
  const review=(await call('GET',root+'/review')).data
  assert.equal(review.items[1].selected_answer,null);assert.equal(review.items[1].earned_marks,0)
 }finally{api.close()}
})
test('CFU scoring and completed review retain the original published bank',async()=>{
 const {repo,api,sid,w,call}=await fixture()
 try{
  const a=(await call('POST',`/students/${sid}/missions/${w.missionId}/attempts`,{})).data,root=`/missions/attempts/${a.attempt_id}`
  const body=structuredClone(seedWorlds[0].pkg.studio);body.content_type='concept_package';body.curriculum.grade='Grade 4'
  for(const q of body.check_for_understanding){q.answer=q.options.find(o=>o!==q.answer);q.question+=' Updated'}
  repo.feed(body)
  for(const q of w.cfuQuestions)await call('POST',root+'/answers',{question_id:q.id,selected_answer:q.answer})
  const result=(await call('POST',root+'/complete',{})).data
  assert.equal(result.score,100);assert.equal(result.content_version,1)
  assert.equal((await call('GET',root+'/review')).data.items[0].question_text,w.cfuQuestions[0].instruction)
  const fresh=(await call('POST',`/students/${sid}/missions/${w.missionId}/attempts`,{})).data
  assert.equal(fresh.content_version,2);assert.match(fresh.first_question.question_text,/Updated/)
 }finally{api.close()}
})
test('Test, Challenge and Battle review use completed server answers and follow response schemas',async()=>{
 const {api,sid,w,call}=await fixture()
 try{
  const other=(await api('POST','/demo/login')).data
  for(const [id,bank,mode] of [[w.testId,w.questions,'test'],[w.challengeTestId,w.challengeQuestions,'challenge']]){
   const a=(await call('POST',`/students/${sid}/tests/${id}/attempts`,{})).data,root=`/tests/attempts/${a.attempt_id}`
   assert.equal((await call('GET',root+'/review')).status,409)
   const publicQuestion=(await call('GET',root+'/questions/1')).data,q=bank.find(q=>q.id===publicQuestion.id)
   await call('POST',root+'/answers',{question_id:q.id,selected_answer:q.answer})
   await call('POST',root+'/complete',{});await call('GET',root+'/result')
   const review=(await call('GET',root+'/review')).data
   assert.equal(review.assessment_type,mode);assert.equal(review.items[0].selected_answer,q.answer)
   assert.equal((await api('GET',root+'/review',{},other.token)).status,403)
   assert.equal(review.items[0].image_url,q.models?.[0]?.image??null)
   if(bank.length>1)assert.equal(review.items[1].selected_answer,null)
  }
  const a=(await call('POST',`/students/${sid}/challenge-battles`,{challenge_id:w.challengeId,opponent_id:opponents[0].id})).data,root=`/challenge-battles/${a.battle_id}`
  assert.equal((await call('GET',root+'/review')).status,409)
  const publicQuestion=(await call('GET',root+'/questions/1')).data,q=w.battleQuestions.find(q=>q.id===publicQuestion.id)
  await call('POST',root+'/answers',{question_id:q.id,selected_answer:q.answer})
  await call('POST',root+'/complete',{});await call('GET',root+'/result')
  assert.equal((await call('GET',root+'/review')).data.items[0].is_correct,true)
  assert.equal((await api('GET',root+'/review',{},other.token)).status,403)
 }finally{api.close()}
})
test('OpenAPI matches runtime contracts and CFU state/reviews cannot be cached as static content',async()=>{
 const {api}=await fixture()
 try{
  const spec=buildAssessmentOpenApi()
  assert.equal((await api('GET','/openapi/assessments.json')).status,200)
  assert.deepEqual((await api('GET','/openapi/assessments.json')).data,spec)
  assert.equal(Object.values(spec.paths).reduce((n,path)=>n+Object.keys(path).length,0),assessmentOperations.length)
  const values=new Map(),snapshot=createSessionSnapshot({getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)})
  const path='/missions/attempts/example/review';snapshot.seed({session_id:'token',resources:{[path]:{should_not_be_cached:true}}})
  assert.equal(isDynamic(path),true);assert.equal(snapshot.request('GET',path,{},'token'),null)
  assert.equal(isDynamic('/students/s/missions/m/attempts'),true)
 }finally{api.close()}
})
