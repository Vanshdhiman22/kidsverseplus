import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Lock, Star, Zap, ArrowLeft, Puzzle, BookOpen, FlaskConical, Grid3x3 } from 'lucide-react'
import Scene, { Cutout, Child } from '../components/Scene.jsx'
import Page, { Stack, Item } from '../components/Page.jsx'
import Logo from '../components/Logo.jsx'
import { UserChip } from '../components/TopBar.jsx'
import { Panel, Card, Check } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import Dock from '../components/Dock.jsx'
import { Tilt } from '../components/Widgets.jsx'
import { BOTS } from '../data/battle.jsx'
import { useGame } from '../state/GameProvider.jsx'
import { bleedL, bleedR, safeT } from '../components/Stage.jsx'
import { sfx } from '../lib/sound.js'

const ICONS = { robo: Puzzle, lexi: BookOpen, cosmo: FlaskConical, pixel: Grid3x3 }

export default function BattleOpponents() {
  const nav = useNavigate()
  const g = useGame(); const { name, face } = g.state.profile
  const [sel, setSel] = useState('robo')
  const tint = useTint()
  const bot = BOTS.find(b => b.id === sel)
  return (
    <Page>
      <Scene name="opponents" />
      <motion.div className="absolute" style={{ ...bleedL(24), ...safeT(24) }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}><Logo variant="planet" tagline="LEARN • EXPLORE • ACHIEVE" /></motion.div>
      <motion.div className="absolute" style={{ ...bleedR(30), ...safeT(20) }} initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}><UserChip name={`Hi, ${name}!`} sub={`Explorer Level ${g.level}`} face={face} /></motion.div>
      <Child screen="opponents" delay={0.4} amp={6} />
      <Cutout id="opponents-1" delay={0.2} amp={10} />

      <Stack className="absolute left-[480px] top-[85px] w-[720px] text-center" start={0.2}>
        <Item><h1 className="font-display font-extrabold text-[66px] leading-none text-ink">Choose an <span className="grad-text">Opponent</span> <img src="/art/planet-sm.webp" alt="" className="inline w-[52px] floaty align-middle" /></h1></Item>
        <Item className="mt-2 text-[22px] font-semibold text-ink-2">Pick your AI opponent and start the battle!</Item>
        <Item v="pop" className="mt-3"><span className="pill h-[48px] px-6 text-[17px] font-bold text-ink"><Lock size={18} className="text-primary-ink" /> 100% Kids Safe • Privacy Protected</span></Item>
      </Stack>

      <Stack className="absolute left-[305px] top-[270px] flex gap-[28px]" start={0.6} delay={0.1}>
        {BOTS.map(b => {
          const on = b.id === sel; const I = ICONS[b.id]
          return (
            <Item key={b.id} v="pop"><Tilt max={6}>
              <Card hover selected={on} className="relative w-[250px] h-[425px] p-4 flex flex-col overflow-hidden" style={{ background: tint(b.bg, b.c), borderColor: on ? b.c : undefined, boxShadow: on ? `0 0 0 3px ${b.c}, 0 24px 50px -20px ${b.c}aa` : undefined }} onClick={() => { sfx.select(); setSel(b.id) }}>
                {on && <Check className="absolute top-3 right-3" size={40} />}
                <motion.img src={b.img} alt="" className="h-[235px] w-full object-cover rounded-[16px]" animate={on ? { y: [0, -6, 0] } : { y: 0 }} transition={{ duration: 3, repeat: Infinity }} />
                <div className="mt-3 flex items-center justify-between"><span className="font-display font-extrabold text-[26px] text-ink uppercase leading-none">{b.name}</span><span className="chip h-[28px] px-3 text-[13px]">Level {b.level}</span></div>
                <div className="text-[16px] font-bold text-ink-2">{b.subject}</div>
                <div className="mt-1 flex items-center gap-1 text-[14px] font-bold text-ink-3">Strengths: {[0, 1, 2].map(i => <Star key={i} size={16} className="text-gold" fill="currentColor" />)}</div>
                <div className="mt-auto card px-3 py-2 flex items-center gap-2 text-[12px] font-semibold text-ink-2 leading-tight"><span className="icon-orb w-[30px] h-[30px] shrink-0" style={{ color: b.c, background: `${b.c}22` }}><I size={16} /></span><span><span className="block font-extrabold text-ink text-[13px]">Specialty</span>{b.spec}</span></div>
              </Card>
            </Tilt></Item>
          )
        })}
      </Stack>

      <Panel className="absolute left-[310px] top-[712px] w-[1120px] h-[145px] px-6 flex items-center gap-6" initial="hidden" animate="show">
        <AnimatePresence mode="wait">
          <motion.div key={bot.id} className="flex items-center gap-6 flex-1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.35 }}>
            <span className="w-[110px] h-[110px] rounded-full overflow-hidden border-4 border-white shadow-lg shrink-0" style={{ background: bot.bg }}><img src={bot.img} alt="" className="w-full h-full object-cover object-top" /></span>
            <div className="w-[300px]"><div className="flex items-center gap-3"><span className="font-display font-extrabold text-[30px] text-primary-ink uppercase">{bot.name}</span><span className="chip h-[28px] px-3 text-[13px]">Level {bot.level}</span></div><p className="text-[15px] font-semibold text-ink-2 leading-snug">{bot.blurb}</p></div>
            <span className="icon-orb w-[74px] h-[74px] text-white shrink-0" style={{ background: 'var(--grad-primary)' }}><Zap size={36} fill="currentColor" /></span>
            <div className="flex-1"><div className="text-[14px] font-bold text-ink-3">Battle Style</div><div className="font-display font-extrabold text-[20px] text-ink">{bot.style}</div><div className="text-[15px] font-semibold text-ink-2 leading-snug">{bot.styleSub}</div></div>
          </motion.div>
        </AnimatePresence>
        <div className="flex flex-col gap-2 w-[285px]">
          <Button size="md" arrow className="h-[56px] uppercase text-[20px]" sound="whoosh" onClick={() => nav(`/challenge/preview?bot=${bot.id}`)}>View {bot.name}</Button>
          <Button variant="ghost" size="md" icon={<ArrowLeft size={18} />} className="h-[44px] text-[16px]" onClick={() => nav('/challenge')}>Back to Challenge</Button>
        </div>
      </Panel>
      <Dock className="w-[860px]" spread style={{ bottom: 14 }} />
    </Page>
  )
}
