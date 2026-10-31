import test from 'node:test'
import assert from 'node:assert/strict'
import { loadPublishedSubjects } from './published-subject-loader.js'

const subject = { id: 'math', slug: 'mathematics', name: 'Mathematics' }
const path = { student_id: 'child', curriculum: { grade: '1', board: 'CBSE' }, subjects: [{ id: 'math', topics: [{ name: 'Shapes' }] }] }
const catalog = { packages: [{ is_published: true, grade: 'Grade 1', board: 'CBSE', subject_name: 'Mathematics', topic_name: 'Shapes', learn_steps_count: 3 }] }

test('subject, path and published-content reads all start before any one finishes', async () => {
  const pending = {}, calls = []
  const loader = key => () => { calls.push(key); return new Promise(resolve => { pending[key] = resolve }) }
  const result = loadPublishedSubjects({ studentId: 'child', live: true,
    loadSubjects: loader('subjects'), loadPath: loader('path'), loadCatalog: loader('catalog') })
  assert.deepEqual(calls, ['subjects', 'path', 'catalog'])
  pending.path(path); pending.catalog(catalog); pending.subjects({ subjects: [subject] })
  assert.deepEqual(await result, [subject])
})

test('wrong-child responses and network errors cannot turn into published choices', async () => {
  const options = { studentId: 'child', live: true, loadSubjects: async () => ({ subjects: [subject] }),
    loadPath: async () => ({ ...path, student_id: 'other-child' }), loadCatalog: async () => catalog }
  await assert.rejects(loadPublishedSubjects(options), /does not match/)
  await assert.rejects(loadPublishedSubjects({ ...options, loadPath: async () => path, loadCatalog: async () => { throw Error('offline') } }), /offline/)
})

test('mock calls do not request live catalog or curriculum data', async () => {
  assert.deepEqual(await loadPublishedSubjects({ live: false, loadSubjects: async () => ({ subjects: [subject] }),
    loadPath: () => assert.fail('no path read'), loadCatalog: () => assert.fail('no live catalog read') }), [subject])
})
