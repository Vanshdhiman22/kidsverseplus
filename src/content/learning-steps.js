const names = { understand: 'Understand', example: 'See an example', remember: 'Remember' }

export function learningMini(source) {
  if (!source) return null
  const options = (Array.isArray(source.options) ? source.options : []).map((item, index) => ({
    key: String(item?.key ?? `option_${index + 1}`),
    label: String(typeof item === 'object' ? item?.label ?? item?.text ?? item?.value ?? '' : item),
  }))
  const raw = source.answer ?? source.correct_answer ?? source.correctAnswer
  const answer = options.find(option => option.key === String(raw) || option.label.toLowerCase() === String(raw ?? '').toLowerCase())?.key
  return { question: source.question ?? source.instruction ?? '', options, answer, explanation: source.explanation ?? '' }
}

// Preserve the published step order and keep each step's own text, media and check together.
export function learningSteps(pkg) {
  const flow = pkg.learn_before_test ?? pkg.studio?.learn_before_test
  const authored = Array.isArray(flow?.steps) ? flow.steps : []
  const order = Array.isArray(flow?.order) ? flow.order : []
  const ordered = [...new Set([...order.flatMap(key => authored.filter(step => step.step_key === key)), ...authored.filter(step => !order.includes(step.step_key))])]
  return ordered.map((step, index) => ({
    id: `${step.step_key ?? 'step'}:${index}`,
    stepKey: step.step_key,
    label: names[step.step_key] ?? step.title ?? `Step ${index + 1}`,
    title: step.title ?? '', body: step.teaching_text ?? '', key: step.key_idea ?? '',
    speech: step.nova_script ?? step.teaching_text ?? '',
    image: step.image_url || null, imageAlt: step.image_alt || step.title || '',
    alternate_teaching_text: step.alternate_teaching_text,
    explanation_ways: step.explanation_ways,
    mini: learningMini(step.mini_question),
  }))
}
