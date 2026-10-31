import test from 'node:test'
import assert from 'node:assert/strict'
import { loadParentEvidence } from './parent-evidence.js'

const path = { topicId: 'topic-1', subject: { name: 'Mathematics' } }
const report = { student_id: 'child-1', topic: { id: 'topic-1', name: 'Shapes' }, latest_test_score: 0, missions_completed: 2, missions_total: 3, learning_events: 5 }
test('parent evidence scopes the existing endpoint to the child and topic and preserves zero scores', async () => {
  const requests = []
  const result = await loadParentEvidence({ studentId: 'child-1', subject: 'maths', resolveTopic: async () => path, request: async url => { requests.push(url); return report } })
  assert.deepEqual(requests, ['/parent/evidence?student_id=child-1&topic_id=topic-1'])
  assert.equal(result.latest_test_score, 0)
  assert.equal(result.missions_completed, 2)
  assert.equal(result.subject, 'Mathematics')
})
test('parent evidence rejects another child or topic and missing child never sends a request', async () => {
  for (const mismatch of [{ ...report, student_id: 'other' }, { ...report, topic: { id: 'other' } }]) {
    await assert.rejects(loadParentEvidence({ studentId: 'child-1', subject: 'maths', resolveTopic: async () => path, request: async () => mismatch }), /does not match/)
  }
  await assert.rejects(loadParentEvidence({ request: () => assert.fail('must not request'), resolveTopic: () => assert.fail('must not resolve') }), /Choose a child/)
})
