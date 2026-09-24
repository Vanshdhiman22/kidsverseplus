export const assessmentBank = mode => mode === 'challenge' ? 'challenge_questions' : 'test_questions'

export function cmsQuestions(pkg, mode) {
  const questions = pkg?.assessments?.[assessmentBank(mode)]
  return pkg?.studio && Array.isArray(questions) && questions.length ? questions : null
}

export function reviewAnswer(question, selectedKey) {
  const selected = question.options.find(option => option.key === selectedKey)
  const answer = question.options.find(option => option.key === question.answer)
  return {
    question: question.instruction,
    selectedLabel: selected?.label ?? 'No answer',
    answerLabel: answer?.label ?? '—',
    correct: selectedKey === question.answer,
    explanation: question.explanation || question.feedback_correct || 'Review the idea and try again.',
    model: question.models?.[0],
  }
}

export function finishCmsAssessment({ questions, review, seconds, subject, mode }) {
  const completed = questions.map((question, index) => review[index] ?? reviewAnswer(question, null))
  return {
    runId: `cms-${Date.now()}`,
    local: true,
    correct: completed.filter(item => item.correct).length,
    total: questions.length,
    seconds,
    subject,
    source: mode,
    review: completed,
    xpAwarded: 0,
  }
}
