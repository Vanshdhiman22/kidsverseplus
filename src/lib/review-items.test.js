import test from 'node:test'
import assert from 'node:assert/strict'
import { reviewItems } from './review-items.js'

const question = 'A kite flies over a tree. Where is the kite compared with the tree?'
const response = { answers: [{ question_id: 'kite', question, selected_answer: 'Inside the tree', correct_answer: 'Above the tree', is_correct: false }] }
const displayed = { questionId: 'kite', question, selectedLabel: 'Inside the tree', correct: true, answerLabel: 'Inside the tree', model: { image: '/kite.jpg' }, explanation: 'Compare their heights.' }

test('review retains matching displayed media without overriding server grading', () => {
  const [item] = reviewItems(response, [displayed])
  assert.deepEqual(item.model, displayed.model)
  assert.equal(item.explanation, displayed.explanation)
  assert.equal(item.correct, false)
  assert.equal(item.answerLabel, 'Above the tree')
})

test('review refuses media from another question, choice or ambiguous match', () => {
  for (const items of [
    [{ ...displayed, questionId: 'another-question' }],
    [{ ...displayed, selectedLabel: 'Below the tree' }],
    [displayed, displayed],
    [],
  ]) assert.equal(reviewItems(response, items)[0].model, null)
})

test('server illustration and explanation take precedence over displayed media', () => {
  const server = { answers: [{ ...response.answers[0], image_url: '/saved-kite.jpg', explanation: 'The kite is higher than the tree.' }] }
  const [item] = reviewItems(server, [displayed])
  assert.equal(item.model.image, '/saved-kite.jpg')
  assert.equal(item.explanation, server.answers[0].explanation)
})
