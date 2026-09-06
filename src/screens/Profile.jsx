import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft, Bell, CalendarDays, CheckCircle2, BookOpen, Swords, Flame, ChevronRight, Star, Map, Trophy, Ticket, Medal, Flag, Mic, Check, ShieldCheck } from 'lucide-react'
import Scene, { Child } from '../components/Scene.jsx'
import Page, { Stack, Item } from '../components/Page.jsx'
import { TopBar, UserChip, IconPill } from '../components/TopBar.jsx'
import { Panel, Card } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import Dock from '../components/Dock.jsx'
import { Counter, Sparkles } from '../components/Widgets.jsx'
import { useGame } from '../state/GameProvider.jsx'
import { gradeLabel } from '../data/catalog.js'
import { sfx } from '../lib/sound.js'
import { MyCardSection } from '../components/StudentCard.jsx'
import { onColor, useAccent } from '../lib/accent.js'

export const STATS = [[CalendarDays, '#3b82f6', 'Together for', 42, 'days'], [CheckCircle2, '#f59e0b', 'Missions', 32, 'completed'], [BookOpen, '#a855f7', 'Reading', 18, 'sessions'], [Swords, '#38bdf8', 'Bot Battles', 6, 'battles']]
export const MILESTONES = [[Flag, '#22c55e', 'Entered Number Forest', 'You began your adventure!'], [BookOpen, '#3b82f6', 'Unlocked your first book', 'Great start, champion!'], [Mic, '#7c3aed', 'Cracked your first reading challenge', 'Words make you stronger!'], [Trophy, '#f59e0b', 'Earned your first trophy', 'Keep going, superstar!']]
const MENU = [[Star, '#f59e0b', 'My Interests', 'Topics & themes you love', '/onboarding/interests'], [Map, '#3b82f6', 'My Journey', "See how far you've come", '/profile/journey'], [Trophy, '#7c3aed', 'My Achievements', 'Badges & trophies', null], [Flame, '#f97316', 'My Streak', 'Keep the flame going', null, '12 days'], [Ticket, '#a855f7', 'Break Passes', 'Recharge and come back', null, '2'], [Medal, '#f59e0b', 'My Best Scores', 'Top performance', '/challenge/leaderboard', 'View']]
const BADGES = ['#7c3aed', '#3b82f6', '#22c55e', '#ef4444', '#8b5cf6', '#f59e0b']

