import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeMissionContent } from './mission.js'
import { cmsQuestions } from './assessment.js'
import fallback from './fractions-equal-parts.json' with { type: 'json' }

const content = {
  type: 'concept_package', theme: 'Space', teaching_method: 'Compare fuel pods',
  explanation: 'Two quarters equal one half.', image_url: 'https://example.com/fuel.png',
  hints: ['Count equal pods'], nova_script: 'Compare both tanks.',
  learn_before_test: { required: true, order: ['understand', 'example', 'remember'], steps: ['understand', 'example', 'remember'].map(step_key => ({
    step_key, title: step_key, teaching_text: `${step_key} text`, key_idea: 'Keep fractions balanced',
    image_url: `https://example.com/${step_key}.png`, nova_script: `${step_key} Nova`,
    mini_question: { question: 'Which equals half?', options: ['2/4', '1/3'], answer: '2/4' },
  })) },
  check_for_understanding: [{ question: 'Which equals 1/2?', options: ['2/4', '1/3'], answer: '2/4', explanation: 'Divide both by two.' }],
}

test('documented flattened mission supplies teaching, all steps, CFU and API identity', () => {
  const result = normalizeMissionContent({ id: 'mission-123', name: 'Equivalent fractions', xp_reward: 30, content }, 'addition-introduction', fallback, { subject: 'Mathematics', topic: 'Fractions', grade: 'Grade 4' })
  assert.equal(result.mission.title, 'Equivalent fractions')
  assert.equal(result.mission.xp, 30)
  assert.equal(result.apiMissionId, 'mission-123')
  assert.equal(result.discover.contents[0].prompt.statement, 'Compare fuel pods')
  assert.equal(result.discover.contents[0].model.image, content.image_url)
  assert.equal(result.learn_before_test.steps[2].mini_question.answer, '2/4')
  assert.equal(result.check.questions[0].answer, 'option_1')
  assert.equal(result.check.questions[0].instruction, 'Which equals 1/2?')
  assert.equal(result.contentSource, 'api')
  assert.equal(result.grade, 'Grade 4')
})

test('mission lacking CFU is rejected instead of scoring unrelated bundled questions', () => {
  assert.throws(() => normalizeMissionContent({ id: 'empty', content: {} }, 'demo', fallback), /no questions/)
})

test('API mission banks never bypass the test attempt API', () => {
  const result = normalizeMissionContent({ id: 'm', content: { ...content, test_questions: { questions: [{ question: 'Formal test?', options: ['Yes', 'No'], answer: 'Yes' }] } } }, 'demo', fallback)
  assert.equal(result.assessments.test_questions.length, 1)
  assert.equal(cmsQuestions(result, 'test'), null)
})

test('mission without artwork does not reuse a bundled fraction illustration', () => {
  const result = normalizeMissionContent({ id: 'm', name: 'Reading', content: { ...content, image_url: undefined } }, 'demo-literacy', fallback, { subject: 'Literacy' })
  assert.equal(result.discover.contents[0].model.image, null)
  assert.equal(result.discover.contents[0].model.key, 'demo-literacy-concept')
  assert.equal(result.subject, 'Literacy')
})
