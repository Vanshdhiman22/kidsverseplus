import test from 'node:test'
import assert from 'node:assert/strict'
import { nextJourneyStop } from './journey-auto-travel.js'
import { journeyCloud } from './journey-clouds.js'

const topic = (id, completed = false) => ({ topic_id: id, world_name: id, progress_verified: true,
  completed_missions: completed ? 2 : 1, total_missions: 2 })

test('only verified topic completion starts a visual trip to the next real station', () => {
  const worlds = [topic('shapes'), topic('numbers')]
  assert.equal(nextJourneyStop(journeyCloud(worlds), 0), null)
  worlds[0].completed_missions = 2
  const cloud = journeyCloud(worlds)
  const snapshot = structuredClone(cloud)
  assert.deepEqual(nextJourneyStop(cloud, 0), { index: 1, sourceId: 'shapes', gate: false })
  assert.deepEqual(cloud, snapshot)
  assert.equal(nextJourneyStop(journeyCloud([{ ...worlds[0], progress_verified: false }, worlds[1]]), 0), null)
})

test('returning to an already advanced topic does not replay the trip, and future slots are never destinations', () => {
  const cloud = journeyCloud([topic('shapes', true), topic('numbers', true)])
  assert.equal(nextJourneyStop(cloud, 0, ['shapes']), null)
  assert.equal(nextJourneyStop(cloud, 1), null)
  assert.equal(nextJourneyStop(cloud, 2), null)
  assert.deepEqual(nextJourneyStop(journeyCloud([topic('shapes', true), topic('numbers', true), topic('next')]), 1),
    { index: 2, sourceId: 'numbers', gate: false })
})

test('automatic travel uses the next cloud gate only after ten actual topics are complete', () => {
  const worlds = Array.from({ length: 10 }, (_, index) => topic(`topic-${index}`, true))
  assert.deepEqual(nextJourneyStop(journeyCloud(worlds), 9), { index: 9, sourceId: 'topic-9', gate: true })
  worlds[3].completed_missions = 1
  assert.equal(nextJourneyStop(journeyCloud(worlds), 9), null)
  worlds[3].completed_missions = 2
  assert.equal(nextJourneyStop(journeyCloud(worlds), 9, ['topic-9']), null)
})
