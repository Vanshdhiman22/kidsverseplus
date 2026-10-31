import contract from './backend-contract.json' with { type: 'json' }

// One callable for each method/path actually implemented by the supplied backend.
// Catalog/admin writes are exposed to tooling, never run as learner side effects.
export function createBackendService(request) {
  return Object.fromEntries(contract.operations.map(operation => [operation.name, (parameters = {}, body) => {
    const used = new Set()
    const path = operation.path.replace(/\{([^}]+)\}/g, (_, key) => {
      const value = parameters[key]
      if (value == null || value === '') throw new Error(`${key} is required for ${operation.name}.`)
      used.add(key)
      return encodeURIComponent(String(value))
    })
    const query = new URLSearchParams(Object.entries(parameters).filter(([key, value]) => !used.has(key) && value != null && value !== ''))
    return request(`${path}${query.size ? `?${query}` : ''}`, {
      method: operation.method,
      ...(operation.method === 'GET' ? {} : { body: body ?? {} }),
    })
  }]))
}

export function settingsValues(response) {
  const values = response?.settings ?? response
  if (!values || typeof values !== 'object' || Array.isArray(values)) throw new Error('The settings response is invalid.')
  const allowed = ['sound', 'music', 'voice', 'motion', 'readAloud', 'theme', 'lang', 'screenFit', 'zoom']
  return Object.fromEntries(allowed.filter(key => Object.hasOwn(values, key)).map(key => [key, values[key]]))
}

export const settingsRequest = (settings, mode = 'live') => mode === 'live' ? { settings } : settings

export function novaReply(response) {
  const text = response?.response ?? response?.text
  if (typeof text !== 'string' || !text.trim()) throw new Error('Nova did not return a reply. Please try again.')
  return { text, state: 'HAPPY' }
}

export function backendErrorMessage(data, status) {
  if (typeof data?.error === 'string') return data.error
  if (typeof data?.error?.message === 'string') return data.error.message
  if (typeof data?.detail === 'string') return data.detail
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const fields = Object.entries(data).filter(([, value]) => Array.isArray(value) && value.every(item => typeof item === 'string'))
    if (fields.length) return fields.map(([key, value]) => `${key.replaceAll('_', ' ')}: ${value.join(' ')}`).join(' ')
  }
  return `Request failed (${status})`
}

export async function loadFamilyProfiles(api) {
  const family = api.parentStudents()
  const artwork = api.avatarCharacters()
  const profiles = family.then(({ students }) => Promise.all(students.map(async student => {
    try {
      const profile = await api.studentProfile(student.id)
      return { ...student, ...profile, id: student.id, remoteStatsLoaded: true }
    } catch { return student }
  })))
  const [enriched, { characters }] = await Promise.all([profiles, artwork])
  return { students: enriched, characters }
}
