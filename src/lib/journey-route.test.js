import test from 'node:test'
import assert from 'node:assert/strict'
import { currentJourneyStation, journeyRoute, journeyStationUrl } from './journey-route.js'

test('one, two and longer city routes keep every car stop on its station, with no repeated positions', () => {
  for (const count of [1, 2, 3, 6, 8, 12]) {
    const route = journeyRoute(count)
    const endpoints = [...route.path.matchAll(/C [-\d.e+]+ [-\d.e+]+, [-\d.e+]+ [-\d.e+]+, ([-\d.e+]+) ([-\d.e+]+)/g)]
    assert.deepEqual(endpoints.slice(0, count).map(match => ({ x: Number(match[1]), y: Number(match[2]) })), route.anchors)
    assert.equal(new Set(route.anchors.map(point => `${point.x},${point.y}`)).size, count)
    assert.equal(route.stops.length, count)
    route.stops.forEach((stop, index) => {
      assert.ok(stop > (route.stops[index - 1] || 0) && stop < 100)
      assert.ok(route.anchors[index].y + 40 <= route.height)
      assert.ok(route.anchors[index].x + 315 < 1140)
    })
  }
  assert.deepEqual(journeyRoute(0).stops, [])
})

test('parked location never claims a locked topic is unlocked, and every station keeps its own link', () => {
  const stations = [{ id: 'shapes', state: 'locked' }, { id: 'numbers', state: 'locked' }]
  const original = structuredClone(stations)
  assert.equal(currentJourneyStation(stations), 0)
  assert.equal(currentJourneyStation([{ state: 'done' }, { state: 'here' }]), 1)
  assert.equal(currentJourneyStation([{ state: 'next' }, { state: 'here' }]), 1)
  assert.equal(currentJourneyStation([{ state: 'done' }, { state: 'done' }]), 1)
  assert.equal(journeyStationUrl('maths', stations[1]), '/learn/topics/maths?topic=numbers')
  assert.equal(new URL(journeyStationUrl('maths', { id: 'topic / 2' }), 'https://example.test').searchParams.get('topic'), 'topic / 2')
  assert.equal(journeyStationUrl('maths', {}), null)
  assert.deepEqual(stations, original)
})
