import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Flame, Star, Lightbulb, Headphones, Volume2, Check, Lock } from 'lucide-react'
import Scene, { Child } from '../components/Scene.jsx'
import Page, { Stack, Item } from '../components/Page.jsx'
import Logo from '../components/Logo.jsx'
import { Panel, Card } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import SpeechBubble from '../components/SpeechBubble.jsx'
import Dock, { DOCK_EXPLORE } from '../components/Dock.jsx'
import { Bar } from '../components/Widgets.jsx'
import { useGame } from '../state/GameProvider.jsx'
import { bleedL, bleedR, safeB, safeT } from '../components/Stage.jsx'
import { sfx } from '../lib/sound.js'
import { cn } from '../lib/utils.js'

const HINTS = ['Check the size of each part.', 'Look at the crust lengths.', 'Compare the toppings area.']

export default function SpotMistake() {
  const nav = useNavigate()
  const g = useGame(); const { streak, xpToday } = g.state.stats
  const [pick, setPick] = useState(null)
  const [hints, setHints] = useState(1)
  const [wrong, setWrong] = useState(0)
  const correct = pick === 'no'
  const choose = v => {
    setPick(v)
    if (v === 'no') { sfx.success(); if (pick !== 'no') g.addXp(10, 'Spot the mistake') } else { sfx.wrong(); setWrong(w => w + 1) }
  }
  return (
    <Page>
      <Scene name="spot" />
      <motion.div className="absolute" style={{ ...bleedL(24), ...safeT(24) }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}><Logo variant="planet" tagline="LEARN • EXPLORE • ACHIEVE" /></motion.div>
      <motion.div className="absolute left-[660px] flex items-center gap-5" style={safeT(32)} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <span className="font-display font-extrabold text-[21px] tracking-[0.12em] text-primary-ink uppercase">Stage 16 of 20</span>
        <span className="flex gap-2">{[0, 1, 2, 3, 4].map(i => <span key={i} className="h-[8px] w-[32px] rounded-full" style={{ background: i < 3 ? 'var(--grad-primary)' : 'var(--lavender-2)', outline: i === 3 ? '2px solid #7c5cff' : 'none', outlineOffset: 2 }} />)}</span>
        <img src="/art/planet-sm.webp" alt="" className="w-[50px] floaty" />
      </motion.div>

      <Panel className="absolute top-[110px] w-[250px] p-5" style={bleedL(24)} initial="hidden" animate="show">
        <div className="label-caps">Mission Progress</div>
        <div className="mt-1 flex items-center justify-between"><span className="font-display font-extrabold text-[26px] text-ink">16 <span className="text-ink-3 text-[18px]">/ 20</span></span><img src="/art/planet-sm.webp" alt="" className="w-[40px]" /></div>
        <Bar value={0.8} className="mt-2" />
        <div className="hairline my-4" />
        <div className="flex items-center gap-3"><span className="icon-orb w-[40px] h-[40px] text-orange-500" style={{ background: 'rgba(249,115,22,.14)' }}><Flame size={22} fill="currentColor" /></span><span className="leading-tight"><span className="label-caps block">Streak</span><span className="font-display font-extrabold text-[20px] text-ink">{streak} days</span></span></div>
        <div className="hairline my-4" />
        <div className="flex items-center gap-3"><span className="icon-orb w-[40px] h-[40px] text-gold" style={{ background: 'rgba(251,191,36,.16)' }}><Star size={22} fill="currentColor" /></span><span className="leading-tight"><span className="label-caps block">XP Today</span><span className="font-display font-extrabold text-[20px] text-ink"><motion.span key={xpToday} initial={{ scale: 1.4, color: '#7c5cff' }} animate={{ scale: 1, color: 'var(--ink)' }} className="inline-block">{xpToday}</motion.span> XP</span></span></div>
      </Panel>
      <Child screen="spot" delay={0.5} />

      <Panel className="absolute left-[320px] top-[90px] w-[1010px] h-[705px] p-8 overflow-hidden" initial="hidden" animate="show">
        <div className="text-center"><h1 className="font-display font-extrabold text-[62px] leading-none text-ink">Spot the Mistake!</h1><motion.div className="mx-auto mt-3 h-[6px] w-[90px] rounded-full" style={{ background: 'var(--grad-primary)' }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.2 }} /><p className="mt-3 text-[21px] font-semibold text-ink-2 leading-snug">Look carefully.<br />Are these four parts equal?</p></div>
        <div className="absolute left-[765px] top-[160px]"><SpeechBubble tail="bottom" text="I'm checking every slice! 🔍" delay={0.3} className="w-[190px] text-[18px]" /></div>
        <div className="absolute left-[120px] bottom-[30px] flex gap-7">
          {[['yes', 'YES', 'They are equal'], ['no', 'NO', 'They are not equal']].map(([v, big, sub]) => {
            const on = pick === v
            return (
              <Card key={v} hover selected={on} className={cn('relative w-[330px] h-[150px] flex flex-col items-center justify-center', on && v === 'yes' && 'ring-4 ring-red-400')} style={on ? { boxShadow: v === 'no' ? '0 0 0 3px #22c55e, 0 20px 44px -16px rgba(34,197,94,.5)' : '0 0 0 3px #ef4444' } : undefined} onClick={() => choose(v)}>
                <span className="absolute top-4 right-4">{on ? <span className={cn('w-[34px] h-[34px] rounded-full grid place-items-center text-white', v === 'no' ? 'bg-green-500' : 'bg-red-500')}>{v === 'no' ? <Check size={20} strokeWidth={3.5} /> : '✕'}</span> : <span className="radio" />}</span>
                <span className="font-display font-extrabold text-[46px] leading-none text-ink">{big}</span>
                <span className="mt-1 text-[19px] font-semibold text-ink-2">{sub}</span>
              </Card>
            )
          })}
        </div>
      </Panel>

      <Panel className="absolute top-[90px] w-[280px] h-[705px] p-5" style={bleedR(27)} initial="hidden" animate="show">
        <div className="eyebrow text-[17px] flex items-center gap-2"><Lightbulb size={20} className="text-gold" fill="currentColor" /> Hint Progress</div>
        <Stack className="mt-3 flex flex-col gap-3" start={0.7}>
          {HINTS.map((h, i) => {
            const st = i < hints ? 'open' : i === hints ? 'next' : 'locked'
            return (
              <Item key={i} v="soft"><Card hover={st === 'next'} className="px-4 py-3 flex items-center gap-3" onClick={() => st === 'next' && (sfx.unlock(), setHints(hints + 1))}>
                <span className={cn('w-[38px] h-[38px] rounded-full grid place-items-center text-white shrink-0', st === 'open' ? 'bg-green-500' : st === 'next' ? 'bg-blue-500' : 'bg-[var(--lavender-2)] text-ink-3')}>{st === 'open' ? <Check size={20} strokeWidth={3.5} /> : st === 'next' ? <span className="font-display font-extrabold text-[17px]">{i + 1}</span> : <Lock size={18} />}</span>
                <span className="leading-tight"><span className="block font-extrabold text-[17px] text-ink">Hint {i + 1}</span><span className="block text-[14px] font-semibold text-ink-3">{st === 'locked' ? 'Tap hint 2 first' : st === 'next' ? 'Tap to reveal' : h}</span></span>
              </Card></Item>
            )
          })}
        </Stack>
        <AnimatePresence>
          {pick && (
            <motion.div className="mt-4 card p-4" initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
              <div className="flex items-center gap-2"><img src="/art/22-novahead.webp" alt="" className="w-[40px]" /><span className="eyebrow text-[14px]">Nova's Feedback</span></div>
              <p className="mt-2 text-[16px] font-bold text-ink-2 leading-snug">{correct ? 'Great observation! Not all four slices are the same. ✦' : 'Hmm, look again at the crust. Is every slice the same size? 🔍'}</p>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {correct && (
            <motion.div className="mt-4 rounded-[22px] p-4 text-white" style={{ background: 'var(--grad-primary)', boxShadow: 'var(--glow-primary)' }} initial={{ opacity: 0, scale: 0.6, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 360, damping: 16, delay: 0.2 }}>
              <div className="font-display font-extrabold text-[26px] flex items-center gap-2"><Star size={24} className="text-gold" fill="currentColor" /> +10 XP</div>
              <div className="text-[16px] font-bold opacity-90">Keep it up! 🎉</div>
            </motion.div>
          )}
        </AnimatePresence>
      </Panel>

      <motion.div className="absolute flex items-center gap-3" style={{ ...bleedL(24), ...safeB(37) }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.27 }}>
        <button className="pill h-[74px] px-4 gap-4 text-left" onClick={() => sfx.success()}><span className="icon-orb w-[54px] h-[54px] text-white" style={{ background: 'var(--grad-primary)' }}><Volume2 size={26} /></span><span className="leading-tight"><span className="block text-[17px] font-extrabold text-ink">Tap to hear the question</span><span className="block text-[13px] font-semibold text-ink-3">Listen anytime!</span></span></button>
        <button className="pill h-[60px] px-5 gap-2 text-[18px] font-extrabold text-ink" onClick={() => hints < 3 && (sfx.unlock(), setHints(hints + 1))}><Lightbulb size={22} className="text-gold" fill="currentColor" /> Hint</button>
        <button className="pill h-[60px] px-5 gap-2 text-[18px] font-extrabold text-ink" onClick={() => sfx.tap()}><Headphones size={22} className="text-primary-ink" /> Listen</button>
      </motion.div>
      <Dock items={DOCK_EXPLORE} active="learn" tiles className="left-[640px]" style={{ bottom: 20 }} />
      <motion.div className="absolute" style={{ ...bleedR(24), ...safeB(69) }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}><Button size="md" arrow className="w-[300px] h-[66px] text-[24px]" disabled={!correct} sound="whoosh" onClick={() => nav('/missions/fractions/complete')}>Continue</Button></motion.div>
    </Page>
  )
}
