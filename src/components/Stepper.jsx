import React from 'react'
import { motion } from 'motion/react'
import { Check } from 'lucide-react'
import { cn } from '../lib/utils.js'

/* Numbered onboarding stepper: 1 Welcome — 2 Learning Setup — 3 Profile — 4 Complete */
export function Steps({ steps, current, className }) {
  return (
    <div className={cn('flex items-start', className)}>
      {steps.map((s, i) => {
        const done = i < current, active = i === current
        return (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center w-[130px]">
              <motion.div
                className={cn('w-[44px] h-[44px] rounded-full grid place-items-center font-display font-extrabold text-[20px] border-2', active ? 'text-white border-transparent' : done ? 'text-white border-transparent' : 'text-ink-3 border-[var(--line)] bg-[var(--glass-strong)]')}
                style={active || done ? { background: 'var(--grad-primary)', boxShadow: 'var(--glow-primary)' } : undefined}
                animate={active ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                transition={{ duration: 1.8, repeat: active ? Infinity : 0, ease: 'easeInOut' }}
              >
                {done ? <Check size={22} strokeWidth={3.2} /> : i + 1}
              </motion.div>
              <div className={cn('mt-2 text-[16px] font-bold whitespace-nowrap', active ? 'text-ink' : 'text-ink-3')}>{s}</div>
            </div>
            {i < steps.length - 1 && (
              <div className="relative flex-1 h-[4px] mt-[20px] rounded-full bg-[var(--lavender-2)] overflow-hidden min-w-[60px]">
                <motion.div className="absolute inset-y-0 left-0 rounded-full" style={{ background: 'var(--grad-primary)' }} initial={{ width: 0 }} animate={{ width: i < current ? '100%' : 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }} />
              </div>
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

/* Segmented dot bar with a numbered bubble on the active segment. */
export function Segments({ total = 8, current = 2, className, badge }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {Array.from({ length: total }, (_, i) => {
        const active = i === current
        return (
          <div key={i} className="relative">
            <motion.div className="h-[8px] rounded-full" style={{ width: active ? 46 : 34, background: i < current ? 'var(--grad-primary)' : active ? 'var(--grad-primary)' : 'var(--lavender-2)', boxShadow: active ? '0 0 14px rgba(124,92,255,.7)' : undefined }} layout transition={{ type: 'spring', stiffness: 300, damping: 26 }} />
            {active && badge && (
              <motion.div className="absolute -top-[13px] left-1/2 -translate-x-1/2 w-[32px] h-[32px] rounded-full grid place-items-center text-white font-display font-extrabold text-[16px]" style={{ background: 'var(--grad-primary)', boxShadow: 'var(--glow-primary)' }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 18, delay: 0.3 }}>{badge}</motion.div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* Lesson rail: 1 DISCOVER · 2 LEARN · 3 INTERACT · 4 THINK · 5 PRACTISE · APPLY */
export function LessonRail({ steps, current, className, compact }) {
  return (
    <div className={cn('flex items-center', compact ? 'gap-1.5' : 'gap-2', className)}>
      {steps.map((s, i) => {
        const done = i < current, active = i === current
        const Icon = s.icon
        return (
          <React.Fragment key={s.key}>
            <motion.div
              className={cn('relative flex flex-col items-center justify-center rounded-[20px] border-[1.5px]', compact ? 'w-[132px] h-[72px]' : 'w-[146px] h-[104px]', active ? 'text-white border-transparent' : 'border-[var(--line)] bg-[var(--glass-strong)] text-ink-3')}
              style={active ? { background: 'var(--grad-primary)', boxShadow: 'var(--glow-primary)' } : undefined}
              initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}
            >
              <div className="flex items-center gap-2">
                <span className={cn('w-[28px] h-[28px] rounded-full grid place-items-center font-display font-extrabold text-[15px]', active ? 'bg-white/25' : done ? 'bg-green-500 text-white' : 'bg-[var(--lavender-2)] text-primary-ink')}>{done ? <Check size={16} strokeWidth={3.5} /> : i + 1}</span>
                <Icon size={compact ? 20 : 24} strokeWidth={2.2} />
              </div>
              <div className={cn('mt-1 font-extrabold tracking-[0.12em]', compact ? 'text-[11px]' : 'text-[13px]')}>{s.label}</div>
            </motion.div>
            {i < steps.length - 1 && <div className={cn('border-t-2 border-dashed border-[var(--line)]', compact ? 'w-[14px]' : 'w-[26px]')} />}
          </React.Fragment>
        )
      })}
    </div>
  )
}
