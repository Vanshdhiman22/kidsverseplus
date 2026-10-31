const publicRoutes = new Set(['/', '/parent/login', '/parent/create-account', '/parent/forgot-password'])

export function needsSignIn({ pathname, search = '', token, review, development }) {
  if (publicRoutes.has(pathname) || token || review) return false
  const preview = new URLSearchParams(search).get('apiPreview')
  if (development && (/^[0-9a-f-]{36}$/i.test(preview || '') || ['/screens', '/api-test'].includes(pathname))) return false
  return true
}
