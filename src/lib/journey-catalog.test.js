import test from 'node:test'
import assert from 'node:assert/strict'
import { loadJourneySubjects, journeyFromSubjects } from './journey-catalog.js'
import { journeyCloud } from './journey-clouds.js'
import { journeyStationUrl } from './journey-route.js'
import { subjectKey } from './live-data.js'
import { createGameClient } from './game-client.js'

const subjects = [
  { id: 'math', name: 'Mathematics', slug: 'mathematics', topics: [
    { id: 'shapes', name: 'Shapes and Spatial Understanding', status: 'locked' },
    { id: 'numbers', name: 'Numbers from 1 to 9', status: 'locked' },
  ] },
  { id: 'science', name: 'EVS / Science', slug: 'evs-science', topics: [{ id: 'body', name: 'Myself and My Body', status: 'locked' }] },
  { id: 'english', name: 'English', slug: 'english', topics: [{ id: 'phonics', name: 'Alphabet Sound and Phonics' }] },
  { id: 'computer', name: 'Computer', slug: 'computer', topics: [{ id: 'computers', name: 'Introduction to Computers' }] },
  { id: 'general', name: 'General Awareness', slug: 'general-awareness', topics: [{ id: 'about-me', name: 'All About Me and My Body' }] },
]
const path = { student_id: 'child', curriculum: { grade: 'Grade 1', board: 'CBSE' }, subjects }

test('the child curriculum supplies topics without waiting for an admin listing or Journey alias fallback', async () => {
  const result = await loadJourneySubjects({ studentId: 'child', readPath: async id => { assert.equal(id, 'child'); return path } })
  assert.deepEqual(result, subjects)
  for (const [alias, topicId] of [['maths', 'shapes'], ['evs', 'body'], ['literacy', 'phonics'], ['computer', 'computers'], ['general', 'about-me']]) {
    const journey = journeyFromSubjects(result, alias)
    assert.equal(journey.worlds[0].topic_id, topicId)
    const station = journeyCloud(journey.worlds, 1, alias).stations[0]
    assert.equal(station.available, true)
    assert.equal(journeyStationUrl(alias, station), `/learn/topics/${alias}?topic=${topicId}`)
  }
})

test('locked progress does not hide existing topics or pretend they are completed', () => {
  const before = structuredClone(subjects)
  const journey = journeyFromSubjects(subjects, 'maths')
  const cloud = journeyCloud(journey.worlds)
  assert.deepEqual(cloud.stations.slice(0, 2).map(station => station.name), ['Shapes and Spatial Understanding', 'Numbers from 1 to 9'])
  assert.equal(cloud.available, 2)
  assert.equal(cloud.completed, 0)
  assert.equal(cloud.canGoNext, false)
  assert.deepEqual(subjects, before)
})

test('wrong-child responses, malformed curriculum data and failed reads remain errors', async () => {
  await assert.rejects(loadJourneySubjects({ studentId: 'other-child', readPath: async () => path }), /does not match/)
  await assert.rejects(loadJourneySubjects({ studentId: 'child', readPath: async () => ({ student_id: 'child' }) }), /subjects/)
  await assert.rejects(loadJourneySubjects({ studentId: 'child', readPath: async () => ({ student_id: 'child', subjects: [{ id: 'math', name: 'Maths' }] }) }), /curriculum topics/)
  await assert.rejects(loadJourneySubjects({ studentId: 'child', readPath: async () => { throw Error('offline') } }), /offline/)
})

test('missing, duplicate and explicitly unpublished topics never create clickable stations', () => {
  const source = [{ ...subjects[0], topics: [...subjects[0].topics, subjects[0].topics[0], { name: 'No ID' }, { id: 'draft', name: 'Draft', is_published: false }, { id: 'inactive', is_active: false }] }]
  assert.equal(journeyFromSubjects(source, 'maths').worlds.length, 2)
  assert.equal(journeyFromSubjects(null, 'maths'), null)
  assert.equal(journeyFromSubjects(subjects, 'another-subject'), null)
  assert.equal(journeyFromSubjects([{ ...subjects[0], topics: [] }], 'maths').worlds.length, 0)
})

test('actual API EVS slugs map to the existing EVS artwork and routes', () => {
  assert.equal(subjectKey('evs-science'), 'evs')
  assert.equal(subjectKey('EVS / Science'), 'evs')
  assert.equal(subjectKey('mathematics'), 'maths')
  assert.equal(subjectKey('english'), 'literacy')
})

test('opening a map topic resolves that exact curriculum ID through the existing learner API without writes', async () => {
  const calls = []
  const client = createGameClient({ mode: 'live', getToken: () => 'test', storage: { getItem: () => null },
    getLearningPath: async id => { assert.equal(id, 'child'); return path },
    request: async (url, options = {}) => {
      assert.equal(options.method || 'GET', 'GET')
      calls.push(url)
      if (url === '/students/child/subjects') return { subjects }
      if (url === '/students/child/topics/body') return { id: 'body', name: 'Myself and My Body', nodes: [{ mission_id: 'concept-body', name: 'Our Body', status: 'locked' }] }
      throw Error(`Unexpected request: ${url}`)
    },
  })
  const result = await client.loadLearningPath('child', 'evs', 'body')
  assert.equal(result.topicId, 'body')
  assert.equal(result.detail.nodes[0].mission_id, 'concept-body')
  assert.deepEqual(calls, ['/students/child/subjects', '/students/child/topics/body'])
})
