import test from 'node:test'
import assert from 'node:assert/strict'
import { ApiError, backend, request, saveAvatarChoice, saveGoalKeys, saveInterestKeys } from './api.js'

const response = (body, status = 200) => new Response(body === null ? null : JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json' },
})

test('request sends JSON and bearer token', async () => {
  let call
  globalThis.fetch = async (url, init) => { call = { url, init }; return response({ ok: true }) }
  const data = await request('/students', { method: 'POST', token: 'jwt', body: { name: 'Asha' } })
  assert.deepEqual(data, { ok: true })
  assert.equal(call.url, 'http://127.0.0.1:8000/api/v1/students')
  assert.equal(call.init.headers.Authorization, 'Bearer jwt')
  assert.equal(call.init.body, '{"name":"Asha"}')
})

test('API errors expose the backend message', async () => {
  globalThis.fetch = async () => response({ detail: 'Invalid email or password' }, 401)
  await assert.rejects(() => backend.login('x@y.com', 'bad'), error => error instanceof ApiError && error.status === 401 && error.message === 'Invalid email or password')
})

test('authenticated catalog requests include the saved JWT', async () => {
  const oldStorage = globalThis.localStorage
  globalThis.localStorage = { getItem: key => key === 'kidsverse-parent-token' ? 'saved-jwt' : null }
  let authorization
  globalThis.fetch = async (_url, init) => { authorization = init.headers.Authorization; return response({ characters: [] }) }
  await backend.avatarCharacters()
  assert.equal(authorization, 'Bearer saved-jwt')
  globalThis.localStorage = oldStorage
})

test('onboarding selections resolve catalog keys to UUID payloads', async () => {
  const calls = []
  globalThis.fetch = async (url, init = {}) => {
    calls.push([url, init])
    if (url.endsWith('/avatar/characters')) return response({ characters: [{ id: 'char-1' }, { id: 'char-2' }] })
    if (url.includes('/avatar/items')) return response({ items: [{ id: 'coat-1', slug: 'explorers-jacket', is_default: true }] })
    if (url.endsWith('/interests')) return response({ interests: [{ id: 'interest-1', key: 'space' }] })
    if (url.endsWith('/goals')) return response({ goals: [{ id: 'goal-1', key: 'build_confidence' }] })
    return response({ saved: true })
  }
  await saveAvatarChoice('student-1', 2, 'explorer')
  await saveInterestKeys('student-1', ['space'])
  await saveGoalKeys('student-1', ['confidence'])
  const puts = calls.filter(([, init]) => init.method === 'PUT').map(([, init]) => JSON.parse(init.body))
  assert.deepEqual(puts, [
    { character_id: 'char-2', outfit_item_id: 'coat-1' },
    { interest_ids: ['interest-1'] },
    { goal_ids: ['goal-1'] },
  ])
})
