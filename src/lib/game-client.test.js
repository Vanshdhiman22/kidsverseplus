import test from 'node:test'
import assert from 'node:assert/strict'
import { createGameClient } from './game-client.js'
import { createMockApi } from '../../mock/api.mjs'
import { createContentRepository } from '../../mock/content-repository.mjs'
import { worlds } from '../../mock/gameplay.mjs'
import { normalizeMissionContent } from '../content/mission.js'
import fallback from '../content/fractions-equal-parts.json' with { type: 'json' }

async function setup() {
  const repo=createContentRepository(),mock = createMockApi({contentRepository:repo})
  const auth = (await mock('POST', '/auth/parent/signup', { email: 'integration@example.com', password: 'MockPass123' })).data
  let token = auth.token
  const calls = [], values = new Map()
  const request = async (path, { method = 'GET', body } = {}) => {
    calls.push({ path, method, body })
    const response = await mock(method, path, body, token)
    if (response.status >= 400) throw new Error(response.data?.detail ?? 'Request failed')
    return response.data
  }
  const student = await request('/students', { method: 'POST', body: { name: 'Explorer' } })
  const client = createGameClient({ request, getToken: () => token, storage: { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) } })
  return { client, student, calls, dbWorlds:repo.worlds(), changeToken: value => { token = value } }
}

test('CFU client resumes server state, fetches each question, grades and loads complete review',async()=>{
  const {client,student,calls,dbWorlds}=await setup()
  const world=dbWorlds[0]
  const [start,duplicate]=await Promise.all([client.startLearningAttempt(student.id,world.missionId),client.startLearningAttempt(student.id,world.missionId)])
  assert.equal(start.attempt_id,duplicate.attempt_id)
  assert.equal(calls.filter(c=>c.method==='POST' && c.path.endsWith('/attempts')).length,1)
  await assert.rejects(client.getAttemptReview(start.attempt_id,'cfu'),/Complete/)
  for(let order=1;order<=start.total_questions;order++){
    const q=await client.getLearningQuestion(start.attempt_id,order)
    assert.equal(q.answer,undefined)
    await assert.rejects(client.submitLearningAnswer(start.attempt_id,order,q.options[0].key,'Wrong text'),/differs/)
    const answer=world.cfuQuestions.find(item=>item.id===q.id).answer
    await client.submitLearningAnswer(start.attempt_id,order,answer,q.question_text)
    assert.equal((await client.startLearningAttempt(student.id,world.missionId)).answered_questions,order)
  }
  const result=await client.completeLearningAttempt(start.attempt_id)
  assert.equal(result.correct_count,start.total_questions)
  const replay=await client.completeLearningAttempt(start.attempt_id)
  assert.equal(replay.xp_awarded,result.xp_awarded)
  const review=await client.getAttemptReview(start.attempt_id,'cfu')
  assert.equal(review.items.length,start.total_questions)
  assert.ok(review.items.every(q=>q.is_correct && q.correct_answer))
  assert.equal(calls.some(c=>c.path.endsWith('/missions/'+world.missionId+'/complete')),false)
})

for (const world of worlds) test(`${world.slug}: frontend client loads documented mission and completes server-scored test`, async () => {
  const { client, student, calls } = await setup()
  const mission = await client.loadMission(student.id, world.slug)
  const pkg = normalizeMissionContent(mission, world.pkg.content_id, fallback, mission.learningContext)
  assert.equal(pkg.apiMissionId, world.missionId)
  assert.equal(pkg.check.questions.length, world.pkg.check.questions.length)
  await client.startMission(student.id, world.slug, pkg.apiMissionId)
  const saved = await client.completeMission(student.id, world.slug, 100, pkg.apiMissionId)
  assert.equal(saved.xp_awarded, world.pkg.mission.xp)
  assert.equal(calls.filter(call => call.path.endsWith('/start')).length, 1)
  const attempt = await client.startTest(student.id, world.slug)
  assert.equal(attempt.total, world.questions.length)
  assert.equal(client.getTestAttempt(student.id, world.slug).total, world.questions.length)
  for (let order = 1; order <= attempt.total; order++) {
    const question = await client.getTestQuestion(student.id, world.slug, order)
    const answer = world.questions.find(q=>q.id===question.id).answer
    assert.equal((await client.submitAnswer(student.id, world.slug, order, answer, question.question_text)).is_correct, true)
  }
  const result = await client.completeTest(student.id, world.slug)
  assert.equal(result.correct_count, attempt.total)
  assert.equal(result.xp_awarded, 50)
  assert.equal(calls.filter(call=>call.method==='GET'&&call.path.includes('/questions/')).length, attempt.total)
  assert.equal(calls.some(call => call.path.includes('/learning-packages/')), false)
})

test('mismatched displayed question is never submitted to the API', async () => {
  const { client, student, calls } = await setup()
  await client.startTest(student.id, 'maths')
  await assert.rejects(client.submitAnswer(student.id, 'maths', 1, 'option_1', 'Different bundled question'), /displayed content differ/)
  assert.equal(calls.filter(call => call.path.endsWith('/answers')).length, 0)
})

test('concurrent question readers share HTTP but a later visit fetches again',async()=>{
  const {client,student,calls}=await setup()
  await client.startTest(student.id,'maths')
  const [a,b]=await Promise.all([client.getTestQuestion(student.id,'maths',1),client.getTestQuestion(student.id,'maths',1)])
  assert.deepEqual(a,b)
  assert.equal(calls.filter(c=>c.path.includes('/questions/')).length,1)
  assert.deepEqual(await client.getTestQuestion(student.id,'maths',1),a)
  assert.equal(calls.filter(c=>c.path.includes('/questions/')).length,2)
})

