import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { selectAttemptQuestions } from './question-selection.mjs'
import { createMockApi } from './api.mjs'
import { createContentRepository } from './content-repository.mjs'
import { opponents, seedWorlds } from './content-seed.mjs'
import { createSessionSnapshot } from '../src/lib/session-snapshot.js'

test('server selection shuffles without replacement, applies the round limit and never mutates the DB bank', () => {
  const bank=Array.from({length:8},(_,i)=>({id:`q${i}`,order_index:20+i,answer:'private'})),original=structuredClone(bank)
  const selected=selectAttemptQuestions(bank,3,()=>0)
  assert.equal(selected.length,3)
  assert.equal(new Set(selected.map(q=>q.id)).size,3)
  assert.deepEqual(selected.map(q=>q.order_index),[1,2,3])
  assert.notDeepEqual(selected.map(q=>q.id),selectAttemptQuestions(bank,3,max=>max-1).map(q=>q.id))
  assert.deepEqual(bank,original)
})

for (const mode of ['test','challenge','battle']) test(`${mode}: DB random sequence survives retries, publication changes and SQLite restart; each GET has one public question`, async()=>{
  const directory=mkdtempSync(join(tmpdir(),'kidsverse-random-')),filename=join(directory,'content.sqlite')
  const content={...structuredClone(seedWorlds[0].pkg.studio),content_type:'concept_package'}
  content.curriculum.grade='Grade 4'
  content.challenge.questions.push(...structuredClone(content.test_questions.questions.slice(0,2)))
  let selections=0,repo=createContentRepository({filename,seed:false})
  repo.feed(content)
  let api=createMockApi({contentRepository:repo,randomIndex:()=>{selections++;return 0}})
  try {
    const auth=(await api('POST','/demo/login')).data,token=auth.token,sid=auth.students[0].id,w=repo.worlds()[0]
    const bank=mode==='test'?w.questions:mode==='challenge'?w.challengeQuestions:w.battleQuestions
    const startPath=mode==='battle'?`/students/${sid}/challenge-battles`:`/students/${sid}/tests/${mode==='test'?w.testId:w.challengeTestId}/attempts`
    const body=mode==='battle'?{challenge_id:w.challengeId,opponent_id:opponents[0].id}:{}
    const start=await api('POST',startPath,body,token,{idempotencyKey:'start-once'})
    assert.equal(start.status,201);assert.ok(selections>0)
    assert.equal(start.data.questions,undefined);assert.equal(start.data.first_question,undefined)
    const root=mode==='battle'?`/challenge-battles/${start.data.battle_id}`:`/tests/attempts/${start.data.attempt_id}`
    const total=start.data.total_questions,before=selections,delivered=[]
    for(let order=1;order<=total;order++) {
      const response=await api('GET',root+`/questions/${order}`,{},token)
      assert.equal(response.status,200)
      assert.ok(bank.some(q=>q.id===response.data.id))
      assert.equal(response.data.order_index,order)
      for(const key of ['answer','correct_answer','explanation','questions'])assert.equal(response.data[key],undefined)
      assert.deepEqual(await api('GET',root+`/questions/${order}`,{},token),response)
      delivered.push(response.data)
    }
    assert.equal(new Set(delivered.map(q=>q.id)).size,total)
    assert.equal(selections,before)
    assert.equal((await api('GET',root+`/questions/${total+1}`,{},token)).status,404)
    const outsider=(await api('POST','/demo/login')).data
    assert.equal((await api('GET',root+'/questions/1',{},outsider.token)).status,403)
    assert.equal((await api('GET',root+'/questions/1')).status,401)
    const snapshot=createSessionSnapshot({getItem:()=>JSON.stringify({session_id:token,resources:{[root+'/questions/1']:delivered[0]}})})
    assert.equal(snapshot.request('GET',root+'/questions/1',{},token),null)
    const updated=structuredClone(content)
    for(const questions of [updated.test_questions.questions,updated.challenge.questions,updated.battle_questions])for(const q of questions)q.question+=' NEW PUBLISHED VERSION'
    repo.feed(updated)
    api.close();repo=createContentRepository({filename});api=createMockApi({contentRepository:repo})
    assert.deepEqual(await api('POST',startPath,body,token,{idempotencyKey:'start-once'}),start)
    for(const [index,q] of delivered.entries()) {
      assert.deepEqual((await api('GET',root+`/questions/${index+1}`,{},token)).data,q)
      const expected=bank.find(item=>item.id===q.id)
      const answer=await api('POST',root+'/answers',{question_id:q.id,selected_answer:expected.answer},token)
      assert.equal(answer.status,200);assert.equal(answer.data.is_correct,true)
    }
    const result=await api('POST',root+'/complete',{},token)
    assert.equal(result.data.score,100);assert.equal(result.data.content_version,w.contentVersion)
  } finally {api.close();rmSync(directory,{recursive:true,force:true})}
})