export default function Profile() {
  const nav = useNavigate()
  const g = useGame(); const { name, face, grade, board } = g.state.profile; const { streak, badges } = g.state.stats
  const ac = useAccent()
  return (
    <Page>
      <Scene name="profile" />
      <TopBar back={false} logo="planet" right={<><IconPill className="relative"><Bell size={22} /><span className="absolute top-3 right-3 w-[9px] h-[9px] rounded-full bg-red-500 border-2 border-white" /></IconPill><UserChip name={`Hi, ${name}!`} sub="Keep Exploring!" face={face} /></>} showControls={false} />

      <Panel soft className="absolute left-[115px] top-[95px] w-[665px] h-[465px] p-8" initial="hidden" animate="show">
        <Sparkles n={5} seed={31} />
        <button className="flex items-center gap-3 text-[16px] font-bold text-ink" onClick={() => { sfx.tap(); nav('/home') }}><ArrowLeft size={20} /> Back to Home</button>
        <h1 className="mt-3 font-display font-extrabold text-[72px] leading-none text-ink uppercase">{name}</h1>
        <div className="mt-1 flex items-center gap-2 text-[22px] font-bold text-ink-2">{gradeLabel(grade)} • {board} <ShieldCheck size={22} className="text-sky-500" /></div>
        <Card className="absolute left-6 bottom-6 w-[280px] h-[92px] px-5 flex items-center gap-4"><img src="/art/22-novahead.webp" alt="" className="w-[54px] floaty" /><span className="leading-tight"><span className="block font-display font-extrabold text-[22px] text-ink uppercase">Nova</span><span className="block text-[14px] font-semibold text-ink-3">Your learning buddy</span></span></Card>
      </Panel>
      <Child screen="profile" delay={0.5} amp={6} />
      <Panel className="absolute left-[120px] top-[565px] w-[650px] h-[270px] px-5 py-2 flex flex-col justify-around" initial="hidden" animate="show">
        {MENU.map(([I, c, t, s, to, v]) => <button key={t} className="h-[42px] flex items-center gap-3 rounded-xl px-2 hover:bg-[var(--lavender)] transition-colors text-left" onClick={() => { sfx.tap(); if (to) nav(to) }}><span className="icon-orb w-[34px] h-[34px]" style={{ color: c, background: `${c}1f` }}><I size={18} /></span><span className="flex-1 leading-tight"><span className="block text-[16px] font-extrabold text-ink">{t}</span><span className="block text-[12px] font-semibold text-ink-3">{s}</span></span>{v && <span className="text-[15px] font-bold text-ink-2">{t === 'My Streak' ? `${streak} days` : v}</span>}<ChevronRight size={18} className="text-ink-3" /></button>)}
      </Panel>

      <Panel className="absolute left-[815px] top-[95px] w-[775px] h-[225px] p-5" initial="hidden" animate="show">
        <div className="grid grid-cols-4 divide-x divide-[var(--line)]">{STATS.map(([I, c0, t, v, u]) => { const c = ac(c0); return <div key={t} className="flex flex-col items-center text-center"><I size={34} style={{ color: c }} /><span className="mt-2 text-[16px] font-bold text-ink-2">{t}</span><span className="font-display font-extrabold text-[40px] leading-none" style={{ color: c }}><Counter to={v} delay={0.24} /></span><span className="text-[15px] font-bold text-ink-3">{u}</span></div> })}</div>
        <Card hover className="mt-4 h-[48px] px-5 flex items-center gap-3 text-[16px] font-bold text-ink"><Flame size={20} className="text-orange-500" fill="currentColor" /> Best streak <span className="ml-auto font-extrabold">12 days</span><ChevronRight size={18} className="text-ink-3" /></Card>
      </Panel>
      <Panel className="absolute left-[815px] top-[335px] w-[775px] h-[255px] p-5" initial="hidden" animate="show">
        <div className="font-display font-extrabold text-[15px] text-ink uppercase tracking-wide">Our milestones</div>
        <div className="relative mt-2 mx-10 h-[3px] rounded-full" style={{ background: 'var(--grad-primary)' }}>{[0, 1, 2, 3].map(i => <motion.span key={i} className="absolute -top-[9px] w-[20px] h-[20px] rounded-full grid place-items-center text-white" style={{ left: `calc(${i * 33.3}% - 10px)`, background: 'var(--grad-primary)' }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.09 + i * 0.15, type: 'spring' }}><Check size={12} strokeWidth={4} /></motion.span>)}</div>
        <Stack className="mt-5 grid grid-cols-4 gap-4" start={0.8} delay={0.1}>{MILESTONES.map(([I, c, t, s]) => <Item key={t} v="pop"><Card hover className="h-[160px] p-3 flex flex-col items-center text-center"><span className="icon-orb w-[58px] h-[58px]" style={{ color: c, background: `${c}1f` }}><I size={30} /></span><span className="mt-2 text-[14px] font-extrabold text-ink leading-tight">{t}</span><span className="mt-1 text-[12px] font-semibold text-ink-3 leading-tight">{s}</span></Card></Item>)}</Stack>
      </Panel>
      <Panel className="absolute left-[815px] top-[605px] w-[775px] h-[150px] p-5" initial="hidden" animate="show">
        <div className="font-display font-extrabold text-[15px] text-ink uppercase tracking-wide">Badge shelf</div>
        <div className="mt-3 flex items-center gap-4">{BADGES.map((c, i) => <motion.span key={c} className="w-[76px] h-[80px] grid place-items-center" style={{ color: onColor(c), background: `linear-gradient(160deg, ${c}, ${c}99)`, clipPath: 'polygon(50% 0, 100% 15%, 100% 65%, 50% 100%, 0 65%, 0 15%)' }} initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.1 + i * 0.1, type: 'spring', stiffness: 300, damping: 14 }} whileHover={{ scale: 1.12, rotate: 6 }}>{[<Star size={30} fill="currentColor" />, <BookOpen size={30} />, <span className="font-display font-extrabold text-[26px]">10</span>, <Flame size={30} fill="currentColor" />, <Mic size={30} />, <Trophy size={30} />][i]}</motion.span>)}<Card className="w-[76px] h-[80px] grid place-items-center text-center leading-tight"><span><span className="block font-display font-extrabold text-[22px] text-ink">+{Math.max(0, badges - 6)}</span><span className="text-[11px] font-bold text-ink-3">More badges</span></span></Card></div>
      </Panel>
      <MyCardSection className="left-[815px] top-[762px] w-[775px] h-[88px]" />
      <Dock spread className="w-[1020px]" style={{ bottom: 14 }} />
    </Page>
  )
}
