import assert from 'node:assert/strict'

const base = 'http://127.0.0.1:5180/api/v1'
const email = 'demo.parent@example.com', password = 'MockPass123'
let token = ''
let count = 0
async function request(method, path, body, status = 200, extraHeaders = {}) {
  const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extraHeaders }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) })
  const data = response.status === 204 ? null : await response.json()
  assert.equal(response.status, status, `${method} ${path}: ${JSON.stringify(data)}`)
  assert.equal(response.headers.get('X-Kidsverse-Source'), 'local-mock', 'Refuse a non-mock backend')
  count++
  console.log(`PASS ${response.status} ${method} ${path}`)
  return data
}
await request('GET', '/health')
assert.equal((await request('GET', '/health/database')).status, 'not_tested')
await request('GET', '/parent/me', undefined, 401)
let auth = await fetch(base + '/auth/parent/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
assert.ok([201, 400].includes(auth.status))
token = (await request('POST', '/auth/parent/login', { email, password })).token
await request('POST', '/auth/parent/login', { email, password: 'wrong-password' }, 401)
let student = (await request('GET', '/parent/students')).students.find(s => s.name === 'Game Tester')
student ||= await request('POST', '/students', { name: 'Game Tester' }, 201)
const root = `/students/${student.id}`
await request('PATCH', `${root}/grade-board`, { grade: '4', board: 'CBSE' })
const characters = (await request('GET', '/avatar/characters')).characters
const items = (await request('GET', '/avatar/items')).items
await request('PUT', `${root}/avatar`, { character_id: characters[0].id, outfit_item_id: items[0].id })
const interests = (await request('GET', '/interests')).interests
await request('PUT', `${root}/interests`, { interest_ids: interests.slice(0, 3).map(v => v.id) })
const goals = (await request('GET', '/goals')).goals
await request('PUT', `${root}/goals`, { goal_ids: [goals[0].id] })
await request('POST', `${root}/onboarding/steps/lobby/complete`, {})
await request('POST', `${root}/nova/greet`, {})
assert.equal((await request('GET', `${root}/onboarding/status`)).is_complete, true)
const subject = (await request('GET', `${root}/subjects`)).subjects.find(s => s.slug === 'maths')
const topic = (await request('GET', `/subjects/${subject.id}/topics`)).topics[0]
const detail = await request('GET', `${root}/topics/${topic.id}`)
const missionId = detail.nodes[0].mission_id
const mission = await request('GET', `/missions/${missionId}`)
await request('POST', `${root}/missions/${missionId}/start`, {})
await request('POST', `${root}/missions/${missionId}/complete`, { score: 80 })
const test = (await request('GET', `/topics/${topic.id}/tests`)).tests[0]
const attempt = await request('POST', `${root}/tests/${test.id}/attempts`, {}, 201)
for (let order = 1; order <= test.question_count; order++) {
  const question = await request('GET', `/tests/attempts/${attempt.attempt_id}/questions/${order}`)
  await request('POST', `/tests/attempts/${attempt.attempt_id}/answers`, { question_id: question.id, selected_answer: mission.content.assessments.test_questions[order - 1].answer })
}
assert.equal((await request('POST', `/tests/attempts/${attempt.attempt_id}/complete`, {})).score, 100)
assert.equal((await request('GET', `/tests/attempts/${attempt.attempt_id}/result`)).xp_awarded, 50)
const challenge = (await request('GET', '/challenges')).challenges.find(c => c.slug === 'maths')
const opponent = (await request('GET', `/challenges/${challenge.id}/opponents`)).opponents[0]
await request('GET', `/challenges/${challenge.id}/preview?opponent_id=${opponent.id}`)
const battle = await request('POST', `${root}/challenge-battles`, { challenge_id: challenge.id, opponent_id: opponent.id }, 201)
assert.equal((await request('POST', `/challenge-battles/${battle.battle_id}/complete`, { score: 80 })).xp_awarded, 50)
await request('GET', `/challenge-battles/${battle.battle_id}/result`)
const home = await request('GET', `${root}/home`)
assert.equal((await request('GET', `${root}/profile`)).total_xp, home.stats.total_xp)
await request('GET', '/parent/overview')
await request('GET', '/goals', undefined, 500, { 'X-Mock-Scenario': '500' })
await request('GET', '/goals', undefined, 401, { 'X-Mock-Scenario': '401' })
const start = performance.now()
await request('GET', '/goals', undefined, 200, { 'X-Mock-Scenario': 'slow' })
assert.ok(performance.now() - start >= 1500)
console.log(`\n${count} HTTP assertions passed. Local demo account: ${email}. No production requests.`)
