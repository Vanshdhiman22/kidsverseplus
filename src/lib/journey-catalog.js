import { subjectKey } from './live-data.js'

// The learner's own learning path already scopes subjects and topic IDs to
// their curriculum. An admin package listing is not needed to open a topic.
export async function loadJourneySubjects({ studentId, readPath }) {
  const path = await readPath(studentId)
  if (!studentId || path?.student_id !== studentId) throw new Error('The learning path does not match this child.')
  if (!Array.isArray(path.subjects)) throw new Error('The service did not return this child’s subjects. Please try again.')
  const subjects = path.subjects.filter(subject => subject.is_active !== false)
  if (subjects.some(subject => !subject.id || !subject.name || !Array.isArray(subject.topics))) throw new Error('The service did not return the curriculum topics. Please try again.')
  return subjects
}

export function journeyFromSubjects(subjects, subject) {
  if (!Array.isArray(subjects)) return null
  const selected = subjects.find(item => subjectKey(item.slug || item.name) === subjectKey(subject))
  if (!selected) return null
  if (!Array.isArray(selected.topics)) return null
  const ids = new Set()
  const worlds = selected.topics.filter(topic => {
    if (!topic.id || topic.is_active === false || topic.is_published === false || ids.has(topic.id)) return false
    ids.add(topic.id)
    return true
  }).map(topic => ({ topic_id: topic.id, topic_name: topic.name, status: topic.status, progress_verified: false }))
  return { subject: selected.name, worlds }
}
