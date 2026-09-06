import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronLeft, Target, PieChart, Timer, Lock, Gamepad2, BookOpen, TrendingUp, Trophy, Award } from 'lucide-react'
import Scene, { Child } from '../components/Scene.jsx'
import Page, { Stack, Item } from '../components/Page.jsx'
import Logo from '../components/Logo.jsx'
import { Panel, Card } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import Dock, { DOCK_ITEMS } from '../components/Dock.jsx'
import { Bar } from '../components/Widgets.jsx'
import { LEAGUE } from '../data/battle.jsx'
import { useGame } from '../state/GameProvider.jsx'
import { bleedL, bleedR, safeT, safeB } from '../components/Stage.jsx'
import { sfx } from '../lib/sound.js'
import { cn } from '../lib/utils.js'

const TABS = ['Friends', 'India', 'Global']

export default function Leaderboard() {
  const nav = useNavigate()
  const g = useGame(); const { name, face } = g.state.profile
  const [tab, setTab] = useState('India')
  const rows = tab === 'Friends' ? LEAGUE.slice(0, 5) : tab === 'Global' ? LEAGUE.map(([n, p, f]) => [n, p * 3, f]) : LEAGUE
  return (
    <Page>
      <Scene name="league" />
      <motion.div className="absolute" style={{ ...bleedL(20), ...safeT(20) }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}><Logo variant="plus" /></motion.div>
      <Dock items={DOCK_ITEMS} tiles className="flex-col w-[100px] top-[110px] rounded-[30px]" style={{ left: 'calc(25px - var(--bleed, 0px))', bottom: 'auto' }} active="challenge" />
      <motion.div className="absolute pill h-[64px] px-4 gap-3" style={{ ...bleedL(20), ...safeB(30) }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}><span className="icon-orb w-[42px] h-[42px] text-gold" style={{ background: '#fef3c7' }}><Award size={22} /></span><span className="leading-tight"><span className="block font-extrabold text-[16px] text-ink">Explorer</span><span className="block text-[13px] font-bold text-ink-3">Level {g.level}</span><Bar value={g.levelPct / 100} h={5} className="mt-1 w-[80px]" /></span></motion.div>
      <Child screen="league" delay={0.5} amp={7} />

      <motion.button className="absolute left-[290px] top-[22px] pill h-[44px] px-4 text-[15px] font-bold text-ink" onClick={() => { sfx.tap(); nav('/challenge') }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}><ChevronLeft size={18} /> Back to Challenge</motion.button>
      <Stack className="absolute left-[305px] top-[72px]" start={0.2}>
        <Item className="flex items-center gap-4"><h1 className="font-display font-extrabold text-[54px] leading-none text-ink uppercase">Learning League</h1><img src="/art/planet-sm.webp" alt="" className="w-[56px] floaty" /></Item>
        <Item className="mt-1 text-[20px] font-semibold text-ink-2">Rank grows through learning.</Item>
        <Item v="pop" className="mt-3"><div className="pill h-[56px] p-1 w-[430px]">{TABS.map(t => <button key={t} className={cn('relative flex-1 h-full rounded-full font-display font-extrabold text-[18px] uppercase tracking-wide transition-colors', tab === t ? 'text-white' : 'text-ink-2')} onClick={() => { sfx.tap(); setTab(t) }}>{tab === t && <motion.span layoutId="lg-tab" className="absolute inset-0 rounded-full" style={{ background: 'var(--grad-primary)' }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}<span className="relative z-10">{t}</span></button>)}</div></Item>
      </Stack>
      <motion.img src="/art/crops/podium.webp" alt="" className="absolute left-[300px] top-[225px] w-[500px] rounded-[20px]" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, type: 'spring', stiffness: 160, damping: 20 }} />

      <Panel className="absolute left-[500px] top-[540px] w-[290px] h-[240px] p-4" initial="hidden" animate="show">
        <div className="text-[14px] font-extrabold text-primary-ink uppercase tracking-wide">Top performers</div>
        <Stack className="mt-2 flex flex-col gap-2" start={0.9}>{[[Target, '#ef4444', 'Accuracy improved', 'The best learners focus and answer with care.'], [PieChart, '#3b82f6', 'Fractions stronger', 'Keep practising to build your skills.'], [Timer, '#f59e0b', '5-minute Fraction Mission', 'Sharpen your fraction skills daily!']].map(([I, c, t, s]) => <Item key={t} v="soft" className="card px-3 py-2 flex items-center gap-3"><span className="icon-orb w-[34px] h-[34px]" style={{ color: c, background: `${c}1f` }}><I size={18} /></span><span className="leading-tight"><span className="block text-[14px] font-extrabold text-primary-ink">{t}</span><span className="block text-[11px] font-semibold text-ink-3">{s}</span></span></Item>)}</Stack>
      </Panel>

      <Panel className="absolute left-[860px] top-[95px] w-[450px] h-[655px] p-5" initial="hidden" animate="show">
        <div className="font-display font-extrabold text-[24px] text-ink uppercase">Ranking — {tab}</div>
        <div className="mt-3 grid grid-cols-[60px_1fr_90px] text-[11px] font-extrabold tracking-wider text-ink-3 uppercase px-3"><span>Rank</span><span>Learner</span><span className="text-right">Points</span></div>
        <AnimatePresence mode="wait">
          <motion.div key={tab} className="mt-2 flex flex-col gap-[6px]" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
            {rows.map(([n, p, f], i) => <div key={n} className="card h-[46px] px-3 grid grid-cols-[60px_1fr_90px] items-center"><span className={cn('font-display font-extrabold text-[20px]', i === 0 ? 'text-gold' : i === 1 ? 'text-ink-3' : i === 2 ? 'text-orange-500' : 'text-ink')}>{i + 1}</span><span className="flex items-center gap-2 text-[16px] font-bold text-ink"><img src={`/art/kid${f}-face-sm.webp`} alt="" className="w-[30px] h-[30px] rounded-full object-cover" />{n}</span><span className="text-right font-display font-extrabold text-[17px] text-ink">{p.toLocaleString()}</span></div>)}
            <div className="text-center text-ink-3 leading-none">•••</div>
            <motion.div className="h-[52px] px-3 grid grid-cols-[60px_1fr_90px] items-center rounded-[16px] text-white" style={{ background: 'var(--grad-primary)', boxShadow: 'var(--glow-primary)' }} animate={{ scale: [1, 1.02, 1] }} transition={{ duration: 2, repeat: Infinity }}><span className="font-display font-extrabold text-[22px]">12</span><span className="flex items-center gap-2 text-[16px] font-extrabold"><img src={`/art/kid${face}-face-sm.webp`} alt="" className="w-[32px] h-[32px] rounded-full object-cover border-2 border-white" />{name}_Star</span><span className="text-right font-display font-extrabold text-[17px]">3,150</span></motion.div>
            <div className="text-center text-ink-3 leading-none">•••</div>
            <div className="card h-[46px] px-3 grid grid-cols-[60px_1fr_90px] items-center"><span className="font-display font-extrabold text-[20px] text-ink">50</span><span className="flex items-center gap-2 text-[16px] font-bold text-ink"><img src="/art/kid2-face-sm.webp" alt="" className="w-[30px] h-[30px] rounded-full object-cover" />CuriousCat</span><span className="text-right font-display font-extrabold text-[17px] text-ink">1,150</span></div>
          </motion.div>
        </AnimatePresence>
      </Panel>

      <motion.img src="/art/crops/trophy.webp" alt="" className="absolute top-[130px] w-[290px] rounded-[24px]" style={bleedR(40)} initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }} transition={{ opacity: { delay: 0.17 }, scale: { delay: 0.17, type: 'spring' }, y: { duration: 4, repeat: Infinity, ease: 'easeInOut' } }} />
      <Panel className="absolute top-[600px] w-[310px] p-4 flex items-center gap-3" style={bleedR(30)} initial="hidden" animate="show"><span className="icon-orb w-[50px] h-[50px] text-primary-ink"><Lock size={24} /></span><span className="leading-tight"><span className="block font-display font-extrabold text-[17px] text-ink uppercase">Privacy safe</span><span className="block text-[13px] font-semibold text-ink-2">No real names, photos, school or location shared.</span></span></Panel>
      <motion.div className="absolute top-[705px]" style={bleedR(30)} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}><Button size="md" arrow className="w-[310px] h-[60px] uppercase text-[20px]" sound="whoosh" onClick={() => nav('/learn')}>How to climb</Button></motion.div>

      <Panel className="absolute left-[580px] top-[805px] w-[970px] h-[92px] px-6 grid grid-cols-4 items-center divide-x divide-[var(--line)]" initial="hidden" animate="show">
        {[[Gamepad2, '#7c3aed', 'Play challenges', 'Win points'], [BookOpen, '#a855f7', 'Learn daily', 'Build streaks'], [TrendingUp, '#22c55e', 'Improve skills', 'Climb ranks'], [Trophy, '#f59e0b', 'Stay consistent', 'Be a champion']].map(([I, c, t, s]) => <div key={t} className="flex items-center gap-3 px-3"><span className="icon-orb w-[44px] h-[44px]" style={{ color: c, background: `${c}1f` }}><I size={22} /></span><span className="leading-tight"><span className="block text-[15px] font-extrabold text-ink">{t}</span><span className="block text-[13px] font-semibold text-ink-3">{s}</span></span></div>)}
      </Panel>
    </Page>
  )
}
