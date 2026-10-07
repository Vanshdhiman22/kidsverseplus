// Review navigation is an explicit fixture source, never a fallback for failed
// live content. Keep the selected source stable while a live request resolves.
export function contentSource({ review, studentId, token }) {
  return review ? 'review-fixture' : studentId && token ? 'api' : 'bundled'
}
