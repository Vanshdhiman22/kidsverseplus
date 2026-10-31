export function practiceReviewItem(question, selected, correct) {
  const label = value => {
    if (value == null) return 'No answer'
    if (Array.isArray(value)) return value.map(label).join(', ')
    return question.options.find(option => option.key === value)?.label ?? String(value)
  }
  return {
    question: question.instruction,
    selectedLabel: label(selected), answerLabel: label(question.answer), correct,
    explanation: question.explanation || question.feedback_correct || '',
    model: question.models?.[0] ?? null,
  }
}
