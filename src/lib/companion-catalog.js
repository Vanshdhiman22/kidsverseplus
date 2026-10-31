export function companionCatalog(response) {
  if (!Array.isArray(response?.activities)) throw new Error('Activity content is not available yet.')
  return response.activities.filter(activity => activity && typeof activity.id === 'string' && typeof activity.type === 'string')
}

export function usableCompanion(activity) {
  if (!activity || !Array.isArray(activity.prompts) || !Array.isArray(activity.tips)) return false
  if (!activity.prompts.every(prompt => typeof prompt === 'string') || !activity.tips.every(tip => typeof tip === 'string')) return false
  return activity.type === 'reading' ? typeof activity.passage === 'string' && Boolean(activity.passage.trim()) : activity.type === 'speaking' && activity.prompts.length > 0
}
