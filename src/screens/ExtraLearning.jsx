import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, BookOpen, MessageCircle, Brain, Star } from 'lucide-react'
import Scene, { Cutout } from '../components/Scene.jsx'
import Page, { Stack, Item } from '../components/Page.jsx'
import SideRail from '../components/SideRail.jsx'
import { Panel, Card } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import { Tilt, Sparkles } from '../components/Widgets.jsx'
import { sfx } from '../lib/sound.js'

const CARDS = [
  { id: 'reading', img: '/art/crops/card-reading.webp', icon: BookOpen, c: '#7c3aed', t: 'Reading Fluency', s: 'Read aloud with Nova', to: '/extra/reading', rec: true },
  { id: 'confidence', img: '/art/crops/card-confidence.webp', icon: MessageCircle, c: '#3b82f6', t: 'Confidence with Nova', s: 'Speak. Think. Express.', to: '/extra/confidence' },
  { id: 'brain', img: '/art/crops/card-brain.webp', icon: Brain, c: '#22c55e', t: 'Brain Lab', s: 'Logic. Patterns. Reasoning.', to: '/challenge' },
]

export default function ExtraLearning() {
  const nav = useNavigate()
  return (
    <Page>
      <Scene name="extra" />
      <SideRail active="home" />
      <Stack className="absolute left-[262px] top-[70px]" start={0.25}>
        <Item v="pop"><span className="chip h-[40px] px-5 text-[15px] uppercase tracking-[0.14em]">Extra Learning</span></Item>
        <Item><h1 className="mt-3 font-display font-extrabold text-[62px] leading-[1.02] text-ink">Keep exploring<br /><span className="grad-text">beyond the classroom</span></h1></Item>
        <Item className="mt-3 text-[20px] font-semibold text-ink-2 w-[470px] leading-snug">Fun adventures to grow your mind, build skills, and spark your curiosity.</Item>
      </Stack>

      <Panel className="absolute left-[1005px] top-[130px] w-[615px] h-[190px] pl-[270px] pr-8 flex flex-col justify-center" initial="hidden" animate="show">
        <Sparkles n={4} seed={22} />
        <div className="flex items-center gap-2 text-[17px] font-extrabold text-primary-ink"><Star size={18} className="text-gold" fill="currentColor" /> Nova suggests</div>
        <div className="mt-1 font-display font-extrabold text-[32px] leading-none text-ink">Reading today 📖</div>
        <div className="mt-2 text-[17px] font-semibold text-ink-2 leading-snug">A great way to build fluency and confidence!</div>
      </Panel>
      <motion.img src="/art/hd/nova-v2.webp" alt="" className="absolute left-[1030px] top-[118px] w-[170px]" style={{ filter: 'drop-shadow(0 18px 24px rgba(40,20,120,.28))' }} initial={{ opacity: 0, y: 40, scale: 0.9 }} animate={{ opacity: 1, y: [0, -9, 0], scale: 1 }} transition={{ opacity: { delay: 0.17 }, scale: { delay: 0.17, type: 'spring' }, y: { duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 0.3 } }} />

      <Stack className="absolute left-[235px] top-[362px] flex gap-[22px]" start={0.6} delay={0.12}>
        {CARDS.map(c => (
          <Item key={c.id} v="pop"><Tilt max={5}>
            <Card hover selected={c.rec} className="relative w-[450px] h-[465px] p-0 overflow-hidden flex flex-col" onClick={() => { sfx.whoosh(); nav(c.to) }}>
              <div className="relative h-[300px] overflow-hidden">
                <motion.img src={c.img} alt="" className="w-full h-full object-cover" whileHover={{ scale: 1.05 }} transition={{ duration: 0.6 }} />
                {c.rec && <span className="absolute left-4 top-4 chip h-[30px] px-4 text-[13px] uppercase tracking-wider text-white" style={{ background: 'var(--grad-primary)' }}><Star size={14} fill="currentColor" /> Recommended</span>}
              </div>
              <div className="flex-1 px-5 pt-4 flex items-start gap-4">
                <span className="icon-orb w-[58px] h-[58px] text-white shrink-0" style={{ background: c.c }}><c.icon size={28} /></span>
                <span className="flex-1 leading-tight"><span className="block font-display font-extrabold text-[22px] text-ink uppercase">{c.t}</span><span className="block text-[16px] font-semibold text-ink-3 mt-1">{c.s}</span></span>
                <span className="w-[54px] h-[54px] rounded-full grid place-items-center border-2 shrink-0" style={{ borderColor: c.c, color: c.c }}><ArrowRight size={26} strokeWidth={2.6} /></span>
              </div>
              {c.rec && <div className="px-5 pb-4"><Button size="md" arrow className="w-full h-[54px] uppercase text-[20px]" sound="whoosh" onClick={e => { e.stopPropagation(); nav(c.to) }}>Start reading</Button></div>}
            </Card>
          </Tilt></Item>
        ))}
      </Stack>
    </Page>
  )
}
