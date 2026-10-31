// Keep drafts in this browser tab until Finish; retain individual acknowledgments
// so retrying a partial save only sends answers that have not been acknowledged.
export function createTestAnswerBuffer({ storage, getToken, request }) {
  const pending = new Map()
  const key = attempt => `kv:test-drafts:${getToken()}:${attempt.attempt_id}`
  const read = id => JSON.parse(storage.getItem(id) || '{}')
  function put(attempt, order, question, selected) {
    const id = key(attempt)
    if (pending.has(id)) throw new Error('Answers are being submitted. Please wait.')
    if (attempt.completion) throw new Error('This test has already finished.')
    if (!Number.isInteger(order) || order < 1 || order > attempt.total || !question?.id || selected == null) throw new Error('Choose an answer to the current question first.')
    const entries = read(id)
    const previous = entries[order]
    entries[order] = { question_id: question.id, selected_answer: selected, is_correct: previous?.selected_answer === selected ? previous.is_correct : undefined,
      saved: previous?.saved === true && previous.question_id === question.id && previous.selected_answer === selected }
    storage.setItem(id, JSON.stringify(entries))
  }
  function flush(attempt) {
    const id = key(attempt)
    const token = getToken()
    if (pending.has(id)) return pending.get(id)
    const operation = (async () => {
      const entries = Object.entries(read(id)).filter(([, entry]) => !entry.saved)
      for (let index = 0; index < entries.length; index += 3) {
        const results = await Promise.allSettled(entries.slice(index, index + 3).map(async ([order, entry]) => {
          if (getToken() !== token) throw new Error('Your login changed. Sign in again to continue.')
          const result = await request(`/tests/attempts/${attempt.attempt_id}/answers`, { method: 'POST', token,
            body: { question_id: entry.question_id, selected_answer: entry.selected_answer } })
          const latest = read(id)
          latest[order] = { ...entry, saved: true, is_correct: typeof result?.is_correct === 'boolean' ? result.is_correct : null }
          storage.setItem(id, JSON.stringify(latest))
        }))
        const failed = results.find(result => result.status === 'rejected')
        if (failed) throw new Error(`Some answers could not be saved. Tap Finish to retry. ${failed.reason.message}`)
      }
      if (getToken() !== token) throw new Error('Your login changed. Sign in again to continue.')
      return read(id)
    })().finally(() => pending.delete(id))
    pending.set(id, operation)
    return operation
  }
  return { put, flush }
}
