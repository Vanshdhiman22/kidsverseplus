import React from 'react'
import { motion } from 'motion/react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Home, BookOpen, ClipboardCheck, Trophy, User, Compass, Heart, Star, Map } from 'lucide-react'
import { cn } from '../lib/utils.js'
import { sfx } from '../lib/sound.js'

export const DOCK_ITEMS = [
  { id: 'home', label: 'Home', sub: 'Your hub', to: '/home', icon: Home, match: ['/home', '/welcome'] },
  { id: 'learn', label: 'Learn', sub: 'Build skills', to: '/learn', icon: BookOpen, match: ['/learn', '/missions', '/journey'] },
  { id: 'test', label: 'Test', sub: 'Check understanding', to: '/tests', icon: ClipboardCheck, match: ['/tests'] },
  { id: 'challenge', label: 'Challenge', sub: 'Level up', to: '/challenge', icon: Trophy, match: ['/challenge'] },
  { id: 'profile', label: 'Profile', sub: 'Your journey', to: '/profile', icon: User, match: ['/profile'] },
]
export const DOCK_EXPLORE = [
  DOCK_ITEMS[0], DOCK_ITEMS[1],
  { id: 'explore', label: 'Explore', to: '/learn', icon: Compass, match: ['/explore'] },
  { id: 'goals', label: 'Goals', to: '/onboarding/goals', icon: Heart, match: ['/goals'] },
  { id: 'rewards', label: 'Rewards', to: '/profile', icon: Star, match: ['/rewards'] },
  DOCK_ITEMS[4],
]
export const DOCK_JOURNEY = [
  DOCK_ITEMS[0],
  { id: 'journey', label: 'Journey', to: '/journey', icon: Map, match: ['/journey'] },
  { ...DOCK_ITEMS[1], match: ['/learn', '/missions'] },
  DOCK_ITEMS[2], DOCK_ITEMS[3], DOCK_ITEMS[4],
]

export default function Dock({ items = DOCK_ITEMS, sub = false, className, style, compact = false, active: forced, spread = false, tiles = false }) {
  const { pathname } = useLocation()
  const nav = useNavigate()
  const activeId = forced ?? (items.find(i => i.match.some(m => pathname.startsWith(m)))?.id ?? items[0].id)
  const bottom = `calc(${style?.bottom ?? 22}px + var(--safe-b, 0px))`
  if (tiles) return (
    <motion.nav className={cn('dock absolute gap-1 p-1.5', className)} style={{ ...style, bottom }} initial={{ y: 90, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 24, delay: 0.35 }}>
      {items.map(it => {
        const active = it.id === activeId; const Icon = it.icon
        return (
          <button key={it.id} className="relative w-[100px] h-[72px] rounded-[20px] flex flex-col items-center justify-center gap-1 font-display font-bold text-[15px] transition-colors" style={{ color: active ? 'var(--dock-active-ink)' : 'var(--dock-ink)' }} onClick={() => { sfx.tap(); nav(it.to) }} onMouseEnter={() => sfx.hover()}>
            {active && <motion.span layoutId="dock-pill" className="dock-pill" style={{ borderRadius: 20 }} transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
            <span className="relative z-10"><Icon size={26} strokeWidth={active ? 2.4 : 2} /></span>
            <span className="relative z-10">{it.label}</span>
          </button>
        )
      })}
    </motion.nav>
  )
  return (
    <motion.nav
      className={cn('dock absolute left-1/2 -translate-x-1/2', className)}
      style={{ ...style, bottom }}
      initial={{ y: 90, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 24, delay: 0.35 }}
    >
      {items.map(it => {
        const active = it.id === activeId
        const Icon = it.icon
        return (
          <button
            key={it.id}
            className={cn('dock-item', compact && 'px-[22px]', spread && 'flex-1 justify-center')}
            data-active={active}
            onClick={() => { sfx.tap(); nav(it.to) }}
            onMouseEnter={() => sfx.hover()}
          >
            {active && <motion.span layoutId="dock-pill" className="dock-pill" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
            <motion.span className="relative z-10 grid place-items-center" animate={active ? { scale: [1, 1.25, 1], rotate: [0, -8, 0] } : { scale: 1 }} transition={{ duration: 0.5 }}>
              <Icon size={26} strokeWidth={active ? 2.4 : 2} />
            </motion.span>
            <span className="relative z-10 flex flex-col leading-none">
              <span>{it.label}</span>
              {sub && it.sub && <span className="text-[13px] font-body font-semibold opacity-70 mt-1">{it.sub}</span>}
            </span>
            {active && <motion.span layoutId="dock-underline" className="absolute -bottom-[10px] left-1/2 -translate-x-1/2 w-[46px] h-[4px] rounded-full" style={{ background: 'var(--grad-primary)' }} />}
          </button>
        )
      })}
    </motion.nav>
  )
}
