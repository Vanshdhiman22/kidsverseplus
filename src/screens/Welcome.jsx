import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Search, Bell, Clock, Award, Play, Check, Lock, ChevronRight, Heart, Calculator, BookOpen, Puzzle } from 'lucide-react'
import Scene, { Child } from '../components/Scene.jsx'
import Page, { Stack, Item } from '../components/Page.jsx'
import SideRail from '../components/SideRail.jsx'
import { UserChip, IconPill } from '../components/TopBar.jsx'
import { Panel, Card } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import SpeechBubble from '../components/SpeechBubble.jsx'
import { useGame } from '../state/GameProvider.jsx'
import { bleedR } from '../components/Stage.jsx'
import { cn } from '../lib/utils.js'
import { useTint, useDark, useAccent } from '../lib/accent.js'

const STEPS = [
  { t: 'Meet Nova', s: 'Completed', k: 'done' }, { t: 'Discovery Mission', s: 'Current', k: 'current', n: 2 },
  { t: 'Unlock Your Universe', s: 'Locked', k: 'locked' }, { t: 'Your First Learning Path', s: 'Locked', k: 'locked' },
]
const WORLDS = [
  { t: 'Literacy Kingdom', s: 'Stories unlock new worlds!', img: '/art/world-literacy.webp', bg: 'linear-gradient(180deg, #f3e8ff, #e9d5ff)', c: '#a855f7' },
  { t: 'Science Planet', s: 'Curiosity powers discovery!', img: '/art/world-evs.webp', bg: 'linear-gradient(180deg, #ecfeff, #cffafe)', c: '#14b8a6' },
  { t: 'Explore My Goals', s: 'Dream it. Plan it. Achieve it!', img: '/art/world-general.webp', bg: 'linear-gradient(180deg, #fff7ed, #fed7aa)', c: '#f97316' },
]

