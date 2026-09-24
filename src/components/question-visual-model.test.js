import test from 'node:test'
import assert from 'node:assert/strict'
import { countableGroups } from './question-visual-model.js'

test('challenge illustration includes every authored group', () => {
  assert.deepEqual(countableGroups('Nova has three sets of items: 2 blocks, 1 block, and 2 blocks. How many altogether?'), [2, 1, 2])
})

test('test and battle illustrations follow their exact quantities', () => {
  assert.deepEqual(countableGroups('3 toys plus 2 toys makes how many toys?'), [3, 2])
  assert.deepEqual(countableGroups('Nova has 5 cookies and her friend gives her 3 more. How many?'), [5, 3])
  assert.deepEqual(countableGroups('Five cookies plus three more makes how many?'), [5, 3])
})

test('an answer after equals is not drawn as a new group', () => {
  assert.deepEqual(countableGroups('What is 3 + 2 = 5?'), [3, 2])
  assert.equal(countableGroups('Which sentence describes addition?'), null)
})
