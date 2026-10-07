const key = token => `kv:parent-proof:${token}`
export function parentProof(storage, token, now = Date.now()) {
  try {
    const value=JSON.parse(storage.getItem(key(token)) || 'null')
    return token && value?.expiresAt > now ? value.proof : null
  } catch { return null }
}
export async function verifyParentPin(request, storage, token, pin) {
  const verified=await request('/parent/pin/verify',{method:'POST',body:{pin}})
  const authorized=await request('/parent/pin/authorize',{method:'POST',body:{proof_token:verified.proof_token}})
  storage.setItem(key(token),JSON.stringify({proof:verified.proof_token,expiresAt:Date.parse(authorized.expires_at)}))
  return authorized
}