test('test attempts from an earlier login cannot be resumed', async () => {
  const { client, student, changeToken } = await setup()
  await client.startTest(student.id, 'maths')
  changeToken('another-session')
  assert.throws(() => client.getTestAttempt(student.id, 'maths'), /Start a test/)
})

test('challenge fetches each randomized question once and submits the displayed server ID', async()=>{
  const {client,student,calls,dbWorlds}=await setup(),world=dbWorlds[0]
  const attempt=await client.startTest(student.id,'maths','challenge')
  for(let order=1;order<=attempt.total;order++){
    const q=await client.getTestQuestion(student.id,'maths',order,'challenge')
    await client.submitAnswer(student.id,'maths',order,world.challengeQuestions.find(item=>item.id===q.id).answer,q.question_text,'challenge')
    assert.equal(calls.at(-1).body.question_id,q.id)
  }
  assert.equal(calls.filter(c=>c.method==='GET'&&c.path.includes('/questions/')).length,attempt.total)
  assert.equal((await client.completeTest(student.id,'maths','challenge')).score,100)
})

test('battle fetches one question per round, uses server scoring and separates login sessions',async()=>{
  const {client,student,calls,changeToken}=await setup(),world=worlds[0]
  const battle=await client.startBattle(student.id,0,'maths')
  assert.equal(battle.questions,undefined)
  for(let order=1;order<=battle.total_questions;order++){
    const q=await client.getBattleQuestion(student.id,order)
    assert.equal((await client.submitBattleAnswer(student.id,order,world.battleQuestions.find(item=>item.id===q.id).answer,q.question_text)).is_correct,true)
    assert.equal(calls.at(-1).body.question_id,q.id)
  }
  assert.equal(calls.filter(c=>c.method==='GET'&&c.path.includes('/questions/')).length,battle.total_questions)
  assert.equal((await client.completeBattle(student.id,0)).score,100)
  changeToken('another-session')
  assert.throws(()=>client.getBattleAttempt(student.id),/Start a battle/)
})

test('documented string answers and mathematics slug are sent unchanged', async () => {
  const calls = [], storage = new Map()
  const client = createGameClient({ getToken: () => 't', storage: { getItem: k => storage.get(k), setItem: (k, v) => storage.set(k, v) }, request: async (path, options) => {
    calls.push({ path, ...options })
    if (path.endsWith('/subjects')) return { subjects: [{ id: 's', slug: 'mathematics', name: 'Mathematics' }] }
    if (path === '/subjects/s/topics') return { topics: [{ id: 'locked', status: 'locked' }, { id: 'topic', name: 'Fractions' }] }
    if (path === '/students/child/topics/topic') return { nodes: [{ mission_id: 'done', status: 'completed' }, { mission_id: 'current', status: 'in_progress' }] }
    if (path === '/topics/topic/tests') return { tests: [{ id: 'test' }] }
    if (path === '/tests/test') return { id: 'test', questions_count: 5 }
    if (path.endsWith('/attempts')) return { attempt_id: 'attempt', first_question: { id: 'q', question_text: 'Half?', options: ['1/2', '1/3'] } }
    if (path.includes('/questions/')) return { id: 'q', question_text: 'Half?', options: ['1/2', '1/3'] }
    if (path.endsWith('/answers')) return { is_correct: true }
    throw new Error(`Unexpected path ${path}`)
  } })
  assert.equal((await client.resolveLearning('child', 'maths')).missionId, 'current')
  assert.equal((await client.startTest('child', 'maths')).total, 5)
  await client.submitAnswer('child', 'maths', 1, '1/2', 'Half?')
  assert.deepEqual(calls.at(-1).body, { question_id: 'q', selected_answer: '1/2' })
})

test('tests remain available when the topic has no missions', async () => {
  const client = createGameClient({ getToken: () => 't', storage: {}, request: async path => {
    if (path.endsWith('/subjects')) return { subjects: [{ id: 's', slug: 'maths' }] }
    if (path === '/subjects/s/topics') return { topics: [{ id: 'topic' }] }
    if (path === '/students/child/topics/topic') return { nodes: [] }
    if (path === '/topics/topic/tests') return { tests: [{ id: 'test' }] }
    if (path === '/tests/test') return { id: 'test', question_count: 1 }
    throw new Error(path)
  } })
  assert.equal((await client.getTestOverview('child', 'maths')).id, 'test')
  await assert.rejects(client.loadMission('child', 'maths'), /no available missions/)
})

test('result retry preserves accepted completion and does not post completion twice', async () => {
  const values = new Map([['kv:api-test:child:maths:t', JSON.stringify({ attempt_id: 'attempt' })]])
  let posts = 0, reads = 0
  const client = createGameClient({ getToken: () => 't', storage: { getItem: k => values.get(k), setItem: (k,v) => values.set(k,v) }, request: async path => {
    if (path.endsWith('/complete')) { posts++; return { correct_count: 1, total_questions: 1, status: 'completed' } }
    if (++reads === 1) throw new Error('Request failed (500)')
    return { correct_count: 1, total_questions: 1, xp_awarded: 50 }
  } })
  const pending = await client.completeTest('child', 'maths')
  assert.equal(pending.correct_count, 1)
  assert.equal(pending.resultPending, true)
  assert.equal(pending.xp_awarded, undefined)
  const retry = await client.completeTest('child', 'maths')
  assert.equal(retry.resultPending, false)
  assert.equal(retry.xp_awarded, 50)
  assert.equal(posts, 1)
})
