import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import Scene, { Child } from '../components/Scene.jsx'
import Page, { Stack, Item } from '../components/Page.jsx'
import { TopBar } from '../components/TopBar.jsx'
import { Card, Check } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import SpeechBubble from '../components/SpeechBubble.jsx'
import { Segments } from '../components/Stepper.jsx'
import { GOALS } from '../data/catalog.js'
import { useGame } from '../state/GameProvider.jsx'
import { sfx } from '../lib/sound.js'
import { cn } from '../lib/utils.js'

/* Constellation: the five goals orbit a star; the chosen one lights up. */
const NODES = [
  { id: 'school', x: 300, y: 60, label: 'Master school\ntopics' },
  { id: 'confidence', x: 95, y: 92, label: 'Build\nconfidence' },
  { id: 'competition', x: 495, y: 92, label: 'Prepare for\ncompetitions' },
  /* x is the tile's centre minus 40, and the tile is 160 wide. The child cutout fills
     1005..1445, so a tile landing between those lines is drawn on top of him. These two
     did -- 'Explore beyond class' sat on Nova's head. Pushed outward to clear him. */
  { id: 'reading', x: -35, y: 300, label: 'Read more\nfluently' },
  { id: 'explore', x: 605, y: 300, label: 'Explore beyond\nclass' },
]
const CENTER = { x: 300, y: 240 }

function Constellation({ chosen, onPick }) {
  return (
    <div className="absolute left-[890px] top-[70px] w-[600px] h-[420px]">
      <svg className="absolute inset-0 w-full h-full overflow-visible">
        {NODES.map((n, i) => (
          <motion.line key={n.id} x1={CENTER.x} y1={CENTER.y} x2={n.x + 40} y2={n.y + 40} stroke={chosen.includes(n.id) ? '#8b5cf6' : 'rgba(124,92,255,.4)'} strokeWidth={chosen.includes(n.id) ? 3 : 2} strokeDasharray="6 8" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 1.2, delay: 0.06 + i * 0.12, ease: [0.16, 1, 0.3, 1] }} style={{ filter: chosen.includes(n.id) ? 'drop-shadow(0 0 6px rgba(139,92,246,.9))' : undefined }} />
        ))}
        {[[135, 132, 340, 100], [340, 100, 535, 132], [5, 340, 135, 132], [535, 132, 645, 340]].map(([a, b, c, d], i) => (
          <motion.line key={i} x1={a} y1={b} x2={c} y2={d} stroke="rgba(124,92,255,.3)" strokeWidth={1.5} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.1 + i * 0.1 }} />
        ))}
      </svg>
      <motion.div className="absolute w-[36px] h-[36px] rounded-full" style={{ left: CENTER.x - 18, top: CENTER.y - 18, background: 'radial-gradient(circle, #fff, #a78bfa 40%, transparent 70%)' }} animate={{ scale: [1, 1.5, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 2.4, repeat: Infinity }} />
      {NODES.map((n, i) => {
        const goal = GOALS.find(g => g.id === n.id); const on = chosen.includes(n.id)
        return (
          <motion.button key={n.id} className="absolute flex flex-col items-center w-[160px] -ml-[40px]" style={{ left: n.x, top: n.y }} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.08 + i * 0.1 }} onClick={() => onPick(n.id)}>
            <motion.div className="relative w-[80px] h-[80px] rounded-full grid place-items-center pill" animate={{ scale: on ? 1.15 : 1, boxShadow: on ? '0 0 0 4px rgba(139,92,246,.5), 0 0 40px rgba(139,92,246,.8)' : '0 6px 18px -10px rgba(70,50,190,.35)' }} transition={{ type: 'spring', stiffness: 300, damping: 18 }}>
              <img src={goal.icon} alt="" className="w-[48px] h-[48px] object-contain" />
              {on && <motion.span className="absolute -top-1 -right-1 w-[26px] h-[26px] rounded-full grid place-items-center text-white" style={{ background: 'var(--grad-primary)' }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}><Check size={15} strokeWidth={3.5} /></motion.span>}
            </motion.div>
            <div className={cn('mt-2 text-center text-[17px] font-extrabold whitespace-pre-line leading-tight', on ? 'text-ink' : 'text-ink-2')}>{n.label}</div>
          </motion.button>
        )
      })}
    </div>
  )
}

