export const TOPICS_PER_CLOUD = 10

export function journeyTopicArt(name = '', subject = '') {
  const topic = String(name).toLowerCase()
  if (/shape|spatial|geometr|fraction/.test(topic)) return 'shapes'
  if (/number|count|digit|decimal/.test(topic)) return 'numbers'
  if (/add|subtract|multiply|multiplication|division|arithmetic|operation/.test(topic)) return 'arithmetic'
  if (/measur|length|time|clock|money|weight|calendar/.test(topic)) return 'measurement'
  if (/plant|animal|earth|space|nature|science|weather|body/.test(topic) || subject === 'evs') return 'nature'
  return 'books'
}

export function isJourneyTopicComplete(world) {
  return Boolean(world?.topic_id) && world.progress_verified === true && Number(world.total_missions) > 0
    && Number(world.completed_missions) === Number(world.total_missions)
}

// Empty map positions are scenery for future content, never invented topic IDs.
export function journeyCloud(worlds = [], requestedPhase = 1, subject = '') {
  const identities = new Set()
  worlds = worlds.filter(world => {
    if (!world?.topic_id || identities.has(world.topic_id)) return false
    identities.add(world.topic_id)
    return true
  })
  let unlockedThrough = 1
  while (worlds.slice((unlockedThrough - 1) * TOPICS_PER_CLOUD, unlockedThrough * TOPICS_PER_CLOUD).length === TOPICS_PER_CLOUD
    && worlds.slice((unlockedThrough - 1) * TOPICS_PER_CLOUD, unlockedThrough * TOPICS_PER_CLOUD).every(isJourneyTopicComplete)) unlockedThrough++
  const requested = Number(requestedPhase)
  const phase = Math.max(1, Math.min(unlockedThrough, Number.isInteger(requested) ? requested : 1))
  const offset = (phase - 1) * TOPICS_PER_CLOUD
  const stations = Array.from({ length: TOPICS_PER_CLOUD }, (_, index) => {
    const world = worlds[offset + index]
    const available = Boolean(world?.topic_id)
    const completed = available && isJourneyTopicComplete(world)
    return {
      id: available ? world.topic_id : null,
      number: offset + index + 1,
      index: offset + index,
      name: available ? world.world_name || world.name || `Topic ${offset + index + 1}` : 'Coming soon',
      available, completed,
      state: completed ? 'done' : ['current', 'in_progress'].includes(world?.status) ? 'here' : world?.status === 'unlocked' ? 'next' : 'locked',
      art: available ? journeyTopicArt(world.world_name || world.name, subject) : null,
    }
  })
  const completed = stations.filter(station => station.completed).length
  return { phase, offset, stations, completed, available: stations.filter(station => station.available).length,
    canGoNext: completed === TOPICS_PER_CLOUD, unlockedThrough }
}
