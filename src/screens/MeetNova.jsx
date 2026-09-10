import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { MessageSquare, Heart, Star, AudioLines, ChevronDown, Volume2, ShieldCheck, Users } from 'lucide-react'
import Scene, { Child } from '../components/Scene.jsx'
import Page, { Stack, Item } from '../components/Page.jsx'
import { TopBar } from '../components/TopBar.jsx'
import { Card } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import { Sparkles } from '../components/Widgets.jsx'
import { TrustRow } from './Landing.jsx'
import { useGame } from '../state/GameProvider.jsx'
import { sfx } from '../lib/sound.js'

/* The portal: three counter-rotating conic rings with a soft core glow. */
function Portal({ x, y, size }) {
  return (
    <motion.div className="absolute" style={{ left: x, top: y, width: size, height: size }} initial={{ opacity: 0, scale: 0.4, rotate: -40 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 90, damping: 18, delay: 0.1 }}>
      <div className="absolute inset-0 rounded-full spin-slow" style={{ background: 'conic-gradient(from 0deg, rgba(139,92,246,0), rgba(139,92,246,.9), rgba(56,189,248,.9), rgba(139,92,246,0))', filter: 'blur(10px)', opacity: .8 }} />
      <div className="absolute inset-[6%] rounded-full spin-slow" style={{ background: 'conic-gradient(from 180deg, rgba(56,189,248,0), rgba(56,189,248,.8), rgba(236,72,153,.6), rgba(56,189,248,0))', filter: 'blur(6px)', animationDirection: 'reverse', animationDuration: '26s' }} />
      <div className="absolute inset-[13%] rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,255,255,.9), rgba(199,210,254,.6) 45%, rgba(139,92,246,.25) 75%, transparent 100%)' }} />
      <motion.div className="absolute inset-[13%] rounded-full" style={{ boxShadow: 'inset 0 0 60px rgba(139,92,246,.5)' }} animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 3, repeat: Infinity }} />
    </motion.div>
  )
}

export default function MeetNova() {
  const nav = useNavigate()
  const g = useGame()
  const name = g.state.profile.name
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  return (
    <Page>
      <Scene name="nova" />
      <Child screen="nova" delay={0.4} amp={6} />
      <TopBar />

      <Stack className="absolute left-[1040px] top-[80px] w-[560px]" start={0.3}>
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
        {error && <Item className="mt-2 text-[14px] font-bold text-red-500">{error}</Item>}
        <Item v="pop" className="mt-4"><Button size="lg" arrow className="w-full h-[80px] uppercase text-[28px]" sound="unlock" disabled={busy} onClick={async () => { setError(''); setBusy(true); try { await g.greetNova(); g.setProfile({ firstVisit: true }); g.completeChild(); nav('/welcome') } catch (e) { setError(e.message) } finally { setBusy(false) } }}>{busy ? 'Starting…' : 'Start my journey'}</Button></Item>
        <Item v="pop" className="mt-3 flex justify-center"><Button variant="ghost" size="md" icon={<Volume2 size={22} />} className="w-[300px] h-[54px] text-[19px]" onClick={() => sfx.success()}>Hear Nova speak</Button></Item>
      </Stack>

      <TrustRow compact className="absolute left-[165px] top-[812px]" delay={0.3} items={[[ShieldCheck, '#22c55e', 'Safe Learning', 'Your child is in safe hands'], [Heart, '#ec4899', 'Loved by kids', 'Designed for joy and growth'], [Users, '#3b82f6', 'Trusted by parents', 'Real progress. Real results.']]} />
    </Page>
  )
}