export default function Goals() {
  const nav = useNavigate()
  const g = useGame()
  const { name } = g.state.profile
  const chosen = g.state.profile.goals ?? []
  /* Pick as many as you like. "Let Nova decide" is the one exception: it means
     "I have not chosen", so it clears the rest and any other pick clears it. */
  const pick = id => {
    sfx.select()
    if (id === 'nova') return g.setProfile({ goals: chosen.includes('nova') ? [] : ['nova'] })
    const next = chosen.includes(id) ? chosen.filter(x => x !== id) : [...chosen.filter(x => x !== 'nova'), id]
    g.setProfile({ goals: next })
  }
  return (
    <Page>
      <Scene name="goals" />
      <TopBar center={<Segments total={8} current={5} badge={7} />} />
      <Stack className="absolute left-[100px] top-[175px]" start={0.2}>
        <Item><h1 className="font-display font-extrabold text-[54px] leading-tight text-ink">What should we grow first?</h1></Item>
        <Item className="text-[21px] font-semibold text-ink-3">Pick one or more goals to personalise {name}'s learning journey.</Item>
      </Stack>
      <Stack className="absolute left-[95px] top-[275px] flex flex-col gap-[12px]" start={0.4} delay={0.07}>
        {GOALS.map(gl => {
          const on = chosen.includes(gl.id)
          return (
            <Item key={gl.id} v="left">
              <Card hover selected={on} className="w-[685px] h-[96px] px-5 flex items-center gap-5" onClick={() => pick(gl.id)}>
                <span className="w-[76px] h-[76px] rounded-full grid place-items-center shrink-0" style={{ background: 'var(--lavender)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.7)' }}><img src={gl.icon} alt="" className="w-[52px] h-[52px] object-contain" /></span>
                <div className="w-[270px]">
                  <div className="font-display font-extrabold text-[21px] text-ink leading-tight">{gl.title}</div>
                  <div className="text-[15px] font-semibold text-ink-3 leading-snug">{gl.desc}</div>
                </div>
                <div className="flex-1 text-[16px] font-bold text-primary-ink leading-snug">{gl.tag}</div>
                {on ? <Check size={36} /> : <span className="radio" />}
              </Card>
            </Item>
          )
        })}
        <Item v="left">
          <Card hover selected={chosen.includes('nova')} className="w-[685px] h-[86px] px-5 flex items-center gap-5" onClick={() => pick('nova')}>
            <span className="w-[62px] h-[62px] rounded-full grid place-items-center shrink-0" style={{ background: 'var(--lavender)' }}><img src="/art/goal-nova.webp" alt="" className="w-[48px] h-[48px] object-contain" /></span>
            <div className="flex-1">
              <div className="font-display font-extrabold text-[21px] text-ink leading-tight">Not sure yet — Let Nova decide</div>
              <div className="text-[15px] font-semibold text-ink-3">Help me explore and decide later.</div>
            </div>
            {chosen.includes('nova') ? <Check size={36} /> : <span className="radio" />}
          </Card>
        </Item>
      </Stack>

      <Constellation chosen={chosen} onPick={pick} />
      <Child screen="goals" delay={0.5} />
      <div className="absolute left-[1462px] top-[560px]"><SpeechBubble tail="left" text="We can change this anytime. ✨" delay={0.3} className="w-[170px] text-[17px]" /></div>
      <motion.div className="absolute left-[945px] top-[798px]" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Button size="lg" arrow className="w-[520px] h-[98px] uppercase text-[30px]" sound="whoosh" onClick={() => nav('/onboarding/nova')}>Continue</Button>
      </motion.div>
    </Page>
  )
}
