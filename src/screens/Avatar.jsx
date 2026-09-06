import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useMotionValue, useSpring, useTransform, animate } from 'motion/react'
import { Shirt, Scissors, Glasses, RotateCw, ArrowLeft, ArrowRight, Rocket, Star, ShieldCheck, Heart, Users } from 'lucide-react'
import Scene, { Cutout } from '../components/Scene.jsx'
import Page, { Stack, Item } from '../components/Page.jsx'
import { TopBar } from '../components/TopBar.jsx'
import { Panel, Card, Check } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import SpeechBubble from '../components/SpeechBubble.jsx'
import { Sparkles } from '../components/Widgets.jsx'
import { TrustRow } from './Landing.jsx'
import { FACES, OUTFITS, spriteFor, hasFaceArt } from '../data/catalog.js'
import { useGame } from '../state/GameProvider.jsx'
import { sfx } from '../lib/sound.js'
import { cn } from '../lib/utils.js'

function MiniSteps({ steps, current }) {
  return (
    <div className="flex items-center gap-3">
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <span className="flex items-center gap-2">
            <span className={cn('w-[34px] h-[34px] rounded-full grid place-items-center font-display font-extrabold text-[16px]', i === current ? 'text-white' : 'text-ink-3 border-2 border-[var(--line)]')} style={i === current ? { background: 'var(--grad-primary)', boxShadow: 'var(--glow-primary)' } : undefined}>{i + 1}</span>
            <span className={cn('text-[18px] font-bold', i === current ? 'text-ink' : 'text-ink-3')}>{s}</span>
          </span>
          {i < steps.length - 1 && <span className="w-[40px] border-t-2 border-dotted border-[var(--line)]" />}
        </React.Fragment>
      ))}
    </div>
  )
}

