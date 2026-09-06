import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Search, Bell, ChevronDown, BookOpen, Box, Trophy, MessageCircle, Puzzle, Star, BarChart3, Calculator, User, ClipboardCheck, Rocket, TrendingUp } from 'lucide-react'
import Scene, { Cutout } from '../components/Scene.jsx'
import Page, { Stack, Item } from '../components/Page.jsx'
import ParentRail from '../components/ParentRail.jsx'
import { UserChip, IconPill } from '../components/TopBar.jsx'
import { Panel, Card } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import SpeechBubble from '../components/SpeechBubble.jsx'
import { Bar, Counter } from '../components/Widgets.jsx'
import { useGame } from '../state/GameProvider.jsx'
import { gradeLabel } from '../data/catalog.js'
import { bleedR } from '../components/Stage.jsx'
import { useAccent } from '../lib/accent.js'

const KPIS = [[BookOpen, '#3b82f6', 'School coverage', 68, 'On track', 'Based on CBSE Grade 4 syllabus'], [Box, '#7c3aed', 'Kidsverse added', 42, 'Strong practice', 'Personalised practice beyond school'], [Trophy, '#f59e0b', 'Competition readiness', null, 'Building', "Keep going! You're building strong"], [MessageCircle, '#22c55e', 'Reading & confidence', null, 'Improving', 'Great progress in reading and expression']]
const NEXT = [[Puzzle, '#7c3aed', 'Fractions —', 'word problems need support', 'Focus area', '#7c3aed'], [BookOpen, '#3b82f6', 'Reading —', 'inference improving', 'On track', '#0ea5e9'], [MessageCircle, '#22c55e', 'Confidence —', 'complete sentences improving', 'Improving', '#22c55e']]

