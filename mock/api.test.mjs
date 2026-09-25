import test from 'node:test'
import assert from 'node:assert/strict'
import { createMockApi, catalogs } from './api.mjs'

test('complete parent and child onboarding persists responses and validates ownership', async () => {
  const api = createMockApi()
  const signup = await api('POST', '/auth/parent/signup', { email: 'test@example.com', password: 'MockPass123' })
  assert.equal(signup.status, 201)
  const token = signup.data.token
  const call = (method, path, body) => api(method, path, body, token)
  assert.equal((await api('POST', '/auth/parent/login', { email: 'test@example.com', password: 'incorrect' })).status, 401)
  assert.equal((await api('POST', '/auth/parent/signup', { email: 'test@example.com', password: 'MockPass123' })).status, 400)
  assert.equal((await api('GET', '/parent/students')).status, 401)
  const child = await call('POST', '/students', { name: 'Local Explorer' })
  assert.equal(child.status, 201)
  assert.match(child.data.id, /^[0-9a-f-]{36}$/)
  assert.equal((await call('PATCH', `/students/${child.data.id}/grade-board`, { grade: '4', board: 'CBSE' })).status, 403)
  const details = { student_id: child.data.id, full_name: 'Test Parent', relationship: 'parent', phone: '+919876543210' }
  assert.equal((await call('POST', '/parent/verification/start', { ...details, phone: '1234' })).status, 400)
  const verification = await call('POST', '/parent/verification/start', details)
  assert.equal(verification.status, 201)
  assert.match(verification.data.dev_code, /^\d{6}$/)
  assert.equal((await call('POST', '/parent/verification/verify', { challenge_id: verification.data.challenge_id, code: 'bad' })).status, 400)
  assert.equal((await call('POST', '/parent/verification/verify', { challenge_id: verification.data.challenge_id, code: verification.data.dev_code })).data.phone_verified, true)
  assert.equal((await call('POST', '/parent/verification/verify', { challenge_id: verification.data.challenge_id, code: verification.data.dev_code })).status, 400)
  assert.equal((await call('GET', '/parent/me')).data.phone, details.phone)
  const root = `/students/${child.data.id}`
  assert.equal((await call('POST', `${root}/nova/greet`)).status, 400)
  assert.equal((await call('PATCH', `${root}/grade-board`, { grade: '4', board: 'CBSE' })).status, 200)
  assert.equal((await call('PUT', `${root}/avatar`, { character_id: catalogs.characters[2].id, outfit_item_id: catalogs.items[1].id })).status, 200)
  assert.equal((await call('PUT', `${root}/interests`, { interest_ids: ['bad-id'] })).status, 400)
  const ids = catalogs.interests.slice(0, 3).map(i => i.id)
  assert.deepEqual((await call('PUT', `${root}/interests`, { interest_ids: ids })).data.interest_ids, ids)
  assert.equal((await call('PUT', `${root}/goals`, { goal_ids: [catalogs.goals[0].id] })).status, 200)
  await call('POST', `${root}/onboarding/steps/lobby/complete`, {})
  const greet = await call('POST', `${root}/nova/greet`, {})
  assert.equal(greet.status, 200)
  assert.match(greet.data.onboarding_completed_at, /Z$/)
  assert.equal((await call('GET', `${root}/onboarding/status`)).data.is_complete, true)
  const students = (await call('GET', '/parent/students')).data.students
  assert.equal(students[0].name, 'Local Explorer')
  assert.deepEqual(students[0].interest_ids, ids)
  assert.match((await call('GET', `${root}/home`)).data.greeting, /Local Explorer/)
  const other = await api('POST', '/auth/parent/signup', { email: 'other@example.com', password: 'MockPass123' })
  assert.equal((await api('GET', `${root}/home`, {}, other.data.token)).status, 404)
  assert.equal((await call('GET', '/nonexistent')).status, 404)
  assert.equal((await call('POST', '/auth/parent/logout')).status, 204)
  assert.equal((await call('GET', '/parent/me')).status, 401)
})

test('mock DB is explicitly not tested and all catalog IDs are unique UUIDs', async () => {
  const api = createMockApi()
  assert.equal((await api('GET', '/health/database')).data.status, 'not_tested')
  const ids = Object.values(catalogs).flat().map(v => v.id)
  assert.equal(new Set(ids).size, ids.length)
  ids.forEach(id => assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/))
})
