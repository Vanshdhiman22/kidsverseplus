// Cosmetic travel follows verified completion. It never changes learning progress.
export function nextJourneyStop(cloud, parked, advanced = []) {
  const current = cloud.stations[parked]
  if (!current?.available || !current.completed || advanced.includes(current.id)) return null
  if (parked === 9) return cloud.canGoNext ? { index: 9, sourceId: current.id, gate: true } : null
  const next = cloud.stations[parked + 1]
  return next?.available ? { index: parked + 1, sourceId: current.id, gate: false } : null
}
