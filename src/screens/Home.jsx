import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import {
  Home as HomeIcon, BookOpen, Compass, Star, User, Users, Settings, Search, Bell, ChevronDown,
  Calculator, FlaskConical, BookMarked, Palette, Sprout, LayoutGrid, ArrowRight, Trophy,
  Lightbulb, Heart, Brain, Check, Flame, Medal, Target, ChevronRight,
} from 'lucide-react'
import Scene, { Cutout, Child } from '../components/Scene.jsx'
import Page, { Stack, Item } from '../components/Page.jsx'
import { Ring, Bar, Counter } from '../components/Widgets.jsx'
import { useGame } from '../state/GameProvider.jsx'
import { openSettings } from '../components/SettingsSheet.jsx'
import ParentGate from '../components/ParentGate.jsx'
import { bleedL, bleedR, bleedX, safeB } from '../components/Stage.jsx'
import { lead } from '../lib/motion.js'
import { sfx } from '../lib/sound.js'
import { cn } from '../lib/utils.js'

const NAV = [
  { label: 'Home', icon: HomeIcon, to: '/home' },
  { label: 'Learn', icon: BookOpen, to: '/learn' },
  { label: 'Explore', icon: Compass, to: '/journey' },
  { label: 'Achievements', icon: Star, to: '/profile' },
  { label: 'My Space', icon: User, to: '/profile' },
  { label: 'Parent Zone', icon: Users, to: '/parent' },
  { label: 'Settings', icon: Settings, to: null },
]

const SUBJECTS = [
  { t: 'Mathematics', s: 'Solve • Think • Grow', icon: Calculator, c: '#2563eb', bg: 'linear-gradient(160deg,#bfdbfe,#93c5fd)', to: '/learn' },
  { t: 'Science', s: 'Discover • Experiment', icon: FlaskConical, c: '#7c3aed', bg: 'linear-gradient(160deg,#e9d5ff,#d8b4fe)', to: '/learn' },
  { t: 'Language', s: 'Read • Write • Express', icon: BookMarked, c: '#db2777', bg: 'linear-gradient(160deg,#fbcfe8,#f9a8d4)', to: '/extra/reading' },
  { t: 'Creativity', s: 'Imagine • Create', icon: Palette, c: '#d97706', bg: 'linear-gradient(160deg,#fde68a,#fcd34d)', to: '/learn' },
  { t: 'Life Skills', s: 'Learn • Apply • Grow', icon: Sprout, c: '#16a34a', bg: 'linear-gradient(160deg,#bbf7d0,#86efac)', to: '/extra/confidence' },
]

const MISSIONS = [
  [BookOpen, '#3b82f6', 'Read a new story', 30],
  [FlaskConical, '#8b5cf6', 'Explore a science fact', 30],
  [Heart, '#ec4899', 'Be kind today', 20],
]

const BADGES = [
  [Star, '#3b82f6', 'First Steps'],
  [Trophy, '#f59e0b', 'Math Whiz'],
  [Brain, '#a855f7', 'Curious Mind'],
  [Heart, '#ec4899', 'Kind Explorer'],
]

/* The dark frame the design wraps the page in: rail down the left, strip along
   the bottom. Both reach the true window edge on wide screens. */
const FRAME = 'linear-gradient(180deg,rgba(22,26,78,.88) 0%,rgba(17,21,62,.9) 55%,rgba(12,15,44,.93) 100%)'
const CARD_DARK = 'linear-gradient(160deg,#1e2a72,#16205a)'

function Hex({ icon: Icon, color, label, delay }) {
  return (
    <motion.div className="flex flex-col items-center gap-2" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 20, delay }}>
      <motion.span className="w-[74px] h-[80px] grid place-items-center text-white" whileHover={{ scale: 1.1, rotate: 5 }}
        style={{ background: `linear-gradient(160deg, ${color}, ${color}bb)`, clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)' }}>
        <Icon size={32} fill="currentColor" />
      </motion.span>
      <span className="text-[13px] font-extrabold text-ink text-center leading-tight">{label}</span>
    </motion.div>
  )
}

