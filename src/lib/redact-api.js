// Keep public status/error/schema fields visible; remove credential values only.
const secretKey = /^(?:password|current_password|new_password|confirm_password|password_hash|password_salt|token|access_token|refresh_token|reset_token|proof_token|session_id|authorization|x-parent-pin-proof|x-mock-content-admin-key|cookie|set-cookie|pin|current_pin|new_pin|confirm_pin|dev_code|otp|otp_code)$/i
export function redactApi(value, parentKey = '') {
  if (Array.isArray(value)) return value.map(item => redactApi(item, parentKey))
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.entries(value).map(([key, item]) => {
    const credential = secretKey.test(key) || (key === 'code' && parentKey !== 'error')
    return [key, credential && (item === null || typeof item !== 'object') ? '[redacted]' : redactApi(item, key)]
  }))
}
