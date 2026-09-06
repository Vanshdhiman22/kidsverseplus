import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, Globe, Sun, Moon, Volume2, VolumeX, Flame, Star, Zap, Gem, Settings, Check, ArrowLeft } from 'lucide-react'
import Logo from './Logo.jsx'
import { cn } from '../lib/utils.js'
import { useGame } from '../state/GameProvider.jsx'
import { sfx } from '../lib/sound.js'
import { EASE } from '../lib/motion.js'
import { LANGS } from '../data/catalog.js'
import { openSettings } from './SettingsSheet.jsx'
import ScreenPill from './ScreenFit.jsx'
import { bleedX, safeT } from './Stage.jsx'

/* `back` is for screens that carry no dock of their own. Navigation lives on the
   main screen, so a screen opened from it needs one clear way home rather than a
   full nav bar -- pass a route, or `true` to step back through history. */
export function TopBar({ logo = 'plus', center, right, className, showControls = true, back, backLabel = 'Back' }) {
  const nav = useNavigate()
  return (
    <motion.header className={cn('absolute flex items-center justify-between px-9 pt-7 z-20', className)} style={{ ...bleedX(0), ...safeT(0) }} initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, ease: EASE }}>
      <div className="flex items-center gap-4">
        {back && (
          <motion.button type="button" className="pill h-[54px] pl-3 pr-5 gap-2 text-primary-ink"
            whileHover={{ x: -3 }} onClick={() => { sfx.tap(); back === true ? nav(-1) : nav(back) }}>
            <ArrowLeft size={22} strokeWidth={2.6} />
            <span className="font-display font-extrabold text-[18px]">{backLabel}</span>
          </motion.button>
        )}
        <Logo variant={logo} />
      </div>
      {center && <div className="absolute left-1/2 -translate-x-1/2 top-7">{center}</div>}
      <div className="flex items-center gap-3">
        {right}
        {showControls && <Controls />}
      </div>
    </motion.header>
  )
}

export function Controls() {
  const g = useGame()
  const dark = g.state.settings.theme === 'dark'
  return (
    <>
      <LangPill />
      <IconPill onClick={() => { sfx.select(); g.toggleTheme() }} title="Toggle theme">
        <motion.span key={dark ? 'moon' : 'sun'} initial={{ rotate: -90, scale: 0.5, opacity: 0 }} animate={{ rotate: 0, scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 18 }} className="grid place-items-center">
          {dark ? <Moon size={22} strokeWidth={2.2} /> : <Sun size={22} strokeWidth={2.2} />}
        </motion.span>
      </IconPill>
      <IconPill onClick={() => { g.toggleSound(); sfx.tap() }} title="Toggle sound">
        {g.state.settings.sound ? <Volume2 size={22} strokeWidth={2.2} /> : <VolumeX size={22} strokeWidth={2.2} />}
      </IconPill>
      <ScreenPill />
      <IconPill onClick={() => { sfx.tap(); openSettings() }} title="Settings"><motion.span whileHover={{ rotate: 60 }} className="grid place-items-center"><Settings size={22} strokeWidth={2.2} /></motion.span></IconPill>
    </>
  )
}

export function IconPill({ children, className, ...rest }) {
  return <button className={cn('pill w-[52px] h-[52px] justify-center text-primary-ink hover:-translate-y-[2px] transition-transform', className)} {...rest}>{children}</button>
}

/* Language: English now; Hindi and Marathi listed as coming soon, like the old app. */
export function LangPill() {
  const g = useGame()
  const [open, setOpen] = useState(false)
  const cur = LANGS.find(l => l.id === (g.state.settings.lang ?? 'en')) ?? LANGS[0]
  useEffect(() => { if (!open) return; const off = () => setOpen(false); window.addEventListener('pointerdown', off); return () => window.removeEventListener('pointerdown', off) }, [open])
  return (
    <div className="relative" onPointerDown={e => e.stopPropagation()}>
      <button className="pill h-[52px] px-5 text-[18px] font-bold text-ink hover:-translate-y-[2px] transition-transform" onClick={() => { sfx.tap(); setOpen(o => !o) }} aria-expanded={open}>
        <Globe size={20} strokeWidth={2.2} className="text-primary-ink" /> {cur.label} <motion.span animate={{ rotate: open ? 180 : 0 }} className="grid"><ChevronDown size={18} strokeWidth={2.5} className="opacity-70" /></motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="absolute right-0 top-[60px] w-[200px] glass glass-strong p-2 z-50" style={{ borderRadius: 18 }} initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.96 }} transition={{ type: 'spring', stiffness: 400, damping: 28 }}>
            {LANGS.map(l => (
              <button key={l.id} disabled={l.soon} className={cn('w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[16px] font-bold text-left', l.soon ? 'text-ink-3 cursor-not-allowed' : 'text-ink hover:bg-[var(--lavender)]')} onClick={() => { sfx.select(); g.setSettings({ lang: l.id }); setOpen(false) }}>
                <span className="flex-1">{l.label}</span>{l.soon ? <span className="chip h-[22px] px-2 text-[11px]">soon</span> : l.id === cur.id ? <Check size={16} className="text-primary-ink" /> : null}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function UserChip({ name, sub, face = 1, className, extra }) {
  return (
    <div className={cn('pill h-[68px] pl-2 pr-5 gap-3', className)}>
      <img src={`/art/kid${face}-face-sm.webp`} alt="" className="w-[52px] h-[52px] rounded-full object-cover border-2 border-white shadow-md" />
      <div className="leading-tight">
        <div className="font-display font-extrabold text-[19px] text-ink">{name}</div>
        {sub && <div className="text-[14px] font-bold text-ink-3">{sub}</div>}
      </div>
      {extra}
      <ChevronDown size={20} strokeWidth={2.5} className="text-ink-3 ml-1" />
    </div>
  )
}

const STAT_ICON = { streak: [Flame, '#f97316'], xp: [Star, '#f59e0b'], coins: [Gem, '#38bdf8'], bolt: [Zap, '#f59e0b'] }
export function StatPill({ kind = 'xp', value, label, className }) {
  const [Icon, color] = STAT_ICON[kind]
  return (
    <div className={cn('pill h-[68px] px-5 gap-3', className)}>
      <span className="icon-orb w-[40px] h-[40px]" style={{ color }}><Icon size={22} strokeWidth={2.4} fill={kind === 'streak' || kind === 'xp' ? color : 'none'} /></span>
      <div className="leading-tight">
        {label && <div className="text-[12px] font-extrabold tracking-wide text-ink-3">{label}</div>}
        <div className="font-display font-extrabold text-[20px] text-ink">{value}</div>
      </div>
    </div>
  )
}
