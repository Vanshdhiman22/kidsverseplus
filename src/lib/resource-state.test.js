import test from 'node:test'
import assert from 'node:assert/strict'
import { visibleResource } from './resource-state.js'

test('switching children hides the previous child data before the next effect runs', () => {
  const prior = { data: { answers: ['private previous answer'] }, error: '', loading: false, dependencies: ['child-a', 'maths'], enabled: true }
  assert.equal(visibleResource(prior, ['child-a', 'maths'], true), prior)
  assert.deepEqual(visibleResource(prior, ['child-b', 'maths'], true), { data: null, error: '', loading: true })
  assert.equal(visibleResource(prior, ['child-a', 'literacy'], true).data, null)
})

test('disabling or enabling a resource cannot reuse an old data or error state', () => {
  const prior = { data: null, error: 'Old failure', loading: false, dependencies: ['attempt-a'], enabled: true }
  assert.deepEqual(visibleResource(prior, ['attempt-a'], false), { data: null, error: '', loading: false })
  assert.equal(visibleResource({ ...prior, enabled: false }, ['attempt-a'], true).loading, true)
})
