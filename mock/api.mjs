import { randomInt, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto'
import { INTERESTS, GOALS, FACES, OUTFITS } from '../src/data/catalog.js'
import { createGameplay } from './gameplay.mjs'

// Local test double, not the production database. Restarting Vite clears it.
const uuid = (group, n) => `00000000-0000-4000-8000-${String(group * 1000 + n).padStart(12, '0')}`
const goalKeys = ['master_school_topics', 'build_confidence', 'prepare_competitions', 'read_fluently', 'explore_beyond_class']
export const catalogs = {
  interests: INTERESTS.map((v, i) => ({ id: uuid(1, i), key: v.id, name: v.name, thumbnail_url: v.img, order_index: i, is_active: true })),
  goals: GOALS.map((v, i) => ({ id: uuid(2, i), key: goalKeys[i], name: v.title, tagline: v.tag, icon_asset: v.icon, order_index: i, is_active: true })),
  characters: FACES.map((v, i) => ({ id: uuid(3, i), name: `Explorer ${v.id}`, slug: `explorer-${v.id}`, base_image_url: v.thumb, order_index: i })),
  items: OUTFITS.map((v, i) => ({ id: uuid(4, i), name: v.name, slug: v.id, category: 'outfit', description: v.blurb, thumbnail_url: v.thumb, render_asset_url: v.thumb, unlock_type: 'free', is_default: i === 0, order_index: i })),
}
const now = () => new Date().toISOString()
const steps = ['child', 'grade_board', 'avatar', 'interests', 'goals', 'lobby', 'nova']
const fail = (status, detail) => { throw Object.assign(new Error(detail), { status }) }

export function createMockApi() {
  const parents = new Map(), tokens = new Map(), students = new Map(), verifications = new Map()
  const gameplay = createGameplay(students)
  return async function handle(method, pathname, body = {}, token) {
    const path = pathname.split('?')[0].replace(/^\/api\/v1/, '')
    const result = (data, status = 200) => ({ status, data })
    try {
      if (method === 'POST' && path === '/__bootstrap') {
        const parent = { id: randomUUID(), email: 'dummy@kidsverse.local', full_name: 'Local tester', phone: '+919999999999', phone_verified_at: now(), created_at: now() }
        const access = `dummy-${randomUUID()}`
        const student = { id: body.student_id || randomUUID(), parent_id: parent.id, name: String(body.name || 'Demo Explorer'), grade: String(body.grade || '1'), board: String(body.board || 'CBSE'), face: Number(body.face) || 1,
          avatar: null, onboarding_completed_at: now(), onboarding_completed: true, created_at: now(), completed_steps: [...steps], interest_ids: [], goal_ids: [] }
        tokens.set(access, parent)
        students.set(student.id, student)
        return result({ token: access, parent, students: [student], source: 'local-dummy' }, 201)
      }
      if (method === 'GET') {
        if (path === '/health') return result({ status: 'ok', source: 'mock', persistence: 'memory; resets on server restart' })
        if (path === '/health/database') return result({ status: 'not_tested', database: 'not-used', source: 'mock' })
        const key = { '/interests': 'interests', '/goals': 'goals', '/avatar/characters': 'characters', '/avatar/items': 'items' }[path]
        if (key) return result({ [key]: catalogs[key] })
        if (path === '/challenges') return gameplay(method, path, body, {})
      }
      if (method === 'POST' && ['/auth/parent/signup', '/auth/parent/login'].includes(path)) {
        const email = String(body.email || '').trim().toLowerCase()
        if (!/^\S+@\S+\.\S+$/.test(email) || typeof body.password !== 'string' || body.password.length < 6) fail(400, 'Valid email and password of at least 6 characters required.')
        let entry = parents.get(email)
        if (path.endsWith('signup')) {
          if (entry) fail(400, 'Email already exists')
          const salt = randomUUID()
          entry = { parent: { id: randomUUID(), email, full_name: body.full_name || '', phone: body.phone || '', created_at: now(), last_login_at: null }, salt, hash: scryptSync(body.password, salt, 32) }
          parents.set(email, entry)
        } else {
          if (!entry || !timingSafeEqual(entry.hash, scryptSync(body.password, entry.salt, 32))) fail(401, 'Invalid email or password')
          entry.parent.last_login_at = now()
        }
        const access = `mock-${randomUUID()}`
        tokens.set(access, entry.parent)
        return result({ parent: entry.parent, token: access }, path.endsWith('signup') ? 201 : 200)
      }
      const parent = tokens.get(token)
      if (!parent) fail(401, 'Sign in first. Mock sessions expire when the local server restarts.')
      const gameResponse = gameplay(method, path, body, parent)
      if (gameResponse) return gameResponse
      if (path === '/auth/parent/logout' && method === 'POST') { tokens.delete(token); return result(null, 204) }
      if (path === '/parent/me' && method === 'GET') return result(parent)
      if (path === '/parent/verification/start' && method === 'POST') {
        const name = String(body.full_name || '').trim()
        const phone = String(body.phone || '')
        const relationship = String(body.relationship || '')
        const student = students.get(body.student_id)
        if (!student || student.parent_id !== parent.id) fail(404, 'Child not found in this parent account.')
        if (name.length < 2 || !/^\+91[6-9]\d{9}$/.test(phone) || !['parent', 'guardian'].includes(relationship)) fail(400, 'Valid parent name, relationship and Indian mobile number are required.')
        const existing = [...verifications.values()].find(entry => entry.parentId === parent.id && entry.phone === phone && !entry.used && Date.now() - entry.createdAt < 30000)
        if (existing) fail(429, 'Please wait 30 seconds before requesting another code.')
        const challengeId = randomUUID(), code = String(randomInt(0, 1000000)).padStart(6, '0')
        verifications.set(challengeId, { parentId: parent.id, studentId: student.id, name, relationship, phone, code, createdAt: Date.now(), attempts: 0, used: false })
        return result({ challenge_id: challengeId, expires_in_seconds: 300, dev_code: code, delivery: 'local_mock_only' }, 201)
      }
      if (path === '/parent/verification/verify' && method === 'POST') {
        const challenge = verifications.get(body.challenge_id)
        if (!challenge || challenge.parentId !== parent.id || challenge.used) fail(400, 'Verification request is invalid. Request a new code.')
        if (Date.now() - challenge.createdAt > 300000) fail(410, 'Code expired. Request a new one.')
        if (challenge.attempts >= 5) fail(429, 'Too many attempts. Request a new code.')
        challenge.attempts += 1
        if (String(body.code || '') !== challenge.code) fail(400, 'Incorrect code. Please try again.')
        challenge.used = true
        Object.assign(parent, { full_name: challenge.name, relationship: challenge.relationship, phone: challenge.phone, phone_verified_at: now() })
        return result({ phone_verified: true, phone: challenge.phone, parent_id: parent.id, verified_at: parent.phone_verified_at })
      }
      if (path === '/parent/students' && method === 'GET') return result({ students: [...students.values()].filter(s => s.parent_id === parent.id).map(s => ({ ...s, onboarding_completed: !!s.onboarding_completed_at })) })
      if (path === '/students' && method === 'POST') {
        if (typeof body.name !== 'string' || body.name.trim().length < 2) fail(400, 'Child name must contain at least two characters.')
        const student = { id: randomUUID(), parent_id: parent.id, name: body.name.trim(), grade: '', board: '', avatar: null, onboarding_completed_at: null, created_at: now(), completed_steps: ['child'], interest_ids: [], goal_ids: [] }
        students.set(student.id, student)
        return result(student, 201)
      }
      const match = path.match(/^\/students\/([^/]+)\/(.+)$/)
      if (!match) fail(404, 'Mock route not implemented; no simulated success returned.')
      const student = students.get(match[1]), action = match[2]
      if (!student || student.parent_id !== parent.id) fail(404, 'Student not found')
      const complete = key => { if (!student.completed_steps.includes(key)) student.completed_steps.push(key) }
      const selectIds = (field, catalog) => {
        const ids = body[field]
        if (!Array.isArray(ids) || ids.some(id => !catalog.some(v => v.id === id)) || new Set(ids).size !== ids.length) fail(400, `${field} must contain unique catalog UUIDs.`)
        student[field] = [...ids]
      }
      if (method === 'PATCH' && action === 'grade-board') {
        if (!parent.phone_verified_at) fail(403, 'Verify the parent phone before continuing child onboarding.')
        if (!body.grade || !body.board) fail(400, 'grade and board are required')
        Object.assign(student, { grade: String(body.grade), board: body.board }); complete('grade_board'); return result(student)
      }
      if (method === 'PUT' && action === 'avatar') {
        const character = catalogs.characters.find(c => c.id === body.character_id)
        if (!character) fail(400, 'Unknown character_id')
        if (body.outfit_item_id && !catalogs.items.some(i => i.id === body.outfit_item_id)) fail(400, 'Unknown outfit_item_id')
        student.avatar = { character_id: character.id, thumbnail_url: character.base_image_url, outfit_item_id: body.outfit_item_id || null }
        complete('avatar'); return result({ ...student.avatar, hair_item_id: null, accessory_item_id: null, updated_at: now() })
      }
      if (method === 'PUT' && action === 'interests') { selectIds('interest_ids', catalogs.interests); complete('interests'); return result({ selected_count: student.interest_ids.length, interest_ids: student.interest_ids }) }
      if (method === 'PUT' && action === 'goals') { selectIds('goal_ids', catalogs.goals); complete('goals'); return result({ goal_ids: student.goal_ids }) }
      if (method === 'GET' && action === 'onboarding/status') return result({ completed_steps: student.completed_steps, next_step: steps.find(s => !student.completed_steps.includes(s)) || null, is_complete: !!student.onboarding_completed_at })
      const step = action.match(/^onboarding\/steps\/([^/]+)\/complete$/)
      if (method === 'POST' && step) { if (!steps.includes(step[1])) fail(400, 'Unknown step'); complete(step[1]); return result({ step_key: step[1], completed_at: now() }) }
      if (method === 'POST' && action === 'nova/greet') {
        if (steps.slice(0, 5).some(s => !student.completed_steps.includes(s))) fail(400, 'Complete the earlier onboarding screens first.')
        complete('nova'); student.onboarding_completed_at = now()
        return result({ message: `Hey ${student.name}! I'm Nova, your AI learning companion!`, onboarding_completed_at: student.onboarding_completed_at })
      }
      if (method === 'GET' && action === 'home') return result({ greeting: `Ready for today's adventure, ${student.name}?`, stats: { day_streak: 0, total_xp: 0, level: 1 }, recommended_mission: null, subjects: [] })
      if (method === 'GET' && action === 'profile') return result({ name: student.name, grade: student.grade, board: student.board, avatar_thumbnail_url: student.avatar?.thumbnail_url, level: 1, total_xp: 0, day_streak: 0 })
      fail(404, 'Mock route not implemented; no simulated success returned.')
    } catch (error) { return result({ detail: error.message }, error.status || 500) }
  }
}

export function mockApiPlugin(base = '/api/v1') {
  const handle = createMockApi()
  return { name: 'kidsverse-local-mock', configureServer(server) {
    server.middlewares.use(base, async (req, res) => {
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('X-Kidsverse-Source', 'local-mock')
      try {
        let raw = ''
        for await (const chunk of req) { raw += chunk; if (raw.length > 65536) { res.statusCode = 413; res.end(JSON.stringify({ detail: 'Body too large' })); return } }
        const scenario = req.headers['x-mock-scenario']
        if (scenario === 'slow') await new Promise(resolve => setTimeout(resolve, 1600))
        const response = ['401', '500'].includes(scenario)
          ? { status: Number(scenario), data: { detail: `Simulated ${scenario}; request not saved.` } }
          : await handle(req.method, req.url, raw ? JSON.parse(raw) : {}, req.headers.authorization?.replace(/^Bearer /, ''))
        res.statusCode = response.status
        res.end(response.status === 204 ? undefined : JSON.stringify(response.data))
      } catch { res.statusCode = 400; res.end(JSON.stringify({ detail: 'Invalid JSON request' })) }
    })
  } }
}
