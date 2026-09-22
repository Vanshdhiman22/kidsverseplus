import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Rocket, User, Users, ArrowRight, ShieldCheck, Heart } from 'lucide-react'
import Scene, { Child } from '../components/Scene.jsx'
import Page, { Stack, Item } from '../components/Page.jsx'
import { TopBar } from '../components/TopBar.jsx'
import { Panel } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import SpeechBubble from '../components/SpeechBubble.jsx'
import { Sparkles } from '../components/Widgets.jsx'
import { useGame } from '../state/GameProvider.jsx'
import { sfx } from '../lib/sound.js'

export function TrustRow({ items, className, style, delay = 0.9, compact }) {
  return (
    <Stack className={className} style={style} start={delay} delay={0.12}>
      <div className={compact ? 'flex items-stretch gap-3' : 'flex items-stretch gap-5'}>
        {items.map(([Icon, color, title, sub], i) => (
          <Item key={i} v="pop" className={compact ? 'pill h-[80px] px-4 gap-3 rounded-[22px]' : 'pill h-[92px] px-6 gap-4 rounded-[24px]'}>
            <span className={compact ? 'icon-orb w-[46px] h-[46px]' : 'icon-orb w-[54px] h-[54px]'} style={{ color, background: `${color}22` }}><Icon size={compact ? 24 : 28} strokeWidth={2.2} /></span>
            <span className="leading-tight">
              <span className={compact ? 'block font-display font-extrabold text-[17px] text-ink' : 'block font-display font-extrabold text-[20px] text-ink'}>{title}</span>
              <span className={compact ? 'block text-[13px] font-semibold text-ink-3 max-w-[150px]' : 'block text-[15px] font-semibold text-ink-3'}>{sub}</span>
            </span>
          </Item>
        ))}
      </div>
    </Stack>
  )
}

export default function Landing() {
  const nav = useNavigate()
  const g = useGame()
  return (
    <Page>
      <Scene name="landing" />
      <Child screen="landing" delay={0.35} />
      <TopBar />
      <Stack className="absolute left-[95px] top-[140px] w-[640px]" start={0.2}>
        <Item>
          <h1 className="font-display font-extrabold uppercase leading-[0.98] tracking-tight text-[88px] text-ink">
            <span className="block">Every child.</span>
            <span className="block">Every dream.</span>
            <span className="grad-text relative inline-block">Every day.<span className="absolute -right-12 top-2 text-gold text-[40px] sparkle" style={{ position: 'absolute' }}>✦</span></span>
          </h1>
        </Item>
        <Item className="mt-6 text-[25px] font-semibold text-ink-2 leading-snug w-[440px]">A personalized learning universe where every mission is made for you.</Item>
      </Stack>

      <div className="absolute left-[705px] top-[250px]">
        <SpeechBubble tail="bottom" text="Ready when you are, Explorer. ✨" delay={0.3} className="w-[240px] text-[19px]" />
      </div>

      <Panel className="absolute left-[960px] top-[165px] w-[620px] p-10" initial="hidden" animate="show">
        <Sparkles n={3} seed={3} size={12} />
        <div className="flex items-start gap-6">
          <motion.span className="icon-orb w-[96px] h-[96px] shrink-0" style={{ background: 'var(--lavender)' }} initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 16, delay: 0.17 }}>
            <Rocket size={44} strokeWidth={2} className="text-primary-ink" />
          </motion.span>
          <div>
            <h2 className="font-display font-extrabold text-[40px] leading-tight text-ink">Begin your adventure</h2>
            <p className="mt-2 text-[21px] font-semibold text-ink-3 leading-snug">Step into Kidsverse and start your personalized learning journey.</p>
          </div>
        </div>
        <Stack className="mt-9 flex flex-col gap-5" start={0.7}>
          <Item v="pop"><Button size="lg" arrow icon={<Rocket size={30} strokeWidth={2.4} />} className="w-full uppercase text-[30px]" sound="whoosh" onClick={() => { g.setAuthIntent('play'); nav('/parent/login') }}>Get Started</Button></Item>
          <Item v="pop"><Button variant="outline" size="md" icon={<User size={24} strokeWidth={2.4} />} className="w-full h-[68px] uppercase text-[21px]" onClick={() => { g.setAuthIntent('play'); nav('/parent/login') }}>I already have an account</Button></Item>
          <Item v="pop">
            <button className="card w-full h-[68px] px-6 flex items-center gap-4 text-left card-hover" onClick={() => { sfx.tap(); g.setAuthIntent('parent'); nav('/parent/login') }}>
              <Users size={26} strokeWidth={2.2} className="text-primary-ink" />
              <span className="text-[21px] font-bold text-ink flex-1">Parent? <span className="font-extrabold">Open Parent Zone</span></span>
              <ArrowRight size={24} strokeWidth={2.6} className="text-primary-ink" />
            </button>
          </Item>
        </Stack>
      </Panel>

      <TrustRow
        className="absolute left-[95px] top-[800px]"
        items={[[ShieldCheck, '#22c55e', 'Safe learning', 'Your child is in safe hands'], [Heart, '#ec4899', 'Loved by kids', 'Designed for joy and growth'], [Users, '#3b82f6', 'Trusted by parents', 'Real progress. Real results.']]}
      />
    </Page>
  )
}
