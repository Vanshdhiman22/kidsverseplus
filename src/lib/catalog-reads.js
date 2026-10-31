// Short-lived, in-memory reuse for published package metadata only.
// Answers, attempts, results, XP and child progress never enter this cache.
export function createCatalogReads({ now = Date.now, maxAgeMs = 30000 } = {}) {
  const entries = new Map()
  return {
    clear: () => entries.clear(),
    run(key, load) {
      const current = entries.get(key)
      if (current && now() < current.expiresAt) return current.promise
      const entry = { expiresAt: Infinity }
      entry.promise = Promise.resolve().then(load).then(value => {
        if (entries.get(key) === entry) entry.expiresAt = now() + maxAgeMs
        return value
      }, error => {
        if (entries.get(key) === entry) entries.delete(key)
        throw error
      })
      entries.set(key, entry)
      return entry.promise
    },
  }
}
