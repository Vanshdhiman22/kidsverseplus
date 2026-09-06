import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { BookOpen, HelpCircle, Clock, Lightbulb, Rocket, Volume2 } from 'lucide-react'
import Scene, { Child } from '../components/Scene.jsx'
import Page, { Stack, Item } from '../components/Page.jsx'
import { TopBar, UserChip, LangPill } from '../components/TopBar.jsx'
import { Panel, Card } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import Dock from '../components/Dock.jsx'
import { Switch, Sparkles } from '../components/Widgets.jsx'
import { useGame } from '../state/GameProvider.jsx'

function Portal({ x, y, size }) {
  return (
    <motion.div className="absolute" style={{ left: x, top: y, width: size, height: size }} initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 90, damping: 18 }}>
      <div className="absolute inset-0 rounded-full spin-slow" style={{ background: 'conic-gradient(from 0deg, rgba(167,139,250,0), rgba(167,139,250,.9), rgba(56,189,248,.8), rgba(244,114,182,.6), rgba(167,139,250,0))', filter: 'blur(14px)', opacity: .9 }} />
      <div className="absolute inset-[5%] rounded-full spin-slow" style={{ background: 'conic-gradient(from 180deg, rgba(56,189,248,0), rgba(56,189,248,.7), rgba(167,139,250,.6), rgba(56,189,248,0))', filter: 'blur(8px)', animationDirection: 'reverse', animationDuration: '30s' }} />
      <div className="absolute inset-[12%] rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,255,255,.95), rgba(219,234,254,.7) 45%, rgba(167,139,250,.2) 78%, transparent 100%)' }} />
    </motion.div>
  )
}

export default function TestIntro() {
  const nav = useNavigate()
  const g = useGame(); const { name, face } = g.state.profile; const { readAloud } = g.state.settings
  return (
    <Page>
      <Scene name="intro" />
      <Child screen="intro" delay={0.4} />
      <TopBar logo="planet" center={<span className="pill h-[56px] pl-7 pr-2 gap-4 font-display font-extrabold text-[24px] text-ink uppercase tracking-wide">19. Test Intro <img src="/art/planet-sm.webp" alt="" className="w-[52px] floaty" /></span>} right={<><LangPill /><UserChip name={`Hi, ${name}! 👋`} sub={<span className="flex items-center gap-2">Explorer Level 3 <span className="w-[70px] h-[8px] rounded-full bg-[var(--lavender-2)] inline-block overflow-hidden"><span className="block h-full w-[70%] rounded-full" style={{ background: 'var(--grad-primary)' }} /></span></span>} face={face} /></>} showControls={false} />

      <Panel className="absolute left-[880px] top-[118px] w-[750px] p-10" initial="hidden" animate="show">
        <Sparkles n={4} seed={3} />
        <div className="flex items-center gap-6">
          <motion.span className="w-[92px] h-[92px] rounded-full grid place-items-center text-white shrink-0" style={{ background: 'var(--grad-primary)', boxShadow: 'var(--glow-primary)' }} initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 16, delay: 0.17 }}><BookOpen size={44} strokeWidth={2} /></motion.span>
          <div><h1 className="font-display font-extrabold text-[44px] leading-none text-ink uppercase">Mixed Concept Test</h1><div className="mt-2 text-[20px] font-semibold text-ink-3">A mix of topics and concepts</div></div>
          <img src="/art/planet-sm.webp" alt="" className="ml-auto w-[80px] floaty" />
        </div>
        <Stack className="mt-8 grid grid-cols-3 gap-5" start={0.7} delay={0.1}>
          {[[HelpCircle, '10', 'Questions'], [Clock, 'About', '8 minutes'], [Lightbulb, 'Hints', 'limited']].map(([I, a, b]) => <Item key={b} v="pop"><Card className="h-[92px] px-5 flex items-center gap-4"><span className="icon-orb w-[50px] h-[50px]"><I size={26} /></span><span className="leading-tight"><span className="block font-display font-extrabold text-[22px] text-ink">{a}</span><span className="block text-[16px] font-semibold text-ink-3">{b}</span></span></Card></Item>)}
        </Stack>
        <motion.div className="mt-6 flex items-center gap-5" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <span className="w-[110px] h-[110px] rounded-full grid place-items-center pill shrink-0"><img src="/art/nova/head.webp" alt="" className="w-[86px] floaty" /></span>
          <div className="card flex-1 px-6 py-4 text-[21px] font-semibold text-ink-2 leading-snug relative"><span className="absolute -left-[12px] top-1/2 -mt-[10px] w-[20px] h-[20px] rotate-45" style={{ background: 'var(--glass-strong)', borderLeft: '1.5px solid var(--glass-border)', borderBottom: '1.5px solid var(--glass-border)' }} />I'll guide you through this.<br />Take your time.<br />Tap me to read instructions.</div>
        </motion.div>
        <Stack className="mt-7 flex flex-col gap-4" start={1.3}>
          <Item v="pop"><Button size="lg" arrow icon={<Rocket size={30} strokeWidth={2.4} />} className="w-full h-[84px] uppercase text-[30px]" sound="whoosh" onClick={() => nav('/tests/mixed/question')}>Start Test</Button></Item>
          <Item v="pop"><Button variant="outline" size="md" className="w-full h-[60px] uppercase text-[20px] tracking-wide" onClick={() => nav('/tests')}>Not now</Button></Item>
          <Item v="pop" className="flex justify-center"><span className="pill h-[54px] px-6 gap-4 text-[18px] font-bold text-ink-2"><Volume2 size={22} className="text-primary-ink" /> Read instructions aloud <Switch on={readAloud} onChange={v => g.setSettings({ readAloud: v })} /></span></Item>
        </Stack>
      </Panel>
      <Dock sub spread className="w-[1440px]" style={{ bottom: 12 }} />
    </Page>
  )
}
