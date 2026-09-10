import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeContentPackage } from './normalize.js'
import fallback from './fractions-equal-parts.json' with { type: 'json' }

test('studio questions keep their matching image, choices and answer', () => {
  const studio = {
    curriculum: { grade: 'Grade 4', board: 'CBSE', subject: 'Mathematics', topic: 'Fractions' },
    concept: { name: 'Equal parts', learning_objective: 'Recognise equal fractions' },
    learning_content: { image_url: 'https://images.example/lesson.webp', hints: ['Count first'] },
    test_questions: {
      questions: Array.from({ length: 7 }, (_, index) => ({
        id: `studio-${index + 1}`,
        question: `Generated question ${index + 1}`,
        options: ['One', 'Two', 'Three', 'Four'],
        correct_answer: 'Two',
        image_url: `https://images.example/question-${index + 1}.webp`,
      })),
    },
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
