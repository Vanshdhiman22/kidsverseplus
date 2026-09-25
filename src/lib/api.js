import { isReviewMode } from './reviewMode.js'

/**
 * One place for all browser-to-API traffic.  The origin is public configuration,
 * while database details and JWT signing secrets stay exclusively on the server.
 */
const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL

export const API_BASE_URL = configuredBaseUrl?.replace(/\/$/, '') || ''
export const API_MODE = import.meta.env.VITE_API_MODE || 'live'
const SESSION_KEY = `kidsverse-session:${API_MODE}:${API_BASE_URL}`
const DUMMY_BASE_URL = '/__dummy/api/v1'
let dummyToken = ''
export const isDummyApiActive = () => import.meta.env.DEV && Boolean(dummyToken)
export const getToken = () => isDummyApiActive() ? dummyToken : sessionStorage.getItem(SESSION_KEY) || ''
export const setToken = token => token ? sessionStorage.setItem(SESSION_KEY, token) : sessionStorage.removeItem(SESSION_KEY)
export const requestLog = []
const catalogCache = new Map()
// Local developer escape hatch: seed the Vite mock with the currently selected
// child. It never writes to the live API or awards production XP.
export async function activateDummyApi(profile = {}, studentId) {
  if (!import.meta.env.DEV) throw new Error('Dummy API is available only in the local developer build.')
  const response = await fetch(`${DUMMY_BASE_URL}/__bootstrap`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ student_id: studentId || undefined, name: profile.name || 'Demo Explorer', grade: profile.grade || '1', board: profile.board || 'CBSE', face: profile.face || 1 }),
  })
  const data = await response.json()
  if (!response.ok || !data?.token) throw new ApiError(data?.detail || 'Could not start dummy API.', { status: response.status, data })
  dummyToken = data.token
  catalogCache.clear()
  window.dispatchEvent(new Event('kidsverse-dummy-api'))
  return data
}
const redact = value => Array.isArray(value) ? value.map(redact) : value && typeof value === 'object'
  ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k, /password|token|authorization|^code$|dev_code|otp/i.test(k) ? '[redacted]' : redact(v)])) : value

export class ApiError extends Error {
  constructor(message, { status, data } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

function parseBody(response) {
  if (response.status === 204) return null
  const contentType = response.headers.get('content-type') || ''
  return contentType.includes('application/json') ? response.json() : response.text()
}

/**
 * Makes an API request and throws a structured error for non-2xx responses.
 * Pass the JWT from authenticated app state; it is never baked into source code.
 */
export async function apiRequest(path, { method = 'GET', token = getToken(), body, signal } = {}) {
  // Shared live review links show the UI without ever contacting the production API.
  if (isReviewMode()) throw new ApiError('Review mode is UI-only. No live API request was sent.')
  if (!API_BASE_URL && !isDummyApiActive()) throw new ApiError('API is not configured. Set VITE_API_BASE_URL in .env.local.')

  if (API_MODE === 'mock' && API_BASE_URL !== '/api/v1' && !isDummyApiActive()) throw new ApiError('Mock mode requires the local /api/v1 base URL. No request sent.')
  const dummy = isDummyApiActive()
  const baseUrl = dummy ? DUMMY_BASE_URL : API_BASE_URL
  if (dummy) token = dummyToken
  const entry = { at: new Date().toISOString(), source: dummy ? 'local-dummy' : API_MODE, method, path, request: redact(body), status: 'pending' }
  requestLog.unshift(entry); requestLog.splice(100)
  const started = performance.now()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)
  const abort = () => controller.abort()
  signal?.addEventListener('abort', abort, { once: true })
  if (signal?.aborted) controller.abort()
  try {
  const response = await fetch(`${baseUrl}${path.startsWith('/') ? path : `/${path}`}`, {
    method,
    signal: controller.signal,
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(API_MODE === 'mock' && !dummy ? { 'X-Mock-Scenario': sessionStorage.getItem('kidsverse-mock-scenario') || 'success' } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
  const data = await parseBody(response)
  Object.assign(entry, { status: response.status, response: redact(data) })
  if (!response.ok) {
    const message = data?.error?.message || data?.detail || `Request failed (${response.status})`
    throw new ApiError(message, { status: response.status, data })
  }
  return data
  } catch (error) {
    if (entry.status === 'pending') entry.status = 'network error'
    entry.error = error.name === 'AbortError' ? 'Request cancelled or timed out. Retry when ready.' : error.message
    throw error.name === 'AbortError' ? new ApiError(entry.error) : error
  } finally {
    clearTimeout(timeout); signal?.removeEventListener('abort', abort)
    entry.ms = Math.round(performance.now() - started)
    window.dispatchEvent(new Event('kidsverse-api-request'))
  }
}

// Public catalogs rarely change during one browser session. Reuse the in-flight or
// completed request so onboarding saves do not wait for the same slow GET twice.
// Failed requests are removed, allowing the next screen/action to retry normally.
function cachedCatalog(path) {
  if (!catalogCache.has(path)) {
    const request = apiRequest(path).catch(error => {
      catalogCache.delete(path)
      throw error
    })
    catalogCache.set(path, request)
  }
  return catalogCache.get(path)
}

export const warmCatalogs = () => Promise.allSettled([
  cachedCatalog('/interests'),
  cachedCatalog('/goals'),
  cachedCatalog('/avatar/characters'),
  cachedCatalog('/avatar/items'),
])

// Public catalog calls are safe to use before a parent signs in.
export const api = {
  interests: () => cachedCatalog('/interests'),
  goals: () => cachedCatalog('/goals'),
  avatarCharacters: () => cachedCatalog('/avatar/characters'),
  avatarItems: () => cachedCatalog('/avatar/items'),
  challenges: () => apiRequest('/challenges'),
  signUp: body => apiRequest('/auth/parent/signup', { method: 'POST', body }),
  login: body => apiRequest('/auth/parent/login', { method: 'POST', body }),
  parentMe: token => apiRequest('/parent/me', { token }),
  startParentVerification: body => apiRequest('/parent/verification/start', { method: 'POST', body }),
  verifyParentPhone: body => apiRequest('/parent/verification/verify', { method: 'POST', body }),
  parentOverview: () => apiRequest('/parent/overview'),
  studentHome: (studentId, token) => apiRequest(`/students/${studentId}/home`, { token }),
  studentSubjects: studentId => apiRequest(`/students/${studentId}/subjects`),
  subjectTopics: (subjectId, grade) => apiRequest(`/subjects/${subjectId}/topics${grade ? `?grade=${encodeURIComponent(grade)}` : ''}`),
  studentTopic: (studentId, topicId) => apiRequest(`/students/${studentId}/topics/${topicId}`),
  studentJourney: (studentId, subject = 'maths') => apiRequest(`/students/${studentId}/journey?subject=${encodeURIComponent(subject)}`),
  completeCompanionActivity: (studentId, activityId) => apiRequest(`/students/${studentId}/companion-activities/${activityId}/complete`, { method: 'POST', body: {} }),
  topicTests: topicId => apiRequest(`/topics/${topicId}/tests`),
  challengeOpponents: challengeId => apiRequest(`/challenges/${challengeId}/opponents`),
  studentProfile: studentId => apiRequest(`/students/${studentId}/profile`),
  studentJourneySummary: studentId => apiRequest(`/students/${studentId}/profile/our-journey`),
  studentCards: studentId => apiRequest(`/students/${studentId}/profile/cards`),
}
