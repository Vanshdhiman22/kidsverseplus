import test from 'node:test'
import assert from 'node:assert/strict'
import { SCREENS } from './screens.js'
import { NAVIGATION_SCREENS, screenNavigation, screenNavigationPath } from './screen-bypass.js'

test('navigation reaches every product screen, including assessments and parent screens, without looping', () => {
  let route = '/'
  const visited = []
  while (route) {
    assert.ok(!visited.includes(route), `Duplicate screen: ${route}`)
    visited.push(route)
    const next = screenNavigation(route).next
    if (!next) break
    assert.equal(screenNavigation(next.path).previous.path, route)
    route = next.path
  }
  const expected = SCREENS.filter(([path, label]) => path !== '/missions/fractions' && !label.startsWith('Dev')).map(([path]) => path)
  assert.deepEqual(visited, expected)
  assert.ok(visited.includes('/onboarding/whatsapp'))
  assert.ok(visited.includes('/challenge/practice'))
  assert.ok(visited.includes('/tests/mixed/result'))
  assert.ok(visited.includes('/parent/plan'))
  assert.equal(screenNavigation('/').previous, null)
  assert.equal(screenNavigation('/parent/plan').next, null)
})

test('route aliases and non-maths topics retain the right screen order', () => {
  assert.equal(screenNavigation('/learn/topics/literacy').next.path, '/missions/fractions/learn')
  assert.equal(screenNavigation('/missions/fractions').next.path, '/missions/fractions/spot-mistake')
  assert.equal(screenNavigation('/onboarding/parent-details').next.path, '/onboarding/grade-board')
  assert.equal(new Set(NAVIGATION_SCREENS.map(([path]) => path)).size, NAVIGATION_SCREENS.length)
})

test('unknown and utility routes keep the picker available without a guessed next screen', () => {
  for (const path of ['/unknown', '/api-test', '/screens', 'constructor']) {
    assert.deepEqual(screenNavigation(path), { current: null, previous: null, next: null })
  }
})

test('lesson navigation preserves the selected subject and mission', () => {
  assert.equal(screenNavigationPath('/missions/fractions/learn', '/learn/topics/literacy'), '/missions/fractions/learn?subject=literacy')
  assert.equal(screenNavigationPath('/missions/fractions/spot-mistake', '/missions/fractions/learn', '?subject=evs&mission=mission-42'), '/missions/fractions/spot-mistake?subject=evs&mission=mission-42')
  assert.equal(screenNavigationPath('/tests', '/missions/fractions/complete', '?subject=evs&mission=mission-42'), '/tests?subject=evs')
})

test('assessment context remains scoped and secrets or preview flags are never copied', () => {
  assert.equal(screenNavigationPath('/tests/mixed/result', '/tests/mixed/question', '?subject=maths&source=challenge&token=secret&review=1&apiPreview=abc'), '/tests/mixed/result?subject=maths&source=challenge')
  assert.equal(screenNavigationPath('/challenge/result', '/challenge/battle', '?subject=evs&bot=nova'), '/challenge/result?subject=evs&bot=nova')
  assert.equal(screenNavigationPath('/challenge/preview', '/challenge/opponents', '?subject=evs&challenge=c1&opponent=o1'), '/challenge/preview?subject=evs&challenge=c1&opponent=o1')
  assert.equal(screenNavigationPath('/extra', '/tests/mixed/result', '?source=challenge&subject=evs'), '/extra')
  assert.equal(screenNavigationPath('/parent', '/switch', '?subject=evs&token=secret'), '/parent')
})
