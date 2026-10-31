import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { avatarPortrait } from './avatar-portrait.js'
import { breakPassState } from './break-pass-state.js'
import { practiceReviewItem } from './practice-review-item.js'
import { battleResultForStudent } from './battle-result.js'

test('every supported avatar uses an existing portrait; missing selections stay display-only', () => {
  for (const face of [null, undefined, 0, 9, 1, '2', 3, 4]) {
    for (const small of [false, true]) assert.ok(fs.existsSync(new URL(`../../public${avatarPortrait(face, small)}`, import.meta.url)))
  }
  assert.equal(avatarPortrait('3', true), '/art/kid3-face-sm.webp')
})

test('break passes read actual backend count fields without inventing exhausted or used passes', () => {
  assert.deepEqual(breakPassState(null, '2026-10-28'), { available: null, total: null, usedToday: false })
  assert.deepEqual(breakPassState({ available_count: 4, used_count: 1 }, '2026-10-28'), { available: 4, total: 5, usedToday: false })
  assert.equal(breakPassState({ available_count: 3, used_count: 2, used: true }, '2026-10-28').usedToday, true)
  assert.equal(breakPassState({ available: 2, used_dates: ['2026-10-28'] }, '2026-10-28').usedToday, true)
  assert.equal(breakPassState({ available_count: 0, used_count: 5 }, '2026-10-28').available, 0)
})

test('practice battle review retains the displayed question, choice, explanation and timeout', () => {
  const question = { instruction: 'How many?', options: [{ key: 'a', label: 'Two' }, { key: 'b', label: 'Three' }], answer: 'b', explanation: 'Count all three.', models: [{ image: '/three.jpg' }] }
  const item = practiceReviewItem(question, 'a', false)
  assert.equal(item.selectedLabel, 'Two')
  assert.equal(item.answerLabel, 'Three')
  assert.equal(item.explanation, 'Count all three.')
  assert.deepEqual(item.model, question.models[0])
  assert.equal(practiceReviewItem(question, null, false).selectedLabel, 'No answer')
})

test('battle results are scoped before any saved review or result can be requested', () => {
  const result = { battleId: 'battle-a', studentId: 'child-a', correctCount: 2 }
  assert.equal(battleResultForStudent(result, 'child-a'), result)
  assert.equal(battleResultForStudent(result, 'child-b'), null)
  assert.equal(battleResultForStudent({ battleId: 'old-unscoped' }, 'child-a'), null)
  assert.equal(battleResultForStudent({ battleId: 'preview', studentId: null, local: true }, null)?.local, true)
})
