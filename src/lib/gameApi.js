import { apiRequest, getToken } from './api.js'

const paths = new Map()
export async function resolveLearning(studentId, subject = 'maths') {
  if (!studentId) throw new Error('Create or select a child first.')
  const key = `${getToken()}:${studentId}:${subject}`
  if (!paths.has(key)) paths.set(key, (async () => {
    const { subjects } = await apiRequest(`/students/${studentId}/subjects`)
    const selected = subjects.find(s => s.slug === subject || (subject === 'maths' && ['math', 'mathematics'].includes(s.slug)))
    if (!selected) throw new Error(`No API subject available for ${subject}.`)
    const { topics } = await apiRequest(`/subjects/${selected.id || selected.subject_id}/topics`)
    const topic = topics.find(t => t.student_status === 'current') || topics[0]
    if (!topic) throw new Error('This subject has no API topics.')
    const detail = await apiRequest(`/students/${studentId}/topics/${topic.id}`)
    const mission = detail.nodes.find(n => n.status !== 'locked') || detail.nodes[0]
    if (!mission) throw new Error('This topic has no API missions.')
    return { subject: selected, topics, topic, detail, topicId: topic.id, missionId: mission.mission_id }
  })().catch(error => { paths.delete(key); throw error }))
  return paths.get(key)
}

export const loadLearningPath = resolveLearning

export async function listTopicTests(studentId, subject) {
  const path = await resolveLearning(studentId, subject)
  const { tests } = await apiRequest(`/topics/${path.topicId}/tests`)
  return { ...path, tests }
}

export async function loadMission(studentId, subject) {
  const path = await resolveLearning(studentId, subject)
  return apiRequest(`/missions/${path.missionId}`)
}
export async function startMission(studentId, subject) {
  const { missionId } = await resolveLearning(studentId, subject)
  return apiRequest(`/students/${studentId}/missions/${missionId}/start`, { method: 'POST', body: {} })
}
export async function completeMission(studentId, subject, score) {
  const { missionId } = await resolveLearning(studentId, subject)
  // Idempotent mock start supports opening the learning screen directly.
  await startMission(studentId, subject)
  return apiRequest(`/students/${studentId}/missions/${missionId}/complete`, { method: 'POST', body: { score } })
}
export async function startTest(studentId, subject) {
  const { topicId } = await resolveLearning(studentId, subject)
  const { tests } = await apiRequest(`/topics/${topicId}/tests`)
  if (!tests.length) throw new Error('No test is available for this topic.')
  const detail = await apiRequest(`/tests/${tests[0].id}`)
  const attempt = await apiRequest(`/students/${studentId}/tests/${tests[0].id}/attempts`, { method: 'POST', body: {} })
  sessionStorage.setItem(`kv:api-test:${studentId}:${subject}`, JSON.stringify({ ...attempt, total: detail.question_count }))
  return attempt
}
export async function getTestQuestion(studentId, subject, order) {
  const attempt = JSON.parse(sessionStorage.getItem(`kv:api-test:${studentId}:${subject}`) || 'null')
  if (!attempt) throw new Error('Start a test from the test introduction first.')
  return apiRequest(`/tests/attempts/${attempt.attempt_id}/questions/${order}`)
}
export async function submitAnswer(studentId, subject, order, selected, displayedQuestion) {
  const attempt = JSON.parse(sessionStorage.getItem(`kv:api-test:${studentId}:${subject}`) || 'null')
  if (!attempt) throw new Error('Start a test from the test introduction first.')
  const q = await apiRequest(`/tests/attempts/${attempt.attempt_id}/questions/${order}`)
  if (displayedQuestion && q.question_text !== displayedQuestion) throw new Error('API question and displayed content differ. Answer was not submitted; content mapping needs review.')
  return apiRequest(`/tests/attempts/${attempt.attempt_id}/answers`, { method: 'POST', body: { question_id: q.id, selected_answer: selected } })
}
export async function completeTest(studentId, subject) {
  const attempt = JSON.parse(sessionStorage.getItem(`kv:api-test:${studentId}:${subject}`) || 'null')
  if (!attempt) throw new Error('No API test attempt. Return to Start Test.')
  const done = await apiRequest(`/tests/attempts/${attempt.attempt_id}/complete`, { method: 'POST', body: {} })
  const result = await apiRequest(`/tests/attempts/${attempt.attempt_id}/result`)
  return { ...done, ...result, attemptId: attempt.attempt_id }
}
export async function battlePreview(botIndex = 0) {
  const { challenges } = await apiRequest('/challenges')
  const challenge = challenges.find(c => c.slug === 'maths') || challenges[0]
  if (!challenge) throw new Error('No challenges available.')
  const { opponents } = await apiRequest(`/challenges/${challenge.id}/opponents`)
  const opponent = opponents[botIndex] || opponents[0]
  if (!opponent) throw new Error('No opponent available.')
  const preview = await apiRequest(`/challenges/${challenge.id}/preview?opponent_id=${opponent.id}`)
  return { ...preview, challengeId: challenge.id, opponent }
}
export async function startBattle(studentId, botIndex = 0) {
  if (!studentId) throw new Error('Create or select a child first.')
  const { challengeId, opponent } = await battlePreview(botIndex)
  const battle = await apiRequest(`/students/${studentId}/challenge-battles`, { method: 'POST', body: { challenge_id: challengeId, opponent_id: opponent.id } })
  sessionStorage.setItem(`kv:api-opponent:${studentId}`, JSON.stringify(opponent))
  sessionStorage.setItem(`kv:api-battle:${studentId}`, battle.battle_id)
  return battle
}
export async function completeBattle(studentId, score) {
  const id = sessionStorage.getItem(`kv:api-battle:${studentId}`)
  if (!id) throw new Error('Start a battle from the battle preview first.')
  await apiRequest(`/challenge-battles/${id}/complete`, { method: 'POST', body: { score } })
  return { ...await apiRequest(`/challenge-battles/${id}/result`), battleId: id }
}

export async function completeCompanionActivity(studentId, keywords, subject = 'literacy') {
  if (!studentId) throw new Error('Create or select a child first.')
  const { companion_activities: activities = [] } = await apiRequest(`/students/${studentId}/journey?subject=${encodeURIComponent(subject)}`)
  const terms = (Array.isArray(keywords) ? keywords : [keywords]).map(value => String(value).toLowerCase())
  const activity = activities.find(item => terms.some(term => item.name.toLowerCase().includes(term)))
  if (!activity) throw new Error('This companion activity is not available from the live API yet.')
  return apiRequest(`/students/${studentId}/companion-activities/${activity.id}/complete`, { method: 'POST', body: {} })
}
