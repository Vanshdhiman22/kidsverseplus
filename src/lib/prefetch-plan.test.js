import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { prefetchPlan } from './prefetch-plan.js'

test('public entry warms account screens without preloading the game or parent records', () => {
  assert.deepEqual(prefetchPlan('/'), ['ParentLogin', 'CreateAccount'])
  assert.deepEqual(prefetchPlan('/parent/create-account'), ['CreateChild'])
  assert.deepEqual(prefetchPlan('/onboarding/whatsapp'), ['LearningSetup'])
})

test('prefetch stays small and targets existing screens for each flow', () => {
  const routes = ['/', '/parent/login', '/parent/create-account', '/onboarding/child', '/onboarding/whatsapp', '/onboarding/grade-board', '/onboarding/avatar', '/onboarding/interests', '/onboarding/goals', '/onboarding/nova', '/welcome', '/home', '/learn', '/journey', '/learn/topics/maths', '/missions/fractions/learn', '/tests', '/tests/mixed/intro', '/tests/mixed/question', '/extra', '/challenge', '/challenge/opponents', '/challenge/preview', '/challenge/battle', '/profile', '/parent']
  for (const route of routes) {
    const plan = prefetchPlan(route)
    assert.ok(plan.length <= 4, route)
    for (const screen of plan) assert.ok(existsSync(new URL(`../screens/${screen}.jsx`, import.meta.url)), screen)
  }
  assert.deepEqual(prefetchPlan('/unknown'), [])
})
