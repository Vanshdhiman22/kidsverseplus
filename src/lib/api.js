const BASE_URL = (import.meta.env?.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api/v1').replace(/\/$/, '')
const TOKEN_KEY = 'kidsverse-parent-token'

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY) ?? '' } catch { return '' }
}

export const setToken = token => {
  try { token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY) } catch {}
}

const messageFrom = body => body?.error?.message || body?.detail ||
  (body && typeof body === 'object' ? Object.values(body).flat().find(v => typeof v === 'string') : '') ||
  'The server could not complete this request.'

export async function request(path, { method = 'GET', body, token = getToken(), signal } = {}) {
  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      signal,
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (error) {
    throw new ApiError('Cannot reach the Kidsverse server. Check VITE_API_BASE_URL and make sure the backend is running.', 0, error)
  }
  const payload = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) throw new ApiError(messageFrom(payload), response.status, payload)
  return payload
}

const auth = async (path, email, password) => {
  const data = await request(path, { method: 'POST', token: '', body: { email: email.trim().toLowerCase(), password } })
  setToken(data.token)
  return data
}

export const backend = {
  signup: (email, password) => auth('/auth/parent/signup', email, password),
  login: (email, password) => auth('/auth/parent/login', email, password),
  students: () => request('/parent/students'),
  createStudent: name => request('/students', { method: 'POST', body: { name } }),
  saveGradeBoard: (studentId, grade, board) => request(`/students/${studentId}/grade-board`, { method: 'PATCH', body: { grade, board } }),
  avatarCharacters: () => request('/avatar/characters'),
  avatarItems: category => request(`/avatar/items${category ? `?category=${encodeURIComponent(category)}` : ''}`),
  saveAvatar: (studentId, body) => request(`/students/${studentId}/avatar`, { method: 'PUT', body }),
  interests: () => request('/interests'),
  saveInterests: (studentId, interestIds) => request(`/students/${studentId}/interests`, { method: 'PUT', body: { interest_ids: interestIds } }),
  goals: () => request('/goals'),
  saveGoals: (studentId, goalIds) => request(`/students/${studentId}/goals`, { method: 'PUT', body: { goal_ids: goalIds } }),
  greetNova: studentId => request(`/students/${studentId}/nova/greet`, { method: 'POST' }),
  onboardingStatus: studentId => request(`/students/${studentId}/onboarding/status`),
}

export const onboardingRoute = step => ({
  child: '/onboarding/child', grade_board: '/onboarding/grade-board', avatar: '/onboarding/avatar',
  interests: '/onboarding/interests', goals: '/onboarding/goals', lobby: '/onboarding/nova', nova: '/onboarding/nova',
}[step] ?? '/home')

const GOAL_KEYS = {
  school: 'master_school_topics', confidence: 'build_confidence', competition: 'prepare_competitions',
  reading: 'read_more_fluently', explore: 'explore_beyond_class', nova: 'not_sure_yet',
}

export async function saveAvatarChoice(studentId, face, outfit) {
  const [{ characters = [] }, { items = [] }] = await Promise.all([backend.avatarCharacters(), backend.avatarItems('outfit')])
  const character = characters[Number(face) - 1]
  if (!character) throw new ApiError('That character is not available in the backend catalog yet.', 400)
  const normalized = outfit === 'explorer' ? 'explorers-jacket' : outfit
  const item = items.find(i => i.slug === normalized) ?? items.find(i => i.is_default) ?? null
  return backend.saveAvatar(studentId, { character_id: character.id, outfit_item_id: item?.id ?? null })
}

export async function saveInterestKeys(studentId, keys) {
  const { interests = [] } = await backend.interests()
  const ids = keys.map(key => interests.find(i => i.key === key)?.id).filter(Boolean)
  if (ids.length !== keys.length) throw new ApiError('One or more selected interests are missing from the backend catalog. Run seed_data and try again.', 400)
  return backend.saveInterests(studentId, ids)
}

export async function saveGoalKeys(studentId, keys) {
  const { goals = [] } = await backend.goals()
  const ids = keys.map(key => goals.find(g => g.key === GOAL_KEYS[key])?.id).filter(Boolean)
  if (ids.length !== keys.length) throw new ApiError('One or more selected goals are missing from the backend catalog. Run seed_data and try again.', 400)
  return backend.saveGoals(studentId, ids)
}

export const apiBaseUrl = BASE_URL
