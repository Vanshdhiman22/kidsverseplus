import { subjectKey } from './live-data.js'

// Route/artwork aliases (for example literacy) need not be backend slugs (english).
export function journeySubjectQuery(subject, liveSubjects = []) {
  return liveSubjects.find(item => subjectKey(item.slug || item.name) === subjectKey(subject))?.slug || subject
}

// Journey can preview the product's other worlds without inventing API records.
// Only published live subjects are allowed to start the existing Journey read.
export function journeySubjectChoices(liveSubjects = [], catalog = []) {
  const keys = new Set()
  const choices = []
  for (const subject of liveSubjects) {
    const key = subjectKey(subject.slug || subject.name)
    if (!key || keys.has(key)) continue
    keys.add(key)
    choices.push({ key, name: subject.name, previewOnly: false })
  }
  for (const subject of catalog) {
    const key = subjectKey(subject.id)
    if (!key || keys.has(key)) continue
    keys.add(key)
    choices.push({ key, name: subject.name, previewOnly: true })
  }
  return choices
}
