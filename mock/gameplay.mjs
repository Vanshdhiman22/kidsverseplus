import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { normalizeContentPackage } from '../src/content/normalize.js'
import { subjectDemoRaw } from '../src/content/subject-demos.js'

const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))
const base = read('../src/content/fractions-equal-parts.json')
const addition = normalizeContentPackage(read('../src/content/packages/addition-introduction.json'), 'addition-introduction', base)
const id = (group, i) => `11111111-1111-4111-8111-${String(group * 1000 + i).padStart(12, '0')}`
export const worlds = ['maths', 'literacy', 'evs', 'computer', 'general'].map((slug, i) => {
  const pkg = slug === 'maths' ? addition : normalizeContentPackage(subjectDemoRaw(slug), `demo-${slug}`, addition)
  return { id: id(1, i), slug, name: pkg.subject, topicId: id(2, i), missionId: id(3, i), testId: id(4, i), challengeId: id(5, i), pkg,
    questions: pkg.assessments.test_questions.map((q, n) => ({ ...q, id: id(10 + i, n), order_index: n + 1 })) }
})
export const opponents = ['robo', 'astro', 'byte'].map((slug, i) => ({ id: id(6, i), name: ['Robo Rex', 'Astro Ace', 'Byte Buddy'][i], slug, difficulty: ['easy', 'medium', 'hard'][i] }))
const now = () => new Date().toISOString()
const requireValue = (value, message) => { if (!value) throw Object.assign(new Error(message), { status: 400 }); return value }
const missing = () => { throw Object.assign(new Error('Resource not found'), { status: 404 }) }

