import test from 'node:test'
import assert from 'node:assert/strict'
import { learningSteps, learningMini } from './learning-steps.js'
import { explanationWays } from './explanation-ways.js'

test('preserves API order and all steps with matching pictures and checks', () => {
  const steps = learningSteps({ learn_before_test: { order: ['example', 'understand'], steps: [
    { step_key: 'understand', teaching_text: 'Understand text', image_url: '/understand.jpg' },
    { step_key: 'example', teaching_text: 'Example text', image_url: '/example.jpg', mini_question: { question: 'Which?', options: [{ key: 'a', value: 'One' }, { key: 'b', text: 'Two' }], answer: 'Two' } },
    { step_key: 'extra', teaching_text: 'Extra step' },
    { step_key: 'remember', teaching_text: 'Remember text' },
  ] } })
  assert.deepEqual(steps.map(s => s.stepKey), ['example', 'understand', 'extra', 'remember'])
  assert.equal(steps[0].image, '/example.jpg')
  assert.equal(steps[0].mini.answer, 'b')
  assert.equal(steps[1].mini, null)
})

test('absent steps and mini checks never borrow unrelated quiz content', () => {
  assert.deepEqual(learningSteps({ check: { questions: [{ instruction: 'Unrelated' }] } }), [])
  assert.equal(learningMini(null), null)
  const ways = explanationWays({ body: 'Base example', mini: { question: 'Base check' }, explanation_ways: [{ teaching_text: 'Another example' }] })
  assert.equal(ways[1].mini, null)
})


test('repeated order entries do not duplicate authored steps or discard unlisted steps', () => {
  const steps = learningSteps({ learn_before_test: { order: ['example', 'example'], steps: [
    { step_key: 'example', title: 'First example' }, { step_key: 'remember', title: 'Remember' },
  ] } })
  assert.deepEqual(steps.map(s => s.title), ['First example', 'Remember'])
})
