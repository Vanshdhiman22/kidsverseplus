import test from 'node:test'
import assert from 'node:assert/strict'
import { emptyProfile, emptyStats, emptyProgress, beginChild, finishChild, selectChild, openAccount, loginRoute, migrateFamily } from './family.js'

const fresh = () => ({ profile: { ...emptyProfile }, stats: { ...emptyStats }, progress: { ...emptyProgress }, children: [], activeChildId: null, accounts: {}, parentLock: { pin: null } })
const add = (state, name, face, id) => {
  const draft = beginChild(state, name)
  return finishChild({ ...draft, profile: { ...draft.profile, face } }, id)
}

test('new family has blank name, no selected avatar, and no picker', () => {
  const state = openAccount(fresh(), 'parent@example.com')
  assert.equal(state.profile.name, '')
  assert.equal(state.profile.face, null)
  assert.equal(loginRoute(state), '/onboarding/child')
  assert.equal(loginRoute(state, true), '/onboarding/child')
  assert.equal(finishChild(beginChild(state, 'Alex'), 'a').children.length, 0)
})

test('single student skips picker; siblings retain their characters and progress', () => {
  let state = add(openAccount(fresh(), 'parent@example.com'), 'Alex', 3, 'a')
  assert.equal(loginRoute(state), '/home')
  state = { ...state, stats: { ...state.stats, xp: 90 }, progress: { ...state.progress, quizzesDone: 2 } }
  state = add(state, 'Sam', 2, 'b')
  assert.equal(loginRoute(state), '/switch')
  assert.equal(state.stats.xp, 0)
  state = selectChild(state, 'a')
  assert.equal(state.profile.name, 'Alex')
  assert.equal(state.profile.face, 3)
  assert.equal(state.stats.xp, 90)
  assert.equal(state.progress.quizzesDone, 2)
  state = selectChild(state, 'b')
  assert.equal(state.profile.face, 2)
  assert.equal(state.progress.quizzesDone, 0)
})

test('different accounts never share the family picker and survive persistence', () => {
  let state = add(openAccount(fresh(), 'first@example.com'), 'Alex', 4, 'a')
  state = openAccount(state, 'second@example.com')
  assert.equal(state.children.length, 0)
  assert.equal(state.profile.name, '')
  state = add(state, 'Sam', 2, 'b')
  state = openAccount(JSON.parse(JSON.stringify(state)), ' FIRST@example.com ')
  assert.deepEqual(state.children.map(c => c.name), ['Alex'])
  assert.equal(state.profile.face, 4)
})

test('legacy demo family is removed but edited student data is retained', () => {
  const legacy = { ...fresh(), profile: { ...emptyProfile, name: 'Aarav', face: 1 }, activeChildId: 'aarav', children: [
    { id: 'aarav', name: 'Aarav', face: 1, outfit: 'explorer' },
    { id: 'mira', name: 'Mira', face: 4, outfit: 'sprint' },
    { id: 'vihaan', name: 'Vihaan', face: 2, outfit: 'ranger' },
  ] }
  assert.equal(migrateFamily(legacy).children.length, 0)
  assert.equal(migrateFamily(legacy).profile.name, '')
  const edited = migrateFamily({ ...legacy, profile: { ...legacy.profile, name: 'Taylor', face: 3 } })
  assert.equal(edited.children.length, 1)
  assert.equal(edited.profile.name, 'Taylor')
  assert.equal(edited.profile.face, 3)
})

test('unfinished sibling setup resumes without creating a fake student', () => {
  let state = add(openAccount(fresh(), 'parent@example.com'), 'Alex', 1, 'a')
  state = beginChild(state, 'Sam')
  state = openAccount(JSON.parse(JSON.stringify(state)), 'parent@example.com')
  assert.equal(state.children.length, 1)
  assert.equal(loginRoute(state), '/onboarding/grade-board')
  assert.equal(state.profile.name, 'Sam')
  assert.equal(state.profile.face, null)
})