export default function Home() {
  const nav = useNavigate()
  const g = useGame()
  const { name, face } = g.state.profile
  const { streak } = g.state.stats
  const level = g.level
  /* The grown-up area sits behind a four-digit code, set on first use. */
  const [gate, setGate] = useState(false)

  return (
    <Page>
      <Scene name="nhome" wings="stretch" />

      {/* ---------- left rail ---------- */}
      <motion.aside className="absolute top-0 bottom-0 z-20 flex flex-col px-4 pt-6"
        style={{ left: 'calc(0px - var(--bleed, 0px))', width: 'calc(205px + var(--bleed, 0px))', paddingLeft: 'calc(16px + var(--bleed, 0px))', paddingBottom: 78, background: FRAME }}
        initial={{ x: -60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 26 }}>
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
          {NAV.map((it, i) => {
            const on = it.label === 'Home'
            return (
              <motion.button key={it.label}
                className={cn('relative h-[50px] rounded-[15px] flex items-center gap-3 px-4 font-display font-bold text-[17px] transition-colors',
                  on ? 'text-white' : 'text-indigo-200/85 hover:text-white')}
                onClick={() => { sfx.tap(); it.label === 'Parent Zone' ? setGate(true) : it.to ? nav(it.to) : openSettings() }}
                initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: lead(0.3) + i * 0.03 }}>
                {on && <span className="absolute inset-0 rounded-[15px]" style={{ background: 'linear-gradient(100deg,#7c5cff,#5b6cff)', boxShadow: '0 10px 24px -12px rgba(124,92,255,1)' }} />}
                <span className="relative z-10 grid place-items-center"><it.icon size={21} strokeWidth={on ? 2.5 : 2} /></span>
                <span className="relative z-10">{it.label}</span>
              </motion.button>
            )
          })}
        </nav>

        <motion.div className="mt-auto rounded-[20px] p-4 text-center" style={{ background: CARD_DARK, border: '1px solid rgba(150,170,255,.22)' }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: lead(0.6) }}>
          <img src="/art/hd/nova-v2.webp" alt="" className="w-[96px] mx-auto floaty" />
          <div className="mt-1 font-display font-extrabold text-[19px] text-white">Nova</div>
          <div className="text-[12px] font-semibold text-indigo-200/85 leading-tight">Your AI Learning Buddy</div>
          <button className="mt-3 w-full h-[36px] rounded-full text-white text-[13px] font-extrabold flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(100deg,#6d3ae0,#2f6fe0)' }} onClick={() => { sfx.tap(); window.dispatchEvent(new Event('kv:agent')) }}>
            Chat with Nova <ArrowRight size={14} strokeWidth={3} />
          </button>
        </motion.div>
      </motion.aside>

      {/* ---------- top bar ---------- */}
      <motion.div className="absolute top-[22px] flex items-center gap-4 z-20" style={bleedR(24)}
        initial={{ y: -24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: lead(0.2) }}>
        <button className="relative w-[52px] h-[52px] rounded-full bg-[var(--surface)] border border-[var(--line)] grid place-items-center text-ink shadow-sm shrink-0" onClick={() => sfx.tap()}>
          <Bell size={21} />
          <span className="absolute top-[10px] right-[12px] w-[9px] h-[9px] rounded-full bg-red-500 border-2 border-white" />
        </button>
        <button className="h-[56px] pl-2 pr-4 rounded-full bg-[var(--surface)] border border-[var(--line)] flex items-center gap-3 shadow-sm shrink-0" onClick={() => { sfx.tap(); nav('/profile') }}>
          <img src={`/art/kid${face}-face-sm.webp`} alt="" className="w-[42px] h-[42px] rounded-full object-cover border-2 border-white" />
          <span className="leading-tight text-left">
            <span className="block font-display font-extrabold text-[17px] text-ink">{name}</span>
            <span className="block text-[12px] font-bold text-ink-3">Level {level} Explorer</span>
          </span>
          <ChevronDown size={18} className="text-ink-3" />
        </button>
      </motion.div>

      {/* ---------- hero ---------- */}
      <Stack className="absolute left-[250px] top-[198px] w-[430px] z-10" start={0.25}>
        <Item><h1 className="font-display font-extrabold text-[46px] leading-[1.05] text-ink">Welcome back,</h1></Item>
        <Item><h1 className="font-display font-extrabold text-[54px] leading-[1.05] grad-text">Explorer! <motion.span className="inline-block text-ink" animate={{ rotate: [0, 20, -8, 20, 0] }} transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 3 }}>👋</motion.span></h1></Item>
        <Item className="mt-3 text-[17px] font-semibold text-ink-2 leading-snug">A new adventure is waiting for you today.<br />Let's learn, explore and achieve together!</Item>
      </Stack>

      <Child screen="nhome" delay={0.35} amp={9} dur={4.2} className="z-10" />
      <Cutout id="nhome-1" delay={0.45} amp={11} dur={3.6} className="z-10" />

      <motion.div className="absolute left-[915px] top-[136px] w-[205px] bubble px-5 py-3 text-[15px] font-bold leading-snug z-10" data-tail="bottom"
        initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1, y: [0, -5, 0] }}
        transition={{ opacity: { delay: lead(0.7) }, scale: { type: 'spring', stiffness: 420, damping: 22, delay: lead(0.7) }, y: { duration: 5, repeat: Infinity, ease: 'easeInOut', delay: lead(0.7) + 0.5 } }}>
        <span className="tail" />
        Ready to learn something amazing today? <span className="text-gold">✨</span>
      </motion.div>

      {/* ---------- subjects ---------- */}
      <Stack className="absolute left-[240px] top-[424px] flex gap-[15px] z-10" start={0.45} delay={0.04}>
        {SUBJECTS.map(s => (
          <Item key={s.t} v="pop">
            <motion.button className="w-[205px] h-[124px] rounded-[20px] px-3 pt-3 pb-3 flex flex-col items-center text-center relative overflow-hidden"
              style={{ background: s.bg, boxShadow: '0 16px 34px -18px rgba(40,30,120,.55)' }}
              whileHover={{ y: -5 }} whileTap={{ scale: 0.97 }} onClick={() => { sfx.whoosh(); nav(s.to) }}>
              <span className="w-[44px] h-[44px] rounded-[14px] grid place-items-center bg-white/85 shrink-0" style={{ color: s.c }}><s.icon size={24} strokeWidth={2.4} /></span>
              <span className="mt-2 font-display font-extrabold text-[18px] leading-none" style={{ color: '#15185a' }}>{s.t}</span>
              <span className="mt-auto w-full flex items-center justify-between">
                <span className="text-[12px] font-bold" style={{ color: '#3b3f86' }}>{s.s}</span>
                <span className="w-[26px] h-[26px] rounded-full grid place-items-center text-white shrink-0" style={{ background: s.c }}><ArrowRight size={15} strokeWidth={3} /></span>
              </span>
            </motion.button>
          </Item>
        ))}
        <Item v="pop">
          <motion.button className="w-[300px] h-[124px] rounded-[20px] px-5 flex items-center gap-4 text-left"
            style={{ background: FRAME, boxShadow: '0 16px 34px -16px rgba(20,15,80,.8)' }}
            whileHover={{ y: -5 }} whileTap={{ scale: 0.97 }} onClick={() => { sfx.whoosh(); nav('/challenge') }}>
            <span className="w-[46px] h-[46px] rounded-[14px] grid place-items-center bg-white/15 text-sky-300 shrink-0"><LayoutGrid size={24} /></span>
            <span className="flex-1 leading-tight">
              <span className="block font-display font-extrabold text-[19px] text-white">✦ Explore More</span>
              <span className="block mt-1 text-[13px] font-semibold text-indigo-200/85">Games, Quizzes<br />and Beyond!</span>
            </span>
            <span className="w-[30px] h-[30px] rounded-full grid place-items-center bg-white/15 text-white shrink-0"><ArrowRight size={17} strokeWidth={3} /></span>
          </motion.button>
        </Item>
      </Stack>

      {/* ---------- my progress ---------- */}
      <motion.section className="absolute left-[232px] top-[583px] w-[452px] h-[280px] rounded-[22px] bg-[var(--surface)] border border-[var(--line)] p-5 z-10"
        style={{ boxShadow: '0 20px 44px -24px rgba(40,30,120,.45)' }}
        initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: lead(0.55) }}>
        <div className="flex items-center gap-2">
          <span className="w-[26px] h-[26px] rounded-[9px] grid place-items-center text-white" style={{ background: 'var(--grad-primary)' }}><Target size={15} /></span>
          <span className="font-display font-extrabold text-[19px] text-ink">My Progress</span>
          <span className="ml-auto font-display font-extrabold text-[17px] text-primary-ink">Level {level}</span>
        </div>
        <div className="mt-3 flex items-center gap-4">
          <Ring size={132} stroke={14} value={0.65} id="home-ring" delay={lead(0.7)} track="#e8e6ff">
            <div className="text-center leading-none">
              <div className="font-display font-extrabold text-[30px] text-primary-ink"><Counter to={65} delay={lead(0.7)} />%</div>
              <div className="mt-1 text-[11px] font-bold text-ink-3">Overall Progress</div>
            </div>
          </Ring>
          <div className="flex-1 flex flex-col gap-[10px]">
            {[[BookOpen, '#3b82f6', '12/20 Lessons', 0.6], [Trophy, '#f59e0b', '8/15 Quizzes', 0.53], [Lightbulb, '#a855f7', '4/10 Projects', 0.4]].map(([I, c, t, v]) => (
              <div key={t} className="rounded-[14px] bg-[var(--lavender)]/60 px-3 py-2 flex items-center gap-3">
                <span className="w-[30px] h-[30px] rounded-[10px] grid place-items-center bg-[var(--surface-2)] shrink-0" style={{ color: c }}><I size={17} /></span>
                <span className="flex-1">
                  <span className="block text-[14px] font-extrabold text-ink leading-none">{t}</span>
                  <Bar value={v} h={6} className="mt-2" delay={lead(0.8)} />
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ---------- today's mission ---------- */}
      <motion.section className="absolute left-[697px] top-[583px] w-[452px] h-[280px] rounded-[22px] bg-[var(--surface)] border border-[var(--line)] p-5 z-10"
        style={{ boxShadow: '0 20px 44px -24px rgba(40,30,120,.45)' }}
        initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: lead(0.65) }}>
        <div className="flex items-center gap-2">
          <span className="w-[26px] h-[26px] rounded-[9px] grid place-items-center text-white" style={{ background: 'linear-gradient(140deg,#f87171,#ef4444)' }}><Target size={15} /></span>
          <span className="font-display font-extrabold text-[19px] text-ink">Today's Mission</span>
          <button className="ml-auto text-[13px] font-extrabold text-primary-ink flex items-center gap-1" onClick={() => nav('/journey')}>See All <ArrowRight size={13} strokeWidth={3} /></button>
        </div>
        {/* Straight into the questions. The mission is "solve 5 fun questions", so the
            lesson screen in between is a detour -- that screen is where progress is read,
            not where a challenge starts. */}
        <motion.button className="mt-2 w-full rounded-[16px] px-3 py-[10px] flex items-center gap-3 text-left"
          style={{ background: 'var(--tint-primary)', border: '1.5px solid var(--tint-primary-line)' }}
          whileHover={{ y: -2 }} onClick={() => { sfx.whoosh(); nav('/tests/mixed/question') }}>
          <span className="w-[42px] h-[42px] rounded-[13px] grid place-items-center bg-[var(--surface-2)] shrink-0 text-amber-500"><Trophy size={22} /></span>
          <span className="flex-1 leading-tight">
            <span className="block text-[15px] font-extrabold text-ink">Complete a Math Challenge</span>
            <span className="block text-[12px] font-semibold text-ink-3">Solve 5 fun questions</span>
            <span className="mt-1 inline-flex items-center gap-1 text-[12px] font-extrabold text-amber-600"><Star size={12} fill="currentColor" /> +50 XP</span>
          </span>
          <span className="w-[28px] h-[28px] rounded-full grid place-items-center text-white shrink-0" style={{ background: 'var(--grad-primary)' }}><ArrowRight size={16} strokeWidth={3} /></span>
        </motion.button>
        <div className="mt-2 flex flex-col gap-[6px]">
          {MISSIONS.map(([I, c, t, xp]) => (
            <div key={t} className="rounded-[13px] bg-[var(--lavender)]/50 px-3 py-[6px] flex items-center gap-3">
              <span className="w-[26px] h-[26px] rounded-[9px] grid place-items-center bg-[var(--surface-2)] shrink-0" style={{ color: c }}><I size={14} /></span>
              <span className="flex-1 leading-tight">
                <span className="block text-[13px] font-extrabold text-ink">{t}</span>
                <span className="block text-[11px] font-bold text-ink-3">+{xp} XP</span>
              </span>
              <span className="w-[22px] h-[22px] rounded-full grid place-items-center border-2 border-green-400 text-green-500"><Check size={12} strokeWidth={4} /></span>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ---------- achievements ---------- */}
      <motion.section className="absolute left-[1162px] top-[583px] w-[478px] h-[280px] rounded-[22px] bg-[var(--surface)] border border-[var(--line)] p-5 z-10"
        style={{ boxShadow: '0 20px 44px -24px rgba(40,30,120,.45)' }}
        initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: lead(0.75) }}>
        <div className="flex items-center gap-2">
          <span className="w-[26px] h-[26px] rounded-[9px] grid place-items-center text-white" style={{ background: 'linear-gradient(140deg,#fbbf24,#f59e0b)' }}><Medal size={15} /></span>
          <span className="font-display font-extrabold text-[19px] text-ink">Achievements</span>
          <button className="ml-auto text-[13px] font-extrabold text-primary-ink flex items-center gap-1" onClick={() => nav('/profile')}>See All <ArrowRight size={13} strokeWidth={3} /></button>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {BADGES.map(([I, c, l], i) => <Hex key={l} icon={I} color={c} label={l} delay={lead(0.8) + i * 0.06} />)}
        </div>
        <motion.button className="mt-4 w-full rounded-[16px] px-4 py-3 flex items-center gap-3 text-left"
          style={{ background: 'var(--tint-warm)', border: '1.5px solid var(--tint-warm-line)' }}
          whileHover={{ y: -2 }} onClick={() => { sfx.tap(); nav('/profile') }}>
          <motion.span className="w-[40px] h-[40px] rounded-full grid place-items-center bg-[var(--surface-2)] text-orange-500 shrink-0"
            animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 2, repeat: Infinity }}><Flame size={22} fill="currentColor" /></motion.span>
          <span className="flex-1 leading-tight">
            <span className="block text-[16px] font-extrabold text-ink">{streak} Day Streak</span>
            <span className="block text-[12px] font-semibold text-ink-3">Keep going! You're doing amazing!</span>
          </span>
          <ChevronRight size={20} className="text-orange-500" />
        </motion.button>
      </motion.section>

      {/* ---------- footer strip ---------- */}
      <motion.footer className="absolute h-[62px] flex items-center pl-8 pr-[92px] z-20" style={{ ...bleedX(0), ...safeB(0), background: FRAME }}
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: lead(0.5) }}>
        <img src="/art/planet-sm.webp" alt="" className="w-[34px]" />
        <span className="ml-3 text-[15px] font-semibold text-indigo-100">Small Steps. <span className="font-extrabold text-white">BIG Possibilities.</span></span>
        <span className="ml-auto text-[13px] font-semibold text-indigo-200/80">Kidsverse+ &nbsp;|&nbsp; Learn Today. A Brighter Tomorrow.</span>
      </motion.footer>

      <AnimatePresence>
        {gate && <ParentGate onCancel={() => setGate(false)} onPass={() => { setGate(false); nav('/parent') }} />}
      </AnimatePresence>
    </Page>
  )
}
