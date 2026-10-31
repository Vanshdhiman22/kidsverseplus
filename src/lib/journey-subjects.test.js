import test from 'node:test'
import assert from 'node:assert/strict'
import { journeySubjectChoices } from './journey-subjects.js'
import { checkedJourney } from './live-data.js'

test('Journey exposes other subject previews without copying sample IDs, progress or lesson data', () => {
  const live = [{ id: 'real-maths', name: 'Mathematics', slug: 'mathematics', progress_percent: 0 }]
  const catalog = [{ id: 'maths', name: 'Maths', pct: 60 }, { id: 'literacy', name: 'Literacy', pct: 70, done: 14 },
    { id: 'evs', name: 'EVS / Science' }, { id: 'computer', name: 'Computer' }, { id: 'general', name: 'General Awareness' }]
  const snapshot = structuredClone([live, catalog])
  const choices = journeySubjectChoices(live, catalog)
  assert.equal(choices.length, 5)
  assert.deepEqual(choices[0], { key: 'maths', name: 'Mathematics', previewOnly: false })
  assert.equal(choices.slice(1).every(choice => choice.previewOnly), true)
  assert.equal(choices.some(choice => 'pct' in choice || 'id' in choice || 'done' in choice), false)
  assert.deepEqual([live, catalog], snapshot)
  const published = journeySubjectChoices([...live, { name: 'English', slug: 'english' }], catalog)
  assert.equal(published.find(choice => choice.key === 'literacy').previewOnly, false)
})

test('a Maths Journey response can never become another subject Journey', () => {
  const maths = { subject: 'Mathematics', worlds: [{ topic_id: 'shapes', world_name: 'Shapes' }] }
  for (const subject of ['literacy', 'evs', 'computer', 'general']) assert.throws(() => checkedJourney(maths, subject), /different subject/)
  assert.equal(checkedJourney(maths, 'maths'), maths)
})
