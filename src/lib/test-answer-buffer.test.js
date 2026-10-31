import test from 'node:test'
import assert from 'node:assert/strict'
import { createTestAnswerBuffer } from './test-answer-buffer.js'

const attempt = { attempt_id: 'attempt', total: 5 }
function setup(request = async () => ({})) {
  const values = new Map()
  const storage = { getItem: k => values.get(k), setItem: (k,v) => values.set(k,v) }
  let token = 'session'
  const dependencies = { storage, request, getToken: () => token }
  return { buffer: createTestAnswerBuffer(dependencies), reload: () => createTestAnswerBuffer(dependencies), changeLogin: () => { token = 'new-login' } }
}
test('answers stay local until Finish, survive refresh, and acknowledged answers are not sent twice', async () => {
  const calls = []
  const { buffer, reload } = setup(async (path, options) => calls.push({ path, ...options }))
  buffer.put(attempt, 1, { id: 'q1' }, 'A')
  buffer.put(attempt, 2, { id: 'q2' }, 'B')
  assert.equal(calls.length, 0)
  const restored = reload()
  await restored.flush(attempt)
  assert.deepEqual(calls.map(call => call.body), [{question_id:'q1',selected_answer:'A'},{question_id:'q2',selected_answer:'B'}])
  await restored.flush(attempt)
  assert.equal(calls.length, 2)
})
test('partial failure retains drafts and retry sends only the unacknowledged answer', async () => {
  const calls = []
  let fail = true
  const { buffer } = setup(async (path, { body }) => { calls.push(body.question_id); if(body.question_id === 'q2' && fail) throw Error('Offline') })
  for(let i=1;i<=3;i++) buffer.put(attempt,i,{id:`q${i}`},'A')
  await assert.rejects(buffer.flush(attempt), /Tap Finish to retry/)
  fail = false
  await buffer.flush(attempt)
  assert.deepEqual(calls,['q1','q2','q3','q2'])
})
test('simultaneous Finish calls share writes and never exceed three requests at once', async () => {
  let count = 0, active = 0, peak = 0
  const { buffer } = setup(async () => { count++; active++; peak=Math.max(peak,active); await new Promise(resolve=>setTimeout(resolve,5)); active-- })
  for(let i=1;i<=5;i++) buffer.put(attempt,i,{id:`q${i}`},'A')
  const a=buffer.flush(attempt),b=buffer.flush(attempt)
  assert.equal(a,b)
  assert.throws(()=>buffer.put(attempt,1,{id:'q1'},'B'),/being submitted/)
  await Promise.all([a,b])
  assert.equal(count,5);assert.equal(peak,3)
})
test('drafts never cross login or attempt and completed tests cannot be edited', async () => {
  let calls=0
  const {buffer,changeLogin}=setup(async()=>{calls++})
  buffer.put(attempt,1,{id:'q1'},'A')
  await buffer.flush({...attempt,attempt_id:'other'})
  changeLogin()
  await buffer.flush(attempt)
  assert.equal(calls,0)
  assert.throws(()=>buffer.put({...attempt,completion:{}},1,{id:'q1'},'A'),/already finished/)
})
