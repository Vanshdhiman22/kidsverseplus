export async function loadParentEvidence({ request, resolveTopic, studentId, subject }) {
  if (!studentId) throw new Error('Choose a child first.')
  const path = await resolveTopic(studentId, subject)
  const query = new URLSearchParams({ student_id: studentId, topic_id: path.topicId })
  const report = await request(`/parent/evidence?${query}`)
  if (report?.student_id !== studentId || report?.topic?.id !== path.topicId) {
    throw new Error('The learning summary does not match this child and topic. Please retry.')
  }
  return { ...report, subject: path.subject.name }
}
