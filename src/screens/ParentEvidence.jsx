import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft, Search, Bell, GraduationCap, ShieldCheck, Info, ChevronRight, LayoutTemplate, Briefcase, LayoutGrid, Trophy, ClipboardCheck, Play, HelpCircle, ArrowLeftRight, Home, BookOpen, User, MessageCircle } from 'lucide-react'
import Scene, { Cutout } from '../components/Scene.jsx'
import Page, { Stack, Item } from '../components/Page.jsx'
import ParentRail from '../components/ParentRail.jsx'
import { UserChip, IconPill } from '../components/TopBar.jsx'
import { Panel, Card } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import { Ring, Counter, Fraction } from '../components/Widgets.jsx'
import { useGame } from '../state/GameProvider.jsx'
import { gradeLabel } from '../data/catalog.js'
import { bleedL, bleedR, safeT } from '../components/Stage.jsx'
import { sfx } from '../lib/sound.js'
import { cn } from '../lib/utils.js'
import { useAccent } from '../lib/accent.js'


export default function ParentEvidence() {
  const nav = useNavigate()
  const g = useGame(); const { name, grade, board } = g.state.profile
  const ac = useAccent()
  return (
    <Page>
      <Scene name="evidence" />
      <ParentRail />
      <motion.div className="absolute flex items-center gap-3" style={{ ...bleedR(30), ...safeT(20) }} initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}><IconPill><Search size={22} /></IconPill><IconPill className="relative"><Bell size={22} /><span className="absolute top-3 right-3 w-[9px] h-[9px] rounded-full bg-red-500 border-2 border-white" /></IconPill><UserChip name={`Parent of ${name}`} face={2} /></motion.div>

      <Panel soft className="absolute left-[295px] top-[90px] w-[1345px] h-[800px] p-8" initial="hidden" animate="show">
        <div className="flex items-center gap-5">
          <button className="pill w-[48px] h-[48px] justify-center text-ink" onClick={() => { sfx.tap(); nav('/parent') }}><ArrowLeft size={22} /></button>
          <img src="/art/planet-sm.webp" alt="" className="w-[90px] floaty" />
          <div><h1 className="font-display font-extrabold text-[54px] leading-none text-ink">Fractions</h1><div className="mt-1 text-[20px] font-semibold text-ink-2">{board} {gradeLabel(grade)} <span className="mx-2 text-ink-3">|</span> <span className="text-green-600 font-bold">Verified</span> <ShieldCheck size={20} className="inline text-green-500" /></div></div>
          <button className="ml-auto flex items-center gap-2 text-[14px] font-extrabold text-primary-ink uppercase tracking-wide" onClick={() => sfx.tap()}>Why this was recommended <Info size={18} /></button>
        </div>
        <div className="mt-6 grid grid-cols-[335px_1fr] gap-5">
          <Stack className="flex flex-col gap-4" start={0.6}>
            <Item v="soft"><Card className="p-5 flex items-start gap-4"><span className="icon-orb w-[54px] h-[54px] text-white" style={{ background: 'var(--grad-primary)' }}><GraduationCap size={28} /></span><span className="leading-tight"><span className="block font-display font-extrabold text-[20px] text-primary-ink">School Coverage</span><span className="block mt-1 text-[17px] font-bold text-ink">{board} {gradeLabel(grade)}</span><span className="block text-[14px] font-bold text-green-600">Verified ✓</span><span className="block mt-1 text-[13px] font-semibold text-ink-3">Aligned to your child's curriculum</span></span></Card></Item>
            <Item v="soft"><Card className="p-5"><div className="font-display font-extrabold text-[20px] text-primary-ink">Kidsverse Plus</div><div className="mt-3 flex flex-col gap-3">{[[LayoutTemplate, 'Visual models', 'Understand with pictures and models'], [Briefcase, 'Word problems', 'Solve real-world questions'], [LayoutGrid, 'Applications', 'Use fractions in daily life']].map(([I, t, s]) => <div key={t} className="flex items-center gap-3"><span className="icon-orb w-[48px] h-[48px] text-white shrink-0" style={{ background: 'var(--grad-primary)' }}><I size={24} /></span><span className="leading-tight"><span className="block text-[17px] font-extrabold text-ink">{t}</span><span className="block text-[13px] font-semibold text-ink-3">{s}</span></span></div>)}</div></Card></Item>
            <Item v="soft"><Card className="p-5"><div className="font-display font-extrabold text-[20px] text-primary-ink">Competition Edge</div><div className="mt-3 flex items-center gap-3"><span className="icon-orb w-[48px] h-[48px] text-white shrink-0" style={{ background: 'var(--grad-primary)' }}><Trophy size={24} /></span><span className="leading-tight"><span className="block text-[17px] font-extrabold text-ink">Higher-order fraction reasoning</span><span className="block text-[13px] font-semibold text-ink-3">Builds deep thinking & accuracy</span></span></div></Card></Item>
          </Stack>
          <div className="flex flex-col gap-5">
            <Card className="p-6 flex gap-6">
              <div className="flex-1"><div className="font-display font-extrabold text-[22px] text-ink">{name}'s recent performance</div>
                <div className="mt-4 grid grid-cols-2 gap-4">{[['Test', 0.8, '8/10', '#22c55e', 'Great job!', "You're grasping fractions well."], ['Word problems', 0.4, '2/5', '#f59e0b', 'Keep practicing!', 'Word problems need a bit more focus.']].map(([t, v, s, c0, h, d], i) => { const c = ac(c0); return <div key={t} className="card p-4"><div className="text-[16px] font-bold text-ink">{t}</div><div className="mt-2 flex items-center gap-3"><Ring size={96} stroke={12} value={v} id={`ev${i}`} delay={0.3} track="#eef" /><span className="font-display font-extrabold text-[30px] text-ink">{s}</span></div><div className="mt-2 font-extrabold text-[16px]" style={{ color: c }}>{h}</div><div className="text-[13px] font-semibold text-ink-3">{d}</div></div> })}</div>
              </div>
              <div className="w-[330px] flex flex-col items-center pt-8">
                {[[1, 2, '#ddd6fe', 1], [1, 4, '#fecdd3', 2], [1, 8, '#fde68a', 4]].map(([n, d, c, k]) => <div key={d} className="flex gap-2 mb-2 w-[300px]">{Array.from({ length: k }, (_, i) => <motion.div key={i} className="flex-1 h-[48px] rounded-md grid place-items-center" style={{ background: c, color: '#1b1a5e' }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.1 + k * 0.1 + i * 0.05 }}><Fraction n={n} d={d} size={14} /></motion.div>)}</div>)}
                <p className="mt-3 text-[15px] font-semibold text-ink-2 leading-snug text-center">Think of fractions as equal parts of a whole. The more you practice, the easier it gets! <span className="text-gold">✦</span></p>
              </div>
            </Card>
            <div className="grid grid-cols-[1fr_420px] gap-5">
              <Card className="p-5"><div className="font-display font-extrabold text-[20px] text-ink">Recent activity</div><div className="mt-3 flex flex-col gap-3">{[[ClipboardCheck, '#7c3aed', 'Mixed Test', 'Practice & track progress', 'Score: 7/10', 'Today, 4:30 PM'], [Play, '#8b5cf6', 'Fraction visual lesson', 'Build strong concepts', 'Completed', 'Today, 3:45 PM'], [HelpCircle, '#3b82f6', '3 targeted questions', 'Focus on weak areas', 'Score: 2/3', 'Today, 3:20 PM']].map(([I, c, t, s, r, when]) => <div key={t} className="flex items-center gap-3"><span className="icon-orb w-[46px] h-[46px] text-white shrink-0" style={{ background: c }}><I size={22} /></span><span className="flex-1 leading-tight"><span className="block text-[16px] font-extrabold text-ink">{t}</span><span className="block text-[13px] font-semibold text-ink-3">{s}</span></span><span className="text-right leading-tight"><span className={cn('block text-[14px] font-extrabold', r === 'Completed' ? 'text-green-600' : 'text-ink-2')}>{r}</span><span className="block text-[12px] font-semibold text-ink-3">{when}</span></span><ChevronRight size={18} className="text-ink-3" /></div>)}</div></Card>
              <Card className="relative p-5 pl-[150px]"><div className="font-display font-extrabold text-[20px] text-ink">Nova's insight <span className="text-primary-ink">✦</span></div><p className="mt-1 text-[15px] font-bold text-ink-2 leading-snug">{name} understands fraction basics really well!</p><p className="mt-2 text-[14px] font-semibold text-ink-3 leading-snug">He just needs more practice with word problems to feel even more confident.</p><Button size="md" arrow className="mt-3 w-full h-[50px] uppercase text-[16px]" sound="whoosh" onClick={() => nav('/parent/plan')}>View Nova's next plan</Button></Card>
            </div>
          </div>
        </div>
      </Panel>
      <Cutout id="evidence-0" delay={0.27} amp={8} dx={-40} dy={10} scale={0.92} />
      <motion.div className="absolute left-[560px] top-[898px] w-[560px] text-center text-[15px] font-extrabold tracking-[0.3em] text-ink-3 uppercase" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>✦ Every child. Every dream. Every day. ✦</motion.div>
    </Page>
  )
}
