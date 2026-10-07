// Preview numbering is UI metadata. Subject/source/mission parameters still
// distinguish requests from different activities on the same route.
export function screenRoute(route = '/') {
  const url = new URL(route, 'http://local.invalid')
  url.searchParams.delete('mockScreen')
  url.searchParams.sort()
  return url.pathname + url.search
}

export function requestsForScreen(entries, route) {
  const current = screenRoute(route)
  return entries.filter(entry => screenRoute(entry.route) === current ||
    (entry.responseRoute && screenRoute(entry.responseRoute) === current))
}
