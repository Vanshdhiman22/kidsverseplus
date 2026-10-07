import fractions from './fractions-equal-parts.json' with { type: 'json' }
import additionStudio from './packages/addition-introduction.json' with { type: 'json' }
import { normalizeContentPackage } from './normalize.js'
import { subjectDemoRaw } from './subject-demos.js'

export const DEFAULT_CONTENT_ID = 'addition-introduction'
const addition = normalizeContentPackage(additionStudio, DEFAULT_CONTENT_ID, fractions)
const packages = { 'fractions-equal-parts': fractions, [DEFAULT_CONTENT_ID]: addition }
for (const subject of ['literacy', 'evs', 'computer', 'general']) {
  packages[`demo-${subject}`] = normalizeContentPackage(subjectDemoRaw(subject), `demo-${subject}`, addition)
}

export function getContent(id) {
  const pkg = packages[id]
  if (!pkg) throw Error(`no bundled learning package "${id}"`)
  return pkg
}
