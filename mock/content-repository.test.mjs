import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {createContentRepository} from './content-repository.mjs'
import {seedWorlds,opponents} from './content-seed.mjs'
import {createMockApi} from './api.mjs'
import {createGameClient} from '../src/lib/game-client.js'

const payload=()=>{const body={...structuredClone(seedWorlds[0].pkg.studio),content_type:'concept_package'};body.curriculum.grade='Grade 4';return body}
test('segregated content persists, reconstructs all banks, and invalid feed leaves no partial package',()=>{
  const dir=mkdtempSync(join(tmpdir(),'kidsverse-content-')),filename=join(dir,'content.sqlite')
  let repo=createContentRepository({filename,seed:false})
  try{
    const body=payload(),saved=repo.feed(body).data
    const read=repo.detail(saved.package_id)
    for(const key of Object.keys(body))assert.deepEqual(read[key],body[key])
    const invalid=payload();invalid.concept.name='Rejected concept';invalid.battle_questions[0].answer='Not an option'
    assert.throws(()=>repo.feed(invalid),/answer from those options/)
    assert.equal(repo.list().length,1)
    const collision=payload();collision.curriculum.topic='Must roll back';collision.concept.name='Rollback concept'
    assert.throws(()=>repo.feed(collision,{missionId:saved.mission_id}),/UNIQUE constraint/)
    assert.equal(repo.tree().length,1)
    repo.close();repo=createContentRepository({filename,seed:false})
    assert.equal(repo.worlds()[0].missionId,saved.mission_id)
    assert.equal(repo.worlds()[0].challengeQuestions.length,body.challenge.questions.length)
    assert.equal(repo.list({grade:'4',board:'CBSE'}).length,1)
    assert.equal(repo.list({grade:'5'}).length,0)
    assert.equal(repo.tree({subject:'Mathematics'})[0].concepts[0].available_themes[0],body.theme_interest)
  }finally{repo.close();rmSync(dir,{recursive:true})}
})

test('admin feed is isolated from parent auth, retries are idempotent, and new content reaches all four flows',async()=>{
  const repo=createContentRepository(),api=createMockApi({contentRepository:repo,contentAdminKey:'test-admin-key'})
  try{
    const {data:auth}=await api('POST','/demo/login'),token=auth.token,sid=auth.students[0].id
    const call=(method,path,body={},context={})=>api(method,path,body,token,context)
    const w=repo.worlds()[0],body=payload();body.concept.name='New DB concept'
    assert.equal((await call('POST','/admin/content/feed',body)).status,403)
    const admin={contentAdminKey:'test-admin-key',idempotencyKey:'new-package'}
    const first=await call('POST','/admin/content/feed',body,admin),again=await call('POST','/admin/content/feed',body,admin)
    assert.equal(first.status,201);assert.deepEqual(first,again)
    const changed=structuredClone(body);changed.learning_content.explanation='Changed nested content'
    assert.equal((await call('POST','/admin/content/feed',changed,admin)).status,409)
    const linked=first.data.data
    const detail=(await call('GET',`/students/${sid}/topics/${linked.topic_id}`)).data
    assert.equal(detail.nodes.length,2)
    assert.equal((await call('GET',`/students/${sid}/subjects`)).data.subjects.length,5)
    await call('POST',`/students/${sid}/missions/${linked.mission_id}/start`)
    const finished=(await call('POST',`/students/${sid}/missions/${linked.mission_id}/complete`,{score:100})).data
    assert.equal(finished.topic_progress_percent,50);assert.equal(finished.next_mission_id,w.missionId)
    assert.equal((await call('GET',`/students/${sid}/topics/${linked.topic_id}`)).data.nodes.find(n=>n.mission_id===linked.mission_id).stars,3)
    assert.equal((await call('GET','/parent/overview')).data.students[0].subjects.length,5)
    const mission=(await call('GET',`/missions/${linked.mission_id}`)).data
    assert.equal(mission.content.learning_objective,undefined)
    assert.equal(mission.content.learn_before_test.steps[0].teaching_text,body.learn_before_test.steps[0].teaching_text)
    assert.equal('test_questions' in mission.content,false)
    for(const id of [linked.test_id,linked.challenge_test_id]){
      const attempt=(await call('POST',`/students/${sid}/tests/${id}/attempts`)).data
      assert.ok(attempt.total_questions);assert.equal(attempt.first_question,undefined)
      const question=(await call('GET',`/tests/attempts/${attempt.attempt_id}/questions/1`)).data
      assert.ok(question.id);assert.equal('answer' in question,false)
    }
    const battle=(await call('POST',`/students/${sid}/challenge-battles`,{challenge_id:linked.challenge_id,opponent_id:opponents[0].id})).data
    const question=(await call('GET',`/challenge-battles/${battle.battle_id}/questions/1`)).data
    assert.ok(body.battle_questions.some(q=>q.question===question.question_text))
    assert.equal('answer' in question,false);assert.equal(battle.questions,undefined)
    assert.equal((await call('GET','/admin/content/packages')).status,403)
    assert.equal((await call('GET','/admin/content/packages',{},admin)).data.count,6)
    assert.equal((await call('POST','/admin/content/feed',body,{...admin,contentAdminKey:'wrong'})).status,403)
  }finally{api.close()}
})

