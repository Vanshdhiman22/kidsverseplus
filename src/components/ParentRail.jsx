import React from 'react'
import { motion } from 'motion/react'
import { useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, BarChart3, CalendarDays, Users, Settings, LogOut, ChevronRight } from 'lucide-react'
import Logo from './Logo.jsx'
import RailBack from './RailBack.jsx'
import { useGame } from '../state/GameProvider.jsx'
import { gradeLabel } from '../data/catalog.js'
import { openSettings } from './SettingsSheet.jsx'
import { bleedL } from './Stage.jsx'
import { sfx } from '../lib/sound.js'
import { cn } from '../lib/utils.js'

/* The grown-up side gets grown-up navigation.
 *
 * The design sheets reuse the child's rail (Home / Learn / Explore / Goals /
 * Rewards / Profile) on the parent screens, which sends a parent into the
 * child's app the moment they click anything. This is a deliberate departure:
 * the parent zone navigates the parent zone, and carries the child switcher,
 * because "which of my children am I looking at" is the question every one of
 * these screens depends on. */
const ITEMS = [
  { label: 'Overview', icon: LayoutDashboard, to: '/parent' },
  { label: 'Topic Evidence', icon: BarChart3, to: '/parent/evidence' },
  { label: 'Weekly Plan', icon: CalendarDays, to: '/parent/plan' },
  { label: 'Switch Child', icon: Users, to: '/switch' },
]

export default function ParentRail({ children }) {
  const nav = useNavigate()
  const { pathname } = useLocation()
  const g = useGame()
  const { name, grade, board, face } = g.state.profile
  const kids = g.state.children ?? []

  return (
    <motion.aside className="absolute top-0 bottom-0 z-20 flex flex-col pt-6 pb-5 glass glass-soft"
      style={{ left: 'calc(0px - var(--bleed, 0px))', width: 'calc(215px + var(--bleed, 0px))',
        paddingLeft: 'calc(14px + var(--bleed, 0px))', paddingRight: 14, borderRadius: '0 34px 34px 0', borderLeft: 0 }}
      initial={{ x: -110, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 24 }}>
      <RailBack />
      <div className="px-1"><Logo variant="planet" tagline="PARENT ZONE" /></div>

      {/* who you are looking at, and one tap to change it */}
      <button className="mt-5 card p-2 flex items-center gap-2 text-left" onClick={() => { sfx.tap(); nav('/switch', { state: { from: 'parent' } }) }}>
        <img src={`/art/kid${face}-face-sm.webp`} alt="" className="w-[42px] h-[42px] rounded-full object-cover border-2 border-white shrink-0" />
        <span className="flex-1 leading-tight min-w-0">
          <span className="block font-display font-extrabold text-[17px] text-ink truncate">{name}</span>
          <span className="block text-[11px] font-bold text-ink-3 truncate">{gradeLabel(grade)} · {board}</span>
        </span>
        <ChevronRight size={16} className="text-ink-3 shrink-0" />
      </button>
      {kids.length > 1 && (
        <div className="mt-1 px-1 text-[11px] font-bold text-ink-3">{kids.length} children · tap to switch</div>
      )}

      <nav className="mt-4 flex flex-col gap-1">
        {ITEMS.map((it, i) => {
          const on = pathname === it.to
          return (
            <motion.button key={it.label}
              className={cn('relative h-[54px] rounded-[16px] flex items-center gap-3 px-3 font-display font-bold text-[17px] transition-colors',
                on ? 'text-primary-ink' : 'text-ink-2 hover:text-primary-ink')}
              /* Switch Child is the one item that leaves the parent zone's own routes, so it
                 has to say who is asking -- that screen serves a parent and a child and
                 must not hand the parent the child's rail. */
              onClick={() => { sfx.tap(); nav(it.to, it.to === '/switch' ? { state: { from: 'parent' } } : undefined) }}
              initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.06 + i * 0.03 }}>
              {on && <motion.span layoutId="prail-pill" className="absolute inset-0 rounded-[16px] card" style={{ borderColor: 'var(--primary)' }} transition={{ type: 'spring', stiffness: 350, damping: 30 }} />}
              <span className="relative z-10"><it.icon size={20} strokeWidth={on ? 2.5 : 2} /></span>
              <span className="relative z-10">{it.label}</span>
            </motion.button>
          )
        })}
        <button className="h-[54px] rounded-[16px] flex items-center gap-3 px-3 font-display font-bold text-[17px] text-ink-2 hover:text-primary-ink"
          onClick={() => { sfx.tap(); openSettings() }}><Settings size={20} /> Settings</button>
      </nav>

      <div className="mt-auto">
        {children}
        <button className="mt-3 w-full h-[48px] rounded-[16px] flex items-center justify-center gap-2 text-[15px] font-extrabold text-primary-ink card"
          onClick={() => { sfx.whoosh(); nav('/home') }}><LogOut size={18} /> Back to {name}'s app</button>
      </div>
    </motion.aside>
  )
}
