import test from 'node:test'
import assert from 'node:assert/strict'
import { contentStatus } from './content-status.js'

test('unpublished companion content offers an available activity rather than a retry loop', () => {
  const state = contentStatus('The live API does not provide reading/speaking content yet. No sample content has been substituted.', 'reading activity')
  assert.equal(state.destination, '/extra')
  assert.equal(state.retry, false)
  assert.match(state.message, /not available yet/)
})

test('expired sessions offer sign in while network failures remain retryable', () => {
  assert.equal(contentStatus('Sign in first.', 'lesson').destination, '/parent/login')
  assert.equal(contentStatus('Failed to fetch', 'lesson').retry, true)
  assert.equal(contentStatus('Failed to fetch', 'speaking activity').destination, '/extra')
})

test('unpublished opponents and missing concepts return to Challenge without a retry loop', () => {
  for (const error of ['No opponents are published for this concept yet.', 'Choose a concept from Challenge Home.']) {
    const state = contentStatus(error, 'opponents')
    assert.equal(state.destination, '/challenge')
    assert.equal(state.retry, false)
    assert.equal(state.label, 'Back to Challenge')
  }
  assert.equal(contentStatus('Failed to fetch', 'opponents').retry, true)
})

test('missing attempts offer their existing start flow instead of a reload loop', () => {
  const testState = contentStatus('Start a test from the test introduction first.', 'test')
  assert.equal(testState.retry, false)
  assert.equal(testState.destination, '/tests')
  assert.match(testState.message, /introduction/)
  assert.equal(contentStatus('Failed to fetch', 'test').destination, '/tests')
  assert.equal(contentStatus('Failed to fetch', 'battle').destination, '/challenge')
})
