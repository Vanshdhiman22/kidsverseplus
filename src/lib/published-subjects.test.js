import test from 'node:test'
import assert from 'node:assert/strict'
import { publishedSubjects } from './published-subjects.js'

const subjects = [
  { id: 'math', slug: 'mathematics', name: 'Mathematics' },
  { id: 'english', slug: 'english', name: 'English' },
  { id: 'science', slug: 'science', name: 'Science' },
]
const path = { curriculum: { grade: 'Grade 1', board: 'CBSE' }, subjects: subjects.map(s => ({ id: s.id, topics: [{ name: `${s.id} topic` }] })) }
const maths = { is_published: true, grade: '1', board: 'CBSE', subject_name: 'Mathematics', topic_name: 'math topic', learn_steps_count: 3, question_count: 12 }

test('only subjects with published content in this child curriculum are offered', () => {
  assert.deepEqual(publishedSubjects(subjects, path, [maths]), [subjects[0]])
  for (const change of [{ is_published: false }, { grade: '2' }, { board: 'ICSE' }, { topic_name: 'Another topic' }, { learn_steps_count: 0, question_count: 0 }]) {
    assert.deepEqual(publishedSubjects(subjects, path, [{ ...maths, ...change }]), [])
  }
  assert.deepEqual(publishedSubjects(subjects, path, []), [])
  assert.deepEqual(publishedSubjects(subjects, null, [maths]), [])
})

test('publishing another matching subject makes it available without a hardcoded Maths restriction', () => {
  const english = { ...maths, subject_name: 'Literacy', topic_name: 'english topic' }
  assert.deepEqual(publishedSubjects(subjects, path, [maths, english]), subjects.slice(0, 2))
  assert.deepEqual(publishedSubjects(subjects, { ...path, subjects: path.subjects.slice(1) }, [maths, english]), [subjects[1]])
})

test('zero progress and a locked curriculum topic do not hide existing published lessons', () => {
  const available = [{ ...subjects[0], progress_percent: 0 }]
  const lockedPath = { ...path, subjects: [{ id: 'math', topics: [{ name: 'math topic', status: 'locked' }] }] }
  assert.deepEqual(publishedSubjects(available, lockedPath, [maths]), available)
})
