import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import {
  Home as HomeIcon, BookOpen, Compass, Star, User, Users, Settings, ArrowRight, ChevronRight,
} from 'lucide-react'
import { openSettings } from './SettingsSheet.jsx'
import ParentGate from './ParentGate.jsx'
import { lead } from '../lib/motion.js'
import { sfx } from '../lib/sound.js'
import { cn } from '../lib/utils.js'

/* One nav list for the whole app. Home drew this inline and every other screen either
   carried a different six-item rail or nothing at all, so the same product had two
   disagreeing menus depending on where you stood. */
export const NAV_ITEMS = [
  { label: 'Home', icon: HomeIcon, to: '/home', match: ['/home'] },
  { label: 'Learn', icon: BookOpen, to: '/learn', match: ['/learn', '/missions'] },
  { label: 'Explore', icon: Compass, to: '/journey', match: ['/journey', '/extra'] },
  { label: 'Achievements', icon: Star, to: '/profile', match: ['/profile'] },
  { label: 'My Space', icon: User, to: '/switch', match: ['/switch'] },
  { label: 'Parent Zone', icon: Users, to: '/parent', match: ['/parent'], gated: true },
  { label: 'Settings', icon: Settings, to: null },
]

const FRAME = 'linear-gradient(180deg,rgba(22,26,78,.88) 0%,rgba(17,21,62,.9) 55%,rgba(12,15,44,.93) 100%)'
const CARD_DARK = 'linear-gradient(160deg,#1e2a72,#16205a)'

/* No handle where a slide-out makes no sense.
 *
 * Two reasons a screen opts out. Either it has nowhere to navigate to yet -- signed out,
 * or mid-onboarding -- or it already draws a rail of its own, and a second one sliding
 * over the first is the bug this list exists to prevent. Home pins this very component
 * open; Welcome, Switch Student, Extra Learning and the whole Parent Zone each carry
 * their own; Journey's Switch Subject panel starts at y=400, exactly where the handle
 * sits, so the handle landed on top of it.
 *
 * Keep this in step with the screens that render <SideRail> or <ParentRail>. */
const OWN_RAIL = ['/home', '/welcome', '/switch', '/extra', '/journey']
const HIDDEN = p =>
  p === '/' || OWN_RAIL.includes(p) || p.startsWith('/parent') || p.startsWith('/onboarding')

function Panel({ pinned, onNavigate, onGate }) {
  const nav = useNavigate()
  const { pathname } = useLocation()
  const isOn = it => (it.match ?? []).some(m => pathname.startsWith(m))
  return (
    <div className={cn('h-full flex flex-col px-4 pt-6', pinned ? '' : 'w-[205px]')} style={{ paddingBottom: 78, background: FRAME }}>
      <div className="flex items-center gap-3">
        <span className="w-[46px] h-[46px] rounded-[15px] grid place-items-center shrink-0" style={{ background: 'linear-gradient(140deg,#8b5cf6,#5b6cff)', boxShadow: '0 10px 24px -10px rgba(124,92,255,.9)' }}>
          <span className="w-[19px] h-[19px] rounded-full border-[4px] border-white/95" />
        </span>
        <span className="leading-none">
          <span className="block font-display font-extrabold text-[21px] text-white">Kidsverse<span className="text-sky-300">+</span></span>
          <span className="block mt-1 text-[8px] font-extrabold tracking-[0.18em] text-indigo-200/80">LEARN • GROW • ACHIEVE</span>
        </span>
      </div>

      <nav className="mt-7 flex flex-col gap-[6px]">
        {NAV_ITEMS.map((it, i) => {
          const on = isOn(it)
          return (
            <motion.button key={it.label}
              className={cn('relative h-[50px] rounded-[15px] flex items-center gap-3 px-4 font-display font-bold text-[17px] transition-colors',
                on ? 'text-white' : 'text-indigo-200/85 hover:text-white')}
              onClick={() => {
                sfx.tap()
                if (it.gated) onGate()
                else if (it.to) { nav(it.to); onNavigate?.() }
                else { openSettings(); onNavigate?.() }
              }}
              initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: (pinned ? lead(0.3) : 0.04) + i * 0.03 }}>
              {on && <span className="absolute inset-0 rounded-[15px]" style={{ background: 'linear-gradient(100deg,#7c5cff,#5b6cff)', boxShadow: '0 10px 24px -12px rgba(124,92,255,1)' }} />}
              <span className="relative z-10 grid place-items-center"><it.icon size={21} strokeWidth={on ? 2.5 : 2} /></span>
              <span className="relative z-10">{it.label}</span>
            </motion.button>
          )
        })}
      </nav>

      <motion.div className="mt-auto rounded-[20px] p-4 text-center" style={{ background: CARD_DARK, border: '1px solid rgba(150,170,255,.22)' }}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: pinned ? lead(0.6) : 0.2 }}>
        <img src="/art/hd/nova-v2.webp" alt="" className="w-[96px] mx-auto floaty" />
        <div className="mt-1 font-display font-extrabold text-[19px] text-white">Nova</div>
        <div className="text-[12px] font-semibold text-indigo-200/85 leading-tight">Your AI Learning Buddy</div>
        <button className="mt-3 w-full h-[36px] rounded-full text-white text-[13px] font-extrabold flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(100deg,#6d3ae0,#2f6fe0)' }} onClick={() => { sfx.tap(); window.dispatchEvent(new Event('kv:agent')) }}>
          Chat with Nova <ArrowRight size={14} strokeWidth={3} />
        </button>
      </motion.div>
    </div>
  )
}

