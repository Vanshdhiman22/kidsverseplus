import { subjectKey } from './live-data.js'

const gradeKey = value => String(value ?? '').replace(/^grade\s*/i, '').trim()
const textKey = value => String(value ?? '').trim().toLowerCase()

// A curriculum subject becomes a learner choice only after matching content is published.
export function publishedSubjects(subjects, path, packages) {
  const curriculum = path?.curriculum
  if (!curriculum?.grade || !curriculum.board) return []
  return subjects.filter(subject => {
    const assigned = path.subjects?.find(item => item.id === (subject.id || subject.subject_id))
    return assigned?.topics?.some(topic => packages.some(item => item.is_published === true
      && (Number(item.learn_steps_count) > 0 || Number(item.question_count) > 0)
      && gradeKey(item.grade) === gradeKey(curriculum.grade)
      && textKey(item.board) === textKey(curriculum.board)
      && subjectKey(item.subject_name) === subjectKey(subject.slug || subject.name)
      && textKey(item.topic_name) === textKey(topic.name)))
  })
}
