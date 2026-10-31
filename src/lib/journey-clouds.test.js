import test from 'node:test'
import assert from 'node:assert/strict'
import { isJourneyTopicComplete, journeyCloud, journeyTopicArt } from './journey-clouds.js'
import { cloudJourneyRoute, CLOUD_PLATFORMS } from './journey-cloud-route.js'
import { loadJourneyProgress } from './journey-progress.js'

const topic = (index, extra = {}) => ({ topic_id: `topic-${index}`, world_name: `Topic ${index}`, status: 'completed',
  progress_verified: true, total_missions: 2, completed_missions: 2, ...extra })

test('a sparse live curriculum renders ten places without inventing IDs, names, completion or a second cloud', () => {
  const worlds = [topic(1, { world_name: 'Shapes and Spatial Understanding' }), topic(2, { world_name: 'Numbers from 1 to 9', progress_verified: false })]
  const snapshot = structuredClone(worlds)
  const cloud = journeyCloud(worlds, 2, 'maths')
  assert.equal(cloud.phase, 1)
  assert.equal(cloud.stations.length, 10)
  assert.equal(cloud.available, 2)
  assert.equal(cloud.completed, 1)
  assert.equal(cloud.canGoNext, false)
  assert.deepEqual(cloud.stations.slice(2).map(station => [station.id, station.name, station.available, station.art]), Array.from({ length: 8 }, () => [null, 'Coming soon', false, null]))
  assert.deepEqual(cloud.stations.slice(0, 2).map(station => station.art), ['shapes', 'numbers'])
  assert.deepEqual(worlds, snapshot)
})

test('Phase 2 opens after ten distinct verified completions; incomplete previous clouds cannot be skipped', () => {
  const worlds = Array.from({ length: 25 }, (_, index) => topic(index + 1))
  worlds[9].completed_missions = 1
  assert.equal(journeyCloud(worlds, 3).phase, 1)
  worlds[9].completed_missions = 2
  worlds[14].progress_verified = false
  const second = journeyCloud(worlds, 3)
  assert.equal(second.phase, 2)
  assert.deepEqual(second.stations.map(station => station.number), [11, 12, 13, 14, 15, 16, 17, 18, 19, 20])
  assert.equal(second.stations[0].id, 'topic-11')
  worlds[14].progress_verified = true
  assert.equal(journeyCloud(worlds, 3).available, 5)
  assert.equal(journeyCloud(worlds.slice(0, 10), 2).available, 0)
  assert.equal(journeyCloud(Array.from({ length: 10 }, () => topic(1)), 2).phase, 1)
})

test('stale topic completion, missing/empty mission details and failed reads never unlock a cloud', async () => {
  const raw = Array.from({ length: 10 }, (_, index) => topic(index + 1, { progress_verified: undefined }))
  assert.equal(journeyCloud(raw).completed, 0)
  const verified = await loadJourneyProgress({ journey: { worlds: raw }, studentId: 'child', readTopic: async (student, id) => {
    assert.equal(student, 'child')
    if (id === 'topic-10') throw Error('Unavailable')
    return { nodes: [{ status: 'completed' }, { status: 'mastered' }] }
  } })
  assert.equal(journeyCloud(verified.worlds).completed, 9)
  assert.equal(journeyCloud(verified.worlds).canGoNext, false)
  assert.equal(isJourneyTopicComplete(topic(1, { total_missions: 0, completed_missions: 0 })), false)
  assert.equal(isJourneyTopicComplete(topic(1, { topic_id: null })), false)
})

test('all ten parking locations are ordered on the illustrated route and close to their own platform', () => {
  const road = cloudJourneyRoute()
  assert.equal(road.anchors.length, 10)
  assert.equal(new Set(road.anchors.map(point => `${point.x},${point.y}`)).size, 10)
  road.stops.forEach((percent, index) => {
    assert.ok(percent > (road.stops[index - 1] || 0) && percent < 100)
    const point = road.anchors[index], platform = CLOUD_PLATFORMS[index]
    assert.ok(Math.hypot(point.x - platform.x, point.y - platform.y) < 160)
    const sampled = road.samples.reduce((best, sample) => Math.abs(sample.percent - percent) < Math.abs(best.percent - percent) ? sample : best)
    assert.ok(Math.hypot(sampled.x - point.x, sampled.y - point.y) < 1)
  })
  assert.equal(journeyTopicArt('Measuring length'), 'measurement')
  assert.equal(journeyTopicArt('Addition and subtraction'), 'arithmetic')
  assert.equal(journeyTopicArt('Plants around us'), 'nature')
  assert.equal(journeyTopicArt('A new story'), 'books')
})
