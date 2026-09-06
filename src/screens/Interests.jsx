import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ChevronLeft, Star } from 'lucide-react'
import Scene, { Child } from '../components/Scene.jsx'
import Page, { Stack, Item, BackButton } from '../components/Page.jsx'
import { TopBar } from '../components/TopBar.jsx'
import { Check } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import SpeechBubble from '../components/SpeechBubble.jsx'
import { Segments } from '../components/Stepper.jsx'
import { Tilt } from '../components/Widgets.jsx'
import { INTERESTS } from '../data/catalog.js'
import { useGame } from '../state/GameProvider.jsx'
import { sfx } from '../lib/sound.js'
import { cn } from '../lib/utils.js'

export default function Interests() {
  const nav = useNavigate()
  const g = useGame()
  const sel = g.state.profile.interests
  const toggle = id => { const on = sel.includes(id); sfx[on ? 'tap' : 'select'](); g.setProfile({ interests: on ? sel.filter(i => i !== id) : [...sel, id] }) }
  const enough = sel.length >= 3
  return (
    <Page>
      <Scene name="interests" />
      <Child screen="interests" delay={0.35} />
      <TopBar center={<div className="flex items-center gap-5"><button className="pill w-[46px] h-[46px] justify-center text-ink" onClick={() => nav(-1)}><ChevronLeft size={24} strokeWidth={2.8} /></button><Segments total={8} current={2} /><img src="/art/planet-sm.webp" alt="" className="w-[50px] floaty" /></div>} />
      <Stack className="absolute left-[545px] top-[110px] w-[980px] text-center" start={0.2}>
        <Item><h1 className="font-display font-extrabold text-[66px] leading-tight text-ink">What makes you curious?</h1></Item>
        <Item className="mt-1 text-[22px] font-semibold text-ink-3">Choose <span className="text-primary-ink font-extrabold">three or more</span>. Nova will weave them into your missions.</Item>
      </Stack>

      <div className="absolute left-[255px] top-[135px]"><SpeechBubble tail="bottom" delay={0.3} className="w-[240px] text-[18px]"><span className="font-extrabold">Great choices!</span><br /><span className="font-semibold text-[16px]">I already have ideas. ✨</span></SpeechBubble></div>

      <Stack className="absolute left-[545px] top-[236px] grid grid-cols-4 gap-[22px]" start={0.45} delay={0.07}>
        {INTERESTS.map(it => {
          const on = sel.includes(it.id)
          return (
            <Item key={it.id} v="pop">
              <Tilt max={8}>
                <button className={cn('relative w-[245px] h-[262px] rounded-[26px] overflow-hidden text-left transition-all duration-500', on ? 'ring-[3px] ring-[var(--primary)]' : 'ring-1 ring-[var(--glass-ring)]')} style={{ boxShadow: on ? '0 26px 50px -18px rgba(109,77,232,.6), 0 0 40px -8px rgba(124,92,255,.5)' : '0 16px 36px -18px rgba(70,50,190,.35)' }} onClick={() => toggle(it.id)} onMouseEnter={() => sfx.hover()}>
                  <img src={it.img} alt="" className="absolute inset-0 w-full h-full object-cover object-top" />
                  <div className="absolute inset-x-0 bottom-0 h-[56px] flex items-center justify-center font-display font-extrabold text-[22px] text-ink" style={{ background: 'var(--bubble)', backdropFilter: 'blur(6px)' }}>{it.name}</div>
                  <motion.div className="absolute inset-0 rounded-[26px]" animate={{ boxShadow: on ? 'inset 0 0 0 3px rgba(255,255,255,.6)' : 'inset 0 0 0 0px rgba(255,255,255,0)' }} />
                  <div className="absolute top-3 right-3"><Check size={38} show={on} /></div>
                </button>
              </Tilt>
            </Item>
          )
        })}
      </Stack>

      <BackButton className="absolute left-[50px] top-[822px] h-[64px] px-8 text-[22px]" />
      <motion.div className="absolute left-[545px] top-[800px] card h-[96px] w-[520px] px-6 flex items-center gap-4" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <span className="icon-orb w-[48px] h-[48px]"><Star size={26} fill="currentColor" /></span>
        <div>
          <div className="font-display font-extrabold text-[24px] text-ink"><motion.span key={sel.length} initial={{ scale: 1.4, color: '#7c5cff' }} animate={{ scale: 1, color: 'var(--ink)' }} className="inline-block">{sel.length}</motion.span> selected</div>
          <div className="text-[16px] font-semibold text-ink-3">{enough ? 'Pick one more or more to explore even deeper!' : `Pick ${3 - sel.length} more to continue.`}</div>
        </div>
      </motion.div>
      <motion.div className="absolute left-[1085px] top-[800px]" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Button size="lg" arrow className="w-[520px] h-[96px] uppercase text-[30px]" disabled={!enough} sound="whoosh" onClick={() => nav('/onboarding/goals')}>Continue</Button>
      </motion.div>
    </Page>
  )
}
