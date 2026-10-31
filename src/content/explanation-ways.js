const asWay = (value, label) => {
  if (typeof value === 'string') return { label, body: value.trim(), speech: value.trim() }
  const way = {
    label: value?.label || label,
    body: String(value?.teaching_text ?? value?.text ?? value?.body ?? '').trim(),
    image: value?.image_url || value?.image || null,
    imageAlt: value?.image_alt || value?.image_prompt || '',
    key: value?.key_idea || null,
    mini: value?.mini_question || null,
  }
  return { ...way, speech: value?.nova_script || way.body }
}

/** Authored examples of the same learning idea, each with its own optional visual and check. */
export function explanationWays(step) {
  const first = { label: 'See the example', body: step.body, speech: step.speech, image: step.image, imageAlt: step.imageAlt, key: step.key, mini: step.mini }
  const authored = Array.isArray(step.explanation_ways) ? step.explanation_ways : []
  const candidates = [
    ...authored.map((way, index) => asWay(way, `Way ${index + 2}`)),
    asWay(step.alternate_teaching_text, 'Break it down'),
  ]
  return [first, ...candidates.filter(way => way.body || way.image || way.mini)]
}
