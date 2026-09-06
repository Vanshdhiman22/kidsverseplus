import React, { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useLocation } from 'react-router-dom'
import { Mic, X, Volume2 } from 'lucide-react'
import { useGame } from '../state/GameProvider.jsx'
import { useNovaVoice } from '../lib/voice.js'
import { useSpeech } from '../lib/speech.js'
import { think } from '../lib/novaBrain.js'
import { sfx } from '../lib/sound.js'
import { cn } from '../lib/utils.js'
import { bleedR, safeB } from './Stage.jsx'

/* Talk to Nova, from anywhere. Tap the mic and ask, or type; Nova answers out loud and in a bubble.
   Not offered before sign-in (nobody to help) or during a test (a hint is cheating). */
const NO_AGENT = ['/', '/parent/login', '/onboarding/child', '/tests/mixed/question']

export default function NovaAgent() {
  const g = useGame(); const { pathname } = useLocation()
  const voice = useNovaVoice()
  const [open, setOpen] = useState(false)
  const [reply, setReply] = useState(null)
  const [heard, setHeard] = useState('')
  const [typed, setTyped] = useState('')
  const [hints, setHints] = useState(0)
  const ask = useCallback(text => {
    const q = (text || '').trim(); if (!q) return
    setHeard(q)
    const r = think(q, { screen: pathname, name: g.state.profile.name, hints })
    if (r.action?.type === 'hint') setHints(h => h + 1)
    setReply(r); voice.say(r)
    if (r.action) window.dispatchEvent(new CustomEvent('kv:nova', { detail: r.action }))
  }, [pathname, g.state.profile.name, hints, voice])
  const sp = useSpeech({ onResult: res => { if (res.transcript) ask(res.transcript) } })
  useEffect(() => { setOpen(false); setReply(null); setHeard(''); setHints(0) }, [pathname])
  useEffect(() => { const on = () => setOpen(true); window.addEventListener('kv:agent', on); return () => window.removeEventListener('kv:agent', on) }, [])
  if (NO_AGENT.includes(pathname)) return null
  const listening = sp.listening
  const status = listening ? 'Listening… tap again when you are done' : sp.error === 'mic-denied' ? 'Microphone blocked. Type instead, or allow the mic' : !sp.supported ? 'No speech in this browser. Type instead' : 'Tap the mic and ask me anything'
  return (
    <>
      <motion.button style={{ ...bleedR(22), ...safeB(22) }} className={cn('absolute z-40 pill w-[58px] h-[58px] p-0 justify-center', listening && 'ring-2 ring-sky-400')} onClick={() => { sfx.tap(); setOpen(o => !o); if (open) { sp.stop(); voice.stop() } }} aria-label={open ? 'Close Nova' : 'Talk to Nova'} aria-expanded={open} whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.94 }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 1.2 }}>
        <motion.img src="/art/nova/head.webp" alt="" className="w-[48px] h-[48px] rounded-full object-cover" animate={voice.speaking ? { rotate: [0, -6, 6, 0] } : { y: [0, -2, 0] }} transition={{ duration: voice.speaking ? 0.5 : 2.4, repeat: Infinity }} />
        <span className="sr-only">{listening ? 'Listening' : 'Talk to Nova'}</span>
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.section className="absolute z-40 w-[400px] glass glass-strong p-5" role="dialog" aria-label="Talk to Nova" initial={{ opacity: 0, y: 20, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.92 }} transition={{ type: 'spring', stiffness: 320, damping: 24 }} style={{ transformOrigin: 'bottom right', ...bleedR(22), ...safeB(88) }}>
            <button className="absolute top-3 right-3 pill w-[34px] h-[34px] justify-center text-ink" onClick={() => { setOpen(false); sp.stop(); voice.stop() }} aria-label="Close"><X size={16} /></button>
            <div className="flex items-center gap-3">
              <img src={reply?.state === 'SURPRISED' ? '/art/nova/surprised.webp' : '/art/nova/welcome.webp'} alt="" className="w-[64px] h-[64px] object-contain floaty" />
              <div><b className="block font-display font-extrabold text-[22px] text-ink leading-none">Nova</b><p className="text-[13px] font-semibold text-ink-3">{status}</p></div>
            </div>
            {heard && <p className="mt-3 text-[13px] font-bold text-ink-3">You: “{heard}”</p>}
            <p className={cn('mt-2 bubble px-4 py-3 text-[16px]', voice.speaking && 'glow-ring')} aria-live="polite">
              {reply?.text ?? "I'm right here. What do you need?"}
              {reply && <button className="ml-2 inline-grid align-middle icon-orb w-[26px] h-[26px]" onClick={() => voice.say(reply)} aria-label="Hear that again"><Volume2 size={13} /></button>}
            </p>
            <div className="mt-3 flex items-center gap-3">
              <motion.button className={cn('icon-orb w-[52px] h-[52px] text-white', listening ? 'bg-sky-500' : '')} style={{ background: listening ? '#0ea5e9' : 'var(--grad-primary)' }} onClick={() => { sfx.tap(); listening ? sp.stop() : sp.start() }} aria-pressed={listening} animate={listening ? { scale: [1, 1.1, 1] } : {}} transition={{ duration: 1, repeat: Infinity }}><Mic size={22} /></motion.button>
              <div className="flex-1 flex items-end gap-[3px] h-[36px]" aria-hidden>{Array.from({ length: 18 }, (_, i) => <motion.i key={i} className="flex-1 rounded-full" style={{ background: 'var(--primary)' }} animate={{ height: `${18 + Math.abs(Math.sin(i * 1.7)) * (listening ? 30 + sp.level * 60 : 10)}%` }} transition={{ duration: 0.15 }} />)}</div>
            </div>
            {listening && sp.transcript && <p className="mt-1 text-[13px] font-semibold text-ink-2">{sp.transcript}</p>}
            <div className="mt-3 flex gap-2">
              {['💡 Hint', "🤔 I don't get it", '🔁 Another way'].map(q => <button key={q} className="chip h-[36px] px-3 text-[13px] flex-1 justify-center hover:brightness-95" onClick={() => ask(q.replace(/^\S+\s/, ''))}>{q}</button>)}
            </div>
            <form className="mt-3 flex gap-2" onSubmit={e => { e.preventDefault(); ask(typed); setTyped('') }}>
              <input className="input h-[44px] text-[15px] pl-4 rounded-[14px]" value={typed} onChange={e => setTyped(e.target.value)} maxLength={140} placeholder="…or type your question" aria-label="Type a question for Nova" />
              <button className="btn btn-primary btn-sm" disabled={!typed.trim()}>Ask</button>
            </form>
            <small className="block mt-3 text-[11px] font-semibold text-ink-3">Nova only talks about learning. Names, numbers and addresses stay private.</small>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  )
}
