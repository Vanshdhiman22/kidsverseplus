import React, { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Lock, X, Check, Delete } from 'lucide-react'
import { useGame } from '../state/GameProvider.jsx'
import { sfx } from '../lib/sound.js'
import { cn } from '../lib/utils.js'
import { bleedX, safeT, safeB } from './Stage.jsx'

/* The child lock on the grown-up area: a four-digit code. First use sets one (typed twice). */
const LEN = 4
export default function ParentGate({ onPass, onCancel }) {
  const g = useGame()
  const saved = g.state.parentLock?.pin ?? null
  const setting = !saved
  const [value, setValue] = useState('')
  const [first, setFirst] = useState(null)
  const [error, setError] = useState('')
  const press = d => { if (value.length >= LEN) return; sfx.tap(); setError(''); setValue(value + d) }
  useEffect(() => {
    if (value.length < LEN) return
    const entered = value
    const id = setTimeout(() => {
      if (setting) {
        if (first == null) { setFirst(entered); setValue(''); return }
        if (first === entered) { g.setParentPin(entered); sfx.success(); onPass() }
        else { setFirst(null); setValue(''); setError('Those did not match. Start again.'); sfx.wrong() }
        return
      }
      if (entered === saved) { sfx.success(); onPass() } else { setValue(''); setError('Wrong code. Try again.'); sfx.wrong() }
    }, 120)
    return () => clearTimeout(id)
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps
  const title = setting ? (first == null ? 'Create a grown-up code' : 'Type it once more') : 'Grown-ups only'
  const blurb = setting ? (first == null ? 'Pick four digits. You will need them to open the parent area.' : 'Just to be sure you will remember it.') : 'Enter your four-digit code to open the parent area.'
  return (
    <motion.div className="absolute z-[60] grid place-items-center" style={{ background: 'rgba(10,8,40,.45)', backdropFilter: 'blur(8px)', ...bleedX(0), ...safeT(0), ...safeB(0) }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={e => { if (e.target === e.currentTarget) onCancel() }} role="dialog" aria-modal="true" aria-label={title}>
      <motion.div className="glass glass-strong relative w-[420px] p-8 text-center" initial={{ scale: 0.8, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 30 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}>
        <button className="absolute top-4 right-4 pill w-[40px] h-[40px] justify-center text-ink" onClick={onCancel} aria-label="Close"><X size={18} /></button>
        <span className="mx-auto icon-orb w-[64px] h-[64px]"><Lock size={30} /></span>
        <h2 className="mt-3 font-display font-extrabold text-[30px] text-ink">{title}</h2>
        <p className="mt-1 text-[16px] font-semibold text-ink-3">{blurb}</p>
        <div className={cn('mt-5 flex justify-center gap-4', error && 'shake')}>{Array.from({ length: LEN }, (_, i) => <span key={i} className="w-[18px] h-[18px] rounded-full border-2 transition-colors" style={{ borderColor: 'var(--primary)', background: i < value.length ? 'var(--primary)' : 'transparent' }} />)}</div>
        <p className="mt-2 h-[22px] text-[15px] font-bold" style={{ color: error ? 'var(--danger-ink)' : 'var(--ink-3)' }}>{error || (setting && first != null ? 'Confirming…' : ' ')}</p>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => <button key={n} className="card card-hover h-[58px] font-display font-extrabold text-[24px] text-ink" onClick={() => press(String(n))}>{n}</button>)}
          <span /><button className="card card-hover h-[58px] font-display font-extrabold text-[24px] text-ink" onClick={() => press('0')}>0</button>
          <button className="card card-hover h-[58px] grid place-items-center text-ink-2" onClick={() => { setError(''); setValue(value.slice(0, -1)) }} aria-label="Delete last digit"><Delete size={24} /></button>
        </div>
        {setting && <p className="mt-4 flex items-center justify-center gap-2 text-[13px] font-semibold text-ink-3"><Check size={14} /> This code only hides the parent area from your child.</p>}
      </motion.div>
    </motion.div>
  )
}
