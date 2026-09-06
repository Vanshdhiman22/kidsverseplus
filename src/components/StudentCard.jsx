import React, { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Star, Flame, Download, X, Sparkles as SparkIcon } from 'lucide-react'
import { OUTFITS, GOALS, spriteFor, gradeLabel } from '../data/catalog.js'
import { useGame } from '../state/GameProvider.jsx'
import Button from './Button.jsx'
import { sfx } from '../lib/sound.js'
import { cn } from '../lib/utils.js'

/* The child's collectable card, carried over from the old app: the learner shown
   AS their chosen character, on a frame that changes with how much they have
   learned. The tier is the point of it - the card visibly grows with the child. */
export const TIERS = [
  { id: 'starter', name: 'Starter', min: 0, tag: 'NEW EXPLORER', ring: '#8b5cf6' },
  { id: 'bronze', name: 'Bronze', min: 500, tag: 'RISING STAR', ring: '#d97706' },
  { id: 'silver', name: 'Silver', min: 1500, tag: 'SKILL BUILDER', ring: '#94a3b8' },
  { id: 'gold', name: 'Gold', min: 3000, tag: 'CHAMPION', ring: '#f59e0b' },
  { id: 'diamond', name: 'Diamond', min: 6000, tag: 'LEGEND', ring: '#38bdf8' },
]
export const tierFor = xp => [...TIERS].reverse().find(t => (xp ?? 0) >= t.min) ?? TIERS[0]
export const nextTier = xp => TIERS.find(t => t.min > (xp ?? 0)) ?? null

const goalLabel = goals => GOALS.find(g => g.id === (goals ?? [])[0])?.title ?? 'Learning journey'

export function useMe() {
  const g = useGame()
  const p = g.state.profile
  return { name: p.name, grade: p.grade, board: p.board, face: p.face, outfit: p.outfit,
           goal: goalLabel(p.goals), xp: g.state.stats.xp, streak: g.state.stats.streak, level: g.level }
}

export default function StudentCard({ me, w = 300, className, style, onClick }) {
  const outfit = OUTFITS.find(o => o.id === me.outfit) ?? OUTFITS[0]
  const [c1, c2] = outfit.colors
  const tier = tierFor(me.xp)
  const h = w * 1.4
  return (
    <motion.button className={cn('relative block rounded-[26px] overflow-hidden text-left', className)}
      style={{ width: w, height: h, background: 'linear-gradient(180deg, #171243, #0c0930)', boxShadow: `0 0 0 3px ${tier.ring}, 0 26px 60px -24px rgba(10,6,40,.9)`, ...style }}
      whileHover={onClick ? { y: -6 } : undefined} whileTap={onClick ? { scale: 0.98 } : undefined} onClick={onClick}>
      <span className="absolute inset-x-0 top-0 h-[42px] grid place-items-center text-[11px] font-extrabold tracking-[0.16em]"
        style={{ color: tier.ring }}>{tier.name.toUpperCase()} · {tier.tag}</span>
      <span className="absolute left-1/2 -translate-x-1/2 rounded-full"
        style={{ top: h * 0.26, width: w * 0.86, height: w * 0.86, background: `radial-gradient(circle, ${c1}66, transparent 68%)` }} />
      <img src={spriteFor(me.outfit, me.face)} alt="" className="absolute left-1/2 -translate-x-1/2 w-auto"
        style={{ top: h * 0.13, height: h * 0.56, filter: 'drop-shadow(0 18px 26px rgba(0,0,20,.6))' }} />
      <span className="absolute inset-x-0 px-3 text-center" style={{ top: h * 0.68 }}>
        <span className="block font-display font-extrabold text-white leading-none" style={{ fontSize: w * 0.14 }}>{me.name.toUpperCase()}</span>
        <span className="block mt-1 font-semibold text-indigo-200" style={{ fontSize: w * 0.052 }}>{gradeLabel(me.grade)} · {me.board}</span>
        <span className="mt-1 flex items-center justify-center gap-3 font-extrabold" style={{ fontSize: w * 0.05 }}>
          <span className="flex items-center gap-1 text-gold"><Star size={w * 0.055} fill="currentColor" /> {me.xp.toLocaleString()} XP</span>
          <span className="flex items-center gap-1 text-orange-400"><Flame size={w * 0.055} fill="currentColor" /> {me.streak}d</span>
        </span>
        <span className="block mt-1 font-semibold text-indigo-300/90 leading-tight" style={{ fontSize: w * 0.044 }}>{me.goal}</span>
      </span>
      <span className="absolute inset-x-0 bottom-2 text-center font-extrabold tracking-[0.2em]" style={{ fontSize: w * 0.042, color: c2 }}>KIDSVERSE+</span>
    </motion.button>
  )
}

