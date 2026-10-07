import { redactApi } from './redact-api.js'

export const LIVE_COMPARISON_BASE = 'https://kidsverse-apinew.vercel.app/api/v1'
export function operationKey(entry) {
  const actual = new URL(entry.path, 'http://local.invalid')
  const url = new URL(entry.operation || entry.path, 'http://local.invalid')
  url.search = actual.search
  const order=decodeURI(actual.pathname).match(/\/questions\/([1-9]\d*)$/)?.[1]
  const path = decodeURI(url.pathname).replace(/\{order\}/g, order || ':order').replace(/\{[^}]+\}/g, ':id').replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id').replace(/\/companion-activities\/[^/]+\/complete$/, '/companion-activities/:id/complete')
  url.searchParams.sort()
  // Live and mock IDs differ; query filters and question order still identify distinct operations.
  const query = url.search.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
  return `${entry.method.toUpperCase()} ${path}${query}`
}
export function comparisonScreens(screens, route) {
  const current = new URL(route, 'http://local.invalid')
  if(current.pathname === '/mock/parent-pin') current.pathname = '/parent'
  const preview = Number(current.searchParams.get('mockScreen'))
  const matches = screens.filter(screen => {
    const candidate = new URL(screen.route, current)
    const redirectedDiscover = preview===26 && screen.id===26 && current.pathname==='/missions/fractions/learn'
    return (candidate.pathname === current.pathname || redirectedDiscover) && ['subject', 'source'].every(key =>
      (candidate.searchParams.get(key) || (key === 'subject' ? 'maths' : '')) ===
      (current.searchParams.get(key) || (key === 'subject' ? 'maths' : '')))
  })
  return { screens: matches, selected: matches.find(s => s.id === preview)?.id || matches[0]?.id }
}
export function comparisonPayload(mock, live, route) {
  const matched = comparisonScreens(mock.screens, route)
  const ids = new Set(matched.screens.map(s => s.id))
  const captureIds = new Set(matched.screens.flatMap(s => s.capture_ids))
  return redactApi({ ...matched, mockDate: mock.generated_at, liveDate: live.finished,
    base: live.base, required: mock.captures.filter(c => captureIds.has(c.id)).map(c => ({...c, screens: matched.screens.filter(s => s.capture_ids.includes(c.id)).map(s => s.id), at: mock.generated_at})),
    live: live.requests.filter(c => c.screens.some(id => ids.has(id))) })
}
export function comparisonPairs(data, screenId, observed = []) {
  const pairs = new Map()
  function add(entry, side, observedEntry = false) {
    const key = operationKey(entry)
    const pair = pairs.get(key) || { key }
    // Saved captures arrive oldest first. Observed entries arrive newest first.
    if (!observedEntry || !pair[`${side}Observed`]) pair[side] = entry
    if (observedEntry) pair[`${side}Observed`] = true
    pairs.set(key, pair)
  }
  data?.required.filter(e => e.screens.includes(screenId)).forEach(e => add(e, 'required'))
  data?.live.filter(e => e.screens.includes(screenId)).forEach(e => add(e, 'live'))
  observed.forEach(e => add(e, e.source === 'live' ? 'live' : 'required', true))
  return [...pairs.values()]
}

// Only read operations may be refreshed. Never replay writes or mock credentials.
export async function fetchLiveRead(entry, { token = '', fetcher = fetch, signal } = {}) {
  if (entry.method !== 'GET' || !entry.path?.startsWith('/') || entry.path.startsWith('//')) throw new Error('Only a recorded live GET can be refreshed.')
  const url = new URL(`${LIVE_COMPARISON_BASE}${entry.path}`)
  if (!url.href.startsWith(`${LIVE_COMPARISON_BASE}/`)) throw new Error('Invalid live API path.')
  const headers = { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  const result = { ...entry, url: url.href, headers: redactApi(headers), request: undefined, response: undefined, error: undefined, source: 'live', transport: 'network', at: new Date().toISOString() }
  try {
    const response = await fetcher(url.href, { method: 'GET', headers, signal, credentials: 'omit', redirect: 'error' })
    result.status = response.status
    if (response.status !== 204) {
      const body = await response.text()
      try { result.response = redactApi(JSON.parse(body)) } catch { result.response = body }
    }
  } catch (error) { result.status = 'No response'; result.error = error.name === 'AbortError' ? 'Request cancelled or timed out.' : 'No readable live response. The network or browser CORS policy may have blocked it.' }
  return result
}
