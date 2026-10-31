import test from 'node:test'
import assert from 'node:assert/strict'
import { createGameClient } from './game-client.js'
import { loadFamilyProfiles } from './backend-service.js'

test('live topics use the child curriculum directly and fetch subjects/path in parallel', async () => {
  const calls = [], pending = {}
  const client = createGameClient({ mode: 'live', getToken: () => 'session', storage: {},
    getLearningPath: studentId => { calls.push('path:'+studentId); return new Promise(resolve => { pending.path = resolve }) },
    request: async path => {
      calls.push(path)
      if (path === '/students/child/subjects') return new Promise(resolve => { pending.subjects = resolve })
      if (path === '/students/child/topics/allowed') return { name: 'Shapes', nodes: [{ mission_id: 'mission', status: 'locked' }] }
      throw Error('Unnecessary or unscoped request: '+path)
    },
  })
  const loading = client.loadLearningPath('child', 'maths')
  assert.deepEqual(calls, ['/students/child/subjects', 'path:child'])
  pending.subjects({ subjects: [{ id: 'math', slug: 'mathematics' }] })
  pending.path({ student_id: 'child', subjects: [{ id: 'math', topics: [{ id: 'allowed', name: 'Shapes', status: 'locked' }] }] })
  assert.equal((await loading).topicId, 'allowed')
  assert.ok(!calls.some(path => path.startsWith('/subjects/')))
  await assert.rejects(client.resolveLearning('child', 'maths'), /no available missions/)
})

test('another child path and topics outside the curriculum never reach topic detail', async () => {
  for (const wrongChild of [true, false]) {
    const calls = []
    const client = createGameClient({ mode: 'live', getToken: () => 'session', storage: {},
      getLearningPath: async () => ({ student_id: wrongChild ? 'other' : 'child', subjects: [{ id: 'math', topics: [{ id: 'allowed' }] }] }),
      request: async path => { calls.push(path); if (path === '/students/child/subjects') return { subjects: [{ id: 'math', slug: 'maths' }] }; throw Error(path) },
    })
    await assert.rejects(client.loadLearningPath('child', 'maths', 'foreign'), wrongChild ? /does not match/ : /no API topics/)
    assert.deepEqual(calls, ['/students/child/subjects'])
  }
})

test('Journey station links load the selected topic instead of the first topic, without starting lessons', async () => {
  const calls = []
  const client = createGameClient({ mode: 'live', getToken: () => 'session', storage: {},
    getLearningPath: async () => ({ student_id: 'child', subjects: [{ id: 'math', topics: [
      { id: 'shapes', status: 'current' }, { id: 'numbers', status: 'locked' },
    ] }] }),
    request: async (path, options = {}) => {
      assert.equal(options.method || 'GET', 'GET')
      calls.push(path)
      if (path === '/students/child/subjects') return { subjects: [{ id: 'math', slug: 'mathematics' }] }
      if (path === '/students/child/topics/shapes') return { id: 'shapes', name: 'Shapes', nodes: [{ status: 'completed' }] }
      if (path === '/students/child/topics/numbers') return { id: 'numbers', name: 'Numbers', nodes: [] }
      throw Error('Unexpected request: ' + path)
    },
  })
  assert.equal((await client.loadLearningPath('child', 'maths', 'numbers')).detail.name, 'Numbers')
  assert.ok(!calls.includes('/students/child/topics/shapes'))
  assert.equal((await client.loadLearningPath('child', 'maths', 'shapes')).detail.name, 'Shapes')
  const count = calls.length
  await assert.rejects(client.loadLearningPath('child', 'maths', 'foreign'), /no API topics/)
  assert.deepEqual(calls.slice(count), ['/students/child/subjects'])
})

test('family profiles start as soon as children arrive, without waiting for avatar artwork', async () => {
  let finishArtwork, profileStarted = false
  const pending = loadFamilyProfiles({
    parentStudents: async () => ({ students: [{ id: 'child', name: 'QA' }] }),
    avatarCharacters: () => new Promise(resolve => { finishArtwork = resolve }),
    studentProfile: async id => { profileStarted = true; return { total_xp: 160 } },
  })
  await Promise.resolve()
  assert.equal(profileStarted, true)
  finishArtwork({ characters: [] })
  assert.equal((await pending).students[0].total_xp, 160)
})

test('challenge catalog starts alongside student validation, but filters only after access resolves', async () => {
  let resolveSubjects
  const calls = []
  const client = createGameClient({ mode: 'live', getToken: () => 'session', storage: {}, request: async path => {
    calls.push(path)
    if (path === '/students/child/subjects') return new Promise(resolve => { resolveSubjects = resolve })
    if (path === '/subjects/math/topics') return { topics: [{ id: 'topic' }] }
    if (path === '/students/child/topics/topic') return { name: 'Shapes' }
    if (path === '/challenges') return { challenges: [{ id: 'allowed', topic: 'Shapes' }, { id: 'other', topic: 'Fractions' }] }
    throw Error(path)
  } })
  const pending = client.listTopicChallenges('child', 'maths')
  assert.ok(calls.includes('/challenges'))
  resolveSubjects({ subjects: [{ id: 'math', slug: 'maths' }] })
  assert.deepEqual((await pending).challenges.map(c => c.id), ['allowed'])
})

test('test preview warms illustration metadata without waiting or creating an attempt', async () => {
  const calls = []
  let resolveMedia
  const client = createGameClient({ mode: 'live', getToken: () => 'session', storage: {}, request: async path => {
    calls.push(path)
    if (path === '/students/child/subjects') return { subjects: [{ id: 'math', slug: 'maths' }] }
    if (path === '/subjects/math/topics') return { topics: [{ id: 'topic' }] }
    if (path === '/students/child/topics/topic') return { name: 'Shapes' }
    if (path === '/students/child/profile') return { grade: '1', board: 'CBSE' }
    if (path === '/topics/topic/tests') return { tests: [{ id: 'test', assessment_type: 'test' }] }
    if (path === '/tests/test') return { id: 'test', questions_count: 5 }
    if (path === '/admin/content/packages') return new Promise(resolve => { resolveMedia = resolve })
    throw Error(path)
  } })
  const preview = await client.getTestOverview('child', 'maths')
  assert.equal(preview.questions_count, 5)
  assert.ok(resolveMedia, 'metadata request must already be running')
  assert.ok(!calls.some(path => path.includes('/attempts')))
  resolveMedia({ packages: [] })
})
