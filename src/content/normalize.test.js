import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeContentPackage } from './normalize.js'
import fallback from './fractions-equal-parts.json' with { type: 'json' }

test('studio questions keep their matching image, choices and answer', () => {
  const studio = {
    curriculum: { grade: 'Grade 4', board: 'CBSE', subject: 'Mathematics', topic: 'Fractions' },
    concept: { name: 'Equal parts', learning_objective: 'Recognise equal fractions' },
    learning_content: { image_url: 'https://images.example/lesson.webp', hints: ['Count first'] },
    check_for_understanding: Array.from({ length: 7 }, (_, index) => ({
        id: `studio-${index + 1}`,
        question: `Generated question ${index + 1}`,
        options: ['One', 'Two', 'Three', 'Four'],
        correct_answer: 'Two',
        image_url: `https://images.example/question-${index + 1}.webp`,
      })),
  }

  const result = normalizeContentPackage(studio, 'fractions-equal-parts', fallback)
  assert.equal(result.check.questions.length, 6)
  assert.equal(result.check.questions[2].instruction, 'Generated question 3')
  assert.equal(result.check.questions[2].models[0].image, 'https://images.example/question-3.webp')
  assert.equal(result.check.questions[2].answer, 'option_2')
})

test('studio multi-select answers become pick-n questions', () => {
  const studio = {
    learning_content: { image_url: 'https://images.example/lesson.webp' },
    check_for_understanding: [{
      question: 'Pick two',
      options: [{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }, { key: 'c', label: 'C' }],
      answer: ['a', 'c'],
      image_url: 'https://images.example/pick-two.webp',
    }],
  }
  const result = normalizeContentPackage(studio, 'fractions-equal-parts', fallback)
  assert.deepEqual(result.check.questions[0].answer, ['a', 'c'])
  assert.equal(result.check.questions[0].required_count, 2)
  assert.equal(result.check.questions[0].type, 'multi_select')
})

test('full studio package preserves test, battle and challenge sections', () => {
  const question = (label) => ({
    question: label,
    options: ['2', '3', '4'], answer: '3',
    image_url: 'https://images.example/addition.webp', xp: 25, marks: 2,
  })
  const studio = {
    learning_content: { image_url: 'https://images.example/concept.webp' },
    check_for_understanding: [question('Learning check: what is 2 + 1?')],
    test_questions: { questions: [question('Test: what is 2 + 1?')] },
    battle_questions: [question('Battle: what is 2 + 1?')],
    challenge: { questions: [question('Challenge: what is 2 + 1?')] },
  }
  const result = normalizeContentPackage(studio, 'addition-introduction', fallback)
  assert.equal(result.assessments.test_questions[0].answer, 'option_2')
  assert.equal(result.assessments.battle_questions[0].xp_on_correct, 25)
  assert.equal(result.assessments.challenge_questions[0].marks, 2)
})

test('studio learn-before-test keeps all three authored tiny checks', () => {
  const tiny = (step, answer) => ({
    step_key: step,
    title: `${step} title`,
    teaching_text: `${step} teaching`,
    key_idea: `${step} key idea`,
    nova_script: `${step} Nova script`,
    mini_question: { question: `${step} question`, options: ['No', answer], answer, explanation: `${step} explanation` },
  })
  const studio = {
    learning_content: { image_url: 'https://images.example/concept.webp' },
    learn_before_test: { required: true, steps: [tiny('understand', 'Join'), tiny('example', '5'), tiny('remember', 'Total')] },
    check_for_understanding: [{ question: 'Separate learning check', options: ['A', 'B'], answer: 'A', image_url: 'https://images.example/check.webp' }],
  }
  const result = normalizeContentPackage(studio, 'addition-introduction', fallback)
  assert.equal(result.studio.learn_before_test.steps.length, 3)
  assert.equal(result.studio.learn_before_test.steps[1].mini_question.question, 'example question')
  assert.equal(result.studio.learn_before_test.steps[2].mini_question.answer, 'Total')
})
