import test from 'node:test'
import assert from 'node:assert/strict'
import { availableWorlds, checkedJourney, normalizeApiQuestion, testSeconds } from './live-data.js'

test('live subject catalog never adds missing artwork subjects or fake completion counts', () => {
  const worlds = availableWorlds([{ id: 's', slug: 'mathematics', name: 'Mathematics', progress_percent: 25 }], [{ id: 'maths', img: 'math.png', total: 20 }, { id: 'evs' }])
  assert.equal(worlds.length, 1)
  assert.equal(worlds[0].id, 'maths')
  assert.equal(worlds[0].total, null)
  assert.equal(worlds[0].pct, 25)
})

test('wrong subject response cannot render as the requested journey', () => {
  assert.throws(() => checkedJourney({ subject: 'Computer', worlds: [] }, 'evs'), /different subject/)
  assert.equal(checkedJourney({ subject: 'Mathematics' }, 'maths').subject, 'Mathematics')
})

test('question answer IDs survive normalization without invented visual or hints', () => {
  const q = normalizeApiQuestion({ id: 'q', question_text: '3/4 is the same as?', options: [{ id: 'a', text: '6/8' }, '1/2'] })
  assert.deepEqual(q.options, [{ key: 'a', label: '6/8' }, { key: '1/2', label: '1/2' }])
  assert.deepEqual(q.models, [])
  assert.deepEqual(q.hints, [])
  assert.equal(testSeconds({ estimated_minutes: 1 }), 60)
  assert.equal(testSeconds({}), null)
})
