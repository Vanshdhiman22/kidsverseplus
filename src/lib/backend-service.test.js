import test from 'node:test'
import assert from 'node:assert/strict'
import contract from './backend-contract.json' with { type: 'json' }
import { createBackendService, settingsValues, settingsRequest, novaReply, backendErrorMessage, loadFamilyProfiles } from './backend-service.js'
import { remoteStudent } from '../state/family.js'
import { createMockApi } from '../../mock/api.mjs'
import { createGameClient } from './game-client.js'
import { curriculumSupports } from './curriculum-options.js'
import { grantParentAccess, hasParentAccess } from './parent-access.js'

test('all 72 supplied backend operations have an exact, callable method/path binding', async () => {
  const calls = []
  const service = createBackendService(async (path, options) => { calls.push({ path, ...options }); return { ok: true } })
  assert.equal(contract.operations.length, 72)
  assert.equal(Object.keys(service).length, 72)
  assert.equal(calls.length, 0) // Registering management operations never runs them.
  for (const operation of contract.operations) {
    const params = Object.fromEntries([...operation.path.matchAll(/\{([^}]+)\}/g)].map(([, key]) => [key, key === 'order' ? 2 : 'qa-id']))
    const expected = operation.path.replace(/\{([^}]+)\}/g, (_, key) => String(params[key]))
    await service[operation.name](params, { selected_answer: 'Circle' })
    const call = calls.at(-1)
    assert.equal(call.path, expected, operation.name)
    assert.equal(call.method, operation.method, operation.name)
    assert.deepEqual(call.body, operation.method === 'GET' ? undefined : { selected_answer: 'Circle' })
  }
  assert.throws(() => service.getStudentProfile(), /studentId is required/)
  await service.getParentEvidence({ student_id: 'child & one', topic_id: 'topic/two' })
  assert.equal(calls.at(-1).path, '/parent/evidence?student_id=child+%26+one&topic_id=topic%2Ftwo')
})

test('settings consume both supplied Django envelope and flat mock response', () => {
  assert.deepEqual(settingsValues({ settings: { sound: false, theme: 'dark' }, updated_at: 'today' }), { sound: false, theme: 'dark' })
  assert.deepEqual(settingsValues({ sound: true, readAloud: false, student_id: 'qa' }), { sound: true, readAloud: false })
  assert.throws(() => settingsValues(null), /invalid/)
  assert.deepEqual(settingsRequest({ sound:false },'live'),{ settings:{ sound:false } })
  assert.deepEqual(settingsRequest({ sound:false },'mock'),{ sound:false })
})

test('live settings request sends the required Django settings envelope before reading the saved values', async () => {
  const service = createBackendService(async(path,options)=>{
    assert.equal(path,'/students/child/settings')
    if(options.method==='PATCH') {
      assert.deepEqual(options.body,{settings:{sound:false,theme:'dark'}})
      return {settings:options.body.settings,updated_at:'now'}
    }
  })
  const saved=await service.patchStudentSettings({studentId:'child'},settingsRequest({sound:false,theme:'dark'}))
  assert.deepEqual(settingsValues(saved),{sound:false,theme:'dark'})
})

test('Nova displays the server reply, not an echoed prompt or undefined field', () => {
  assert.equal(novaReply({ message: 'Question', response: 'Backend answer' }).text, 'Backend answer')
  assert.equal(novaReply({ text: 'Mock answer' }).text, 'Mock answer')
  assert.throws(() => novaReply({ message: 'Question' }), /did not return/)
})

test('Django field errors and error strings remain readable in the frontend', () => {
  assert.equal(backendErrorMessage({ error: 'No pass available' }, 409), 'No pass available')
  assert.equal(backendErrorMessage({ error: { message: 'Wrong PIN' } }, 401), 'Wrong PIN')
  assert.equal(backendErrorMessage({ interest_ids: ['Invalid UUID.'] }, 400), 'interest ids: Invalid UUID.')
  assert.equal(backendErrorMessage({}, 500), 'Request failed (500)')
})

