import React, { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useGame } from '../state/GameProvider.jsx'
import { API_MODE, getToken, mockSnapshot } from '../lib/api.js'
import Page from '../components/Page.jsx'
import Scene from '../components/Scene.jsx'
import Button from '../components/Button.jsx'

export default function DemoEntry() {
  const game = useGame(), navigate = useNavigate()
  const startup = useRef(null)
  const [retry, setRetry] = useState(0), [error, setError] = useState('')
  useEffect(() => {
    if (API_MODE !== 'mock') return
    let active = true
    setError('')
    // Share this pending request across StrictMode effect replays. A rejected
    // request is retried only when the reviewer presses Try again.
    startup.current ||= (async () => {
      const snapshot = mockSnapshot.value
      const usable = getToken() && snapshot?.session_id === getToken() &&
        Date.parse(snapshot.expires_at) > Date.now() &&
        snapshot.students.some(student => student.id === game.state.activeChildId)
      if (!usable) await game.startMockDemo()
    })()
    startup.current.then(() => {
      if (active) navigate('/home', { replace: true })
    }).catch(cause => {
      if (active) setError(cause.message || 'Could not open the demo. Please try again.')
    })
    return () => { active = false }
  }, [retry])
  if (API_MODE !== 'mock') return <Navigate to="/parent/login" replace />
  return <Page><Scene name="login" />
    <section className="absolute inset-0 grid place-items-center p-8">
      <div className="glass glass-strong rounded-[32px] p-10 max-w-[620px] text-center text-ink" aria-busy={!error}>
        <h1 className="font-display text-[38px] font-extrabold">{error ? 'Demo could not open' : 'Opening your demo…'}</h1>
        {error ? <>
          <p className="mt-4 text-[20px] text-ink-2" role="alert">{error}</p>
          <Button className="mt-6" onClick={() => { startup.current = null; setRetry(value => value + 1) }}>Try again</Button>
        </> : <p className="mt-4 text-[20px] text-ink-2" role="status">Getting the sample account and learning content ready.</p>}
      </div>
    </section>
  </Page>
}