test('published updates cannot change an existing test, challenge or battle grading snapshot',async()=>{
  const repo=createContentRepository(),api=createMockApi({contentRepository:repo})
  try{
    const auth=(await api('POST','/demo/login')).data,sid=auth.students[0].id
    const call=(method,path,body={})=>api(method,path,body,auth.token)
    const w=structuredClone(repo.worlds()[0]),attempts=[]
    for(const id of [w.testId,w.challengeTestId])attempts.push((await call('POST',`/students/${sid}/tests/${id}/attempts`)).data)
    const battle=(await call('POST',`/students/${sid}/challenge-battles`,{challenge_id:w.challengeId,opponent_id:opponents[0].id})).data
    const updated=payload()
    for(const bank of [updated.test_questions.questions,updated.battle_questions,updated.challenge.questions])for(const q of bank){q.answer=q.options.find(v=>v!==q.answer);q.question+=' (version two)'}
    assert.equal(repo.feed(updated).data.content_version,2)
    for(const [i,a]of attempts.entries()){
      const bank=i?w.challengeQuestions:w.questions
      for(const q of bank)assert.equal((await call('POST',`/tests/attempts/${a.attempt_id}/answers`,{question_id:q.id,selected_answer:q.answer})).data.is_correct,true)
      const done=await call('POST',`/tests/attempts/${a.attempt_id}/complete`)
      assert.equal(done.data.score,100);assert.equal(done.data.content_version,1)
    }
    for(const q of w.battleQuestions)assert.equal((await call('POST',`/challenge-battles/${battle.battle_id}/answers`,{question_id:q.id,selected_answer:q.answer})).data.is_correct,true)
    const done=await call('POST',`/challenge-battles/${battle.battle_id}/complete`,{score:0})
    assert.equal(done.data.score,100);assert.equal(done.data.content_version,1)
    const fresh=(await call('POST',`/students/${sid}/tests/${w.testId}/attempts`)).data
    assert.equal(fresh.content_version,2);assert.match((await call('GET',`/tests/attempts/${fresh.attempt_id}/questions/1`)).data.question_text,/version two/)
  }finally{api.close()}
})

test('frontend separates normal and challenge attempts and chooses battle content by subject',async()=>{
  const repo=createContentRepository(),api=createMockApi({contentRepository:repo})
  try{
    const auth=(await api('POST','/demo/login')).data,sid=auth.students[0].id,values=new Map()
    const client=createGameClient({getToken:()=>auth.token,storage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)},request:async(path,{method='GET',body={}}={})=>{const r=await api(method,path,body,auth.token);if(r.status>=400)throw Error(r.data.detail);return r.data}})
    const normal=await client.startTest(sid,'maths'),challenge=await client.startTest(sid,'maths','challenge')
    assert.notEqual(normal.attempt_id,challenge.attempt_id)
    assert.equal(client.getTestAttempt(sid,'maths').attempt_id,normal.attempt_id)
    assert.equal(client.getTestAttempt(sid,'maths','challenge').attempt_id,challenge.attempt_id)
    const q=await client.getTestQuestion(sid,'maths',1,'challenge'),w=repo.worlds()[0]
    await client.submitAnswer(sid,'maths',1,w.challengeQuestions[0].answer,q.question_text,'challenge')
    assert.equal((await client.completeTest(sid,'maths','challenge')).score,100)
    const literacy=repo.worlds().find(w=>w.slug==='literacy')
    assert.equal((await client.battlePreview(0,'literacy')).challengeId,literacy.challengeId)
    await assert.rejects(client.battlePreview(0,'unknown'),/No challenges/)
  }finally{api.close()}
})

test('frontend selects the requested DB mission and its assessments across multiple topics',async()=>{
 const repo=createContentRepository(),api=createMockApi({contentRepository:repo})
 try{
  const body=payload();body.curriculum.topic='A second topic';body.concept.name='A second concept'
  const linked=repo.feed(body).data
  const auth=(await api('POST','/demo/login')).data,sid=auth.students[0].id,values=new Map()
  const client=createGameClient({getToken:()=>auth.token,storage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)},request:async(path,{method='GET',body={}}={})=>{const r=await api(method,path,body,auth.token);if(r.status>=400)throw Error(r.data.detail);return r.data}})
  assert.equal((await client.loadMission(sid,'maths',linked.mission_id)).id,linked.mission_id)
  assert.equal((await client.getTestOverview(sid,'maths','test',linked.mission_id)).id,linked.test_id)
  assert.equal((await client.getTestOverview(sid,'maths','challenge',linked.mission_id)).id,linked.challenge_test_id)
  assert.equal((await client.startTest(sid,'maths','challenge',linked.mission_id)).package_id,linked.package_id)
  await assert.rejects(client.loadMission(sid,'literacy',linked.mission_id),/no API topics/)
 }finally{api.close()}
})
