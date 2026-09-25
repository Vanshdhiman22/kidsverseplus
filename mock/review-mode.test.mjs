import test from 'node:test'
import assert from 'node:assert/strict'
import { enterReviewMode, exitReviewMode, isReviewMode, takeReviewSeed } from '../src/lib/reviewMode.js'

const storage = () => {
  const values = new Map()
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
  }
}

test('live dummy skip enters isolated review state without clearing the real account', () => {
  globalThis.sessionStorage = storage()
  globalThis.localStorage = storage()
  let destination = ''
  globalThis.window = {
    location: {
      origin: 'https://kidsverseplus.vercel.app',
      search: '',
      assign: value => { destination = value },
      replace: value => { destination = value },
    },
  }
  localStorage.setItem('kidsverse-plus-v3-live', 'real-account-state')
  localStorage.setItem('kidsverse-plus-v3-live-review', 'old-review-state')
  const state = { profile: { name: 'Aarav', grade: '1' }, children: [{ id: 'child-1' }], activeChildId: 'child-1' }

  enterReviewMode('/tests/mixed/question?subject=maths', state, 'live')
  assert.equal(destination, '/tests/mixed/question?subject=maths&review=1')
  assert.equal(localStorage.getItem('kidsverse-plus-v3-live'), 'real-account-state')
  assert.equal(localStorage.getItem('kidsverse-plus-v3-live-review'), null)
  assert.deepEqual(takeReviewSeed(), state)
  assert.equal(takeReviewSeed(), null)

  window.location.search = '?review=1'
  assert.equal(isReviewMode(), true)
  exitReviewMode()
  assert.equal(destination, '/')
  window.location.search = ''
  assert.equal(isReviewMode(), false)
  delete globalThis.window
  delete globalThis.sessionStorage
  delete globalThis.localStorage
})
