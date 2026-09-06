import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { Flame, Star, Trophy, Gem, Map, UserCircle, X } from 'lucide-react'
import { useGame, XP_PER_LEVEL } from '../state/GameProvider.jsx'
import { sfx } from '../lib/sound.js'
import { cn } from '../lib/utils.js'
import { safeT } from './Stage.jsx'

/* ============================================================
   Nova Island: the one place the game talks back.
   A Dynamic-Island HUD pinned to the top of every signed-in screen. It rests
   as a small pill (level ring · XP · streak) and morphs, with spring physics,
   into whatever just happened: +XP (awards stack into a combo), LEVEL UP,
   a streak, or a line from Nova. Tap the pill for the full progress card.
   ============================================================ */
const SHOW_MS = { xp: 2100, levelup: 3000, streak: 2600, nova: 2600 }
const SPRING = { type: 'spring', stiffness: 420, damping: 30, mass: 0.8 }
const SOFT = { type: 'spring', stiffness: 170, damping: 20 }
const POP = { type: 'spring', stiffness: 520, damping: 14 }
const buzz = p => { try { if (navigator.userActivation?.hasBeenActive) navigator.vibrate?.(p) } catch {} }

/* Odometer: each digit is a column of 0–9 that springs to the right row. */
function Odometer({ value }) {
  const reduce = useReducedMotion()
  const cols = String(Math.max(0, Math.round(value))).split('')
  return (
    <span className="nvi-odo" aria-label={String(value)}>
      {cols.map((d, i) => (
        <span className="nvi-odo-col" key={cols.length - i}>
          <motion.span className="nvi-odo-strip" initial={false} animate={{ y: `-${Number(d) * 10}%` }} transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 160, damping: 20, delay: i * 0.03 }}>
            {Array.from({ length: 10 }, (_, n) => <b key={n}>{n}</b>)}
          </motion.span>
        </span>
      ))}
    </span>
  )
}

function LevelRing({ pct, level, size = 30, stroke = 3.2 }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, p = Math.max(0, Math.min(1, pct / 100))
  return (
    <span className="nvi-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}><circle cx={size / 2} cy={size / 2} r={r} className="nvi-ring-track" strokeWidth={stroke} /><motion.circle cx={size / 2} cy={size / 2} r={r} className="nvi-ring-fill" strokeWidth={stroke} strokeDasharray={c} initial={false} animate={{ strokeDashoffset: c * (1 - p) }} transition={SOFT} transform={`rotate(-90 ${size / 2} ${size / 2})`} /></svg>
      <b style={{ fontSize: size * 0.4 }}>{level}</b>
    </span>
  )
}

function Sparks({ n = 14, tone = '#ffd75e', reach = 46 }) {
  if (useReducedMotion()) return null
  return <span className="nvi-sparks" aria-hidden>{Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2, d = reach + (i * 37) % 34; return <motion.i key={i} style={{ background: i % 3 === 0 ? '#fff' : tone }} initial={{ x: 0, y: 0, scale: 0, opacity: 1 }} animate={{ x: Math.cos(a) * d, y: Math.sin(a) * d, scale: [0, 1.4, 0], opacity: [1, 1, 0] }} transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1], delay: 0.05 + (i % 4) * 0.03 }} /> })}</span>
}

const Words = ({ text, delay = 0.08, step = 0.045 }) => String(text ?? '').split(' ').map((w, i, arr) => <React.Fragment key={i}><motion.span className="inline-block" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: delay + i * step }}>{w}</motion.span>{i < arr.length - 1 ? ' ' : ''}</React.Fragment>)

