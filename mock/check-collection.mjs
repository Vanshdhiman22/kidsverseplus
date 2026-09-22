// Execute our local collection's request order and assertion scripts without a Postman installation.
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import assert from 'node:assert/strict'

const collection = JSON.parse(readFileSync(new URL('../postman/Kidsverse-local-mock.postman_collection.json', import.meta.url)))
const vars = new Map(collection.variable.map(v => [v.key, v.value]))
const interpolate = value => value.replace(/\{\{([^}]+)\}\}/g, (_, key) => { assert.ok(vars.has(key), `Missing variable ${key}`); return vars.get(key) })
let checks = 0
for (const item of collection.item) {
  const pm = {
    collectionVariables: { set: (key, value) => vars.set(key, value) },
    test: (name, fn) => { fn(); checks++ },
    expect: actual => ({ to: { equal: expected => assert.equal(actual, expected) } }),
  }
  for (const event of item.event.filter(e => e.listen === 'prerequest')) runInNewContext(event.script.exec.join('\n'), { pm }, { timeout: 1000 })
  const url = interpolate(item.request.url)
  assert.ok(url.startsWith('http://127.0.0.1:5180/api/v1/'), 'Only local mock requests allowed')
  const headers = Object.fromEntries(item.request.header.map(h => [h.key, interpolate(h.value)]))
  if (vars.get('token')) headers.Authorization = `Bearer ${vars.get('token')}`
  const response = await fetch(url, { method: item.request.method, headers, ...(item.request.body ? { body: interpolate(item.request.body.raw) } : {}), signal: AbortSignal.timeout(10000) })
  const data = response.status === 204 ? null : await response.json()
  pm.response = { json: () => data, headers: response.headers, to: { have: { status: expected => assert.equal(response.status, expected, `${item.name}: ${JSON.stringify(data)}`) } } }
  for (const event of item.event.filter(e => e.listen === 'test')) runInNewContext(event.script.exec.join('\n'), { pm }, { timeout: 1000 })
  console.log(`PASS ${item.name}: ${response.status}`)
}
console.log(`${collection.item.length} collection requests, ${checks} assertions passed against localhost. Not a Postman GUI run.`)
