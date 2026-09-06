import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Clock, ChevronRight, HelpCircle, Check } from 'lucide-react'
import Scene, { Cutout, Child } from '../components/Scene.jsx'
import Page, { Stack, Item } from '../components/Page.jsx'
import { TopBar, UserChip, StatPill } from '../components/TopBar.jsx'
import { Card } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import SpeechBubble from '../components/SpeechBubble.jsx'
import Dock from '../components/Dock.jsx'
import { ArtIcon, Tilt } from '../components/Widgets.jsx'
import { TESTS } from '../data/catalog.js'
import { useGame } from '../state/GameProvider.jsx'
import { cn } from '../lib/utils.js'

export default function TestArena() {
  const nav = useNavigate()
  const g = useGame(); const { name, face } = g.state.profile; const { streak, coins } = g.state.stats
  const row1 = TESTS.slice(0, 5), row2 = TESTS.slice(5)
  const TestCard = ({ t, wide, i }) => (
    <Item v="pop"><Tilt max={5}>
      <Card hover selected={t.recommended} className={cn('relative p-5 flex flex-col', wide ? 'w-[470px] h-[124px] p-4' : t.recommended ? 'w-[335px] h-[228px] -mt-[10px] z-10' : 'w-[285px] h-[180px]')} onClick={() => nav('/tests/mixed/intro')}>
        {t.recommended && <><span className="absolute -top-[16px] left-1/2 -translate-x-1/2 h-[30px] px-4 rounded-full text-white text-[14px] font-extrabold flex items-center" style={{ background: 'var(--grad-primary)' }}>Recommended</span><span className="absolute top-3 right-3 w-[30px] h-[30px] rounded-full grid place-items-center text-white" style={{ background: 'var(--grad-primary)' }}><Check size={18} strokeWidth={3.5} /></span></>}
        <div className="flex items-start gap-4"><ArtIcon name={t.icon} size={wide ? 70 : 76} float /><div className="flex-1 leading-tight"><div className="font-display font-extrabold text-[22px] text-ink">{t.name}</div><div className="mt-1 text-[15px] font-semibold text-ink-2 leading-snug">{t.desc}</div></div></div>
        <div className="mt-auto flex items-center gap-4 text-[15px] font-bold text-ink-3">{t.q && <span className="flex items-center gap-1"><HelpCircle size={17} /> {t.q}</span>}<span className="flex items-center gap-1"><Clock size={17} /> {t.time}</span>{!t.recommended && <ChevronRight size={22} className="ml-auto text-primary-ink" />}</div>
        {t.recommended && <Button size="sm" arrow className="mt-3 w-full h-[50px] text-[18px] uppercase" sound="whoosh">View Mixed Test</Button>}
      </Card>
    </Tilt></Item>
  )
  return (
    <Page>
      <Scene name="arena" />
      <Cutout id="arena-1" delay={0.17} amp={10} />
      <Child screen="arena" delay={0.4} amp={6} />
      <TopBar right={<><StatPill kind="xp" value={`${streak} days`} label="Streak" /><StatPill kind="bolt" value={(2450).toLocaleString()} label="XP" /><StatPill kind="coins" value={coins} label="Nova Coins" /><UserChip name={name} face={face} /></>} showControls={false} />
      <Stack className="absolute left-[90px] top-[98px]" start={0.2}>
        <Item className="eyebrow text-[19px]">18. Test Arena</Item>
        <Item className="flex items-center gap-4"><h1 className="font-display font-extrabold text-[62px] leading-none text-ink">Test with Nova</h1><img src="/art/planet-sm.webp" alt="" className="w-[56px] floaty" /></Item>
        <Item className="mt-1 text-[21px] font-semibold text-ink-2 w-[340px] leading-snug">Choose a test and grow your skills.</Item>
      </Stack>
      <div className="absolute left-[680px] top-[140px]"><SpeechBubble tail="bottom" text="Ready to test your knowledge? Pick a test below! 🚀" delay={0.3} className="w-[220px] text-[18px]" /></div>

      <Stack className="absolute left-[58px] top-[488px] flex items-end gap-[16px]" start={0.7} delay={0.08}>{row1.map((t, i) => <TestCard key={t.id} t={t} i={i} />)}</Stack>
      <Stack className="absolute left-[58px] top-[714px] flex gap-[16px]" start={1.1} delay={0.08}>{row2.map((t, i) => <TestCard key={t.id} t={t} wide />)}</Stack>
      <Dock spread className="w-[1200px]" style={{ bottom: 12 }} />
    </Page>
  )
}
