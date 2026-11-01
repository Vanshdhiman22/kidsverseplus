import test from 'node:test'
import assert from 'node:assert/strict'
import { screenBypassDestination } from './screen-bypass.js'

test('local bypass follows the setup screens without inventing saved state', () => {
  let route = '/onboarding/child'
  const visited = []
  while (screenBypassDestination(route, true)) {
    const next = screenBypassDestination(route, true)
    visited.push(next.path)
    route = next.path
    assert.ok(visited.length <= 8)
  }
  assert.deepEqual(visited, ['/onboarding/whatsapp', '/onboarding/grade-board', '/onboarding/avatar', '/onboarding/interests', '/onboarding/goals', '/onboarding/nova', '/welcome', '/home'])
})

test('bypass is unavailable in production, sign-in, parent gates and assessments', () => {
  assert.equal(screenBypassDestination('/onboarding/whatsapp', false), null)
  for (const path of ['/parent/login', '/parent/create-account', '/parent', '/challenge/battle', '/tests/mixed/question', '/missions/fractions/learn', '/home', '/unknown', 'constructor']) {
    assert.equal(screenBypassDestination(path, true), null)
  }
})
