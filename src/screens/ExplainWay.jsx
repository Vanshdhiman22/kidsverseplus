import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { BookOpen, RefreshCw, Hand, Zap } from 'lucide-react'
import Scene, { Cutout, Child } from '../components/Scene.jsx'
import Page, { Stack, Item } from '../components/Page.jsx'
import { TopBar, UserChip } from '../components/TopBar.jsx'
import { Panel, Card, Check } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import SpeechBubble from '../components/SpeechBubble.jsx'
import Dock from '../components/Dock.jsx'
import { Ring, Fraction } from '../components/Widgets.jsx'
import { useGame } from '../state/GameProvider.jsx'
import { sfx } from '../lib/sound.js'
import { cn } from '../lib/utils.js'

/* Interactive pizza: four draggable wedges; drag one out and it snaps back, tap to shade. */
function PizzaModel({ shaded, setShaded }) {
  const R = 95, C = 100
  const wedge = i => { const a0 = (i * 90 - 90) * Math.PI / 180, a1 = ((i + 1) * 90 - 90) * Math.PI / 180; return `M ${C} ${C} L ${C + R * Math.cos(a0)} ${C + R * Math.sin(a0)} A ${R} ${R} 0 0 1 ${C + R * Math.cos(a1)} ${C + R * Math.sin(a1)} Z` }
  return (
    <div className="relative w-[210px] h-[210px]">
      <img src="/art/new/pizza-equal.webp" alt="" className="absolute inset-0 w-full h-full object-contain" />
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
        {[0, 1, 2, 3].map(i => (
          <motion.path key={i} d={wedge(i)} fill={shaded.includes(i) ? 'rgba(124,92,255,0)' : 'rgba(255,255,255,.82)'} stroke="rgba(124,92,255,.5)" strokeWidth="2" className="cursor-grab" drag dragSnapToOrigin dragElastic={0.4} whileDrag={{ scale: 1.08, filter: 'drop-shadow(0 12px 12px rgba(0,0,0,.25))' }} onTap={() => { sfx.select(); setShaded(shaded.includes(i) ? shaded.filter(x => x !== i) : [...shaded, i]) }} initial={false} animate={{ fill: shaded.includes(i) ? 'rgba(124,92,255,0)' : 'rgba(255,255,255,.82)' }} />
        ))}
      </svg>
    </div>
  )
}
function ChocoModel({ shaded, setShaded }) {
  return (
    <div className="grid grid-cols-2 gap-[6px] w-[150px]">
      {[0, 1, 2, 3].map(i => <motion.button key={i} className="h-[62px] rounded-[10px]" style={{ background: shaded.includes(i) ? 'linear-gradient(135deg,#8b4513,#5a2d0c)' : 'transparent', border: shaded.includes(i) ? '2px solid #3d1e08' : '2.5px dashed rgba(124,92,255,.5)', boxShadow: shaded.includes(i) ? 'inset 0 2px 0 rgba(255,255,255,.25), 0 6px 10px -6px #000' : 'none' }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }} onClick={() => { sfx.select(); setShaded(shaded.includes(i) ? shaded.filter(x => x !== i) : [...shaded, i]) }} />)}
    </div>
  )
}
function LineModel({ shaded, setShaded }) {
  const n = shaded.length
  return (
    <div className="w-[240px] pt-4">
      <div className="relative h-[6px] rounded-full bg-[var(--ink-2)]">
        <motion.div className="absolute left-0 top-0 h-full rounded-full" style={{ background: 'var(--grad-primary)' }} animate={{ width: `${n * 25}%` }} />
        {[0, 1, 2, 3, 4].map(i => <button key={i} className="absolute -top-[9px] w-[24px] h-[24px] -ml-[12px] rounded-full border-[3px]" style={{ left: `${i * 25}%`, background: i <= n && i > 0 ? '#7c5cff' : 'var(--glass-strong)', borderColor: '#3b3a7a' }} onClick={() => { sfx.select(); setShaded([0, 1, 2, 3].slice(0, i)) }} />)}
      </div>
      <div className="mt-4 flex justify-between text-[16px] font-extrabold text-ink"><span>0</span><Fraction n={1} d={4} size={13} /><Fraction n={2} d={4} size={13} /><Fraction n={3} d={4} size={13} /><span>1</span></div>
    </div>
  )
}

