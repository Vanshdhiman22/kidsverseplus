import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { MessageSquare, Heart, Star, AudioLines, ChevronDown, Volume2, ShieldCheck, Users } from 'lucide-react'
import Scene, { Child, Cutout } from '../components/Scene.jsx'
import Page, { Stack, Item } from '../components/Page.jsx'
import { LangPill, TopBar } from '../components/TopBar.jsx'
import { Card } from '../components/Panel.jsx'
import Button from '../components/ApiButton.jsx'
import { Sparkles } from '../components/Widgets.jsx'
import { TrustRow } from './Landing.jsx'
import { useGame } from '../state/GameProvider.jsx'
import { sfx } from '../lib/sound.js'
import { getToken } from '../lib/api.js'

/* The portal: three counter-rotating conic rings with a soft core glow. */
function Portal({ x, y, size }) {
  return (
    <motion.div className="absolute" style={{ left: x, top: y, width: size, height: size }} initial={{ opacity: 0, scale: 0.4, rotate: -40 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 90, damping: 18, delay: 0.1 }}>
      <div className="absolute inset-0 rounded-full spin-slow" style={{ border: '22px solid rgba(139,92,246,.28)', boxShadow: '0 0 42px rgba(139,92,246,.55), inset 0 0 34px rgba(56,189,248,.45)' }} />
      <div className="absolute inset-[5%] rounded-full spin-slow" style={{ border: '10px solid rgba(125,211,252,.42)', boxShadow: '0 0 26px rgba(56,189,248,.5)', animationDirection: 'reverse', animationDuration: '26s' }} />
      <div className="absolute inset-[11%] rounded-full" style={{ border: '5px solid rgba(255,255,255,.55)', background: 'radial-gradient(circle, rgba(255,255,255,.16), rgba(56,189,248,.12) 58%, transparent 74%)', boxShadow: 'inset 0 0 55px rgba(139,92,246,.28)' }} />
      <motion.div className="absolute inset-[16%] rounded-full" style={{ border: '2px solid rgba(196,181,253,.55)' }} animate={{ scale: [1, 1.035, 1], opacity: [.65, 1, .65] }} transition={{ duration: 3, repeat: Infinity }} />
    </motion.div>
  )
}

export default function MeetNova() {
  const nav = useNavigate()
  const g = useGame()
  const name = g.state.profile.name?.trim() || 'Explorer'
  const face = Number(g.state.profile.face) || 1
  useEffect(() => {
    if (!getToken()) nav('/parent/login', { replace: true })
  }, [nav])
  return (
    <Page>
      <Scene name="nova" />
      <Portal x={235} y={70} size={650} />
      {/* The extracted design cutout had a damaged transparent centre, which made
          Nova look hollow. Use the clean approved duo for the boy; the girl keeps
          the character-substitution path so the saved avatar is still respected. */}
      {face === 4
        ? <Child screen="nova" delay={0.4} amp={6} />
        : <Cutout id="meet-nova-duo" src="/art/hd/meetnova-duo.webp" box={[-10, 120, 723, 787]} delay={0.4} amp={6} />}
      {/* This introduction is a locked presentation frame: the approved design only
          carries the brand and language control, without navigation/settings chrome. */}
      <TopBar back={false} showControls={false} right={<LangPill />} />

      <Stack className="absolute left-[995px] top-[96px] w-[560px]" start={0.3}>
        <Item><h1 className="font-display font-extrabold text-[104px] leading-[0.88] text-ink">Meet <span className="text-gold text-[48px] align-top">✦</span><br /><span className="grad-text">Nova</span></h1></Item>
        <Item className="mt-5 card px-6 py-4 flex items-center gap-5 relative" v="pop">
          <span className="absolute -left-[13px] top-1/2 -mt-[11px] w-[22px] h-[22px] rotate-45 rounded-[4px]" style={{ background: 'var(--glass-strong)', borderLeft: '1.5px solid var(--glass-border)', borderBottom: '1.5px solid var(--glass-border)' }} />
          <motion.span className="icon-orb w-[64px] h-[64px]" animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 1.6, repeat: Infinity }}><AudioLines size={32} strokeWidth={2.2} /></motion.span>
          <div>
            <div className="font-display font-extrabold text-[32px] leading-none text-ink">Hi {name}!</div>
            <div className="mt-1 text-[22px] font-semibold text-ink-2">I'm <span className="text-primary-ink font-extrabold">Nova</span>, your learning buddy.</div>
          </div>
        </Item>
        <Item className="mt-4 flex items-center gap-4 text-primary-ink"><span className="hairline flex-1" /><span className="eyebrow text-[15px] tracking-[0.18em]">I'm here to help you...</span><span className="hairline flex-1" /></Item>
        <Stack className="mt-4 grid grid-cols-3 gap-4" start={0.9} delay={0.1}>
          {[[MessageSquare, '#38bdf8', 'I explain in different ways'], [Heart, '#ec4899', 'I remember your learning journey'], [Star, '#f59e0b', 'I celebrate every step']].map(([I, c, t], i) => (
            <Item key={i} v="pop">
              <Card hover className="h-[136px] flex flex-col items-center justify-center text-center px-3 gap-2" style={{ borderColor: `${c}66` }}>
                <span className="icon-orb w-[52px] h-[52px]" style={{ color: c, background: `${c}1f` }}><I size={28} strokeWidth={2.2} /></span>
                <span className="text-[16px] font-bold text-ink leading-tight">{t}</span>
              </Card>
            </Item>
          ))}
        </Stack>
        <Item v="pop" className="mt-4 flex justify-center"><span className="pill h-[44px] px-6 gap-3 text-[15px] font-extrabold tracking-[0.14em] text-ink-2 uppercase"><Heart size={18} className="text-pink-500" fill="currentColor" /> You + Nova <ChevronDown size={16} /></span></Item>
        <Item v="pop" className="mt-4"><Button size="lg" arrow className="w-full h-[80px] uppercase text-[28px]" sound="unlock" onClick={async () => { await g.greetNova(); g.setProfile({ firstVisit: true }); nav('/welcome') }}>Start my journey</Button></Item>
        <Item v="pop" className="mt-3 flex justify-center"><Button variant="ghost" size="md" icon={<Volume2 size={22} />} className="w-[300px] h-[54px] text-[19px]" onClick={() => sfx.success()}>Hear Nova speak</Button></Item>
      </Stack>

      <TrustRow compact className="absolute left-[176px] top-[783px]" delay={0.3} items={[[ShieldCheck, '#22c55e', 'Safe Learning', 'Your child is in safe hands'], [Heart, '#ec4899', 'Loved by kids', 'Designed for joy and growth'], [Users, '#3b82f6', 'Trusted by parents', 'Real progress. Real results.']]} />
    </Page>
  )
}
