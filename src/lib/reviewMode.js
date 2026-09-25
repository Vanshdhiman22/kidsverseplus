const REVIEW_KEY = 'kidsverse-ui-review'

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
