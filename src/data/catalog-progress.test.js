import test from 'node:test'
import assert from 'node:assert/strict'
import { lessonProgress, STATION_PER } from './catalog.js'

test('new child has no pre-completed journey stops', () => {
  assert.deepEqual(lessonProgress({}), { done: 0, total: 30, pct: 0 })
})

test('a recorded subject stop advances progress by one, not a demo baseline', () => {
  assert.deepEqual(lessonProgress({ maths: STATION_PER }), { done: 1, total: 30, pct: 3 })
})
