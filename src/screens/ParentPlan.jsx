import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { CalendarDays, Play, HelpCircle, BookOpen, Smile, ClipboardCheck, Check, TrendingUp, Clock, SlidersHorizontal, ArrowLeft, Target, Home, Users, Trophy, User, HelpCircle as Help, ChevronRight, Star } from 'lucide-react'
import Scene, { Cutout } from '../components/Scene.jsx'
import Page, { Stack, Item } from '../components/Page.jsx'
import ParentRail from '../components/ParentRail.jsx'
import { Panel, Card } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import { Bar } from '../components/Widgets.jsx'
import { useGame } from '../state/GameProvider.jsx'
import { gradeLabel } from '../data/catalog.js'
import { bleedL, bleedR, safeT } from '../components/Stage.jsx'
import { sfx } from '../lib/sound.js'
import { cn } from '../lib/utils.js'

const PLAN = [['Mon', '12 May', Play, '#7c3aed', 'Fraction visual lesson', 'Builds strong concepts', Check, 'Strengthens foundation', '20 min'], ['Tue', '13 May', HelpCircle, '#3b82f6', '3 targeted questions', 'Focus on weak areas', TrendingUp, 'Improves accuracy', '15 min'], ['Wed', '14 May', BookOpen, '#22c55e', 'Reading inference', 'Strengthen comprehension', TrendingUp, 'Better understanding', '20 min'], ['Thu', '15 May', Smile, '#f97316', 'Confidence activity', 'Fun & quick boost', TrendingUp, 'Builds motivation', '10 min'], ['Fri', '16 May', ClipboardCheck, '#7c3aed', 'Mixed test', 'Practice & track progress', TrendingUp, 'Tracks progress', '25 min']]

