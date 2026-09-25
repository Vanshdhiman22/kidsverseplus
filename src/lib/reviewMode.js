const REVIEW_KEY = 'kidsverse-ui-review'
const SEED_KEY = 'kidsverse-ui-review-seed'

export function isReviewMode() {
  if (typeof window === 'undefined') return false
  const requested = new URLSearchParams(window.location.search).get('review')
  if (requested === '1') sessionStorage.setItem(REVIEW_KEY, '1')
  if (requested === '0') sessionStorage.removeItem(REVIEW_KEY)
  return sessionStorage.getItem(REVIEW_KEY) === '1'
}

export function exitReviewMode() {
  sessionStorage.removeItem(REVIEW_KEY)
  window.location.replace('/')
}

export function enterReviewMode(destination, state, apiMode) {
  // A dummy skip must not modify the real account's browser progress.
  localStorage.removeItem(`kidsverse-plus-v3-${apiMode}-review`)
  sessionStorage.setItem(SEED_KEY, JSON.stringify({
    profile: state.profile,
    children: state.children,
    activeChildId: state.activeChildId,
  }))
  const url = new URL(destination, window.location.origin)
  url.searchParams.set('review', '1')
  window.location.assign(url.pathname + url.search + url.hash)
}

export function takeReviewSeed() {
  const value = sessionStorage.getItem(SEED_KEY)
  sessionStorage.removeItem(SEED_KEY)
  if (!value) return null
  try { return JSON.parse(value) } catch { return null }
}
