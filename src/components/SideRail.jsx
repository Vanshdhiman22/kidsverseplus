import React from 'react'
import { motion } from 'motion/react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Home, BookOpen, Compass, Heart, Star, User } from 'lucide-react'
import Logo from './Logo.jsx'
import { Bar } from './Widgets.jsx'
import { cn } from '../lib/utils.js'
import { sfx } from '../lib/sound.js'

const ITEMS = [
  { id: 'home', label: 'Home', to: '/home', icon: Home, match: ['/home', '/welcome'] },
  { id: 'learn', label: 'Learn', to: '/learn', icon: BookOpen, match: ['/learn', '/missions'] },
  { id: 'explore', label: 'Explore', to: '/journey', icon: Compass, match: ['/journey'] },
  { id: 'goals', label: 'Goals', to: '/onboarding/goals', icon: Heart, match: ['/goals'] },
  { id: 'rewards', label: 'Rewards', to: '/profile', icon: Star, match: ['/rewards'] },
  { id: 'profile', label: 'Profile', to: '/profile', icon: User, match: ['/profile'] },
]

/* Vertical navigation rail used by the hub-style screens. */
export default function SideRail({ active: forced, className, logo = 'planet' }) {
  const { pathname } = useLocation(); const nav = useNavigate()
  const active = forced ?? (ITEMS.find(i => i.match.some(m => pathname.startsWith(m)))?.id ?? 'home')
  return (
    <motion.aside className={cn('absolute top-0 bottom-0 glass glass-soft flex flex-col pt-6 pb-5', className)} style={{ borderRadius: '0 34px 34px 0', borderLeft: 0, left: 'calc(0px - var(--bleed, 0px))', width: 'calc(215px + var(--bleed, 0px))', paddingLeft: 'calc(16px + var(--bleed, 0px))', paddingRight: 16 }} initial={{ x: -120, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 160, damping: 22 }}>
      <div className="px-2 flex flex-col items-center text-center">
        <img src="/art/planet-sm.webp" alt="" className="w-[110px] floaty" />
        <div className="font-display font-extrabold text-[26px] leading-none grad-text uppercase tracking-wide">Kidsverse</div>
        <div className="mt-1 text-[10px] font-extrabold tracking-[0.2em] text-ink-3">LEARN • EXPLORE • ACHIEVE</div>
      </div>
      <nav className="mt-6 flex flex-col gap-2">
        {ITEMS.map((it, i) => {
          const on = it.id === active; const Icon = it.icon
          return (
            <motion.button key={it.id} className={cn('relative h-[66px] rounded-[20px] flex items-center gap-4 px-5 text-[20px] font-display font-bold transition-colors', on ? 'text-primary-ink' : 'text-ink-2 hover:text-primary-ink')} onClick={() => { sfx.tap(); nav(it.to) }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.06 }}>
              {on && <motion.span layoutId="rail-pill" className="absolute inset-0 rounded-[20px] card" style={{ borderColor: 'var(--primary)' }} transition={{ type: 'spring', stiffness: 350, damping: 30 }} />}
              <span className="relative z-10"><Icon size={26} strokeWidth={on ? 2.4 : 2} /></span>
              <span className="relative z-10">{it.label}</span>
            </motion.button>
          )
        })}
      </nav>
      <div className="mt-auto card px-4 py-4 flex items-center gap-3">
        <img src="/art/planet-sm.webp" alt="" className="w-[46px]" />
        <div className="flex-1">
          <div className="text-[15px] font-extrabold text-ink leading-tight">Small Steps<br />Big Futures</div>
          <Bar value={0.62} h={6} className="mt-2" delay={0.27} />
        </div>
      </div>
    </motion.aside>
  )
}
