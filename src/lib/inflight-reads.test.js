import test from 'node:test'
import assert from 'node:assert/strict'
import { createInflightReads } from './inflight-reads.js'

test('concurrent same-session reads share transport, subsequent reads stay fresh', async () => {
  const reads = createInflightReads()
  let calls = 0
  const load = async () => ++calls
  assert.deepEqual(await Promise.all([reads.run('session:child:path', load), reads.run('session:child:path', load)]), [1, 1])
  assert.equal(await reads.run('session:child:path', load), 2)
  await Promise.all([reads.run('other-session:child:path', load), reads.run('session:other-child:path', load)])
  assert.equal(calls, 4)
})

test('failed reads can retry and writes separate readers from older in-flight data', async () => {
  const reads = createInflightReads()
  await assert.rejects(reads.run('key', async () => { throw Error('offline') }), /offline/)
  let finishOld, finishNew
  const old = reads.run('key', () => new Promise(resolve => { finishOld = resolve }))
  await Promise.resolve()
  reads.clear()
  const fresh = reads.run('key', () => new Promise(resolve => { finishNew = resolve }))
  await Promise.resolve()
  finishOld('old')
  await old
  assert.equal(reads.run('key', () => assert.fail('must share the new read')), fresh)
  finishNew('new')
  assert.equal(await fresh, 'new')
})