const WAYS = [
  { id: 'pizza', label: 'Pizza', preview: <div className="scale-[0.72] -my-6 pointer-events-none"><PizzaModel shaded={[0, 1, 2]} setShaded={() => {}} /></div>, Model: PizzaModel },
  { id: 'choco', label: 'Chocolate Bar', img: '/art/new/choco-bar.webp', Model: ChocoModel },
  { id: 'line', label: 'Number Line', img: null, Model: LineModel },
]

export default function ExplainWay() {
  const nav = useNavigate()
  const g = useGame(); const { name, face } = g.state.profile
  const [way, setWay] = useState('pizza')
  const [shaded, setShaded] = useState([0, 1, 2])
  const W = WAYS.find(w => w.id === way)
  return (
    <Page>
      <Scene name="explain" />
      <Child screen="explain" delay={0.4} />
      <Cutout id="explain-1" delay={0.17} amp={12} />
      <TopBar logo="planet" right={<><span className="pill h-[60px] px-5 gap-2 text-[21px] font-extrabold text-ink"><Zap size={22} className="text-gold" fill="currentColor" /> 120</span><UserChip name={name} face={face} /></>} showControls={false} />
      <motion.div className="absolute left-[25px] top-[110px] card w-[270px] px-5 py-4 flex items-center gap-4" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}><span className="icon-orb w-[58px] h-[58px]"><BookOpen size={30} /></span><div className="leading-tight"><div className="text-[14px] font-bold text-ink-3">Current Topic</div><div className="font-display font-extrabold text-[22px] text-ink">Fractions</div><div className="text-[13px] font-semibold text-ink-3">Understanding equal parts</div></div></motion.div>
      <motion.div className="absolute left-[25px] top-[748px] card w-[315px] px-5 py-4 flex items-center gap-4" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}><Ring size={84} stroke={9} value={0.68} id="prog"><span className="font-display font-extrabold text-[20px] text-ink">68%</span></Ring><div className="leading-tight"><div className="font-display font-extrabold text-[20px] text-primary-ink">Your Progress</div><div className="text-[15px] font-bold text-ink-2">Keep it up, {name}!<br />You're doing amazing!</div></div></motion.div>

      <Stack className="absolute left-[470px] top-[30px] w-[760px] text-center" start={0.2}>
        <Item className="text-[18px] font-bold text-ink-2 text-left ml-[230px]">Lesson 15 of 30</Item>
        <Item className="mt-1 flex items-center gap-3 ml-[230px]"><div className="relative w-[330px] h-[6px] rounded-full bg-[var(--lavender-2)]"><motion.div className="absolute left-0 top-0 h-full rounded-full" style={{ background: 'var(--grad-primary)' }} initial={{ width: 0 }} animate={{ width: '50%' }} transition={{ duration: 1.2, delay: 0.14 }} />{[0, 1, 2, 3, 4, 5].map(i => <span key={i} className="absolute -top-[3px] w-[12px] h-[12px] rounded-full" style={{ left: `${i * 20}%`, background: i <= 2 ? '#7c5cff' : 'var(--lavender-2)', border: '2px solid white' }} />)}<motion.span className="absolute -top-[7px] w-[20px] h-[20px] rounded-full border-[3px] border-white" style={{ left: '48%', background: '#7c5cff', boxShadow: '0 0 12px #7c5cff' }} animate={{ scale: [1, 1.25, 1] }} transition={{ duration: 1.6, repeat: Infinity }} /></div><img src="/art/planet-sm.webp" alt="" className="w-[44px]" /></Item>
        <Item><h1 className="mt-2 font-display font-extrabold text-[52px] leading-tight text-ink">Choose the way that clicks <span className="text-gold text-[36px]">✦</span></h1></Item>
        <Item className="text-[19px] font-semibold text-ink-2">Different models can show the same fraction.</Item>
        <Item className="mt-1 flex items-center justify-center gap-3 text-[19px] font-semibold text-ink"><Fraction n={3} d={4} size={17} /> as equal parts.</Item>
      </Stack>

      <Stack className="absolute left-[425px] top-[318px] flex items-end gap-[24px]" start={0.5} delay={0.1}>
        {WAYS.map((w, i) => {
          const on = way === w.id
          return (
            <Item key={w.id} v="pop" className="relative">
              <motion.div className={cn('absolute -top-[46px] left-[40px] h-[50px] px-8 rounded-t-[18px] flex items-center font-display font-extrabold text-[22px]', on ? 'text-white' : 'text-primary-ink card')} style={on ? { background: 'var(--grad-primary)' } : { borderBottom: 0 }} layout>Way {i + 1}</motion.div>
              <Card hover selected={on} className="relative w-[255px] h-[236px] flex flex-col items-center justify-center gap-3" onClick={() => { sfx.select(); setWay(w.id); setShaded([0, 1, 2]) }}>
                {on && <Check className="absolute top-3 right-3" size={36} />}
                {w.preview ? w.preview : w.img ? <img src={w.img} alt="" className="h-[150px] object-contain" style={{ filter: 'drop-shadow(0 12px 16px rgba(60,40,160,.3))' }} /> : (
                  <div className="w-[190px] pt-2"><div className="relative h-[5px] rounded-full bg-ink"><span className="absolute -top-[6px] left-0 w-[3px] h-[17px] bg-ink" /><span className="absolute -top-[6px] right-0 w-[3px] h-[17px] bg-ink" />{[25, 50, 75].map((p, k) => <span key={p} className="absolute -top-[6px] w-[17px] h-[17px] -ml-[8px] rounded-full" style={{ left: `${p}%`, background: k === 2 ? 'white' : '#3b82f6', border: '3px solid #3b82f6' }} />)}</div><div className="mt-3 flex justify-between text-[15px] font-extrabold text-ink"><span>0</span><Fraction n={1} d={4} size={12} /><Fraction n={2} d={4} size={12} /><Fraction n={3} d={4} size={12} /><span>1</span></div></div>
                )}
                <div className={cn('font-display font-extrabold text-[20px] uppercase tracking-wide', on ? 'text-primary-ink' : 'text-ink')}>{w.label}</div>
              </Card>
            </Item>
          )
        })}
      </Stack>

      <Panel className="absolute left-[415px] top-[578px] w-[845px] h-[200px] px-8 flex items-center gap-8" initial="hidden" animate="show">
        <div className="w-[230px]"><div className="font-display font-extrabold text-[20px] text-ink"><span className="text-gold">✦</span> You chose this way!</div><div className="mt-1 text-[16px] font-semibold text-ink-2 leading-snug">{way === 'line' ? 'Tap the marks to show' : way === 'choco' ? 'Tap the pieces to show' : 'Drag the pieces to see'} 3 out of 4 equal parts.</div></div>
        <div className="flex-1 flex items-center justify-center"><AnimatePresence mode="wait"><motion.div key={way} className="scale-[0.88]" initial={{ opacity: 0, scale: 0.6, rotate: -10 }} animate={{ opacity: 1, scale: 0.88, rotate: 0 }} exit={{ opacity: 0, scale: 0.6, rotate: 10 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }}><W.Model shaded={shaded} setShaded={setShaded} /></motion.div></AnimatePresence></div>
        <div className="w-[230px]"><div className="font-display font-extrabold text-[30px] text-ink leading-none"><motion.span key={shaded.length} initial={{ scale: 1.5, color: '#7c5cff' }} animate={{ scale: 1, color: 'var(--ink)' }} className="inline-block">{shaded.length}</motion.span> out of 4</div><div className="text-[17px] font-semibold text-ink-2">equal parts are shaded.</div><span className="chip mt-3 h-[40px] px-4 text-[16px]">{way === 'pizza' ? 'Drag a slice!' : 'Tap a part!'} <Hand size={18} /></span></div>
      </Panel>
      <motion.div className="absolute left-[440px] top-[790px] flex items-center gap-4" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Button size="md" arrow className="w-[455px] h-[58px] uppercase text-[22px]" sound="whoosh" onClick={() => nav('/missions/fractions/spot-mistake')}>Use this way</Button>
        <Button variant="ghost" size="md" icon={<RefreshCw size={20} />} className="h-[58px] px-7 uppercase text-[17px] tracking-wide" onClick={() => { const i = WAYS.findIndex(w => w.id === way); setWay(WAYS[(i + 1) % 3].id); setShaded([0, 1, 2]) }}>Show me another</Button>
      </motion.div>

      <div className="absolute left-[1350px] top-[180px]"><SpeechBubble tail="bottom" text="Fractions are equal parts. Which model makes most sense to you? ✦" delay={0.3} className="w-[245px] text-[18px]" /></div>
      <Dock spread className="w-[1440px]" style={{ bottom: 10 }} compact />
    </Page