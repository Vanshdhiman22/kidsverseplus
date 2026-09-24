import test from 'node:test'
import assert from 'node:assert/strict'
import { assessmentBank, cmsQuestions, reviewAnswer, finishCmsAssessment } from './assessment.js'
import { normalizeContentPackage } from './normalize.js'
import sample from './packages/addition-introduction.json' with { type: 'json' }
import fallback from './fractions-equal-parts.json' with { type: 'json' }

const makeQuestion = (text, answer = 'option_2') => ({
  instruction: text,
  options: [{ key: 'option_1', label: 'One' }, { key: 'option_2', label: 'Two' }],
  answer,
  explanation: `${text} explained`,
  models: [{ image: `${text}.png` }],
})

test('test and challenge select separate CMS banks', () => {
  const testQuestions = [makeQuestion('Test')]
  const challengeQuestions = [makeQuestion('Challenge')]
  const pkg = { studio: {}, assessments: { test_questions: testQuestions, challenge_questions: challengeQuestions } }
  assert.equal(assessmentBank('challenge'), 'challenge_questions')
  assert.equal(cmsQuestions(pkg, 'test'), testQuestions)
  assert.equal(cmsQuestions(pkg, 'challenge'), challengeQuestions)
  assert.equal(cmsQuestions({ ...pkg, studio: null }, 'challenge'), null)
})

test('download-shaped package feeds all three game assessment banks', () => {
  const pkg = normalizeContentPackage(sample, 'addition-introduction', fallback)
  assert.ok(cmsQuestions(pkg, 'test')?.length)
  assert.ok(cmsQuestions(pkg, 'challenge')?.length)
  assert.ok(pkg.assessments.battle_questions.length)
  assert.notEqual(cmsQuestions(pkg, 'test')[0].instruction, cmsQuestions(pkg, 'challenge')[0].instruction)
})

test('CMS answer review keeps explanation and question image', () => {
  const question = makeQuestion('Find two')
  const review = reviewAnswer(question, 'option_2')
  assert.equal(review.correct, true)
  assert.equal(review.answerLabel, 'Two')
  assert.equal(review.explanation, 'Find two explained')
  assert.equal(review.model.image, 'Find two.png')
})

test('local result counts unanswered questions as incorrect without inventing API XP', () => {
  const questions = [makeQuestion('First'), makeQuestion('Second')]
  const run = finishCmsAssessment({ questions, review: [reviewAnswer(questions[0], 'option_2')], seconds: 12, subject: 'maths', mode: 'challenge' })
  assert.equal(run.correct, 1)
  assert.equal(run.total, 2)
  assert.equal(run.review[1].selectedLabel, 'No answer')
  assert.equal(run.local, true)
  assert.equal(run.xpAwarded, 0)
})
