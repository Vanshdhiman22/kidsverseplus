import test from 'node:test'
import assert from 'node:assert/strict'
import { companionCatalog, usableCompanion } from './companion-catalog.js'

test('activity metadata alone cannot advertise playable reading or speaking content', () => {
  assert.equal(usableCompanion({ id: 'reading', type: 'reading', name: 'Read together' }), false)
  assert.equal(usableCompanion({ type: 'reading', passage: '', prompts: [], tips: [] }), false)
  assert.equal(usableCompanion({ type: 'reading', passage: {}, prompts: [], tips: [] }), false)
  assert.equal(usableCompanion({ type: 'speaking', prompts: [], tips: [] }), false)
  assert.equal(usableCompanion({ type: 'reading', passage: 'Read this story.', prompts: ['What happened?'], tips: [] }), true)
  assert.equal(usableCompanion({ type: 'speaking', prompts: ['Tell a story.'], tips: [] }), true)
})

test('malformed catalogs fail clearly instead of crashing a .find or .map call', () => {
  assert.throws(() => companionCatalog({}), /not available yet/)
  assert.deepEqual(companionCatalog({ activities: [null, { id: 'a', type: 'reading' }] }), [{ id: 'a', type: 'reading' }])
  assert.equal(usableCompanion({ type: 'reading', passage: 'Read', prompts: [null], tips: [] }), false)
})
