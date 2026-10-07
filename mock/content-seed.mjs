import {readFileSync} from 'node:fs'
import {battleFixtures} from './battle-fixtures.mjs'
import {normalizeContentPackage} from '../src/content/normalize.js'
import {subjectDemoRaw} from '../src/content/subject-demos.js'
const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))
const base = read('../src/content/fractions-equal-parts.json')
const addition = normalizeContentPackage(read('../src/content/packages/addition-introduction.json'), 'addition-introduction', base)
const id = (group, i) => `11111111-1111-4111-8111-${String(group * 1000 + i).padStart(12, '0')}`
export const seedWorlds = ['maths', 'literacy', 'evs', 'computer', 'general'].map((slug, i) => {
  const pkg = slug === 'maths' ? addition : normalizeContentPackage(subjectDemoRaw(slug), `demo-${slug}`, addition)
  return { id: id(1, i), slug, name: pkg.subject, topicId: id(2, i), missionId: id(3, i), testId: id(4, i), challengeId: id(5, i), pkg,
    battleQuestions: (pkg.assessments.battle_questions.length?pkg.assessments.battle_questions:battleFixtures[slug]).map((q,n)=>({...q,answer:`option_${q.options.findIndex(o=>o.key===q.answer)+1}`,options:q.options.map((o,j)=>({...o,key:`option_${j+1}`})),id:id(20+i,n),order_index:n+1})),
    questions: pkg.assessments.test_questions.map((q, n) => ({ ...q, id: id(10 + i, n), order_index: n + 1 })) }
})
export const opponents = ['robo', 'astro', 'byte'].map((slug, i) => ({ id: id(6, i), name: ['Robo Rex', 'Astro Ace', 'Byte Buddy'][i], slug, difficulty: ['easy', 'medium', 'hard'][i] }))
