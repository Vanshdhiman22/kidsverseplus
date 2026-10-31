import { subjectKey } from './live-data.js'

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