export default function Welcome() {
  const nav = useNavigate()
  const g = useGame(); const { name, face } = g.state.profile
  const tint = useTint(); const dark = useDark(); const ac = useAccent()
  return (
    <Page>
      <Scene name="welcome" />
      <SideRail active="home" />
      <motion.div className="absolute top-[22px] flex items-center gap-3" style={bleedR(34)} initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <IconPill><Search size={22} /></IconPill>
        <IconPill className="relative"><Bell size={22} /><span className="absolute top-3 right-3 w-[9px] h-[9px] rounded-full bg-red-500 border-2 border-white" /></IconPill>
        <UserChip name={`Hi, ${name}!`} sub="Keep Exploring!" face={face} />
      </motion.div>

      <Stack className="absolute left-[250px] top-[70px]" start={0.25}>
        <Item><h1 className="font-display font-extrabold text-[56px] leading-[1.02] text-ink">Welcome to<br /><span className="grad-text">Kidsverse, {name}!</span> <span className="text-gold text-[40px]">✦</span></h1></Item>
        <Item className="mt-2 text-[22px] font-semibold text-ink-2">Nova is ready to discover how you learn.</Item>
      </Stack>
      <Child screen="welcome" delay={0.4} amp={6} />
      <div className="absolute left-[610px] top-[232px]"><SpeechBubble tail="bottom" delay={0.3} className="w-[190px] text-[16px] text-center px-4 py-3"><span className="font-extrabold text-[19px]">Hi {name}! <span className="text-gold">✦</span></span><br />Ready for our first adventure?</SpeechBubble></div>

      <Panel className="absolute left-[855px] top-[105px] w-[785px] px-9 py-7" initial="hidden" animate="show">
        <motion.img src="/art/planet-sm.webp" alt="" className="absolute right-6 top-6 w-[180px] floaty" style={{ animationDuration: '8s' }} />
        <div className="w-[560px]">
          <h2 className="font-display font-extrabold text-[30px] leading-tight text-ink uppercase">Your first discovery mission</h2>
          {/* Promised three activities across Maths, Literacy and Visual Thinking. The
              button goes to /missions/fractions, which is two Maths steps -- Discover, then
              Spot the Mistake -- and nothing else. The copy now says what the child gets. */}
          <p className="mt-1 text-[17px] font-semibold text-ink-3 leading-snug">Two playful activities help Nova understand how you learn. No scores. No pressure.</p>
          <div className="mt-3 flex gap-3">
            {[[Calculator, 'Discover Fractions', '#0ea5e9'], [Puzzle, 'Spot the Mistake', '#22c55e']].map(([I, t, c0]) => { const c = ac(c0); return <span key={t} className="chip h-[40px] px-4 text-[16px]" style={{ color: c, background: `${c}18`, border: `1.5px solid ${c}55` }}><I size={18} /> {t}</span> })}
          </div>
          <div className="mt-3 flex items-center gap-6 text-[17px] font-bold text-ink-2"><span className="flex items-center gap-2"><Clock size={20} className="text-primary-ink" /> 6–8 min</span><span className="w-px h-6 bg-[var(--line)]" /><span className="flex items-center gap-2"><Award size={20} className="text-gold" /> Cosmic Explorer badge</span></div>
        </div>
        <motion.div className="mt-4 ml-[110px]" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.27 }}>
          <Button size="lg" icon={<Play size={28} fill="currentColor" />} className="w-[480px] h-[58px] text-[24px] uppercase rounded-full" sound="whoosh" onClick={() => { g.setProfile({ firstVisit: false }); nav('/missions/fractions') }}>Begin my adventure</Button>
        </motion.div>
      </Panel>

      <Stack className="absolute left-[855px] top-[470px] flex items-center gap-2" start={0.8} delay={0.1}>
        {STEPS.map((s, i) => (
          <React.Fragment key={s.t}>
            <Item v="pop"><Card className={cn('h-[74px] px-3 flex items-center gap-3 w-[172px]', s.k === 'current' && 'card-selected')}>
              <span className={cn('w-[40px] h-[40px] rounded-full grid place-items-center shrink-0', s.k === 'done' ? 'bg-green-100 text-green-600' : s.k === 'current' ? 'text-white' : 'bg-[var(--lavender)] text-ink-3')} style={s.k === 'current' ? { background: 'var(--grad-primary)' } : undefined}>{s.k === 'done' ? <Check size={22} strokeWidth={3} /> : s.k === 'current' ? <span className="font-display font-extrabold text-[20px]">{s.n}</span> : <Lock size={20} />}</span>
              <span className="leading-tight"><span className="block text-[15px] font-extrabold text-ink">{s.t}</span><span className={cn('block text-[13px] font-bold', s.k === 'done' ? 'text-green-600' : s.k === 'current' ? 'text-primary-ink' : 'text-ink-3')}>{s.s}</span></span>
            </Card></Item>
            {i < STEPS.length - 1 && <span className="w-[8px] border-t-2 border-dotted border-[var(--line)]" />}
          </React.Fragment>
        ))}
      </Stack>

      <Stack className="absolute left-[250px] top-[578px] flex items-end gap-4" start={0.9} delay={0.1}>
        <Item v="pop">
          <Card hover className="w-[430px] h-[160px] px-6 flex items-center gap-4 overflow-hidden relative" style={{ background: dark ? 'var(--tint-primary)' : 'linear-gradient(120deg, rgba(255,255,255,.95), #ede9fe)' }} onClick={() => nav('/learn')}>
            <div className="w-[190px]"><div className="font-display font-extrabold text-[24px] text-ink leading-tight">Maths Galaxy</div><div className="text-[16px] font-semibold text-ink-3">Numbers come to life!</div></div>
            <img src="/art/world-maths.webp" alt="" className="absolute right-[70px] top-[14px] w-[140px] floaty" />
            <span className="absolute right-5 bottom-5 w-[46px] h-[46px] rounded-full grid place-items-center text-white" style={{ background: 'var(--grad-primary)' }}><ChevronRight size={26} strokeWidth={3} /></span>
          </Card>
        </Item>
        {WORLDS.map(w => (
          <Item key={w.t} v="pop">
            <Card hover className="w-[205px] h-[300px] p-5 overflow-hidden relative" style={{ background: tint(w.bg, w.c) }} onClick={() => nav('/learn')}>
              <div className="font-display font-extrabold text-[22px] text-ink leading-tight">{w.t}</div>
              <div className="text-[14px] font-semibold text-ink-3 mt-1">{w.s}</div>
              <img src={w.img} alt="" className="absolute left-1/2 -translate-x-1/2 bottom-[40px] w-[150px] floaty" />
              <span className="absolute right-4 bottom-4 w-[42px] h-[42px] rounded-full grid place-items-center text-white" style={{ background: w.c }}><ChevronRight size={24} strokeWidth={3} /></span>
            </Card>
          </Item>
        ))}
      </Stack>

      <Panel className="absolute left-[1410px] top-[555px] w-[230px] h-[330px] p-5 text-center" initial="hidden" animate="show">
        <div className="font-display font-extrabold text-[22px] text-primary-ink uppercase">Nova's Promise</div>
        <motion.span className="inline-grid place-items-center mt-2 text-pink-500" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.4, repeat: Infinity }}><Heart size={40} fill="currentColor" /></motion.span>
        <p className="mt-2 text-[16px] font-bold text-ink-2 leading-snug">I'll notice your strengths, explain things differently, and help you keep growing.</p>
        <img src="/art/hd/nova-v2.webp" alt="" className="absolute left-1/2 -translate-x-1/2 bottom-[-4px] w-[86px] floaty" />
      </Panel>
      <motion.div className="absolute left-[540px] top-[898px] w-[640px] text-center text-[16px] font-extrabold tracking-[0.3em] text-ink-3 uppercase" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>✦ Every child. Every dream. Every day. ✦</motion.div>
    </Page>
  )
}
