import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useGame } from '../state/GameProvider.jsx'
import { activateDummyApi, isDummyApiActive, requestLog } from '../lib/api.js'
import { startBattle, startMission, startTest } from '../lib/gameApi.js'
import { exitReviewMode, isReviewMode } from '../lib/reviewMode.js'

const RESULT_FIXTURES = {
  '/missions/fractions/complete': ['kv:last-mission-score', () => ({ attemptId: `dummy-mission-${crypto.randomUUID()}`, score: 2, total: 3, xpAwarded: 0, local: true, review: [
    { question: '2 red balls and 1 blue ball make how many?', selectedLabel: '3', answerLabel: '3', correct: true, explanation: 'Count both groups together: 2 + 1 = 3.' },
    { question: 'What does the plus sign mean?', selectedLabel: 'To share', answerLabel: 'To put together', correct: false, explanation: 'The plus sign combines groups.' },
    { question: '4 stars and 2 more make how many?', selectedLabel: '6', answerLabel: '6', correct: true, explanation: 'Count on from four: five, six.' },
  ] })],
  '/tests/mixed/result': ['kv:last-test-run', () => ({ attemptId: `dummy-test-${crypto.randomUUID()}`, correct: 3, total: 5, seconds: 90, source: 'test', xpAwarded: 0, local: true, review: [
    { question: '3 toys plus 2 toys makes how many?', selectedLabel: '5', answerLabel: '5', correct: true, explanation: '3 + 2 = 5.' },
    { question: 'What does plus mean?', selectedLabel: 'Put together', answerLabel: 'Put together', correct: true, explanation: 'Addition combines groups.' },
    { question: '2 red balls and 1 blue ball make how many?', selectedLabel: '2', answerLabel: '3', correct: false, explanation: 'Count every ball: 2 + 1 = 3.' },
    { question: '1 apple plus 1 apple makes how many?', selectedLabel: '2', answerLabel: '2', correct: true, explanation: 'One and one make two.' },
    { question: '4 stars and 2 more make how many?', selectedLabel: '5', answerLabel: '6', correct: false, explanation: 'Count on twice from four: five, six.' },
  ] })],
  '/challenge/result': ['kv:last-battle-result', () => ({ battleId: `dummy-battle-${crypto.randomUUID()}`, result: 'win', xp_awarded: 0, local: true })],
}

function nextScreen(pathname, screens) {
  const numbered = screens.filter(([path, label]) => /^\d{2} /.test(label) && path !== '/missions/fractions')
  const normalized = pathname.startsWith('/learn/topics/') ? '/learn/topics/maths' : pathname === '/missions/fractions' ? '/missions/fractions/learn' : pathname
  const index = numbered.findIndex(([path]) => path === normalized)
  if (index >= 0) return numbered[index + 1]?.[0] ?? null
  if (pathname === '/parent/create-account' || pathname === '/parent/forgot-password') return '/onboarding/child'
  if (pathname === '/onboarding/child') return '/onboarding/parent-details'
  if (pathname === '/onboarding/parent-details') return '/onboarding/grade-board'
  if (pathname === '/profile/break-passes') return '/switch'
  return null
}

/** Local dummy API in development; UI-only walkthrough behind ?review=1 on live. */
export default function DevDummyNavigator({ screens }) {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const game = useGame()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [apiError, setApiError] = useState('')
  const [dummy, setDummy] = useState(isDummyApiActive)
  const review = isReviewMode()
  const next = nextScreen(pathname, screens)

  useEffect(() => {
    setError('')
    setApiError('')
  }, [pathname])
  useEffect(() => {
    const update = () => {
      const last = requestLog[0]
      if (last && (last.status === 'network error' || Number(last.status) >= 400)) setApiError(`${last.method} ${last.path} failed (${last.status})`)
    }
    const dummyUpdate = () => setDummy(isDummyApiActive())
    window.addEventListener('kidsverse-api-request', update)
    window.addEventListener('kidsverse-dummy-api', dummyUpdate)
    return () => {
      window.removeEventListener('kidsverse-api-request', update)
      window.removeEventListener('kidsverse-dummy-api', dummyUpdate)
    }
  }, [])

  if ((!import.meta.env.DEV && !review) || !next) return null

  const continueWithDummy = async () => {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      if (review) {
        if (!game.state.profile.name) game.dispatch({ type: 'profile', patch: { name: 'Reviewer', grade: '1', board: 'CBSE' } })
        const fixture = RESULT_FIXTURES[next]
        if (fixture) sessionStorage.setItem(fixture[0], JSON.stringify(fixture[1]()))
        if (next === '/challenge/result') navigate(`${next}?me=2&bot_s=1&t=45`)
        else navigate(`${next}${search && !['/parent', '/home', '/switch'].includes(next) ? search : ''}`)
        return
      }
      const { students } = await activateDummyApi(game.state.profile, game.state.activeChildId)
      const studentId = students[0].id
      if (!game.state.activeChildId) game.dispatch({ type: 'remoteFamily', email: 'dummy@kidsverse.local', students })
      const subject = new URLSearchParams(search).get('subject') || 'maths'
      if (next === '/missions/fractions/spot-mistake') await startMission(studentId, subject)
      if (next === '/tests/mixed/question') await startTest(studentId, subject)
      if (next === '/challenge/battle') await startBattle(studentId)
      const fixture = RESULT_FIXTURES[next]
      if (fixture) sessionStorage.setItem(fixture[0], JSON.stringify(fixture[1]()))
      if (next === '/challenge/result') navigate(`${next}?me=2&bot_s=1&t=45`)
      else navigate(`${next}${search && !['/parent', '/home', '/switch'].includes(next) ? search : ''}`)
    } catch (cause) {
      setError(cause?.message || 'Dummy data could not be prepared. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return <div data-testid="developer-dummy-control" style={{ position: 'fixed', left: '50%', bottom: 12, transform: 'translateX(-50%)', zIndex: 100001, maxWidth: 'min(94vw, 520px)', display: 'flex', alignItems: 'center', gap: 8, padding: 7, borderRadius: 14, color: '#fff', background: '#171d43', boxShadow: '0 8px 28px #11173980', font: '13px/1.3 system-ui' }}>
    <span style={{ padding: '0 6px', whiteSpace: 'nowrap' }}>{review ? 'UI review · no live API' : dummy ? 'Dummy API active · local only' : apiError || 'Developer testing'}</span>
    <button type="button" disabled={busy} onClick={continueWithDummy} style={{ border: 0, borderRadius: 9, padding: '9px 12px', background: '#baf7df', color: '#123830', fontWeight: 800, cursor: busy ? 'wait' : 'pointer', whiteSpace: 'nowrap' }}>{busy ? 'Preparing…' : 'Dummy → Next'}</button>
    {review && <button type="button" onClick={exitReviewMode} style={{ border: 0, borderRadius: 9, padding: '9px 12px', background: '#fff', color: '#171d43', fontWeight: 700, cursor: 'pointer' }}>Exit</button>}
    {error && <span role="alert" style={{ color: '#ffd2d2', maxWidth: 210 }}>{error}</span>}
  </div>
}
