// Share simultaneous reads only. Completed values are never cached, and a write
// separates later readers from any request that began before that write.
export function createInflightReads() {
  const pending = new Map()
  return {
    clear: () => pending.clear(),
    run(key, load) {
      if (!pending.has(key)) {
        const task = Promise.resolve().then(load).finally(() => {
          if (pending.get(key) === task) pending.delete(key)
        })
        pending.set(key, task)
      }
      return pending.get(key)
    },
  }
}
