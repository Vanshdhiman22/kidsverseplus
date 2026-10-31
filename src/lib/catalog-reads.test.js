import test from 'node:test'
import assert from 'node:assert/strict'
import { createCatalogReads } from './catalog-reads.js'

test('metadata loads once across concurrent and nearby visits, then expires', async () => {
  let time = 0, calls = 0
  const reads = createCatalogReads({ now: () => time, maxAgeMs: 30000 })
  const load = async () => ({ revision: ++calls })
  const [a, b] = await Promise.all([reads.run('session:catalog', load), reads.run('session:catalog', load)])
  assert.equal(a, b)
  time = 29999
  assert.equal(await reads.run('session:catalog', load), a)
  time = 30000
  assert.deepEqual(await reads.run('session:catalog', load), { revision: 2 })
  assert.equal(calls, 2)
})

test('different session scopes do not share metadata and errors can retry', async () => {
  const reads = createCatalogReads()
  let calls = 0
  const load = async () => ++calls
  assert.equal(await reads.run('session-a:catalog', load), 1)
  assert.equal(await reads.run('session-b:catalog', load), 2)
  await assert.rejects(reads.run('broken', () => { throw Error('offline') }), /offline/)
  assert.equal(await reads.run('broken', load), 3)
})

test('a mutation or logout clears saved metadata and late reads cannot repopulate it', async () => {
  const reads = createCatalogReads()
  let finishOld
  const old = reads.run('key', () => new Promise(resolve => { finishOld = resolve }))
  await Promise.resolve()
  reads.clear()
  assert.equal(await reads.run('key', async () => 'fresh'), 'fresh')
  finishOld('old')
  assert.equal(await old, 'old')
  assert.equal(await reads.run('key', () => assert.fail('must retain fresh response')), 'fresh')
  reads.clear()
  assert.equal(await reads.run('key', async () => 'new session'), 'new session')
})
