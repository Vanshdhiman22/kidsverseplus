import test from 'node:test'
import assert from 'node:assert/strict'
import { eligiblePracticePackages, practiceQuestions, practiceCorrect, createChallengePractice } from './challenge-practice.js'

const context = { grade: '1', board: 'CBSE', subject: 'Mathematics', topic: 'Shapes' }
const selected = { id: 'package', concept_id: 'concept', concept_name: 'Squares', grade: 'Grade 1', board: 'CBSE', subject_name: 'Mathematics', topic_name: 'Shapes', is_published: true }
const payload = { id: 'package', concept: { id: 'concept' }, curriculum: context, challenge: { questions: [{ question: 'Which shape?', options: ['Circle', 'Square'], answer: 'Square', explanation: 'Four equal sides.', image_url: '/actual.jpg', hints: ['Count the sides.'] }] } }

test('practice choices exclude wrong grade, board, subject, topic and unpublished packages', () => {
  const invalid = [{grade:'4'}, {board:'ICSE'}, {subject_name:'Science'}, {topic_name:'Fractions'}, {is_published:false}].map(change => ({...selected,...change}))
  assert.deepEqual(eligiblePracticePackages([selected,...invalid],context), [selected])
})
test('practice uses the actual question, answer, hints and picture; missing content cannot fabricate a result', () => {
  const [q] = practiceQuestions(payload, selected, context)
  assert.equal(q.instruction, 'Which shape?')
  assert.equal(q.models[0].image, '/actual.jpg')
  assert.deepEqual(q.models[0].hints, ['Count the sides.'])
  assert.equal(practiceCorrect(q,['option_2']),true)
  assert.equal(practiceCorrect(q,['option_1']),false)
  assert.equal(practiceCorrect(q,[]),false)
  assert.throws(()=>practiceQuestions({...payload,concept:{id:'other'}},selected,context),/does not match/)
  assert.throws(()=>practiceQuestions({...payload,challenge:{questions:[]}},selected,context),/No challenge questions/)
  assert.throws(()=>practiceQuestions({...payload,challenge:{questions:[{question:'Broken',options:['A','B']}]}},selected,context),/incomplete/)
})
test('multi-select practice requires the complete exact answer set', () => {
  const q = {answer:['a','b']}
  assert.equal(practiceCorrect(q,['b','a']),true)
  for (const picks of [[],['a'],['a','a'],['a','b','c']]) assert.equal(practiceCorrect(q,picks),false)
})
test('practice uses existing read endpoints only, validates package selection, and never writes XP or answers', async () => {
  const calls=[]
  const client=createChallengePractice({resolveTopic:async()=>({detail:{name:'Shapes'},subject:{name:'Mathematics'}}),request:async(path,options)=>{
    calls.push({path,options})
    if(path==='/students/child/profile')return {grade:'1',board:'CBSE'}
    if(path==='/admin/content/packages')return {packages:[selected]}
    if(path==='/admin/content/packages/package')return payload
    throw Error('Unexpected request')
  }})
  const catalog=await client.list('child','maths')
  assert.equal((await client.load(catalog,'package')).questions.length,1)
  await assert.rejects(client.load(catalog,'other'),/Choose a published concept/)
  assert.equal(calls.length,3)
  assert.ok(calls.every(call=>call.options===undefined))
})