/**
 * The app's navigation rail.
 *
 * `pinned` is Home: the rail is part of that screen's layout and always open. Everywhere
 * else it slides in from a handle on the left edge — the handle sits mid-height rather
 * than in a corner because every other corner already holds a logo, a back control or a
 * user chip, and a drawer that covers those is worse than no drawer.
 */
export default function NavDrawer({ pinned = false }) {
  const nav = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [gate, setGate] = useState(false)

  /* A route change means the drawer did its job; leaving it open would cover the screen
     the child just asked for. */
  useEffect(() => { setOpen(false) }, [pathname])
  useEffect(() => {
    if (!open) return
    const esc = e => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [open])

  if (pinned) {
    return (
      <motion.aside className="absolute top-0 bottom-0 z-20"
        style={{ left: 'calc(0px - var(--bleed, 0px))', width: 205 }}
        initial={{ x: -60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 26 }}>
        <Panel pinned onGate={() => setGate(true)} />
        {gate && <ParentGate onCancel={() => setGate(false)} onPass={() => { setGate(false); nav('/parent') }} />}
      </motion.aside>
    )
  }

  if (HIDDEN(pathname)) return null

  return (
    <>
      {/* the handle: a slim tab on the left edge, clear of every corner control */}
      <motion.button type="button" aria-label="Open menu" aria-expanded={open}
        className="absolute top-1/2 z-40 w-[26px] h-[92px] rounded-r-[14px] grid place-items-center text-white/90"
        /* centred with a margin, not -translate-y-1/2: motion writes its own inline
           transform for the slide-in and wipes the Tailwind one, which left the handle
           sitting 46px below centre. */
        style={{ left: 'calc(0px - var(--bleed, 0px))', marginTop: -46, background: FRAME, boxShadow: '0 10px 26px -10px rgba(20,15,80,.9)' }}
        initial={{ x: -26, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }}
        whileHover={{ width: 32 }}
        onClick={() => { sfx.tap(); setOpen(o => !o) }}>
        <ChevronRight size={18} strokeWidth={3} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            {/* Nothing visual. The screen behind stays exactly as it was -- no wash, no
                blur -- because the drawer sliding over it is already the whole signal that
                a menu opened. This layer exists only so a tap anywhere outside closes it. */}
            <div className="absolute inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.aside className="absolute top-0 bottom-0 left-0 z-40"
              initial={{ x: -215 }} animate={{ x: 0 }} exit={{ x: -215 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}>
              <Panel onNavigate={() => setOpen(false)} onGate={() => setGate(true)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      {gate && <ParentGate onCancel={() => setGate(false)} onPass={() => { setGate(false); setOpen(false); nav('/parent') }} />}
    </>
  )
}
