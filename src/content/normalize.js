const list = value => Array.isArray(value) ? value : typeof value === 'string' ? value.split('|').map(v => v.trim()).filter(Boolean) : []

const optionKey = (value, index) => typeof value === 'object' && value?.key ? String(value.key) : `option_${index + 1}`
const optionLabel = value => typeof value === 'object' ? String(value.label ?? value.text ?? value.value ?? '') : String(value)

function mapAnswer(answer, options) {
  const values = Array.isArray(answer) ? answer : [answer]
  const mapped = values.map(value => {
    if (typeof value === 'number') return options[value]?.key ?? options[value - 1]?.key
    const exact = options.find(option => option.key === String(value) || option.label.toLowerCase() === String(value).toLowerCase())
    return exact?.key
  }).filter(Boolean)
  return Array.isArray(answer) ? mapped : mapped[0]
}

function studioQuestion(question, index, learning) {
  const rawOptions = list(question.options ?? question.choices)
  const options = rawOptions.map((value, optionIndex) => ({
    key: optionKey(value, optionIndex),
    label: optionLabel(value),
    ...(typeof value === 'object' && value?.sub ? { sub: value.sub } : {}),
  }))
  const rawAnswer = question.answer ?? question.correct_answer ?? question.correctAnswer
  const answer = mapAnswer(rawAnswer, options)
  const isMulti = Array.isArray(answer)
  const image = question.image_url ?? question.image ?? question.visual?.url ?? learning.image_url
  const hints = list(question.hints).length ? list(question.hints) : list(learning.hints)
  return {
    question_id: String(question.question_id ?? question.id ?? `generated_${index + 1}`),
    type: isMulti ? 'multi_select' : (question.type ?? 'single_choice'),
    title: question.title ?? (isMulti ? `Pick Any ${answer.length}!` : `Question ${index + 1}`),
    instruction: question.instruction ?? question.question ?? question.prompt ?? '',
    models: [{
      key: question.model_key ?? `generated-${index + 1}`,
      label: question.image_label ?? 'Question image',
      image,
      alt: question.image_alt ?? question.alt ?? `Visual for question ${index + 1}`,
      hints,
      feedback_wrong: question.feedback_wrong ?? question.explanation ?? learning.nova_feedback ?? 'Look closely and try again.',
    }],
    options,
    ...(isMulti ? { required_count: question.required_count ?? answer.length } : {}),
    answer,
    feedback_correct: question.feedback_correct ?? question.explanation ?? learning.nova_feedback ?? 'Great work! That is correct.',
    xp_on_correct: Number(question.xp_on_correct ?? 10),
    nova: {
      speech: question.nova_script ?? learning.nova_script ?? 'Look closely and choose your answer.',
      voice: question.nova_voice ?? question.question ?? question.prompt ?? '',
    },
  }
}

/** Convert the Content Studio download/push payload into the lesson screen contract. */
export function normalizeContentPackage(raw, id, fallback) {
  const payload = raw?.data ?? raw
  if (!payload || typeof payload !== 'object') throw new Error('invalid content package')
  if (payload.content_id === id && payload.discover?.contents && payload.check?.questions) return payload

  const learning = payload.learning_content ?? {}
  const generated = [
    ...list(payload.check_for_understanding),
    ...list(payload.test_questions?.questions),
  ].slice(0, 6)
  if (!generated.length) throw new Error('studio package has no questions')

  const questions = generated.map((question, index) => studioQuestion(question, index, learning))
  if (questions.some(question => !question.instruction || !question.options.length || !question.answer || !question.models[0].image)) {
    throw new Error('studio questions require text, options, an answer and an image')
  }

  return {
    ...fallback,
    content_id: id,
    content_version: String(payload.content_version ?? payload.version ?? Date.now()),
    subject: payload.curriculum?.subject ?? fallback.subject,
    grade: payload.curriculum?.grade ?? fallback.grade,
    board: payload.curriculum?.board ?? fallback.board,
    topic: payload.curriculum?.topic ?? fallback.topic,
    learning_objective: payload.concept?.learning_objective ?? fallback.learning_objective,
    discover: {
      selected: 0,
      contents: [{
        ...fallback.discover.contents[0],
        model: {
          ...fallback.discover.contents[0].model,
          title: payload.concept?.name ?? fallback.discover.contents[0].model.title,
          caption: learning.explanation ?? fallback.discover.contents[0].model.caption,
          image: learning.image_url ?? questions[0].models[0].image,
          alt: learning.image_alt ?? `Visual explanation of ${payload.concept?.name ?? fallback.topic}`,
        },
        hints: list(learning.hints),
        nova: {
          speech: learning.nova_script ?? fallback.discover.contents[0].nova.speech,
          voice: learning.nova_script ?? fallback.discover.contents[0].nova.voice,
        },
      }],
    },
    check: { selected: 0, questions },
  }
}
