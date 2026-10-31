// Frontend navigation gate only; API ownership remains enforced by the backend.
const key = token => `kv:parent-access:${token}`
export function hasParentAccess(storage, token, now = Date.now()) {
  if (!token) return false
  try { return Number(storage.getItem(key(token))) > now } catch { return false }
}
export function grantParentAccess(storage, token, now = Date.now()) {
  if (token) storage.setItem(key(token), String(now + 5 * 60 * 1000))
}
