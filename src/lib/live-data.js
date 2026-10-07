// Keep remote identifiers separate from the artwork and route aliases used by the UI.
export function subjectKey(value = '') {
  const key = String(value).toLowerCase().replace(/[ _]+/g, '-')
  return ({ math: 'maths', mathematics: 'maths', english: 'literacy', science: 'evs', 'evs-/-science':'evs', computers: 'computer', 'computer-science': 'computer', 'general-awareness': 'general', 'general-knowledge': 'general' })[key] || key
}

export function availableWorlds(subjects = [], artwork = []) {
  return subjects.map(subject => {
    const id = subjectKey(subject.slug || subject.name)
    const style = artwork.find(world => world.id === id) || artwork[0] || {}
    return { ...style, id, name: subject.name, apiId: subject.id || subject.subject_id,
      pct: Number(subject.progress_percent ?? 0), locked: Boolean(subject.locked),
      total: subject.total_missions ?? null, done: subject.completed_missions ?? null,
      badge: subject.badge, desc: subject.description || 'Explore the available topics.' }
  })
}

export function checkedJourney(journey, subject) {
  if (subjectKey(journey?.subject) !== subjectKey(subject)) throw new Error('The service returned a different subject. Please choose another subject or retry later.')
  return journey
}

export function normalizeApiQuestion(item) {
  if (!item?.id || !item.question_text || !Array.isArray(item.options) || !item.options.length) throw new Error('This question is missing its text or answer options.')
  return { question_id: item.id, instruction: item.question_text,
    options: item.options.map((option, i) => typeof option === 'object' && option !== null
      ? { key: String(option.id ?? option.key ?? option.value ?? option.text ?? option.label ?? i), label: String(option.text ?? option.label ?? option.value ?? option.id ?? '') }
      : { key: String(option), label: String(option) }),
    answer: null, hints: item.hints || (item.hint ? [item.hint] : []),
    models: item.image_url ? [{ image: item.image_url, alt: item.question_text }] : [],
    explanation: item.explanation || 'Your answer is checked by the service.' }
}

export function testSeconds(test) {
  const minutes = Number(test?.estimated_minutes)
  return Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes * 60) : null
}
