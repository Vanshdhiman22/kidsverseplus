import test from 'node:test'
import assert from 'node:assert/strict'
import { clearBrowserData } from './browserData.js'

function storage(entries) {
  const data = new Map(entries)
  return {
    get length() { return data.size },
    key: index => [...data.keys()][index] ?? null,
    removeItem: key => data.delete(key),
    data,
  }
}

test('local reset removes all Kidsverse families, API sessions and runs but preserves unrelated data', () => {
  const local = storage([['kidsverse-plus-v3-live', '{}'], ['kidsverse-plus-v3-mock', '{}'], ['kv:rewarded:attempt', '1'], ['kv-music', '1'], ['other-app', 'keep']])
  const session = storage([['kidsverse-session:live:https://example.com/api/v1', 'token'], ['kidsverse-content-preview', '{}'], ['kv:api-test:child:maths:token', '{}'], ['kv:last-test-run', '{}'], ['other-session', 'keep']])
  clearBrowserData(local, session)
  assert.deepEqual([...local.data], [['other-app', 'keep']])
  assert.deepEqual([...session.data], [['other-session', 'keep']])
})
