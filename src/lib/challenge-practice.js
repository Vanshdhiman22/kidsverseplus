import { normalizeAuthoredQuestionBank } from '../content/normalize.js'

const grade = value => String(value || '').replace(/^grade\s*/i, '').trim()
const same = (a, b) => Boolean(a && b) && String(a).trim().toLowerCase() === String(b).trim().toLowerCase()

export function eligiblePracticePackages(packages, context) {
  return packages.filter(item => item.is_published === true
    && same(item.topic_name, context.topic) && same(item.subject_name, context.subject)
    && same(item.board, context.board) && grade(item.grade) === grade(context.grade))
}

export function practiceQuestions(payload, selected, context) {
  const curriculum = payload.curriculum || {}
  if (payload.id !== selected.id || payload.concept?.id !== selected.concept_id
    || !same(curriculum.topic, context.topic) || !same(curriculum.subject, context.subject)
    || !same(curriculum.board, context.board) || grade(curriculum.grade) !== grade(context.grade)) {
    throw new Error('This content does not match the selected child and concept.')
  }
  const bank = payload.challenge?.questions
  if (!Array.isArray(bank) || !bank.length) throw new Error('No challenge questions are published for this concept yet.')
  const questions = normalizeAuthoredQuestionBank(bank, {})
  if (questions.some(q => !q.instruction || q.options.length < 2 || q.options.some(o => !o.label)
    || !q.answer || (Array.isArray(q.answer) && !q.answer.length)
    || new Set(q.options.map(o => o.key)).size !== q.options.length)) {
    throw new Error('This challenge has incomplete question content. Please choose another concept.')
  }
  return questions
}

export function practiceCorrect(question, picks) {
  const expected = Array.isArray(question.answer) ? question.answer : [question.answer]
  return picks.length === expected.length && new Set(picks).size === picks.length && expected.every(key => picks.includes(key))
}

export function createChallengePractice({ request, resolveTopic }) {
  return {
    async list(studentId, subject) {
      if (!studentId) throw new Error('Choose a child first.')
      const [path, profile, catalog] = await Promise.all([
        resolveTopic(studentId, subject), request(`/students/${studentId}/profile`), request('/admin/content/packages'),
      ])
      const context = { topic: path.detail.name, subject: path.subject.name, grade: profile.grade, board: profile.board }
      if (!context.grade || !context.board) throw new Error('Choose the child’s grade and board first.')
      return { context, packages: eligiblePracticePackages(catalog.packages || [], context) }
    },
    async load(catalog, packageId) {
      const selected = catalog.packages.find(item => item.id === packageId)
      if (!selected) throw new Error('Choose a published concept for this child first.')
      const payload = await request(`/admin/content/packages/${selected.id}`)
      return { name: selected.concept_name, questions: practiceQuestions(payload, selected, catalog.context) }
    },
  }
}
