import { randomInt } from 'node:crypto'

// Select once at attempt creation. The private snapshot, including its answer
// keys and content version, is persisted with the attempt. GET never reshuffles.
export function selectAttemptQuestions(bank, limit = bank.length, randomIndex = randomInt) {
  const questions = structuredClone(bank)
  for (let i = questions.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1)
    if (!Number.isInteger(j) || j < 0 || j > i) throw new Error('Invalid random question index')
    ;[questions[i], questions[j]] = [questions[j], questions[i]]
  }
  return questions.slice(0, limit).map((question, index) => ({ ...question, order_index: index + 1 }))
}
