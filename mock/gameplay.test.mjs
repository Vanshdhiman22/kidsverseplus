import test from 'node:test'
import assert from 'node:assert/strict'
import { createMockApi } from './api.mjs'
import { worlds, opponents } from './gameplay.mjs'
import { formatBrowserDateTime } from '../src/lib/time.js'

for (const world of worlds) test(`${world.slug}: mission, server-scored test, battle, stats and replay protection`, async () => {
  const api = createMockApi()
  const { data: auth } = await api('POST', '/auth/parent/signup', { email: 'play@example.com', password: 'MockPass123' })
  const call = (method, path, body) => api(method, path, body, auth.token)
  const { data: student } = await call('POST', '/students', { name: 'Test Explorer' })
  const root = `/students/${student.id}`
  assert.equal((await call('GET', `${root}/subjects`)).data.subjects.length, 5)
  assert.equal((await call('GET', `/subjects/${world.id}/topics`)).data.topics[0].id, world.topicId)
  const detail = (await call('GET', `${root}/topics/${world.topicId}`)).data
  assert.equal(detail.nodes[0].mission_id, world.missionId)
  assert.equal((await call('GET', `/missions/${world.missionId}`)).data.content.subject, world.pkg.subject)
  assert.equal((await call('POST', `${root}/missions/${world.missionId}/complete`, { score: 100 })).status, 400)
  await call('POST', `${root}/missions/${world.missionId}/start`, {})
  const mission = await call('POST', `${root}/missions/${world.missionId}/complete`, { score: 80 })
  assert.equal(mission.data.stars, 3)
  await call('POST', `${root}/missions/${world.missionId}/complete`, { score: 80 })
  const { data: attempt } = await call('POST', `${root}/tests/${world.testId}/attempts`, {})
  assert.equal((await call('POST', `/tests/attempts/${attempt.attempt_id}/answers`, { question_id: worlds.find(w => w !== world).questions[0].id, selected_answer: 'option_1' })).status, 400)
  for (const q of world.questions) {
    const response = await call('GET', `/tests/attempts/${attempt.attempt_id}/questions/${q.order_index}`)
    assert.equal(response.data.question_text, q.instruction)
    assert.equal('answer' in response.data, false)
    assert.equal((await call('POST', `/tests/attempts/${attempt.attempt_id}/answers`, { question_id: q.id, selected_answer: q.answer })).data.is_correct, true)
  }
  const result = await call('POST', `/tests/attempts/${attempt.attempt_id}/complete`, {})
  assert.equal(result.data.score, 100)
  await call('POST', `/tests/attempts/${attempt.attempt_id}/complete`, {})
  assert.equal((await call('GET', `/tests/attempts/${attempt.attempt_id}/result`)).data.xp_awarded, 50)
  const { data: battle } = await call('POST', `${root}/challenge-battles`, { challenge_id: world.challengeId, opponent_id: opponents[0].id })
  assert.equal((await call('POST', `/challenge-battles/${battle.battle_id}/complete`, { score: 101 })).status, 400)
  assert.equal((await call('POST', `/challenge-battles/${battle.battle_id}/complete`, { score: 80 })).data.result, 'win')
  await call('POST', `/challenge-battles/${battle.battle_id}/complete`, { score: 80 })
  const home = (await call('GET', `${root}/home`)).data
  assert.equal(home.stats.total_xp, world.pkg.mission.xp + 100)
  assert.equal((await call('GET', '/parent/overview')).data.students[0].total_xp, home.stats.total_xp)
  assert.equal((await call('GET', `${root}/profile`)).data.total_xp, home.stats.total_xp)
})

test('UTC timestamps render correctly in India and US with DST', () => {
  const date = '2026-09-18T10:30:00Z'
  assert.match(formatBrowserDateTime(date, { timeZone: 'Asia/Kolkata', hourCycle: 'h23' }), /16:00/)
  assert.match(formatBrowserDateTime(date, { timeZone: 'America/New_York', hourCycle: 'h23' }), /06:30/)
  assert.match(formatBrowserDateTime('2026-01-18T10:30:00Z', { timeZone: 'America/New_York', hourCycle: 'h23' }), /05:30/)
  assert.equal(formatBrowserDateTime('invalid'), '—')
})
