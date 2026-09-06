import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

/* Where "back" goes when there is no trail to walk — a deep link, a refresh, or the
   first screen of a session. Without this the button would be dead exactly when a
   child needs it most.

   Ported from v1, which kept the same map. v2 had no back system at all: every screen
   was expected to carry its own dock, so removing a dock from one silently turned it
   into a dead end. This makes the way out structural instead. */
export const PARENT = {
  '/parent/login': '/',
  '/onboarding/child': '/parent/login',
  '/onboarding/grade-board': '/onboarding/child',
  '/onboarding/avatar': '/onboarding/grade-board',
  '/onboarding/interests': '/onboarding/avatar',
  '/onboarding/goals': '/onboarding/interests',
  '/onboarding/nova': '/onboarding/goals',
  '/welcome': '/home',
  '/learn': '/home',
  '/journey': '/home',
  '/tests': '/home',
  '/extra': '/home',
  '/challenge': '/home',
  '/profile': '/home',
  '/parent': '/home',
  '/missions/fractions': '/journey',
  '/missions/fractions/spot-mistake': '/missions/fractions',
  '/missions/fractions/complete': '/missions/fractions',
  '/tests/mixed/intro': '/tests',
  '/tests/mixed/question': '/tests/mixed/intro',
  '/tests/mixed/result': '/tests',
  '/extra/reading': '/extra',
  '/extra/confidence': '/extra',
  '/challenge/opponents': '/challenge',
  '/challenge/preview': '/challenge/opponents',
  '/challenge/battle': '/challenge/opponents',
  '/challenge/result': '/challenge',
  '/challenge/leaderboard': '/challenge',
  '/profile/journey': '/profile',
  '/switch': '/parent',
  '/parent/evidence': '/parent',
  '/parent/plan': '/parent',
}

/* Topic is parameterised, so it cannot be a plain key. */
export const parentOf = path =>
  PARENT[path] ?? (path.startsWith('/learn/topics/') ? '/learn' : null)

/* The roots: nothing sits behind them, so a Back would point nowhere. */
export const NO_BACK = new Set(['/', '/home'])

/* The seven screens that render no TopBar and no Logo. Everywhere else the back lives
   inside the header, which is both tidier and impossible to collide with; these are the
   ones that need a floating button instead. Home is headerless too but is a root. */
export const HEADERLESS = new Set([
  '/welcome', '/extra', '/missions/fractions', '/switch', '/parent', '/parent/evidence', '/parent/plan',
])

/* Does this route need the floating button? Only if it has somewhere to go back to and
   no header of its own to put the control in. */
export const needsFloatingBack = path => !NO_BACK.has(path) && HEADERLESS.has(path)

/**
 * Back returns where the child actually came from, not to a fixed parent — a child who
 * reached the test from Home should land back on Home, not on the Journey map just
 * because that is the "logical" parent. PARENT is the fallback for when there is no
 * trail: a bookmark, a refresh, or a shared link.
 */
export function useBackTrail() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const trail = useRef([])
  const last = useRef(pathname)
  const goingBack = useRef(false)

  useEffect(() => {
    if (last.current === pathname) return
    /* Don't record the backwards step itself, or Back would ping-pong between two screens. */
    if (goingBack.current) goingBack.current = false
    else {
      trail.current.push(last.current)
      if (trail.current.length > 40) trail.current.shift()
    }
    last.current = pathname
  }, [pathname])

  return () => {
    let target = null
    while (trail.current.length && !target) {
      const prev = trail.current.pop()
      if (prev && prev !== pathname) target = prev
    }
    goingBack.current = true
    navigate(target ?? parentOf(pathname) ?? '/home')
  }
}
