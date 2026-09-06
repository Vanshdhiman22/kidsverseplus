import React from 'react'
import { motion } from 'motion/react'
import { cn } from '../lib/utils.js'

export default function Logo({ variant = 'plus', tagline = 'LEARN • GROW • ACHIEVE', className }) {
  return (
    <div className={cn('flex items-center gap-4', className)}>
      {variant === 'planet' ? (
        <motion.img src="/art/planet-sm.webp" alt="" className="w-[64px] h-[64px] object-contain" animate={{ rotate: [0, 6, 0, -6, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
      ) : (
        <div className="relative w-[58px] h-[58px] rounded-[18px] grid place-items-center" style={{ background: 'var(--grad-primary)', boxShadow: '0 12px 28px -10px rgba(109,77,232,.75), inset 0 1px 0 rgba(255,255,255,.5)' }}>
          <div className="w-[26px] h-[26px] rounded-full border-[5px] border-white/95 glow-pulse" />
          <span className="absolute -top-1 -right-1 text-white text-[14px]">✦</span>
        </div>
      )}
      <div className="leading-none">
        <div className="font-display font-extrabold text-[30px] tracking-tight text-ink">
          {variant === 'planet' ? <span className="grad-text uppercase tracking-wide text-[28px]">Kidsverse</span> : <>Kidsverse<span className="text-primary">+</span></>}
        </div>
        <div className="mt-1 text-[11px] font-extrabold tracking-[0.22em] text-ink-3">{tagline}</div>
      </div>
    </div>
  )
}
