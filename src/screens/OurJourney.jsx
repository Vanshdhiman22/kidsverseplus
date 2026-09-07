import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Flame, Bell, Award } from 'lucide-react'
import Scene, { Child } from '../components/Scene.jsx'
import Page, { Stack, Item } from '../components/Page.jsx'
import { TopBar, UserChip, IconPill } from '../components/TopBar.jsx'
import { Panel, Card } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import SpeechBubble from '../components/SpeechBubble.jsx'
import { Counter, Sparkles } from '../components/Widgets.jsx'
import { STATS, MILESTONES } from './Profile.jsx'
import { useGame } from '../state/GameProvider.jsx'

export default function OurJourney() {
  const nav = useNavigate()
  const g = useGame(); const { name, face } = g.state.profile
  const stats = [...STATS, [Flame, '#f97316', 'Best streak', 12, 'days']]
  return (
    <Page>
      <Scene name="ourjourney" />
      <TopBar logo="planet" right={<><span className="pill h-[60px] px-5 gap-2 text-[18px] font-bold text-ink"><img src="/art/planet-sm.webp" alt="" className="w-[34px]" /> Explorer <span className="text-gold">✦</span> Level {g.level}</span><IconPill className="relative"><Bell size={22} /><span className="absolute top-3 right-3 w-[9px] h-[9px] rounded-full bg-red-500 border-2 border-white" /></IconPill><UserChip name={name} face={face} /></>} showControls={false} />
      <Child screen="ourjourney" delay={0.4} amp={6} />
      <div className="absolute left-[40px] top-[665px]"><SpeechBubble tail="right" text="We've learned a lot together. ✨" delay={0.3} className="w-[215px] text-[22px] font-bold" /></div>

      <Stack className="absolute left-[685px] top-[115px]" start={0.2}>
        <Item><h1 className="font-display font-extrabold text-[72px] leading-none text-ink uppercase">Our Journey <span className="text-gold text-[56px]">✦</span></h1></Item>
        <Item className="mt-3 text-[22px] font-semibold text-ink-2 leading-snug">Every step you've taken has made you stronger.<br />Here's how far you and Nova have come!</Item>
      </Stack>
      <Sparkles n={5} seed={32} className="left-[660px] top-[100px] w-[700px] h-[180px]" />

      <Panel className="absolute left-[640px] top-[275px] w-[1000px] h-[135px] px-6 grid grid-cols-5 items-center divide-x divide-[var(--line)]" initial="hidden" animate="show">
        {stats.map(([I, c, t, v, u]) => <div key={t} className="flex items-center gap-3 px-3"><I size={44} style={{ color: c }} /><span className="leading-none"><span className="block text-[14px] font-bold text-ink-2">{t}</span><span className="block font-display font-extrabold text-[40px]" style={{ color: c }}><Counter to={v} delay={0.24} /></span><span className="text-[13px] font-bold text-ink-3">{u}</span></span></div>)}
      </Panel>
      <Panel className="absolute left-[640px] top-[420px] w-[1000px] h-[365px] p-6" initial="hidden" animate="show">
        <div className="font-display font-extrabold text-[20px] text-ink uppercase">Our milestones</div>
        <Stack className="mt-3 grid grid-cols-4 gap-8" start={0.8} delay={0.12}>{MILESTONES.map(([I, c, t, s], i) => <Item key={t} v="pop"><Card hover className="relative h-[240px] p-4 pt-8 flex flex-col items-center text-center"><span className="absolute -top-4 -left-3 w-[42px] h-[42px] rounded-full grid place-items-center text-white font-display font-extrabold text-[20px]" style={{ background: 'var(--grad-primary)' }}>{i + 1}</span><span className="icon-orb w-[110px] h-[110px]" style={{ color: c, background: `${c}1f` }}><I size={56} /></span><span className="mt-3 text-[17px] font-extrabold text-ink leading-tight">{t}</span><span className="mt-1 text-[13px] font-semibold text-ink-3 leading-tight">{s}</span></Card></Item>)}</Stack>
        <div className="relative mt-5 mx-[100px] h-[4px] rounded-full bg-[var(--lavender-2)]"><motion.div className="absolute inset-y-0 left-0 rounded-full" style={{ background: 'var(--grad-primary)' }} initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 1.4, delay: 0.3 }} />{[0, 1, 2, 3].map(i => <motion.span key={i} className="absolute -top-[8px] w-[20px] h-[20px] rounded-full border-4 border-[var(--primary)] bg-white" style={{ left: `calc(${i * 33.3}% - 10px)` }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1 + i * 0.3 }} />)}</div>
      </Panel>
      <motion.div className="absolute left-[1155px] top-[805px]" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}><Button size="lg" arrow className="w-[455px] h-[84px] uppercase text-[24px]" sound="whoosh" onClick={() => nav('/journey')}>Continue our journey</Button></motion.div>
    </Page>
  )
}
