import { publishedSubjects } from './published-subjects.js'

export async function loadPublishedSubjects({ studentId, live, loadSubjects, loadPath, loadCatalog }) {
  if (!live) return (await loadSubjects()).subjects || []
  const [subjects, path, catalog] = await Promise.all([loadSubjects(), loadPath(), loadCatalog()])
  if (path.student_id !== studentId) throw new Error('The learning path does not match this child.')
  return publishedSubjects(subjects.subjects || [], path, catalog.packages || [])
}