export default function Avatar() {
  const nav = useNavigate()
  const g = useGame()
  const { face, outfit, name } = g.state.profile
  const [tab, setTab] = useState('Outfit')
  const rot = useMotionValue(0)
  const srot = useSpring(rot, { stiffness: 120, damping: 18 })
  const scaleX = useTransform(srot, r => { const m = ((r % 360) + 360) % 360; return m > 90 && m < 270 ? -1 : 1 })
  const skew = useTransform(srot, r => Math.sin((r * Math.PI) / 180) * 6)
  const width = useTransform(srot, r => `${Math.max(0.2, Math.abs(Math.cos((r * Math.PI) / 180))) * 100}%`)
  const turn = d => { sfx.whoosh(); animate(rot, rot.get() + d, { type: 'spring', stiffness: 90, damping: 16 }) }
  const current = OUTFITS.find(o => o.id === outfit)
  const sprite = spriteFor(outfit, face)
  const isDefault = outfit === 'explorer' && face === 1

  return (
    <Page>
      <Scene name="avatar" />
      {isDefault && <Cutout id="avatar-0" delay={0.35} />}
      <Cutout id="avatar-1" delay={0.2} amp={10} />
      <TopBar back={false} center={<MiniSteps steps={['Avatar', 'Interests', 'Goals', 'Switch Student']} current={0} />} />
      <Stack className="absolute left-[85px] top-[115px]" start={0.2}>
        <Item><h1 className="font-display font-extrabold text-[46px] leading-tight text-ink">Choose your explorer look <span className="text-gold">✦</span></h1></Item>
        <Item className="mt-1 text-[19px] font-semibold text-ink-3">Pick an avatar that looks like you or that you love!</Item>
      </Stack>

      <Stack className="absolute left-[85px] top-[222px] flex flex-col gap-3" start={0.4} delay={0.08}>
        {FACES.map(f => (
          <Item key={f.id} v="pop">
            <Card hover selected={face === f.id} className="relative w-[236px] h-[112px] overflow-hidden grid place-items-center" onClick={() => { sfx.select(); g.setProfile({ face: f.id }) }}>
              <img src={f.thumb} alt="" className="h-[104px] object-contain" />
              {face === f.id && <Check className="absolute -top-1 -right-1" size={34} />}
            </Card>
          </Item>
        ))}
        <Item v="pop"><div className="pill w-[236px] h-[46px] justify-center text-[15px] font-bold text-ink-2">More avatars coming soon ✨</div></Item>
      </Stack>

      {/* Podium + sprite with drag-to-rotate */}
      <motion.div className="absolute left-[590px] top-[165px] w-[300px] h-[535px] flex items-end justify-center cursor-grab active:cursor-grabbing" drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.05} onDrag={(e, info) => rot.set(rot.get() + info.delta.x * 0.8)} initial={{ opacity: 0, y: 120 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 150, damping: 20, delay: 0.35 }}>
        <motion.div className="relative w-full flex justify-center" style={{ scaleX, skewY: skew, opacity: isDefault ? 0 : 1 }}>
          <motion.img key={sprite} src={sprite} alt="" className="h-[535px] object-contain pointer-events-none" style={{ filter: 'drop-shadow(0 24px 30px rgba(40,20,120,.3))' }} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }} transition={{ opacity: { duration: 0.4 }, scale: { type: 'spring', stiffness: 200 }, y: { duration: 3.8, repeat: Infinity, ease: 'easeInOut' } }} />
        </motion.div>
      </motion.div>
      <div className="absolute left-[850px] top-[178px]"><SpeechBubble tail="bottom" text={`That looks amazing, ${name}! ✨`} delay={0.3} className="w-[210px] text-[18px]" /></div>

      <motion.button className="absolute left-[372px] top-[560px] pill flex-col h-auto w-[116px] py-4 gap-1 text-ink" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} onClick={() => turn(180)}>
        <span className="flex items-center gap-2 font-display font-extrabold text-[18px]"><RotateCw size={20} /> Rotate</span>
        <span className="text-[13px] font-semibold text-ink-3 text-center">Click &amp; drag to rotate</span>
      </motion.button>
      <motion.button className="absolute left-[424px] top-[706px] pill w-[64px] h-[64px] justify-center text-ink" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} onClick={() => turn(-180)}><ArrowLeft size={28} strokeWidth={2.6} /></motion.button>
      <motion.button className="absolute left-[978px] top-[706px] pill w-[64px] h-[64px] justify-center text-ink" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} onClick={() => turn(180)}><ArrowRight size={28} strokeWidth={2.6} /></motion.button>

      <Panel className="absolute left-[1130px] top-[145px] w-[495px] h-[615px] p-7" initial="hidden" animate="show">
        <Sparkles n={4} seed={11} />
        <div className="pill h-[56px] p-1 gap-0 w-full">
          {[['Outfit', Shirt], ['Hair', Scissors], ['Accessories', Glasses]].map(([t, I]) => (
            <button key={t} className={cn('relative flex-1 h-full rounded-full flex items-center justify-center gap-2 font-display font-bold text-[18px] transition-colors', tab === t ? 'text-primary-ink' : 'text-ink-3')} onClick={() => { sfx.tap(); setTab(t) }}>
              {tab === t && <motion.span layoutId="avatar-tab" className="absolute inset-0 rounded-full bg-[var(--lavender)] border border-[var(--line)]" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
              <span className="relative z-10 flex items-center gap-2"><I size={20} /> {t}</span>
            </button>
          ))}
        </div>
        <div className="mt-5 font-display font-extrabold text-[20px] text-ink">Choose an outfit</div>
        <Stack className="mt-3 grid grid-cols-3 gap-4" start={0.5} delay={0.06}>
          {OUTFITS.map(o => (
            <Item key={o.id} v="pop">
              <Card hover selected={outfit === o.id} className="relative h-[148px] grid place-items-center overflow-hidden" onClick={() => { sfx.select(); g.setProfile({ outfit: o.id }) }}>
                <img src={o.thumb} alt="" className="h-[136px] object-contain" />
                {outfit === o.id && <Check className="absolute -top-1 -right-1" size={32} />}
              </Card>
            </Item>
          ))}
        </Stack>
        <motion.div key={current.id} className="mt-5 card px-5 py-4 flex items-center gap-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <span className="icon-orb w-[52px] h-[52px] text-gold" style={{ background: '#fef3c7' }}><Star size={26} fill="currentColor" /></span>
          <div className="flex-1">
            <div className="font-display font-extrabold text-[20px] text-ink">{current.name}</div>
            <div className="text-[15px] font-semibold text-ink-3">{hasFaceArt(outfit, face) ? current.blurb : 'This outfit is still being drawn for this explorer. Coming soon!'}</div>
            <div className="mt-2 flex gap-2">{current.colors.map(c => <span key={c} className="w-[22px] h-[22px] rounded-full border-2 border-white shadow" style={{ background: c }} />)}</div>
          </div>
        </motion.div>
      </Panel>

      <TrustRow compact className="absolute left-[85px] top-[812px]" delay={0.3} items={[[ShieldCheck, '#22c55e', 'Safe & Secure', "Your child's data is always protected"], [Heart, '#ec4899', 'Loved by Kids', 'Designed for joy and growth'], [Users, '#3b82f6', 'Trusted by Parents', 'Real progress. Real results.']]} />
      <motion.div className="absolute left-[1085px] top-[795px] flex items-center gap-5" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Button variant="ghost" size="md" icon={<ArrowLeft size={24} strokeWidth={2.6} />} className="h-[76px] px-9 text-[22px]" onClick={() => nav(-1)}>Back</Button>
        <Button size="lg" arrow icon={<Rocket size={28} strokeWidth={2.4} />} className="w-[360px] uppercase" sound="whoosh" onClick={() => nav('/onboarding/interests')}>This is me</Button>
      </motion.div>
    </Page>
  )
}
