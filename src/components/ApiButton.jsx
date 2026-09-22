import React, { useRef, useState } from 'react'
import Button from './Button.jsx'

// Await the save before navigating; a failed request stays on the current screen.
export default function ApiButton({ onClick, disabled, children, ...props }) {
  const lock = useRef(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const run = async () => {
    if (lock.current) return
    lock.current = true; setBusy(true); setError('')
    try { await onClick() } catch (e) { setError(e.message || 'Request failed. Please retry.') }
    finally { lock.current = false; setBusy(false) }
  }
  return <><Button {...props} disabled={disabled || busy} onClick={run}>{busy ? 'Saving…' : children}</Button>{error && <p role="alert" className="mt-2 text-[18px] font-bold text-red-500">{error}</p>}</>
}
