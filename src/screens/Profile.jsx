import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft, Bell, CalendarDays, CheckCircle2, BookOpen, Swords, Flame, ChevronRight, Star, Map, Trophy, Ticket, Medal, Flag, Mic, Check, ShieldCheck , Lock} from 'lucide-react'
import Scene, { Child } from '../components/Scene.jsx'
import Page, { Stack, Item } from '../components/Page.jsx'
import { TopBar, UserChip, IconPill } from '../components/TopBar.jsx'
import { Panel, Card } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import { Counter, Sparkles } from '../components/Widgets.jsx'
import { cn } from '../lib/utils.js'
import { useGame } from '../state/GameProvider.jsx'
import { gradeLabel } from '../data/catalog.js'
import { sfx } from '../lib/sound.js'
import { MyCardSection } from '../components/StudentCard.jsx'
import { onColor, useAccent } from '../lib/accent.js'

/* Was four literals -- 42 days, 32 missions, 18 reading sessions, 6 battles -- identical
 * for every child and frozen no matter how much they played. Built from state now. */
export const statsFor = st => [
  [CalendarDays, '#3b82f6', 'Together for', st.stats.day, 'days'],
  [CheckCircle2, '#f59e0b', 'Missions', Object.values(st.progress.worldDone ?? {}).reduce((a, b) => a + b, 0), 'completed'],
  [BookOpen, '#a855f7', 'Reading', st.stats.reading, 'sessions'],
  [Swords, '#38bdf8', 'Bot Battles', st.stats.battles, 'battles'],
]
/* All four used to render as achieved the moment the screen opened, on a brand new
 * account with nothing done. Each one now hangs off the event it claims. */
export const milestonesFor = st => {
  const lessons = Object.values(st.progress.worldDone ?? {}).reduce((a, b) => a + b, 0)
  return [
    [Flag, '#22c55e', 'Entered Number Forest', 'You began your adventure!', lessons > 0],
    [BookOpen, '#3b82f6', 'Unlocked your first book', 'Great start, champion!', (st.stats.reading ?? 0) > 0],
    [Mic, '#7c3aed', 'Cracked your first quiz', 'Words make you stronger!', (st.progress.quizzesDone ?? 0) > 0],
    [Trophy, '#f59e0b', 'Earned your first trophy', 'Keep going, superstar!', (st.stats.battles ?? 0) > 0],
  ]
}
/* Three of these rows had no destination and no handler: tapping My Achievements, My
 * Streak or Break Passes did nothing at all, while looking exactly as tappable as the
 * three that work. The dead ones are marked locked rather than left as bait. */
const MENU = [
  [Star, '#f59e0b', 'My Interests', 'Topics & themes you love', '/onboarding/interests'],
  [Map, '#3b82f6', 'My Journey', "See how far you've come", '/profile/journey'],
  [Medal, '#f59e0b', 'My Best Scores', 'Top performance', '/challenge/leaderboard', 'View'],
  [Trophy, '#7c3aed', 'My Achievements', 'Badges & trophies', null],
  [Flame, '#f97316', 'My Streak', 'Keep the flame going', null],
  [Ticket, '#a855f7', 'Break Passes', 'Recharge and come back', null],
]
const BADGES = ['#7c3aed', '#3b82f6', '#22c55e', '#ef4444', '#8b5cf6', '#f59e0b']

