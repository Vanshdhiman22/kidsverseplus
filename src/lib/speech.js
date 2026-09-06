/* Speech input: the browser's SpeechRecognition where it exists (Chrome, Edge), a graceful "type instead" everywhere else. */
import { useCallback, useEffect, useRef, useState } from 'react'
const Rec = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null
export const speechSupported = () => Boolean(Rec)

export function useSpeech({ onResult } = {}) {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState(null)
  const [level, setLevel] = useState(0)
  const rec = useRef(null); const tick = useRef(0)
  const stop = useCallback(() => { try { rec.current?.stop() } catch {} rec.current = null; clearInterval(tick.current); setListening(false); setLevel(0) }, [])
  const start = useCallback(() => {
    if (!Rec) { setError('unsupported'); return }
    try {
      const r = new Rec(); r.lang = 'en-IN'; r.interimResults = true; r.continuous = false
      r.onresult = e => { const t = Array.from(e.results).map(x => x[0].transcript).join(' '); setTranscript(t); if (e.results[e.results.length - 1].isFinal) { onResult?.({ transcript: t }); stop() } }
      r.onerror = e => { setError(e.error === 'not-allowed' ? 'mic-denied' : e.error); stop() }
      r.onend = () => { setListening(false); clearInterval(tick.current) }
      rec.current = r; r.start(); setListening(true); setTranscript(''); setError(null)
      tick.current = setInterval(() => setLevel(0.3 + Math.random() * 0.7), 120)
    } catch (e) { setError('failed'); stop() }
  }, [onResult, stop])
  useEffect(() => () => stop(), [stop])
  return { listening, transcript, error, level, start, stop, supported: Boolean(Rec) }
}
