import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft, Mic, Volume2, Lightbulb, Headphones, RefreshCw, MessageCircle, Star, BookA, ShieldCheck, Coins, ChevronDown, Music } from 'lucide-react'
import Scene, { Cutout, Child } from '../components/Scene.jsx'
import Page, { Stack, Item } from '../components/Page.jsx'
import Logo from '../components/Logo.jsx'
import { UserChip } from '../components/TopBar.jsx'
import { Panel, Card } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import { Bar } from '../components/Widgets.jsx'
import { useGame } from '../state/GameProvider.jsx'
import { bleedL, bleedR, safeT, safeB } from '../components/Stage.jsx'
import { sfx } from '../lib/sound.js'
import { speak } from '../lib/voice.js'

const SKILLS = [[MessageCircle, '#a855f7', 'Complete sentences', 0.6], [Star, '#facc15', 'Clarity', 0.45], [BookA, '#3b82f6', 'Vocabulary', 0.5], [ShieldCheck, '#38bdf8', 'Confidence', 0.7]]

export default function ConfidenceMission() {
  const nav = useNavigate()
  const g = useGame(); const { name, face } = g.state.profile; const { xp } = g.state.stats
  const [live, setLive] = useState(false)
  const [turn, setTurn] = useState(0)
  const chat = [[face, 'kid', <>Tell me three things <span className="text-primary-ink">you notice.</span></>], [null, 'nova', <>Great! Now add one <span className="text-primary-ink">describing word.</span></>]]
  return (
    <Page>
      <Scene name="confidence" />
      <Panel className="absolute w-[285px] p-5" style={{ ...bleedL(10), ...safeT(10) }} initial="hidden" animate="show">
        <Logo variant="planet" tagline="LEARN • EXPLORE • ACHIEVE" />
        <button className="mt-4 flex items-center gap-2 text-[17px] font-bold text-ink" onClick={() => { sfx.tap(); nav('/extra') }}><ArrowLeft size={20} /> Back</button>
        <div className="hairline my-3" />
        <div className="eyebrow text-[14px]">Confidence Mission</div>
        <div className="font-display font-extrabold text-[30px] leading-[1.05] text-ink">Describe<br />the picture</div>
        <div className="mt-2 text-[16px] font-semibold text-ink-2">Nova is {live ? 'listening…' : 'ready.'}</div>
        <Card className="mt-3 p-4"><div className="flex items-center gap-2 font-extrabold text-[16px] text-primary-ink">Nova <Volume2 size={16} /></div><p className="mt-1 text-[15px] font-semibold text-ink-2 leading-snug">Take a good look at the picture. When you're ready, tell me what you see!</p></Card>
      </Panel>
      <Child screen="confidence" delay={0.5} amp={6} />
      <Cutout id="confidence-1" delay={0.24} amp={11} />

      <Panel className="absolute left-[645px] top-[20px] w-[405px] h-[90px] px-6 flex items-center justify-between" initial="hidden" animate="show">
        <div><div className="font-display font-extrabold text-[20px] text-ink uppercase">24 Confidence Mission</div><div className="mt-2 flex gap-2">{[0, 1, 2, 3, 4, 5, 6].map(i => <span key={i} className="h-[7px] w-[28px] rounded-full" style={{ background: i === 0 ? 'var(--grad-primary)' : 'var(--lavender-2)' }} />)}</div></div>
        <img src="/art/planet-sm.webp" alt="" className="w-[52px] floaty" />
      </Panel>
      <motion.div className="absolute flex items-center gap-3" style={{ ...bleedR(24), ...safeT(22) }} initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <span className="pill h-[68px] px-5 gap-2 font-display font-extrabold text-[20px] text-ink"><Coins size={24} className="text-gold" /> {xp.toLocaleString()} <ChevronDown size={18} className="text-ink-3" /></span>
        <UserChip name={name} sub="Explorer" face={face} />
      </motion.div>

      <Panel className="absolute left-[310px] top-[130px] w-[705px] h-[680px] p-4" initial="hidden" animate="show">
        <motion.div className="rounded-[22px] overflow-hidden h-[430px]" style={{ boxShadow: '0 20px 40px -20px rgba(40,20,120,.5)' }} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.17 }}>
          <motion.img src="/art/crops/starfruits.webp" alt="" className="w-full h-full object-cover" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }} />
        </motion.div>
        <Stack className="mt-4 grid grid-cols-4 gap-4" start={0.8} delay={0.08}>
          {SKILLS.map(([I, c, t, v]) => <Item key={t} v="pop"><Card className="h-[190px] p-4 flex flex-col items-center justify-center text-center"><span className="icon-orb w-[64px] h-[64px]" style={{ color: c, background: `${c}22` }}><I size={32} /></span><span className="mt-3 font-display font-extrabold text-[18px] text-ink leading-tight">{t}</span><Bar value={v} h={6} className="mt-3 w-[110px]" delay={0.3} /></Card></Item>)}
        </Stack>
      </Panel>

      <Panel className="absolute left-[1020px] top-[170px] w-[305px] h-[530px] p-6 flex flex-col items-center justify-center" initial="hidden" animate="show">
        <div className="relative grid place-items-center">
          <AnimatePresence>{live && [0, 1].map(i => <motion.span key={i} className="absolute w-[150px] h-[150px] rounded-full border-2" style={{ borderColor: 'rgba(124,92,255,.5)' }} initial={{ scale: 1, opacity: 0.7 }} animate={{ scale: 2, opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.8 }} />)}</AnimatePresence>
          <motion.button className="w-[140px] h-[140px] rounded-full grid place-items-center text-white" style={{ background: 'var(--grad-primary)', boxShadow: 'var(--glow-primary)' }} onPointerDown={() => { sfx.select(); setLive(true); setTurn(1) }} onPointerUp={() => setLive(false)} onPointerLeave={() => setLive(false)} whileTap={{ scale: 0.94 }}><Mic size={60} /></motion.button>
        </div>
        <div className="mt-8 font-display font-extrabold text-[26px] text-ink uppercase">Hold to speak</div>
        <div className="text-[17px] font-semibold text-ink-3">{live ? 'Nova is listening…' : 'Ready when you are!'}</div>
      </Panel>

      <Stack className="absolute top-[135px] w-[315px] flex flex-col gap-4" style={bleedR(24)} start={0.7} delay={0.15}>
        {chat.map(([f, who, msg], i) => (
          <Item key={i} v="right"><Panel className="p-4 flex items-center gap-3 min-h-[150px]" style={{ opacity: i > turn ? 0.55 : 1 }}>
            {who === 'kid' ? <img src={`/art/kid${f}-face-sm.webp`} alt="" className="w-[70px] h-[70px] rounded-full object-cover border-2 border-white shadow" /> : <img src="/art/hd/nova-v2.webp" alt="" className="w-[70px] floaty" />}
            <span className="flex-1 text-[18px] font-bold text-ink leading-snug">{msg}</span>
            <button className="pill w-[36px] h-[36px] justify-center text-primary-ink" onClick={() => sfx.tap()}><Volume2 size={16} /></button>
          </Panel></Item>
        ))}
        <Item v="right"><Panel className="p-5 h-[145px]"><div className="flex items-center gap-2 text-[15px] font-extrabold text-primary-ink uppercase tracking-wide"><Lightbulb size={18} className="text-gold" /> Tips from Nova</div><p className="mt-2 text-[16px] font-semibold text-ink-2 leading-snug">Look closely, use details, and speak clearly. You've got this!</p></Panel></Item>
      </Stack>

      <motion.div className="absolute pill h-[80px] px-3 gap-3" style={{ ...bleedL(24), ...safeB(24) }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <span className="icon-orb w-[50px] h-[50px]"><Music size={22} /></span>
        <span className="pill h-[56px] px-4 gap-3"><span className="icon-orb w-[38px] h-[38px] text-white" style={{ background: 'var(--grad-primary)' }}><Volume2 size={18} /></span><span className="leading-tight"><span className="block font-extrabold text-[15px] text-ink">Tap to hear the question</span><span className="block text-[12px] font-semibold text-ink-3">Listen anytime!</span></span></span>
        <button className="pill h-[56px] px-5 text-[16px] font-bold text-ink" onClick={() => { sfx.tap(); speak('Look at the star fruits market. What do you notice?') }}><Lightbulb size={18} className="text-gold" /> Hint</button>
        <span className="pill h-[56px] px-5 text-[16px] font-bold text-ink"><Headphones size={18} /> Listen</span>
      </motion.div>
      <motion.div className="absolute left-[835px] flex items-center gap-4" style={safeB(24)} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Button variant="ghost" size="md" icon={<RefreshCw size={22} />} className="h-[64px] px-8 text-[19px]" onClick={() => setTurn(0)}>Try Again</Button>
        <Button size="md" arrow className="w-[300px] h-[64px] text-[22px]" sound="whoosh" onClick={() => { g.addXp(20, 'Confidence mission'); nav('/extra') }}>Continue</Button>
      </motion.div>
    </Page