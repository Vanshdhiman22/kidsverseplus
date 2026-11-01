import { SCREENS } from './screens.js'

// Route navigation only. No API calls, saved profiles, attempts or result fixtures.
export const NAVIGATION_SCREENS = SCREENS.filter(([path, label]) => path !== '/missions/fractions' && !label.startsWith('Dev'))

export function screenNavigation(pathname) {
  const normalized = pathname.startsWith('/learn/topics/') ? '/learn/topics/maths'
    : pathname === '/missions/fractions' ? '/missions/fractions/learn'
      : pathname === '/onboarding/parent-details' ? '/onboarding/whatsapp' : pathname
  const index = NAVIGATION_SCREENS.findIndex(([path]) => path === normalized)
  const destination = entry => entry ? { path: entry[0], label: entry[1] } : null
  return {
    current: destination(NAVIGATION_SCREENS[index]),
    previous: destination(NAVIGATION_SCREENS[index - 1]),
    next: index < 0 ? null : destination(NAVIGATION_SCREENS[index + 1]),
  }
}

export function screenNavigationPath(destination, pathname, search = '') {
  if (!/^\/(?:learn\/topics\/|missions\/|tests(?:\/|$)|challenge(?:\/|$))/.test(destination)) return destination
  const current = new URLSearchParams(search)
  const params = new URLSearchParams()
  const subject = current.get('subject') || pathname.match(/^\/learn\/topics\/([^/]+)$/)?.[1]
  if (subject) params.set('subject', subject)
  if (destination.startsWith('/missions/') && pathname.startsWith('/missions/') && current.has('mission')) params.set('mission', current.get('mission'))
  if (destination.startsWith('/tests/') && pathname.startsWith('/tests/') && current.has('source')) params.set('source', current.get('source'))
  if (destination.startsWith('/challenge/') && pathname.startsWith('/challenge/')) {
    for (const key of ['bot', 'challenge', 'opponent']) if (current.has(key)) params.set(key, current.get(key))
  }
  const query = params.toString()
  return `${destination}${query ? `?${query}` : ''}`
}
