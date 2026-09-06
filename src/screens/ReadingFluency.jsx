import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { BookOpen, Mic, Pause, RotateCcw, Volume2, Timer, Target, Gauge, Drama, Lightbulb, Headphones, Music, Star, Award } from 'lucide-react'
import Scene, { Child } from '../components/Scene.jsx'
import Page, { Stack, Item } from '../components/Page.jsx'
import Logo from '../components/Logo.jsx'
import { UserChip } from '../components/TopBar.jsx'
import { Panel, Card } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import { Bar, Counter } from '../components/Widgets.jsx'
import { useGame } from '../state/GameProvider.jsx'
import { bleedL, bleedR, safeT, safeB } from '../components/Stage.jsx'
import { sfx } from '../lib/sound.js'
import { speak } from '../lib/voice.js'
import { cn } from '../lib/utils.js'

const WORDS = 'Under the pale moonlight, Aarav spotted a glowing path across the quiet dunes. He followed the lights and discovered a hidden cave filled with sparkling crystals.'.split(' ')
const STATS = [[Target, '#ef4444', 'Accuracy', 92, 'Excellent! 🎉'], [Gauge, '#3b82f6', 'Pace', 118, 'Good pace! ⚡', 'Words / min'], [Drama, '#8b5cf6', 'Expression', 78, 'Keep going! 🌟'], [BookOpen, '#0ea5e9', 'Comprehension', 90, 'Great understanding! 📖']]

function Waveform({ live, mirror }) {
  const bars = Array.from({ length: 30 }, (_, i) => 8 + Math.abs(Math.sin(i * 1.3)) * 30)
  return (
    <div className={cn('flex items-center gap-[4px] h-[60px]', mirror && 'flex-row-reverse')}>
      {bars.map((h, i) => <motion.span key={i} className="w-[4px] rounded-full" style={{ background: 'var(--grad-primary)', height: h }} animate={live ? { height: [h, h * 1.6, h * 0.6, h] } : { height: h }} transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.04 }} />)}
    </div>
  )
}