export default function ParentOverview() {
  const nav = useNavigate()
  const g = useGame(); const { name, face, grade, board } = g.state.profile
  const ac = useAccent()
  return (
    <Page>
      <Scene name="parent" />
      <ParentRail />
      <motion.div className="absolute left-[250px] top-[25px] pill h-[76px] pl-2 pr-5 gap-3" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}><img src={`/art/kid${face}-face-sm.webp`} alt="" className="w-[56px] h-[56px] rounded-full object-cover border-2 border-white" /><span className="leading-tight"><span className="block font-display font-extrabold text-[20px] text-ink">{name}</span><span className="block text-[14px] font-bold text-ink-3">{gradeLabel(grade)} • {board}</span></span><ChevronDown size={20} className="text-ink-3 ml-3" /></motion.div>
      <motion.div className="absolute top-[22px] flex items-center gap-3" style={bleedR(34)} initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <IconPill><Search size={22} /></IconPill><IconPill className="relative"><Bell size={22} /><span className="absolute top-3 right-3 w-[9px] h-[9px] rounded-full bg-red-500 border-2 border-white" /></IconPill>
        <UserChip name="Hi, Parent!" sub={`${name}'s learning hub`} face={face} />
      </motion.div>

      <motion.img src="/art/crops/aarav-avatar.webp" alt="" className="absolute left-[250px] top-[180px] w-[200px] h-[220px] object-cover rounded-full border-4 border-white shadow-xl" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.14, type: 'spring', stiffness: 200, damping: 16 }} />
      <Stack className="absolute left-[460px] top-[190px] w-[340px]" start={0.3}>
        <Item><h1 className="font-display font-extrabold text-[62px] leading-[0.95] text-ink">{name}'s<br />learning <span className="text-gold text-[44px]">✦</span></h1></Item>
        <Item className="mt-3 text-[16px] font-semibold text-ink-2 leading-snug">{name} is showing great consistency! With the right support in a few key areas, they'll keep building strong every day. 💜</Item>
      </Stack>
      <div className="absolute left-[775px] top-[378px]"><SpeechBubble tail="right" delay={0.3} className="w-[170px] text-[13px] text-center px-3 py-2"><span className="font-extrabold text-[16px] text-primary-ink">I'm Nova!</span><br />I track progress and personalise learning to help {name} grow.</SpeechBubble></div>
      <Cutout id="parent-0" delay={0.17} amp={10} />

      <Stack className="absolute left-[245px] top-[480px] flex gap-[16px]" start={0.7} delay={0.1}>
        {KPIS.map(([I, c0, t, v, st, s]) => { const c = ac(c0); return <Item key={t} v="pop"><Card hover className="w-[190px] h-[305px] p-4 flex flex-col items-center text-center"><span className="icon-orb w-[74px] h-[74px]" style={{ color: c, background: `${c}1f` }}><I size={36} /></span><span className="mt-3 text-[17px] font-extrabold text-ink leading-tight">{t}</span>{v != null ? <><span className="font-display font-extrabold text-[44px] leading-none mt-2" style={{ color: c }}><Counter to={v} delay={0.3} />%</span><Bar value={v / 100} h={8} className="mt-3 w-full" delay={0.3} /></> : <span className="font-display font-extrabold text-[30px] leading-none mt-3" style={{ color: c }}>{st}{t.startsWith('Reading') && <TrendingUp size={22} className="inline ml-1" />}</span>}<span className="mt-2 text-[14px] font-extrabold" style={{ color: c }}>{v != null ? st : ''}</span><span className="mt-auto text-[12px] font-semibold text-ink-3 leading-tight">{s}</span></Card></Item> })}
      </Stack>
      <Panel className="absolute left-[245px] top-[800px] w-[785px] h-[100px] px-6 flex items-center gap-5" initial="hidden" animate="show">
        <span className="icon-orb w-[60px] h-[60px] text-white" style={{ background: 'var(--grad-primary)' }}><Star size={30} fill="currentColor" /></span>
        <span className="flex-1 leading-snug"><span className="block text-[18px] font-extrabold text-ink">Keep it up, {name}! Small steps lead to big achievements.</span><span className="block text-[15px] font-semibold text-ink-2">Your daily effort today is building your brighter tomorrow. 💜</span></span>
        <motion.span className="text-primary-ink" animate={{ y: [0, -8, 0], rotate: [0, 6, 0] }} transition={{ duration: 3, repeat: Infinity }}><Rocket size={54} /></motion.span>
      </Panel>

      <Panel className="absolute left-[1065px] top-[150px] w-[565px] h-[710px] p-6" initial="hidden" animate="show">
        <div className="flex items-center gap-2 font-display font-extrabold text-[20px] text-ink uppercase"><span className="text-primary-ink">✦</span> What Kidsverse is doing next</div>
        <Stack className="mt-4 flex flex-col gap-3" start={0.8}>{NEXT.map(([I, c0, t, s, tag, tc0]) => { const c = ac(c0), tc = ac(tc0); return <Item key={t} v="soft"><Card className="h-[90px] px-4 flex items-center gap-4"><span className="icon-orb w-[54px] h-[54px]" style={{ color: c, background: `${c}1f` }}><I size={28} /></span><span className="flex-1 leading-tight"><span className="block font-display font-extrabold text-[19px] text-ink">{t}</span><span className="block text-[15px] font-semibold text-ink-2">{s}</span></span><span className="chip h-[36px] px-4 text-[14px]" style={{ color: tc, background: `${tc}18`, border: `1.5px solid ${tc}55` }}>{tag}</span></Card></Item> })}</Stack>
        <div className="mt-5 font-display font-extrabold text-[15px] text-primary-ink uppercase tracking-wide">Next plan includes</div>
        <div className="mt-2 grid grid-cols-4 gap-2">{[[Calculator, '#7c3aed', '2 Maths missions'], [BookOpen, '#3b82f6', '1 Reading mission'], [User, '#22c55e', '1 Confidence activity'], [ClipboardCheck, '#f59e0b', '1 Mixed Test']].map(([I, c, t]) => <div key={t} className="flex items-center gap-2"><span className="icon-orb w-[36px] h-[36px] text-white shrink-0" style={{ background: c }}><I size={18} /></span><span className="text-[13px] font-bold text-ink-2 leading-tight">{t}</span></div>)}</div>
        <div className="mt-6 flex flex-col gap-3"><Button size="md" arrow className="w-full h-[64px] uppercase text-[22px]" sound="whoosh" onClick={() => nav('/parent/plan')}>View weekly plan</Button><Button variant="ghost" size="md" icon={<BarChart3 size={22} />} className="w-full h-[58px] uppercase text-[18px]" onClick={() => nav('/parent/evidence')}>View topic evidence</Button></div>
      </Panel>
    </Page>
  )
}