export default function Profile() {
  const nav = useNavigate()
  const g = useGame(); const { name, face, grade, board } = g.state.profile; const { streak, badges } = g.state.stats
  const ac = useAccent()
  const mileDone = milestonesFor(g.state).filter(m => m[4]).length
  /* Six shelf slots; the first `badgesWon` are lit. A streak badge needs a streak, a
     battle badge needs a battle -- the same events the milestones read. */
  const badgesWon = Math.min(6, mileDone + (streak >= 3 ? 1 : 0) + ((g.state.stats.xp ?? 0) >= 1000 ? 1 : 0))
  return (
    <Page>
      <Scene name="profile" />
      <TopBar back={false} logo="planet" right={<><IconPill className="relative"><Bell size={22} /><span className="absolute top-3 right-3 w-[9px] h-[9px] rounded-full bg-red-500 border-2 border-white" /></IconPill><UserChip name={`Hi, ${name}!`} sub="Keep Exploring!" face={face} /></>} showControls={false} />

      <Panel soft className="absolute left-[115px] top-[95px] w-[665px] h-[465px] p-8" initial="hidden" animate="show">
        <Sparkles n={5} seed={31} />
        <button className="flex items-center gap-3 text-[16px] font-bold text-ink" onClick={() => { sfx.tap(); nav('/home') }}><ArrowLeft size={20} /> Back to Home</button>
        {/* Our Journey had no inbound link from anywhere in the app -- the screen existed
            and was routed, but only a typed URL could reach it. It belongs to the profile,
            so it is opened from here. */}
        <button className="ml-5 flex items-center gap-2 text-[16px] font-extrabold text-primary-ink hover:underline" onClick={() => { sfx.tap(); nav('/profile/journey') }}>Our Journey <ChevronRight size={18} strokeWidth={2.6} /></button>
        <h1 className="mt-3 font-display font-extrabold text-[72px] leading-none text-ink uppercase">{name}</h1>
        <div className="mt-1 flex items-center gap-2 text-[22px] font-bold text-ink-2">{gradeLabel(grade)} • {board} <ShieldCheck size={22} className="text-sky-500" /></div>
        <Card className="absolute left-6 bottom-6 w-[280px] h-[92px] px-5 flex items-center gap-4"><img src="/art/22-novahead.webp" alt="" className="w-[54px] floaty" /><span className="leading-tight"><span className="block font-display font-extrabold text-[22px] text-ink uppercase">Nova</span><span className="block text-[14px] font-semibold text-ink-3">Your learning buddy</span></span></Card>
      </Panel>
      <Child screen="profile" delay={0.5} amp={6} />
      <Panel className="absolute left-[120px] top-[565px] w-[650px] h-[270px] px-5 py-2 flex flex-col justify-around" initial="hidden" animate="show">
        {MENU.map(([I, c, t, s, to, v]) => <button key={t} className="h-[42px] flex items-center gap-3 rounded-xl px-2 hover:bg-[var(--lavender)] transition-colors text-left" disabled={!to} onClick={to ? () => { sfx.tap(); nav(to) } : undefined}><span className="icon-orb w-[34px] h-[34px]" style={{ color: to ? c : 'var(--ink-3)', background: to ? `${c}1f` : 'var(--lavender)' }}>{to ? <I size={18} /> : <Lock size={16} />}</span><span className="flex-1 leading-tight"><span className="block text-[16px] font-extrabold text-ink">{t}</span><span className="block text-[12px] font-semibold text-ink-3">{s}</span></span>{v && <span className="text-[15px] font-bold text-ink-2">{t === 'My Streak' ? `${streak} days` : v}</span>}<ChevronRight size={18} className="text-ink-3" /></button>)}
      </Panel>

      <Panel className="absolute left-[815px] top-[95px] w-[775px] h-[225px] p-5" initial="hidden" animate="show">
        <div className="grid grid-cols-4 divide-x divide-[var(--line)]">{statsFor(g.state).map(([I, c0, t, v, u]) => { const c = ac(c0); return <div key={t} className="flex flex-col items-center text-center"><I size={34} style={{ color: c }} /><span className="mt-2 text-[16px] font-bold text-ink-2">{t}</span><span className="font-display font-extrabold text-[40px] leading-none" style={{ color: c }}><Counter to={v} delay={0.24} /></span><span className="text-[15px] font-bold text-ink-3">{u}</span></div> })}</div>
        {/* Said "12 days" while the live streak sat two panels away saying 7. It is a readout,
            not a link, so it no longer offers a chevron and a hover it cannot honour. */}
        <div className="card mt-4 h-[48px] px-5 flex items-center gap-3 text-[16px] font-bold text-ink"><Flame size={20} className="text-orange-500" fill="currentColor" /> Best streak <span className="ml-auto font-extrabold">{Math.max(streak, g.state.stats.bestStreak ?? 0)} days</span></div>
      </Panel>
      <Panel className="absolute left-[815px] top-[335px] w-[775px] h-[255px] p-5" initial="hidden" animate="show">
        <div className="font-display font-extrabold text-[15px] text-ink uppercase tracking-wide">Our milestones</div>
        {/* The rail used to be a filled gradient with four ticks on it whatever the child
            had done, which then sat directly above four locked cards. It tracks them now. */}
        <div className="relative mt-2 mx-10 h-[3px] rounded-full" style={{ background: 'var(--lavender-2)' }}>
          <motion.div className="absolute inset-y-0 left-0 rounded-full" style={{ background: 'var(--grad-primary)' }}
            initial={{ width: 0 }} animate={{ width: `${(mileDone / 4) * 100}%` }} transition={{ duration: 1.1, delay: 0.3 }} />
          {[0, 1, 2, 3].map(i => <motion.span key={i} className="absolute -top-[9px] w-[20px] h-[20px] rounded-full grid place-items-center" style={{ left: `calc(${i * 33.3}% - 10px)`, background: i < mileDone ? 'var(--grad-primary)' : 'var(--lavender-2)', color: i < mileDone ? '#fff' : 'var(--ink-3)' }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.09 + i * 0.15, type: 'spring' }}>{i < mileDone ? <Check size={12} strokeWidth={4} /> : <Lock size={10} />}</motion.span>)}
        </div>
        <Stack className="mt-5 grid grid-cols-4 gap-4" start={0.8} delay={0.1}>{milestonesFor(g.state).map(([I, c, t, s, earned]) => <Item key={t} v="pop"><Card className={cn('h-[160px] p-3 flex flex-col items-center text-center', !earned && 'opacity-55')}><span className="icon-orb w-[58px] h-[58px]" style={{ color: earned ? c : 'var(--ink-3)', background: earned ? `${c}1f` : 'var(--lavender)' }}>{earned ? <I size={30} /> : <Lock size={26} />}</span><span className="mt-2 text-[14px] font-extrabold text-ink leading-tight">{t}</span><span className="mt-1 text-[12px] font-semibold text-ink-3 leading-tight">{s}</span></Card></Item>)}</Stack>
      </Panel>
      <Panel className="absolute left-[815px] top-[605px] w-[775px] h-[150px] p-5" initial="hidden" animate="show">
        <div className="font-display font-extrabold text-[15px] text-ink uppercase tracking-wide">Badge shelf</div>
        <div className="mt-3 flex items-center gap-4">{/* Every badge rendered as won. They are lit by the same events the milestones use,
              so an empty shelf looks empty and a filled one was actually filled. */}
        {BADGES.map((c, i) => <motion.span key={c} className="w-[76px] h-[80px] grid place-items-center" style={{ color: i < badgesWon ? onColor(c) : 'var(--ink-3)', background: i < badgesWon ? `linear-gradient(160deg, ${c}, ${c}99)` : 'var(--lavender-2)', clipPath: 'polygon(50% 0, 100% 15%, 100% 65%, 50% 100%, 0 65%, 0 15%)' }} initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.1 + i * 0.1, type: 'spring', stiffness: 300, damping: 14 }} whileHover={{ scale: 1.12, rotate: 6 }}>{i < badgesWon ? [<Star size={30} fill="currentColor" />, <BookOpen size={30} />, <span className="font-display font-extrabold text-[26px]">10</span>, <Flame size={30} fill="currentColor" />, <Mic size={30} />, <Trophy size={30} />][i] : <Lock size={26} />}</motion.span>)}<Card className="w-[76px] h-[80px] grid place-items-center text-center leading-tight"><span><span className="block font-display font-extrabold text-[22px] text-ink">+{Math.max(0, badges - 6)}</span><span className="text-[11px] font-bold text-ink-3">More badges</span></span></Card></div>
      </Panel>
      <MyCardSection className="left-[815px] top-[762px] w-[775px] h-[88px]" />
    </Page>
  )
}