export default function ReadingFluency() {
  const nav = useNavigate()
  const g = useGame(); const { name, face } = g.state.profile; const { xp } = g.state.stats
  const [live, setLive] = useState(false)
  const [idx, setIdx] = useState(4)
  const [secs, setSecs] = useState(84)
  useEffect(() => { if (!live) return; const id = setInterval(() => { setIdx(i => Math.min(WORDS.length - 1, i + 1)); setSecs(s => s + 1) }, 420); return () => clearInterval(id) }, [live])
  const mm = String(Math.floor(secs / 60)).padStart(2, '0'), ss = String(secs % 60).padStart(2, '0')
  return (
    <Page>
      <Scene name="reading" />
      <Panel className="absolute w-[265px] p-5" style={{ ...bleedL(10), ...safeT(10) }} initial="hidden" animate="show">
        <div className="text-center"><Logo variant="planet" tagline="LEARN • EXPLORE • ACHIEVE" stacked /></div>
        <div className="hairline my-4" />
        <div className="flex items-center gap-2 text-[16px] font-extrabold text-primary-ink uppercase tracking-wide"><BookOpen size={20} /> Reading Fluency</div>
        <div className="mt-2 font-display font-extrabold text-[28px] leading-[1.05] text-ink uppercase">Moonlight<br />Reading 🌙</div>
        <Card className="mt-4 p-4"><div className="flex items-center gap-2 font-extrabold text-[17px] text-primary-ink"><img src="/art/22-novahead.webp" alt="" className="w-[28px]" /> Nova</div><p className="mt-1 text-[15px] font-semibold text-ink-2 leading-snug">Read the passage aloud. Speak clearly and express each sentence.</p></Card>
      </Panel>
      <Child screen="reading" delay={0.5} amp={6} />
      <motion.div className="absolute pill h-[80px] px-6 gap-6" style={{ ...bleedL(30), ...safeB(24) }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.27 }}>
        <span className="flex items-center gap-2 font-display font-extrabold text-[18px] text-ink"><Award size={24} className="text-gold" /> Level {g.level}</span><span className="w-px h-8 bg-[var(--line)]" /><span className="font-display font-extrabold text-[18px] text-ink">{xp.toLocaleString()} <span className="text-ink-3 text-[15px]">XP</span></span>
      </motion.div>

      <Panel className="absolute left-[615px] top-[20px] w-[425px] h-[130px] p-4 text-center" initial="hidden" animate="show">
        <div className="font-display font-extrabold text-[28px] leading-none text-primary-ink uppercase">Reading Session</div>
        <div className="mt-1 text-[16px] font-semibold text-ink-2">Passage 1 of 1</div>
        <motion.span className="mt-2 pill h-[38px] px-4 text-[15px] font-bold text-primary-ink inline-flex" animate={live ? { scale: [1, 1.04, 1] } : {}} transition={{ duration: 1, repeat: Infinity }}><Mic size={16} /> {live ? 'Listening to you' : 'Hold the mic to start'}</motion.span>
      </Panel>
      <motion.div className="absolute" style={{ ...bleedR(30), ...safeT(20) }} initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}><UserChip name={`Hi, ${name}!`} sub="Keep Exploring!" face={face} /></motion.div>

      <Panel className="absolute left-[345px] top-[165px] w-[445px] h-[450px] p-8 flex flex-col" initial="hidden" animate="show">
        <div className="flex items-center justify-between text-[16px] font-bold text-ink-2"><span>Read the passage aloud.</span><span className="flex items-center gap-1 font-display font-extrabold text-[18px] text-ink tabular-nums"><Timer size={20} /> {mm}:{ss}</span></div>
        <p className="mt-4 font-display font-bold text-[27px] leading-[1.55] text-ink">
          {WORDS.map((w, i) => <span key={i} className={cn('inline-block mr-[8px] rounded-md px-1 transition-colors', i < idx && 'text-ink-2', i === idx && 'text-white')} style={i === idx ? { background: 'var(--grad-primary)' } : undefined}>{w}</span>)}
        </p>
        <button className="mt-auto pill h-[46px] px-5 self-start text-[16px] font-bold text-primary-ink" onClick={() => { sfx.tap(); speak(WORDS.join(' ')) }}><Volume2 size={20} /> Listen Passage</button>
      </Panel>
      <motion.div className="absolute left-[805px] top-[165px] w-[405px] h-[450px] rounded-[26px] overflow-hidden" style={{ boxShadow: 'var(--glass-shadow)' }} initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.14, type: 'spring', stiffness: 200, damping: 22 }}>
        <motion.img src="/art/crops/moonlight.webp" alt="" className="w-full h-full object-cover" animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }} />
      </motion.div>

      <Panel className="absolute left-[345px] top-[628px] w-[865px] h-[190px] px-8 flex items-center justify-between" initial="hidden" animate="show">
        <Waveform live={live} />
        <div className="flex flex-col items-center -mt-6">
          <motion.button className="w-[112px] h-[112px] rounded-full grid place-items-center text-white" style={{ background: 'var(--grad-primary)', boxShadow: live ? '0 0 0 14px rgba(124,92,255,.22), 0 0 50px rgba(124,92,255,.7)' : 'var(--glow-primary)' }} onPointerDown={() => { sfx.select(); setLive(true) }} onPointerUp={() => setLive(false)} onPointerLeave={() => setLive(false)} whileTap={{ scale: 0.94 }} animate={live ? { scale: [1, 1.06, 1] } : {}} transition={{ duration: 1, repeat: Infinity }}><Mic size={50} /></motion.button>
          <span className="mt-2 font-display font-extrabold text-[19px] text-primary-ink uppercase">Hold to speak</span>
        </div>
        <Waveform live={live} mirror />
        <button className="absolute left-8 bottom-5 pill h-[48px] px-5 text-[16px] font-extrabold text-ink uppercase" onClick={() => { sfx.tap(); setLive(false) }}><Pause size={18} /> Pause</button>
        <button className="absolute right-8 bottom-5 pill h-[48px] px-5 text-[16px] font-extrabold text-ink uppercase" onClick={() => { sfx.tap(); setIdx(0); setSecs(0) }}><RotateCcw size={18} /> Restart</button>
      </Panel>

      <Panel className="absolute top-[145px] w-[410px] p-5" style={bleedR(30)} initial="hidden" animate="show">
        <div className="label-caps text-[14px] text-primary-ink">Your Progress</div>
        <Stack className="mt-3 flex flex-col gap-3" start={0.7}>
          {STATS.map(([I, c, l, v, m, unit]) => (
            <Item key={l} v="soft"><Card className="h-[92px] px-4 flex items-center gap-4"><span className="icon-orb w-[46px] h-[46px]" style={{ color: c, background: `${c}1f` }}><I size={24} /></span><span className="w-[120px] leading-tight"><span className="block text-[14px] font-bold text-ink-3">{l}</span><span className="block font-display font-extrabold text-[30px] leading-none" style={{ color: c }}><Counter to={v} delay={0.3} />{unit ? '' : '%'}</span>{unit && <span className="block text-[12px] font-bold text-ink-3">{unit}</span>}</span><span className="flex-1"><span className="block text-[15px] font-bold text-ink">{m}</span><Bar value={v / (unit ? 150 : 100)} h={8} className="mt-2" delay={0.3} /></span></Card></Item>
          ))}
        </Stack>
      </Panel>
      <Panel className="absolute top-[655px] w-[410px] p-5" style={bleedR(30)} initial="hidden" animate="show">
        <div className="label-caps text-[14px] text-primary-ink">Nova says</div>
        <div className="mt-2 flex items-center gap-3"><img src="/art/hd/nova-v2.webp" alt="" className="w-[72px] floaty" /><p className="flex-1 text-[16px] font-bold text-ink-2 leading-snug">You read with great expression and a steady pace. Amazing adventure, {name}!</p><Star size={40} className="text-gold" fill="currentColor" /></div>
      </Panel>

      <motion.div className="absolute left-[320px] pill h-[80px] px-3 gap-3" style={safeB(24)} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <span className="icon-orb w-[50px] h-[50px]"><Music size={22} /></span>
        <span className="pill h-[56px] px-4 gap-3"><span className="icon-orb w-[38px] h-[38px] text-white" style={{ background: 'var(--grad-primary)' }}><Volume2 size={18} /></span><span className="leading-tight"><span className="block font-extrabold text-[15px] text-ink">Tap to hear the question</span><span className="block text-[12px] font-semibold text-ink-3">Listen anytime!</span></span></span>
        <span className="pill h-[56px] px-5 text-[16px] font-bold text-ink"><Lightbulb size={18} className="text-gold" /> Hint</span>
        <span className="pill h-[56px] px-5 text-[16px] font-bold text-ink"><Headphones size={18} /> Listen</span>
      </motion.div>
      <motion.div className="absolute" style={{ ...bleedR(50), ...safeB(24) }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Button size="lg" arrow className="w-[430px] h-[76px] uppercase text-[24px]" sound="whoosh" onClick={() => { g.addXp(25, 'Reading session'); nav('/extra') }}>Finish reading</Button>
      </motion.div>
    </Page>
  )
}
