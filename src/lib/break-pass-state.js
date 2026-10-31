export function breakPassState(response, today) {
  const available = response?.available_count ?? response?.available
  const used = response?.used_count
  const known = Number.isInteger(available) && available >= 0
  return {
    available: known ? available : null,
    total: known && Number.isInteger(used) && used >= 0 ? available + used : null,
    usedToday: response?.used === true || (response?.used_dates ?? []).includes(today),
  }
}
