export function reviewItems(review) {
  return review.items.map(q => ({
    question:q.question_text,
    selectedLabel:q.options.find(o=>o.key===q.selected_answer)?.label || 'No answer',
    answerLabel:q.options.find(o=>o.key===q.correct_answer)?.label || q.correct_answer,
    correct:q.is_correct,
    explanation:q.explanation,
    model:q.image_url ? {image:q.image_url,alt:q.image_alt || q.question_text} : null,
  }))
}
