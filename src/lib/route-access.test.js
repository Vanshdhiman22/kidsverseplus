import test from 'node:test'
import assert from 'node:assert/strict'
import { needsSignIn } from './route-access.js'

test('signed-out gameplay does not silently open bundled lessons or parent records', () => {
  for (const pathname of ['/home', '/journey', '/learn/topics/maths', '/missions/fractions/learn', '/tests', '/parent', '/onboarding/child']) assert.equal(needsSignIn({ pathname, token: '', review: false }), true)
  for (const pathname of ['/', '/parent/login', '/parent/create-account', '/parent/forgot-password']) assert.equal(needsSignIn({ pathname }), false)
})

test('authenticated flow and explicit review remain available; API preview is local only', () => {
  assert.equal(needsSignIn({ pathname: '/learn', token: 'session' }), false)
  assert.equal(needsSignIn({ pathname: '/learn', review: true }), false)
  const route = { pathname: '/missions/fractions/learn', search: '?apiPreview=bebc07a5-baa4-4f58-bfbd-763a321bb2a7' }
  assert.equal(needsSignIn({ ...route, development: true }), false)
  assert.equal(needsSignIn({ ...route, development: false }), true)
  assert.equal(needsSignIn({ ...route, search: '?apiPreview=anything', development: true }), true)
})
