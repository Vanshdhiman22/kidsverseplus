/**
 * Format an API UTC timestamp in the viewer's own browser timezone. `Intl` obtains
 * the timezone from the device: America/New_York in the US, Asia/Kolkata in India,
 * and so on. Do not manually add offsets because DST makes that unreliable.
 */
export function formatBrowserDateTime(value, options = {}) {
  if (value == null || value === '') return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
    ...options,
  }).format(date)
}

export function browserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
}
