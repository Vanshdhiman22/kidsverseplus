/** Clear Kidsverse data for this browser origin without touching other apps. */
export function clearBrowserData(local, session) {
  const belongsToKidsverse = key => /^kidsverse[-:]|^kv[-:]/.test(key)
  for (const storage of [local, session]) {
    const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index))
    for (const key of keys) if (key && belongsToKidsverse(key)) storage.removeItem(key)
  }
}