/* Full-size view with the tier ladder and a downloadable copy. */
export function MyCardModal({ open, onClose }) {
  const me = useMe()
  const g = useGame()
  const [busy, setBusy] = useState(false)
  const tier = tierFor(me.xp), next = nextTier(me.xp)

  const download = async () => {
    setBusy(true)
    try {
      const img = new Image()
      img.src = spriteFor(me.outfit, me.face)
      await img.decode()
      const W = 640, H = 900, c = document.createElement('canvas')
      c.width = W; c.height = H
      const x = c.getContext('2d')
      const outfit = OUTFITS.find(o => o.id === me.outfit) ?? OUTFITS[0]
      const [c1, c2] = outfit.colors
      const grad = x.createLinearGradient(0, 0, 0, H)
      grad.addColorStop(0, '#171243'); grad.addColorStop(1, '#0a0630')
      x.fillStyle = grad; x.fillRect(0, 0, W, H)
      x.strokeStyle = tier.ring; x.lineWidth = 10; x.strokeRect(10, 10, W - 20, H - 20)
      const glow = x.createRadialGradient(W / 2, H * 0.5, 40, W / 2, H * 0.5, 300)
      glow.addColorStop(0, c1 + '66'); glow.addColorStop(1, 'rgba(0,0,0,0)')
      x.fillStyle = glow; x.fillRect(0, H * 0.2, W, H * 0.6)
      const ih = H * 0.55, iw = img.width * (ih / img.height)
      x.drawImage(img, (W - iw) / 2, H * 0.12, iw, ih)
      x.textAlign = 'center'
      x.fillStyle = tier.ring; x.font = '800 24px Nunito, sans-serif'
      x.fillText(`${tier.name.toUpperCase()} · ${tier.tag}`, W / 2, 56)
      x.fillStyle = '#fff'; x.font = '800 58px "Baloo 2", Nunito, sans-serif'
      x.fillText(me.name.toUpperCase(), W / 2, H * 0.78)
      x.fillStyle = '#cfc9f5'; x.font = '600 24px Nunito, sans-serif'
      x.fillText(`${gradeLabel(me.grade)} · ${me.board}`, W / 2, H * 0.83)
      x.fillText(`${me.xp.toLocaleString()} XP   ${me.streak} day streak`, W / 2, H * 0.875)
      x.fillStyle = c2; x.font = '700 20px Nunito, sans-serif'
      x.fillText('KIDSVERSE+', W / 2, H * 0.95)
      const a = document.createElement('a')
      a.download = `${me.name}-kidsverse-card.png`
      a.href = c.toDataURL('image/png')
      a.click()
      sfx.success()
    } catch {
      g.notice?.('Could not build the card image — try again.')
    } finally { setBusy(false) }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="absolute inset-0 z-50 grid place-items-center" style={{ background: 'rgba(8,5,34,.72)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div className="glass glass-strong relative p-8 flex items-center gap-9" style={{ borderRadius: 30 }}
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }} onClick={e => e.stopPropagation()}>
            <button className="absolute right-4 top-4 pill w-[44px] h-[44px] justify-center text-ink" onClick={onClose}><X size={22} /></button>
            <StudentCard me={me} w={340} />
            <div className="w-[360px]">
              <div className="eyebrow text-[15px]">My card</div>
              <h2 className="mt-1 font-display font-extrabold text-[40px] leading-none text-ink">{tier.name} tier</h2>
              <p className="mt-2 text-[17px] font-semibold text-ink-2 leading-snug">
                Your card grows as you learn. Keep going and it changes shape at every tier.
              </p>
              <div className="mt-5 flex flex-col gap-2">
                {TIERS.map(t => {
                  const reached = me.xp >= t.min
                  return (
                    <div key={t.id} className={cn('flex items-center gap-3 rounded-[14px] px-3 py-2', reached ? 'card' : 'opacity-55')}>
                      <span className="w-[14px] h-[14px] rounded-full shrink-0" style={{ background: reached ? t.ring : 'var(--line)' }} />
                      <span className="flex-1 text-[16px] font-extrabold text-ink">{t.name}</span>
                      <span className="text-[14px] font-bold text-ink-3">{t.min.toLocaleString()} XP</span>
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 text-[16px] font-bold text-ink-2">
                {next ? <>{(next.min - me.xp).toLocaleString()} XP to <span className="text-primary-ink">{next.name}</span></> : 'Top tier reached. Legend.'}
              </div>
              <Button size="md" icon={<Download size={22} />} className="mt-4 w-full h-[60px] uppercase text-[19px]" disabled={busy} onClick={download}>
                {busy ? 'Building…' : 'Download card'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* The Profile entry point: a small live card you can tap to open the big one. */
export function MyCardSection({ className, style }) {
  const me = useMe()
  const [open, setOpen] = useState(false)
  const tier = tierFor(me.xp), next = nextTier(me.xp)
  return (
    <>
      {/* One row, in the footprint the old buttons had, so it clears the dock. */}
      <motion.section className={cn('absolute flex items-center gap-5', className)} style={style}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <StudentCard me={me} w={62} onClick={() => { sfx.whoosh(); setOpen(true) }} />
        <div className="flex-1 leading-tight">
          <div className="flex items-center gap-2 eyebrow text-[14px]"><SparkIcon size={15} className="text-gold" /> My card</div>
          <div className="font-display font-extrabold text-[22px] text-ink">{tier.name} tier — {tier.tag.toLowerCase()}</div>
          <div className="text-[14px] font-semibold text-ink-3">
            {next ? <>{(next.min - me.xp).toLocaleString()} XP to {next.name}</> : 'Top tier reached.'}
          </div>
        </div>
        <Button size="md" arrow className="h-[62px] px-8 uppercase text-[19px] shrink-0" sound="whoosh" onClick={() => setOpen(true)}>View my card</Button>
      </motion.section>
      <MyCardModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