test('family cards use child-scoped profile XP and streak from existing APIs', async () => {
  const data = await loadFamilyProfiles({
    parentStudents: async () => ({ students: [{ id: 'nova', name: 'Nova' }, { id: 'moon', name: 'Moon' }] }),
    avatarCharacters: async () => ({ characters: [] }),
    studentProfile: async id => ({ name: id, total_xp: id === 'nova' ? 70 : 0, day_streak: id === 'nova' ? 1 : 0 }),
  })
  assert.equal(remoteStudent(data.students[0]).stats.xp, 70)
  assert.equal(remoteStudent(data.students[0]).streak, 1)
  assert.equal(remoteStudent(data.students[1]).stats.xp, 0)
})

test('curriculum choices follow available backend grade/board combinations', () => {
  const rows = [{ grade: 'Grade 1', board: 'CBSE', is_active: true }, { grade: '2', board: 'ICSE', is_active: false }]
  assert.equal(curriculumSupports(rows, '1', 'CBSE'), true)
  assert.equal(curriculumSupports(rows, '1', 'ICSE'), false)
  assert.equal(curriculumSupports(rows, '2', 'ICSE'), false)
  assert.equal(curriculumSupports([], '1', 'CBSE'), false)
})

test('parent navigation verification is scoped to the existing login and expires', () => {
  const values = new Map(), storage = { getItem: key => values.get(key), setItem: (key,value) => values.set(key,value) }
  assert.equal(hasParentAccess(storage,'first',100),false)
  grantParentAccess(storage,'first',100)
  assert.equal(hasParentAccess(storage,'first',101),true)
  assert.equal(hasParentAccess(storage,'other',101),false)
  assert.equal(hasParentAccess(storage,'first',300100),false)
})

test('live topic resolution uses the existing child learning path to avoid wrong-grade catalog IDs', async () => {
  const calls = []
  const client = createGameClient({ mode:'live', getToken:()=> 'qa', storage:{getItem:()=>null,setItem(){}},
    getLearningPath:async studentId => ({student_id:studentId,subjects:[{id:'math',topics:[{id:'grade1'}]}]}),
    request:async path => {
      calls.push(path)
      if(path==='/students/child/subjects')return {subjects:[{id:'math',slug:'maths'}]}
      if(path==='/subjects/math/topics')return {topics:[{id:'stale-grade4'},{id:'grade1'}]}
      if(path==='/students/child/topics/grade1')return {name:'Shapes',nodes:[]}
      throw Error(path)
    },
  })
  assert.equal((await client.loadLearningPath('child','maths')).topicId,'grade1')
  assert.ok(!calls.some(path=>path.includes('stale-grade4')))
})

test('connected settings, Nova history, profile and leaderboard execute against the API transport', async t => {
  const mock = createMockApi()
  t.after(() => mock.close())
  const demo = await mock('POST', '/demo/login', {})
  assert.equal(demo.status, 200)
  const token = demo.data.token
  const studentId = demo.data.students[0].id
  const service = createBackendService(async (path, { method, body }) => {
    const response = await mock(method, path, body, token)
    if (response.status >= 400) throw new Error(`${method} ${path}: ${response.data.detail}`)
    return response.data
  })
  const profile = await service.getStudentProfile({ studentId })
  assert.equal(typeof profile.total_xp, 'number')
  const original = settingsValues(await service.getStudentSettings({ studentId }))
  await service.patchStudentSettings({ studentId }, { ...original, sound: false })
  assert.equal(settingsValues(await service.getStudentSettings({ studentId })).sound, false)
  await service.postStudentNovaMessages({ studentId }, { message: 'Help me count to ten' })
  const history = await service.getStudentNovaMessages({ studentId })
  assert.ok(history.messages.length)
  assert.ok(novaReply(history.messages.at(-1)).text)
  const challenges = await service.getListChallenges()
  const result = await service.getChallengeLeaderboard({ challengeId: challenges.challenges[0].id, student_id: studentId, scope: 'global' })
  assert.ok(Array.isArray(result.entries))
})
