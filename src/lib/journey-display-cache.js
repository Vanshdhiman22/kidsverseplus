// Only real server responses are remembered, in component memory for this
// authenticated child. Cached display data never verifies a cloud unlock.
export function journeyDisplaySnapshot(journey) {
  return { ...journey, worlds:(journey?.worlds || []).map(world=>({ ...world, progress_verified:false })) }
}

export function journeyDisplayData({ previewOnly, sample, live, cached }) {
  // A confirmed unpublished world must not regain old clickable topics from
  // the display cache after a catalog refresh.
  if (previewOnly) return null
  return sample || live || cached || null
}
