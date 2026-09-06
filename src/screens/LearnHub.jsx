import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Home, Lock, ArrowRight, ShieldCheck, Heart, Star } from 'lucide-react'
import Scene, { Child } from '../components/Scene.jsx'
import Page, { Stack, Item } from '../components/Page.jsx'
import { TopBar } from '../components/TopBar.jsx'
import { Card } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import SpeechBubble from '../components/SpeechBubble.jsx'
import { Ring, Tilt } from '../components/Widgets.jsx'
import { WORLDS } from '../data/catalog.js'
import { sfx } from '../lib/sound.js'
import { cn } from '../lib/utils.js'
import { useAccent } from '../lib/accent.js'

export default function LearnHub() {
  const nav = useNavigate()
  const ac = useAccent()
  return (
    <Page>
      <Scene name="learn" />
      <Child screen="learn" delay={0.3} amp={5} />
      <TopBar logo="planet" back="/home" backLabel="Home" />
      <div className="absolute left-[345px] top-[420px] z-20"><SpeechBubble tail="left" text="Fractions will unlock the next Maths world. ✨" delay={0.3} className="w-[175px] text-[16px] px-4 py-3" /></div>

      <Stack className="absolute left-[545px] top-[80px]" start={0.2}>
        <Item className="eyebrow text-[19px] flex items-center gap-2"><Home size={22} strokeWidth={2.4} /> Learn Hub</Item>
        <Item><h1 className="font-display font-extrabold text-[60px] leading-tight text-ink">Choose your next world</h1></Item>
        <Item className="text-[21px] font-semibold text-ink-3">Explore, learn and grow with Nova by your side.</Item>
      </Stack>

      <Stack className="absolute left-[530px] top-[236px] flex items-end gap-[16px]" start={0.5} delay={0.08}>
        {WORLDS.map((w, i) => {
          const f = w.featured
          return (
            <Item key={w.id} v="pop">
              <Tilt max={6}>
                <Card hover={!w.locked} className={cn('relative flex flex-col items-center text-center px-4 pb-4', f ? 'w-[250px] h-[500px] pt-8' : 'w-[200px] h-[462px] pt-7', f && 'card-selected')} onClick={() => !w.locked && nav(`/learn/topics/${w.id}`)}>
                  {f && <motion.span className="absolute -top-[22px] left-1/2 -translate-x-1/2 h-[42px] px-4 rounded-full text-white font-display font-extrabold text-[16px] flex items-center gap-2 whitespace-nowrap" style={{ background: 'var(--grad-primary)', boxShadow: 'var(--glow-primary)' }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.3 }}><Star size={16} fill="currentColor" className="text-gold" /> Next: {w.next}</motion.span>}
                  {w.locked && <span className="absolute top-3 right-3 icon-orb w-[40px] h-[40px]"><Lock size={20} /></span>}
                  <motion.img src={w.img} alt="" className={cn('object-contain', f ? 'w-[176px] h-[176px]' : 'w-[142px] h-[142px]', w.locked && 'opacity-80 saturate-50')} animate={{ y: [0, -10, 0], rotate: [0, 3, 0, -3, 0] }} transition={{ duration: 6 + i, repeat: Infinity, ease: 'easeInOut' }} style={{ filter: 'drop-shadow(0 18px 24px rgba(60,40,160,.35))' }} />
                  <div className={cn('mt-2 font-display font-extrabold text-ink leading-tight', f ? 'text-[27px]' : 'text-[22px]')}>{w.name}</div>
                  <div className="mt-1 text-[14px] font-semibold text-ink-3 leading-snug">{w.desc}</div>
                  <div className="mt-auto flex flex-col items-center">
                    <Ring size={f ? 84 : 72} stroke={8} value={w.pct / 100} id={`w-${w.id}`} delay={0.3 + i * 0.1}><div className="leading-none"><div className={cn('font-display font-extrabold text-ink', f ? 'text-[22px]' : 'text-[19px]')}>{w.pct}%</div></div></Ring>
                    <div className="text-[13px] font-bold text-ink-3">{w.done} / {w.total}</div>
                  </div>
                  {w.locked ? <span className="mt-3 h-[44px] w-full rounded-[14px] border-2 border-[var(--line)] flex items-center justify-center gap-2 text-[16px] font-extrabold text-ink-3"><Lock size={18} /> Locked</span>
                    : f ? <Button size="sm" arrow className="mt-3 w-full h-[50px] text-[17px] uppercase px-3" sound="whoosh">Explore Maths</Button>
                    : <Button variant="outline" size="sm" arrow className="mt-3 w-full h-[44px] text-[16px]" style={{ borderColor: '#38bdf8', color: ac('#0284c7') }}>Explore</Button>}
                </Card>
              </Tilt>
            </Item>
          )
        })}
      </Stack>

      <motion.div className="absolute left-[500px] top-[752px] w-[1140px] card h-[84px] px-8 grid grid-cols-3 items-center" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        {[[ShieldCheck, '#22c55e', 'Safe Learning', 'Ad-free, child-safe and secure'], [Heart, '#ec4899', 'Personalised for you', 'Lessons adapt to your pace and style'], [Star, '#f59e0b', 'Track your growth', 'See progress and celebrate wins']].map(([I, c, t, s]) => (
          <div key={t} className="flex items-center gap-4"><span className="icon-orb w-[50px] h-[50px]" style={{ color: c, background: `${c}1f` }}><I size={26} strokeWidth={2.2} /></span><span className="leading-tight"><span className="block font-extrabold text-[17px] text-ink">{t}</span><span className="block text-[14px] font-semibold text-ink-3">{s}</span></span></div>
        ))}
      </motion.div>
    </Page>
  )
}
