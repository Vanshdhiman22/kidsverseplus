import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

/* Where "back" goes when there is no trail to walk — a deep link, a refresh, or the
   first screen of a session. Without this the button would be dead exactly when a
   child needs it most.

   Ported from v1, which kept the same map. v2 had no back system at all: every screen
   was expected to carry its own way out, so dropping a dock from one silently turned it
   into a dead end. This makes the way out structural instead. */
export const PARENT = {
  '/parent/login': '/',
  '/parent/create-account': '/parent/login',
  '/onboarding/child': '/parent/create-account',
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

/* The screens that render no TopBar and no Logo. Everywhere else the back lives inside
   the header, which is tidier and cannot collide with a logo; these are the ones that
   need a floating button instead. Home is headerless too, but it is a root. */
export const HEADERLESS = new Set([
  '/welcome', '/extra', '/extra/reading', '/missions/fractions', '/switch',
  '/parent', '/parent/evidence', '/parent/plan',
])

/* Headerless is not the same as cornerless. These screens draw a 215px rail whose logo
   fills the top-left, so a button pinned to that corner lands on top of the wordmark --
   it read as broken even though it worked. They carry the back inside the rail instead,
   the same way every other screen carries it inside its TopBar. */
export const OWN_RAIL = new Set([
  '/home', '/welcome', '/extra', '/switch', '/parent', '/parent/evidence', '/parent/plan',
])
export const hasOwnRail = path => OWN_RAIL.has(path)

export const needsFloatingBack = path =>
  !NO_BACK.has(path) && HEADERLESS.has(path) && !hasOwnRail(path)

/* ── the trail ──────────────────────────────────────────────────────────────
   One trail for the whole app, held at module scope rather than in a hook.
   It was per-hook first, which looked right and silently did nothing: TopBar,
   the floating button and a screen's own back each built their own empty trail,
   so every one of them fell through to PARENT and "back" could never mean
   "where I actually came from". There is one history, so there is one trail. */
const trail = []
let last = null
let goingBack = false

/** Mounted once, above the routes. Records each navigation. */
export function useTrailRecorder() {
  const { pathname } = useLocation()
  useEffect(() => {
    if (last === pathname) return
    /* Don't record the backward step itself, or back would ping-pong between two screens. */
    if (goingBack) goingBack = false
    else if (last != null) {
      trail.push(last)
      if (trail.length > 40) trail.shift()
    }
    last = pathname
  }, [pathname])
}

/**
 * Back returns where the child actually came from — a child who opened Maths from Home
 * lands back on Home, not on the Learn Hub just because that is the "logical" parent.
 * PARENT is the fallback for when there is no trail: a bookmark, a refresh, a deep link.
 */
export function useBack() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const ref = useRef(null)
  ref.current = pathname
  return () => {
    const here = ref.current
    let target = null
    while (trail.length && !target) {
      const prev = trail.pop()
      if (prev && prev !== here) target = prev
    }
    goingBack = true
    navigate(target ?? parentOf(here) ?? '/home')
  }
}
