import test from 'node:test'
import assert from 'node:assert/strict'
import { selectedChallenge, battleAvailability, topicChallenges } from './challenge-selection.js'

const concepts = [{ id: 'spatial', topic: 'Shapes' }, { id: 'shapes', topic: 'Shapes' }]

test('multiple concepts need an explicit valid choice; stale links cannot silently switch concepts', () => {
  assert.equal(selectedChallenge(concepts), null)
  assert.equal(selectedChallenge(concepts, 'missing'), null)
  assert.equal(selectedChallenge(concepts, 'shapes'), concepts[1])
  assert.equal(selectedChallenge([concepts[0]]), concepts[0])
  assert.equal(selectedChallenge([concepts[0]], 'missing'), null)
  assert.equal(selectedChallenge([]), null)
})

test('only actual published opponents enable Battle', () => {
  assert.equal(battleAvailability(null, {}).disabled, true)
  assert.equal(battleAvailability(concepts[0], { loading: true }).disabled, true)
  assert.equal(battleAvailability(concepts[0], { error: 'Failed to fetch' }).disabled, true)
  assert.equal(battleAvailability(concepts[0], { data: { opponents: [] } }).disabled, true)
  assert.equal(battleAvailability(concepts[0], { data: { opponents: [{ id: 'published' }] } }).disabled, false)
})

test('concept choices stay inside the exact server topic association', () => {
  assert.deepEqual(topicChallenges([...concepts, {id:'other',topic:'Fractions'}], 'topic-id', 'Shapes'), concepts)
  assert.deepEqual(topicChallenges([{id:'wrong',topic_id:'other',topic:'Shapes'}], 'topic-id', 'Shapes'), [])
})
