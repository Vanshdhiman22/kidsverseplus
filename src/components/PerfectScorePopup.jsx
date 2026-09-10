import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Award, Sparkles, Star, X } from 'lucide-react'
import Button from './Button.jsx'

export default function PerfectScorePopup({ show, mode = 'mission' }) {
  const [open, setOpen] = useState(show)
  const label = mode === 'challenge' ? 'Challenge Champion!' : mode === 'test' ? 'Perfect Test!' : 'Perfect Mission!'
  return (
    <AnimatePresence>
      {open && show && (
        <motion.div className="absolute inset-0 z-[100] grid place-items-center bg-indigo-950/35 backdrop-blur-[6px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="relative w-[560px] rounded-[38px] border-2 border-white/80 bg-white/95 px-10 py-9 text-center shadow-[0_30px_90px_rgba(76,29,149,.4)]" initial={{ opacity: 0, scale: 0.45, rotate: -8, y: 80 }} animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }} exit={{ opacity: 0, scale: 0.7 }} transition={{ type: 'spring', stiffness: 260, damping: 17, delay: 0.2 }} role="dialog" aria-modal="true" aria-label={label}>
            <button className="absolute right-5 top-5 grid h-[40px] w-[40px] place-items-center rounded-full text-ink-3 hover:bg-violet-100" onClick={() => setOpen(false)} aria-label="Close perfect score celebration"><X size={22} /></button>
            <motion.div className="mx-auto grid h-[110px] w-[110px] place-items-center rounded-full text-white" style={{ background: 'var(--grad-primary)', boxShadow: 'var(--glow-primary)' }} animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.08, 1] }} transition={{ duration: 1.8, repeat: Infinity }}><Award size={62} /><Star className="absolute text-gold" size={28} fill="currentColor" /></motion.div>
            <div className="mt-5 font-display text-[48px] font-extrabold leading-none grad-text">{label}</div>
            <div className="mt-3 font-display text-[32px] font-extrabold text-ink">100% SCORE</div>
            <p className="mt-2 text-[19px] font-semibold text-ink-2">Every answer was correct. Outstanding work!</p>
            <div className="mt-5 flex justify-center gap-3 text-gold"><Sparkles size={28} /><Star size={30} fill="currentColor" /><Sparkles size={28} /></div>
            <Button size="md" className="mx-auto mt-6 h-[58px] w-[260px] text-[20px]" onClick={() => setOpen(false)}>Keep Playing</Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