export function createGameplay(students) {
  const missions = new Map(), attempts = new Map(), battles = new Map()
  const stats = s => ({ day_streak: s.xp ? 1 : 0, total_xp: s.xp || 0, level: 1 + Math.floor((s.xp || 0) / 1000) })
  const owner = (studentId, parent) => { const s = students.get(studentId); if (!s || s.parent_id !== parent.id) missing(); return s }
  const subject = (w, s) => ({ id: w.id, subject_id: w.id, slug: w.slug, name: w.name, icon_asset: '', progress_percent: missions.get(`${s.id}:${w.missionId}`)?.status === 'completed' ? 100 : 0, locked: false, badge: null })
  const test = w => ({ id: w.testId, name: `${w.pkg.mission.title} Test`, slug: w.slug, intro_text: 'Local mock assessment', question_count: w.questions.length, estimated_minutes: 8 })
  const question = q => ({ id: q.id, question_text: q.instruction, question_type: 'mcq', options: q.options, order_index: q.order_index })
  return function gameplay(method, path, body, parent) {
    const ok = (data, status = 200) => ({ status, data })
    if (method === 'GET' && path === '/challenges') return ok({ challenges: worlds.map(w => ({ id: w.challengeId, name: `${w.name} Duel`, slug: w.slug, description: 'Local mock battle', topic: w.pkg.mission.title })) })
    if (method === 'GET' && path === '/parent/overview') return ok({ students: [...students.values()].filter(s => s.parent_id === parent.id).map(s => ({ student_id: s.id, name: s.name, ...stats(s), subjects: worlds.map(w => ({ subject: w.name, progress_percent: subject(w, s).progress_percent })), recent_test_score: [...attempts.values()].filter(a => a.studentId === s.id && a.result).at(-1)?.result.score || 0 })) })
    let m = path.match(/^\/students\/([^/]+)\/(.+)$/)
    if (m) {
      const s = owner(m[1], parent), action = m[2]
      if (method === 'GET' && action === 'home') return ok({ greeting: `Ready for today's adventure, ${s.name}?`, stats: stats(s), recommended_mission: { mission_id: worlds[0].missionId, title: worlds[0].pkg.mission.title, subject: worlds[0].name, topic: worlds[0].pkg.mission.title, xp_reward: worlds[0].pkg.mission.xp, duration_minutes: 8, progress_percent: subject(worlds[0], s).progress_percent }, subjects: worlds.map(w => subject(w, s)) })
      if (method === 'GET' && action === 'subjects') return ok({ subjects: worlds.map(w => subject(w, s)) })
      if (method === 'GET' && action === 'profile') return ok({ name: s.name, grade: s.grade, board: s.board, avatar_thumbnail_url: s.avatar?.thumbnail_url, ...stats(s) })
      if (method === 'GET' && action === 'profile/cards') return ok({ cards: [] })
      if (method === 'GET' && action === 'profile/our-journey') return ok({ subjects_progress: worlds.map(w => ({ subject: w.name, progress_percent: subject(w, s).progress_percent })), milestones_completed: 0, total_milestones: 0 })
      let actionMatch = action.match(/^topics\/([^/]+)$/)
      if (method === 'GET' && actionMatch) {
        const w = worlds.find(w => w.topicId === actionMatch[1]); if (!w) missing()
        return ok({ id: w.topicId, name: w.pkg.mission.title, grade_level: s.grade, subject: w.name, description: 'Local mock content', tiers: [], nodes: [{ mission_id: w.missionId, name: w.pkg.mission.title, order_index: 1, status: missions.get(`${s.id}:${w.missionId}`)?.status || 'unlocked', stars: 0 }] })
      }
      actionMatch = action.match(/^missions\/([^/]+)\/(start|complete)$/)
      if (method === 'POST' && actionMatch) {
        const w = worlds.find(w => w.missionId === actionMatch[1]); if (!w) missing()
        const key = `${s.id}:${w.missionId}`, old = missions.get(key)
        if (actionMatch[2] === 'start') { const value = old || { status: 'in_progress', started_at: now() }; missions.set(key, value); return ok(value) }
        requireValue(old, 'Start the mission first')
        if (old.status === 'completed') return ok(old)
        const score = Number(body.score); requireValue(Number.isFinite(score) && score >= 0 && score <= 100, 'score must be 0–100')
        const result = { status: 'completed', stars: score >= 80 ? 3 : score >= 50 ? 2 : 1, xp_awarded: w.pkg.mission.xp, completed_at: now(), next_mission_id: null, topic_progress_percent: 100 }
        missions.set(key, result); s.xp = (s.xp || 0) + result.xp_awarded; return ok(result)
      }
      actionMatch = action.match(/^tests\/([^/]+)\/attempts$/)
      if (method === 'POST' && actionMatch) {
        const w = worlds.find(w => w.testId === actionMatch[1]); if (!w) missing()
        const attemptId = randomUUID(), started_at = now()
        attempts.set(attemptId, { studentId: s.id, world: w, answers: new Map(), started_at })
        return ok({ attempt_id: attemptId, status: 'in_progress', started_at, first_question: question(w.questions[0]) }, 201)
      }
      if (method === 'POST' && action === 'challenge-battles') {
        requireValue(worlds.some(w => w.challengeId === body.challenge_id) && opponents.some(o => o.id === body.opponent_id), 'Valid challenge_id and opponent_id required')
        const battle_id = randomUUID(), started_at = now()
        battles.set(battle_id, { studentId: s.id, status: 'in_progress', started_at })
        return ok({ battle_id, status: 'in_progress', started_at }, 201)
      }
    }
    m = path.match(/^\/subjects\/([^/]+)\/topics$/)
    if (method === 'GET' && m) { const w = worlds.find(w => w.id === m[1]); if (!w) missing(); return ok({ topics: [{ id: w.topicId, name: w.pkg.mission.title, slug: w.slug, grade_level: '4', order_index: 1, student_status: 'current', world_name: w.name }] }) }
    m = path.match(/^\/missions\/([^/]+)$/)
    if (method === 'GET' && m) { const w = worlds.find(w => w.missionId === m[1]); if (!w) missing(); return ok({ id: w.missionId, topic_id: w.topicId, tier_key: 'school', name: w.pkg.mission.title, xp_reward: w.pkg.mission.xp, content: w.pkg }) }
    m = path.match(/^\/topics\/([^/]+)\/tests$/)
    if (method === 'GET' && m) { const w = worlds.find(w => w.topicId === m[1]); if (!w) missing(); return ok({ tests: [test(w)] }) }
    m = path.match(/^\/tests\/([^/]+)$/)
    if (method === 'GET' && m) { const w = worlds.find(w => w.testId === m[1]); if (!w) missing(); return ok(test(w)) }
    m = path.match(/^\/tests\/attempts\/([^/]+)\/(.+)$/)
    if (m) {
      const attempt = attempts.get(m[1]); if (!attempt) missing()
      const s = owner(attempt.studentId, parent), action = m[2], questions = attempt.world.questions
      if (method === 'GET' && action.startsWith('questions/')) { const q = questions.find(q => q.order_index === Number(action.split('/')[1])); if (!q) missing(); return ok(question(q)) }
      if (method === 'POST' && action === 'answers') {
        requireValue(!attempt.result, 'Attempt already completed')
        const q = questions.find(q => q.id === body.question_id); requireValue(q, 'Question does not belong to this attempt')
        requireValue(q.options.some(o => o.key === body.selected_answer), 'Unknown selected_answer')
        const is_correct = q.answer === body.selected_answer
        attempt.answers.set(q.id, is_correct)
        return ok({ is_correct, next_question_id: questions[q.order_index]?.id || null })
      }
      if (method === 'POST' && action === 'complete') {
        if (!attempt.result) {
          const correct_count = [...attempt.answers.values()].filter(Boolean).length, score = correct_count / questions.length * 100
          attempt.result = { status: 'completed', score, correct_count, total_questions: questions.length, completed_at: now() }
          s.xp = (s.xp || 0) + Math.floor(score * .5)
        }
        return ok(attempt.result)
      }
      if (method === 'GET' && action === 'result') { requireValue(attempt.result, 'Complete the attempt first'); return ok({ ...attempt.result, xp_awarded: Math.floor(attempt.result.score * .5), extra_learning: [] }) }
    }
    m = path.match(/^\/challenges\/([^/]+)\/(opponents|preview)$/)
    if (method === 'GET' && m) { const w = worlds.find(w => w.challengeId === m[1]); if (!w) missing(); return ok(m[2] === 'opponents' ? { opponents } : { challenge: w.name, opponent: opponents[0], rules: 'Score at least 50% to win.', xp_reward: 50 }) }
    m = path.match(/^\/challenge-battles\/([^/]+)\/(complete|result)$/)
    if (m) {
      const battle = battles.get(m[1]); if (!battle) missing()
      const s = owner(battle.studentId, parent)
      if (method === 'POST' && m[2] === 'complete') {
        if (battle.status !== 'completed') {
          const score = Number(body.score); requireValue(Number.isFinite(score) && score >= 0 && score <= 100, 'score must be 0–100')
          Object.assign(battle, { status: 'completed', result: score >= 50 ? 'win' : 'loss', score, xp_awarded: score >= 50 ? 50 : 10, completed_at: now() })
          s.xp = (s.xp || 0) + battle.xp_awarded
        }
        return ok(battle)
      }
      if (method === 'GET' && m[2] === 'result') return ok(battle)
    }
    return null
  }
}