function Idle({ g, hovered }) {
  return (
    <div className="nvi-idle">
      <LevelRing pct={g.levelPct} level={g.level} />
      <span className="nvi-xp"><Star size={14} fill="currentColor" /><Odometer value={g.state.stats.xp} /><i>XP</i></span>
      <span className="nvi-streak"><Flame size={14} fill="currentColor" /><b>{g.state.stats.streak}</b></span>
      <AnimatePresence>{hovered && <motion.span className="nvi-hint" initial={{ width: 0, opacity: 0 }} animate={{ width: 'auto', opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ width: SPRING, opacity: { duration: 0.18 } }}><em>{g.toNext} XP to Level {g.level + 1} · tap for more</em></motion.span>}</AnimatePresence>
    </div>
  )
}
function XpAward({ g, toasts }) {
  const latest = toasts[toasts.length - 1], total = toasts.reduce((s, t) => s + (t.amount ?? 0), 0), combo = toasts.length
  return (
    <div className="nvi-xpaward">
      <Sparks key={latest.id} />
      <motion.span className="nvi-badge" key={'b' + latest.id} initial={{ scale: 0.4, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={POP}><Star size={18} fill="currentColor" /></motion.span>
      <span className="nvi-xptext"><span className="nvi-xpnum"><b>+</b><Odometer value={total} /><b className="nvi-xpunit">XP</b></span>
        <AnimatePresence>{combo > 1 && <motion.em className="nvi-combo" key={combo} initial={{ scale: 0.3, rotate: -14, opacity: 0 }} animate={{ scale: 1, rotate: -6, opacity: 1 }} exit={{ scale: 0.3, opacity: 0 }} transition={POP}>x{combo}</motion.em>}</AnimatePresence>
        {latest.label && <motion.i key={'l' + latest.id} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ ...SOFT, delay: 0.12 }}>{latest.label}</motion.i>}</span>
      <span className="nvi-bar"><motion.span className="nvi-barfill" initial={false} animate={{ width: `${g.levelPct}%` }} transition={{ type: 'spring', stiffness: 120, damping: 18, delay: 0.18 }} /></span>
    </div>
  )
}
function LevelUp({ g }) {
  return (
    <div className="nvi-levelup">
      <Sparks n={22} tone="#c084fc" reach={70} />
      <motion.span className="nvi-halo" initial={{ scale: 0.2, opacity: 0.9 }} animate={{ scale: 2.6, opacity: 0 }} transition={{ duration: 1.1 }} />
      <span className="nvi-lvword">{'LEVEL UP!'.split('').map((ch, i) => <motion.b key={i} initial={{ y: 22, opacity: 0, rotate: -12, scale: 0.6 }} animate={{ y: [22, -6, 0], opacity: 1, rotate: 0, scale: [0.6, 1.15, 1] }} transition={{ duration: 0.55, delay: 0.08 + i * 0.04 }}>{ch}</motion.b>)}</span>
      <motion.span className="nvi-lvsub" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SOFT, delay: 0.5 }}><LevelRing pct={100} level={g.level} size={26} stroke={3} /> You are Explorer Level {g.level}</motion.span>
    </div>
  )
}
function StreakUp({ g }) {
  return (
    <div className="nvi-streakup">
      <Sparks n={16} tone="#ff8a3c" reach={52} />
      <motion.span className="nvi-flame" initial={{ scale: 0, rotate: -25 }} animate={{ scale: [0, 1.35, 1], rotate: [-25, 8, 0] }} transition={{ duration: 0.6 }}><Flame size={26} fill="currentColor" /></motion.span>
      <span className="nvi-streaktext"><b><Words text={`${g.state.stats.streak} day streak!`} delay={0.12} step={0.06} /></b><motion.i initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SOFT, delay: 0.5 }}>Come back tomorrow to keep the fire going</motion.i></span>
    </div>
  )
}
function NovaSays({ notice }) {
  return (
    <div className="nvi-nova">
      <motion.img src="/art/22-novahead.webp" alt="" className="nvi-face" initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: [0, -4, 4, -2, 0] }} transition={{ scale: POP, rotate: { duration: 1.2, delay: 0.3 } }} />
      <span className="nvi-line"><i>Nova</i><b><Words text={notice.message} /></b></span>
    </div>
  )
}
function Expanded({ g, onClose, onLaunch }) {
  const s = g.state.stats
  const item = i => ({ initial: { opacity: 0, y: 12, scale: 0.94 }, animate: { opacity: 1, y: 0, scale: 1 }, transition: { ...SOFT, delay: 0.06 + i * 0.05 } })
  return (
    <div className="nvi-card" onClick={e => e.stopPropagation()}>
      <motion.div className="nvi-card-top" {...item(0)}>
        <LevelRing pct={g.levelPct} level={g.level} size={58} stroke={5} />
        <span className="nvi-card-title"><i>Explorer Level {g.level}</i><b><Odometer value={s.xp} /> <em>XP</em></b><small>{g.toNext} XP to Level {g.level + 1}</small></span>
        <motion.button className="nvi-close" aria-label="Close" onClick={onClose} whileHover={{ rotate: 90, scale: 1.1 }} whileTap={{ scale: 0.85 }}><X size={16} strokeWidth={3} /></motion.button>
      </motion.div>
      <motion.span className="nvi-bar nvi-bar-lg" {...item(1)}><motion.span className="nvi-barfill" initial={{ width: 0 }} animate={{ width: `${g.levelPct}%` }} transition={{ type: 'spring', stiffness: 90, damping: 18, delay: 0.25 }} /></motion.span>
      <div className="nvi-stats">
        {[['streak', Flame, s.streak, 'day streak', '#ff8a3c', '/journey'], ['today', Star, s.xpToday, 'XP today', '#f5b400', '/journey'], ['coins', Gem, s.coins, 'Nova Coins', '#38bdf8', '/profile'], ['badges', Trophy, s.badges, 'badges', '#a855f7', '/profile']].map(([k, I, v, l, tone, to], i) => (
          <motion.button key={k} className="nvi-stat" style={{ '--tone': tone }} {...item(2 + i)} whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.92 }} onClick={() => onLaunch(to)}><span className="nvi-stat-ico"><I size={16} /></span><b><Odometer value={v} /></b><i>{l}</i></motion.button>
        ))}
      </div>
      <motion.div className="nvi-actions" {...item(6)}>
        <button onClick={() => onLaunch('/journey')}><Map size={15} /> My Journey</button>
        <button onClick={() => onLaunch('/profile')}><UserCircle size={15} /> Profile</button>
      </motion.div>
    </div>
  )
}