export default function ParentPlan() {
  const nav = useNavigate()
  const g = useGame(); const { name, face, grade, board } = g.state.profile
  const [saved, setSaved] = useState(false)
  return (
    <Page>
      <Scene name="plan" />
      <ParentRail />

      <Panel soft className="absolute left-[265px] top-[30px] w-[955px] h-[860px] p-8" initial="hidden" animate="show">
        <Stack start={0.3}>
          <Item><h1 className="font-display font-extrabold text-[40px] leading-[1.1] text-ink">Nova's Next Plan —<br />Built from <span className="grad-text">{name}'s</span> recent performance.</h1></Item>
          <Item className="mt-2 text-[18px] font-semibold text-ink-2">Personalized practice to build confidence and mastery.</Item>
        </Stack>
        <Card className="mt-5 p-5">
          <div className="flex items-center gap-2 font-display font-extrabold text-[20px] text-ink uppercase"><CalendarDays size={22} className="text-primary-ink" /> Weekly plan</div>
          <Stack className="mt-3 flex flex-col gap-3" start={0.7} delay={0.1}>
            {PLAN.map(([d, dt, I, c, t, s, RI, r, m], i) => <Item key={d} v="soft" className="flex items-center gap-4">
              <span className="w-[80px] leading-tight"><span className="block font-display font-extrabold text-[20px] text-ink uppercase">{d}</span><span className="block text-[13px] font-bold text-ink-3 uppercase">{dt}</span></span>
              <span className="relative w-[14px] h-[14px] rounded-full border-2 border-[var(--primary)] bg-white">{i < PLAN.length - 1 && <span className="absolute left-[4px] top-[14px] w-[2px] h-[70px] bg-[var(--line)]" />}</span>
              <div className="card flex-1 h-[74px] px-4 flex items-center gap-4"><span className="icon-orb w-[48px] h-[48px] text-white shrink-0" style={{ background: c }}><I size={24} /></span><span className="w-[260px] leading-tight"><span className="block text-[18px] font-extrabold text-ink">{t}</span><span className="block text-[13px] font-semibold text-ink-3">{s}</span></span><span className="w-px h-10 bg-[var(--line)]" /><span className="flex items-center gap-2 flex-1 text-[15px] font-bold text-ink-2"><span className="w-[28px] h-[28px] rounded-full grid place-items-center text-green-600 bg-green-100"><RI size={16} strokeWidth={3} /></span>{r}</span><span className="flex items-center gap-1 text-[14px] font-bold text-ink-3"><Clock size={16} /> {m}</span></div>
            </Item>)}
          </Stack>
        </Card>
        <Card className="mt-5 h-[100px] px-6 flex items-center gap-4"><img src="/art/hd/nova-v2.webp" alt="" className="w-[90px] floaty" /><span className="leading-snug"><span className="block text-[20px] font-extrabold text-ink">We've built this plan just for {name}.</span><span className="block text-[16px] font-semibold text-ink-2">Consistent practice, big progress! You've got this! ✨</span></span></Card>
      </Panel>
      <motion.img src="/art/hd/nova-v2.webp" alt="" className="absolute left-[1030px] top-[40px] w-[150px]" style={{ filter: 'drop-shadow(0 18px 24px rgba(40,20,120,.28))' }} initial={{ opacity: 0, y: 40, scale: 0.9 }} animate={{ opacity: 1, y: [0, -9, 0], scale: 1 }} transition={{ opacity: { delay: 0.2 }, scale: { delay: 0.2, type: 'spring' }, y: { duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 0.3 } }} />

      <Panel className="absolute top-[95px] w-[400px] h-[545px] p-6" style={bleedR(30)} initial="hidden" animate="show">
        <div className="flex items-start gap-3"><div className="flex-1"><div className="text-[14px] font-extrabold text-primary-ink uppercase tracking-wide">Focus this week</div><div className="mt-1 font-display font-extrabold text-[26px] leading-tight text-ink">Fraction word problems</div><div className="mt-1 text-[14px] font-semibold text-ink-3">Recommended based on recent performance.</div></div><motion.span className="text-primary-ink" animate={{ rotate: [0, -8, 8, 0] }} transition={{ duration: 3, repeat: Infinity }}><Target size={70} /></motion.span></div>
        <Card className="mt-4 p-4"><div className="text-[13px] font-extrabold text-primary-ink uppercase tracking-wide">Why this focus?</div><div className="mt-2 flex items-center gap-3"><span className="icon-orb w-[40px] h-[40px] text-white shrink-0" style={{ background: 'var(--grad-primary)' }}><Star size={20} fill="currentColor" /></span><p className="text-[14px] font-semibold text-ink-2 leading-snug">You scored 2/5 in word problems. Extra practice will build accuracy and confidence.</p></div></Card>
        <Card className="mt-4 p-4"><div className="text-[13px] font-extrabold text-primary-ink uppercase tracking-wide">Weekly progress forecast</div><div className="mt-1 text-[14px] font-semibold text-ink-2">Great job! You're on track for growth.</div><div className="relative mt-4"><Bar value={0.75} h={10} delay={0.3} /><motion.span className="absolute -top-[10px] w-[30px] h-[30px] rounded-full grid place-items-center text-gold bg-white shadow" style={{ left: 'calc(75% - 15px)' }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring' }}><Star size={16} fill="currentColor" /></motion.span></div><div className="mt-4 grid grid-cols-3 divide-x divide-[var(--line)] text-center">{[['75%', 'Concepts Strong', 'text-ink'], ['+18%', 'Accuracy Boost', 'text-green-600'], ['92%', 'Confidence Score', 'text-ink']].map(([v, l, c]) => <div key={l}><div className={cn('font-display font-extrabold text-[24px]', c)}>{v}</div><div className="text-[11px] font-bold text-ink-3">{l}</div></div>)}</div></Card>
      </Panel>
      <motion.div className="absolute top-[665px] w-[400px] flex flex-col gap-3" style={bleedR(30)} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Button size="md" icon={saved ? <Check size={24} /> : <Play size={22} fill="currentColor" />} className="w-full h-[66px] uppercase text-[22px]" sound="whoosh" onClick={() => { setSaved(true); g.notice('Weekly plan saved for ' + name) }}>{saved ? 'Plan saved' : 'Save weekly plan'}</Button>
        <Button variant="outline" size="md" icon={<SlidersHorizontal size={22} />} className="w-full h-[58px] uppercase text-[19px]" onClick={() => nav('/onboarding/goals')}>Adjust goals</Button>
        <button className="mt-2 flex items-center justify-center gap-2 text-[16px] font-extrabold text-primary-ink uppercase tracking-wide" onClick={() => { sfx.tap(); nav('/parent') }}><ArrowLeft size={18} /> Back to overview</button>
      </motion.div>
    </Page>
  )
}
