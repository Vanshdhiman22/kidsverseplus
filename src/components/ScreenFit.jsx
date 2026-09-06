import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Monitor, Maximize2, Minus, Plus, Check, ChevronDown, Laptop, Tablet } from 'lucide-react'
import { useGame } from '../state/GameProvider.jsx'
import { sfx } from '../lib/sound.js'
import { cn } from '../lib/utils.js'

/* Screen size: how the 1672x941 board is sized to this display.
   Auto fits the whole board; Fill uses every pixel and may trim the edges.
   Zoom nudges between the two for monitors, laptops and tablets. */
export const ZOOM_MIN = 0.8
export const ZOOM_MAX = 1.3
const step = (v, d) => Math.round(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, v + d)) * 100) / 100

export function useScreenFit() {
  const g = useGame()
  const mode = g.state.settings.screenFit ?? 'auto'
  const zoom = g.state.settings.zoom ?? 1
  return {
    mode, zoom,
    setMode: m => { sfx.select(); g.setSettings({ screenFit: m }) },
    setZoom: z => { sfx.tap(); g.setSettings({ zoom: z }) },
    reset: () => { sfx.tap(); g.setSettings({ screenFit: 'auto', zoom: 1 }) },
  }
}

const MODES = [
  { id: 'auto', label: 'Auto', sub: 'Fit the whole board', icon: Laptop },
  { id: 'stretch', label: 'Fill screen', sub: 'Reach every edge · art looks slightly wider', icon: Maximize2 },
]

export function ZoomStepper({ className }) {
  const { zoom, setZoom } = useScreenFit()
  return (
    <span className={cn('flex items-center gap-1', className)}>
      <button className="w-[32px] h-[32px] rounded-full grid place-items-center bg-[var(--lavender)] text-ink disabled:opacity-40" onClick={() => setZoom(step(zoom, -0.05))} disabled={zoom <= ZOOM_MIN} aria-label="Smaller"><Minus size={16} strokeWidth={3} /></button>
      <b className="w-[54px] text-center font-display font-extrabold text-[15px] text-ink tabular-nums">{Math.round(zoom * 100)}%</b>
      <button className="w-[32px] h-[32px] rounded-full grid place-items-center bg-[var(--lavender)] text-ink disabled:opacity-40" onClick={() => setZoom(step(zoom, 0.05))} disabled={zoom >= ZOOM_MAX} aria-label="Bigger"><Plus size={16} strokeWidth={3} /></button>
    </span>
  )
}

/* The rows used inside the Settings sheet. */
export function ScreenRows() {
  const { mode, setMode, zoom, reset } = useScreenFit()
  return (
    <>
      {MODES.map(m => (
        <button key={m.id} className="w-full flex items-center gap-4 px-4 py-3 rounded-[18px] text-left hover:bg-[var(--lavender)]" onClick={() => setMode(m.id)}>
          <span className="icon-orb w-[42px] h-[42px] shrink-0" style={{ color: '#0ea5e9', background: '#0ea5e91f' }}><m.icon size={20} /></span>
          <span className="flex-1 leading-tight"><b className="block text-[16px] font-extrabold text-ink">{m.label}</b><i className="block text-[13px] font-semibold not-italic text-ink-3">{m.sub}</i></span>
          {mode === m.id && <span className="check-badge w-[26px] h-[26px]"><Check size={15} strokeWidth={3.5} /></span>}
        </button>
      ))}
      <div className="w-full flex items-center gap-4 px-4 py-3">
        <span className="icon-orb w-[42px] h-[42px] shrink-0" style={{ color: '#8b5cf6', background: '#8b5cf61f' }}><Tablet size={20} /></span>
        <span className="flex-1 leading-tight"><b className="block text-[16px] font-extrabold text-ink">Zoom</b><i className="block text-[13px] font-semibold not-italic text-ink-3">{zoom === 1 ? 'Normal size' : 'Custom size'}</i></span>
        <ZoomStepper />
      </div>
      {(mode !== 'auto' || zoom !== 1) && <button className="mx-4 mt-1 chip h-[32px] px-4 text-[13px]" onClick={reset}>Reset to Auto</button>}
    </>
  )
}

/* The pill in the top bar. */
export default function ScreenPill() {
  const { mode, setMode, zoom, reset } = useScreenFit()
  const [open, setOpen] = useState(false)
  useEffect(() => { if (!open) return; const off = () => setOpen(false); window.addEventListener('pointerdown', off); return () => window.removeEventListener('pointerdown', off) }, [open])
  const tweaked = mode !== 'auto' || zoom !== 1
  return (
    <div className="relative" onPointerDown={e => e.stopPropagation()}>
      <button className={cn('pill w-[52px] h-[52px] justify-center text-primary-ink hover:-translate-y-[2px] transition-transform', tweaked && 'ring-2 ring-[var(--primary)]')} onClick={() => { sfx.tap(); setOpen(o => !o) }} title="Screen size" aria-expanded={open}>
        <Monitor size={22} strokeWidth={2.2} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="absolute right-0 top-[60px] w-[290px] glass glass-strong p-3 z-50" style={{ borderRadius: 20 }} initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.96 }} transition={{ type: 'spring', stiffness: 400, damping: 28 }}>
            <div className="label-caps px-2 pb-2">Screen size</div>
            {MODES.map(m => (
              <button key={m.id} className="w-full flex items-center gap-3 px-2 py-2 rounded-xl text-left hover:bg-[var(--lavender)]" onClick={() => setMode(m.id)}>
                <span className="icon-orb w-[34px] h-[34px] shrink-0"><m.icon size={17} /></span>
                <span className="flex-1 leading-tight"><b className="block text-[15px] font-extrabold text-ink">{m.label}</b><i className="block text-[12px] font-semibold not-italic text-ink-3">{m.sub}</i></span>
                {mode === m.id && <Check size={17} strokeWidth={3} className="text-primary-ink" />}
              </button>
            ))}
            <div className="hairline my-2" />
            <div className="flex items-center gap-3 px-2 pb-1">
              <b className="flex-1 text-[15px] font-extrabold text-ink">Zoom</b>
              <ZoomStepper />
            </div>
            {tweaked && <button className="w-full mt-2 chip h-[32px] justify-center text-[13px]" onClick={reset}>Reset to Auto</button>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