function pickEvent({ state, streakEv, open }) {
  if (state.flash === 'levelup') return { kind: 'levelup', key: 'levelup' }
  if (open) return { kind: 'open', key: 'open' }
  if (streakEv) return { kind: 'streak', key: `streak-${streakEv}` }
  if (state.toasts.length) { const t = state.toasts[state.toasts.length - 1]; return { kind: 'xp', key: `xp-${t.id}`, toasts: state.toasts } }
  if (state.notices.length) { const n = state.notices[state.notices.length - 1]; return { kind: 'nova', key: `nova-${n.id}`, notice: n } }
  return null
}

export default function NovaIsland({ hidden = false, style }) {
  const g = useGame(); const { state } = g
  const nav = useNavigate()
  const reduce = useReducedMotion()
  const [hovered, setHovered] = useState(false)
  const [open, setOpen] = useState(false)
  const [streakEv, setStreakEv] = useState(null)
  const prevStreak = useRef(state.stats.streak)
  useEffect(() => { if (state.stats.streak > prevStreak.current) setStreakEv(state.stats.streak); prevStreak.current = state.stats.streak }, [state.stats.streak])

  const ev = pickEvent({ state, streakEv, open })
  const show = !hidden || (ev && ev.kind !== 'open')

  useEffect(() => {
    if (!ev || ev.kind === 'open') return
    if (ev.kind === 'levelup') { sfx.unlock(); buzz([30, 40, 60]) }
    if (ev.kind === 'xp') { sfx.xp(); buzz(12) }
    if (ev.kind === 'streak') buzz([20, 30, 20])
    const id = setTimeout(() => {
      if (ev.kind === 'levelup') { g.clearFlash(); state.toasts.forEach(t => g.clearToast(t.id)) }
      else if (ev.kind === 'streak') setStreakEv(null)
      else if (ev.kind === 'xp') { ev.toasts.forEach(t => g.clearToast(t.id)); if (state.flash === 'xp') g.clearFlash() }
      else g.clearNotice(ev.notice.id)
    }, SHOW_MS[ev.kind])
    return () => clearTimeout(id)
  }, [ev?.key]) // eslint-disable-line react-hooks/exhaustive-deps

  const close = useCallback(() => setOpen(false), [])
  const launch = useCallback(to => { setOpen(false); setTimeout(() => nav(to), 140) }, [nav])
  useEffect(() => {
    if (!open) return
    const onKey = e => { if (e.key === 'Escape') close() }; const onDown = () => close()
    window.addEventListener('keydown', onKey); window.addEventListener('pointerdown', onDown)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('pointerdown', onDown) }
  }, [open, close])
  useEffect(() => { if (hidden) setOpen(false) }, [hidden])

  /* Real width/height driven by springs, measured from the content, so text stays crisp while the island morphs. */
  const inner = useRef(null)
  const pw = useSpring(0, { stiffness: 380, damping: 32 }), ph = useSpring(0, { stiffness: 380, damping: 32 })
  const measured = useRef(false)
  useLayoutEffect(() => {
    if (!show) { measured.current = false; return }
    const el = inner.current; if (!el) return
    const apply = () => { const w = Math.ceil(el.scrollWidth) + 2, h = Math.ceil(el.scrollHeight) + 2; if (!w || !h) return; if (!measured.current || reduce) { pw.jump(w); ph.jump(h); measured.current = true } else { pw.set(w); ph.set(h) } }
    apply(); const ro = new ResizeObserver(apply); ro.observe(el); return () => ro.disconnect()
  }, [show, ev?.key, reduce]) // eslint-disable-line react-hooks/exhaustive-deps

  const mx = useMotionValue(0), my = useMotionValue(0)
  const rx = useSpring(useTransform(my, [-1, 1], [7, -7]), { stiffness: 220, damping: 18 }), ry = useSpring(useTransform(mx, [-1, 1], [-9, 9]), { stiffness: 220, damping: 18 })
  const wrap = useRef(null)
  const onMove = e => { if (open) return; const r = wrap.current?.getBoundingClientRect(); if (!r) return; mx.set(((e.clientX - r.left) / r.width) * 2 - 1); my.set(((e.clientY - r.top) / r.height) * 2 - 1) }
  const toggle = () => { if (hidden) return; if (!ev || ev.kind === 'open' || ev.kind === 'nova') { sfx.tap(); setOpen(o => !o) } }

  const content = useMemo(() => {
    if (!ev) return <Idle g={g} hovered={hovered && !open} />
    switch (ev.kind) {
      case 'xp': return <XpAward key={ev.key} g={g} toasts={ev.toasts} />
      case 'levelup': return <LevelUp key={ev.key} g={g} />
      case 'streak': return <StreakUp key={ev.key} g={g} />
      case 'nova': return <NovaSays key={ev.key} notice={ev.notice} />
      case 'open': return <Expanded key={ev.key} g={g} onClose={close} onLaunch={launch} />
      default: return null
    }
  }, [g, ev?.key, ev?.toasts?.length, hovered, open, close, launch]) // eslint-disable-line react-hooks/exhaustive-deps
  const view = ev?.kind ?? 'idle'

  /* The x:-50% below does the horizontal centring, not CSS: Motion writes the
     whole transform property, so a CSS translateX(-50%) is overwritten and the
     island hangs off to the right of centre. */
  return (
    <AnimatePresence>
      {show && (
        <motion.div ref={wrap} className={cn('nova-island', `is-${view}`)} style={{ ...safeT(14), ...style, x: '-50%', rotateX: reduce || open ? 0 : rx, rotateY: reduce || open ? 0 : ry, transformPerspective: 700 }}
          initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0, transition: { duration: 0.18 } }} transition={SPRING}
          onPointerMove={reduce ? undefined : onMove} onPointerEnter={() => setHovered(true)} onPointerLeave={() => { mx.set(0); my.set(0); setHovered(false) }} onPointerDown={e => e.stopPropagation()} onClick={toggle}
          role="button" tabIndex={0} aria-expanded={open} aria-label={open ? 'Progress card' : 'Your progress. Press to open'} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle() } }}>
          <motion.div key={ev?.key ?? 'idle'} className="nvi-squash" initial={reduce ? false : { scaleX: 1.06, scaleY: 0.92 }} animate={{ scaleX: 1, scaleY: 1 }} transition={{ type: 'spring', stiffness: 520, damping: 12 }}>
            <motion.div className="nvi-pill" style={{ width: pw, height: ph }}>
              <div ref={inner} className="nvi-inner"><AnimatePresence mode="popLayout" initial={false}><motion.div key={view} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.12 } }} transition={{ duration: 0.22 }}>{content}</motion.div></AnimatePresence></div>
              {!reduce && <motion.span key={'sheen' + (ev?.key ?? 'idle')} className="nvi-sheen" initial={{ x: '-140%', opacity: 0 }} animate={{ x: '240%', opacity: [0, 0.9, 0] }} transition={{ duration: 0.8, delay: 0.05 }} />}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
