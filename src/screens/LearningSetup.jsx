import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { GraduationCap, BookOpen, Landmark, Globe, Star, ShieldCheck, ArrowLeft, Rocket, CheckCircle2, MoreHorizontal } from 'lucide-react'
import Scene, { Child } from '../components/Scene.jsx'
import Page, { Stack, Item } from '../components/Page.jsx'
import { TopBar } from '../components/TopBar.jsx'
import { Panel, Card, Check } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import { Steps } from '../components/Stepper.jsx'
import { GRADES, BOARDS } from '../data/catalog.js'
import { useGame } from '../state/GameProvider.jsx'
import { sfx } from '../lib/sound.js'

const BOARD_ICON = { book: BookOpen, bank: Landmark, globe: Globe, dots: MoreHorizontal }

function Head({ icon: Icon, title, sub }) {
  return (
    <div className="flex items-center gap-4">
      <span className="w-[68px] h-[68px] rounded-full grid place-items-center text-white" style={{ background: 'var(--grad-primary)', boxShadow: 'var(--glow-primary)' }}><Icon size={32} strokeWidth={2.2} /></span>
      <div><div className="eyebrow text-[17px]">{title}</div><div className="text-[17px] font-semibold text-ink-3 mt-1">{sub}</div></div>
    </div>
  )
}

export default function LearningSetup() {
  const nav = useNavigate()
  const g = useGame()
  const { grade, board } = g.state.profile
  return (
    <Page>
      <Scene name="setup" />
      <Child screen="setup" delay={0.14} amp={5} />
      <TopBar back={false} center={<Steps steps={['Welcome', 'Learning Setup', 'Profile', 'Complete']} current={1} className="w-[640px]" />} />
      <Stack className="absolute left-[130px] top-[160px] w-[560px]" start={0.25}>
        <Item><h1 className="font-display font-extrabold text-[64px] leading-[1.02] text-ink">Set the learning<br />path <span className="text-gold">✦</span></h1></Item>
        <Item className="mt-6 text-[24px] font-semibold text-ink-2 leading-snug w-[420px]">Nova will match school learning with the right adventures.</Item>
      </Stack>

      <Panel className="absolute left-[680px] top-[160px] w-[520px] h-[600px] p-7" initial="hidden" animate="show">
        <Head icon={GraduationCap} title="Select Grade" sub="Playschool to Grade 8" />
        <Stack className="mt-5 grid grid-cols-4 gap-3" start={0.55} delay={0.04}>
          {GRADES.map(gr => {
            const sel = grade === gr.id
            return (
              <Item key={gr.id} v="pop">
                <Card hover selected={sel} className="relative h-[108px] flex flex-col items-center justify-center" onClick={() => { sfx.select(); g.setProfile({ grade: gr.id }) }}>
                  {/* The fill sits above the card's own pale background (which is why the
                      white label reads) and lights up in place — a shared layoutId would
                      fly across the grid and paint over the neighbouring labels. */}
                  {sel && <motion.span className="absolute inset-0 z-0 rounded-[22px]" style={{ background: 'var(--grad-primary)' }} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 460, damping: 30 }} />}
                  {sel && <Check className="absolute -top-2 -right-2 z-20" size={30} />}
                  <span className={`relative z-10 font-display font-extrabold leading-none ${gr.abbr ? 'text-[30px]' : 'text-[44px]'} ${sel ? 'text-white' : 'text-ink'}`}>{gr.short}</span>
                  <span className={`relative z-10 mt-1 text-[14px] font-bold ${sel ? 'text-white/90' : 'text-ink-2'}`}>{gr.label}</span>
                </Card>
              </Item>
            )
          })}
        </Stack>
        <Item className="mt-4 card px-5 py-3 flex items-center gap-4 text-[15px] font-semibold text-ink-2" v="soft"><span className="icon-orb w-[40px] h-[40px]"><Star size={20} fill="currentColor" /></span>You can change this later from your child's profile settings.</Item>
      </Panel>

      <Panel className="absolute left-[1220px] top-[160px] w-[405px] h-[600px] p-7" initial="hidden" animate="show">
        <Head icon={BookOpen} title="Select Board" sub="Choose your child's school board" />
        <Stack className="mt-5 flex flex-col gap-3" start={0.65} delay={0.07}>
          {BOARDS.map(b => {
            const Icon = BOARD_ICON[b.icon]; const sel = board === b.id
            return (
              <Item key={b.id} v="pop">
                <Card hover selected={sel} className="relative h-[80px] px-5 flex items-center gap-4" onClick={() => { sfx.select(); g.setProfile({ board: b.id }) }}>
                  {sel && <motion.span className="absolute inset-0 z-0 rounded-[22px]" style={{ background: 'var(--grad-primary)' }} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 460, damping: 30 }} />}
                  {sel && <Check className="absolute -top-3 -right-3 z-20" size={32} />}
                  <Icon size={30} strokeWidth={2} className={`relative z-10 ${sel ? 'text-white' : 'text-primary-ink'}`} />
                  <span className={`relative z-10 font-display font-extrabold text-[24px] flex-1 ${sel ? 'text-white' : 'text-ink'}`}>{b.label}</span>
                  {b.verified && <span className="relative z-10 chip h-[34px] px-3 text-[15px]" style={sel ? { background: 'rgba(255,255,255,.28)', color: '#fff' } : { color: '#15803d', background: '#dcfce7' }}><CheckCircle2 size={18} /> Verified</span>}
                </Card>
              </Item>
            )
          })}
        </Stack>
        <Item className="mt-4 card px-5 py-3 flex items-center gap-4 text-[15px] font-semibold text-ink-2" v="soft"><span className="icon-orb w-[40px] h-[40px]"><ShieldCheck size={20} /></span>We use this to personalise your child's learning and recommendations.</Item>
      </Panel>

      <Panel className="absolute left-[680px] top-[790px] w-[945px] h-[112px] px-6 flex items-center justify-end gap-6" initial="hidden" animate="show" style={{ borderRadius: 30 }}>
        <Button variant="ghost" size="md" icon={<ArrowLeft size={24} strokeWidth={2.6} />} className="h-[72px] px-10 text-[22px]" onClick={() => nav(-1)}>Back</Button>
        <Button size="lg" arrow icon={<Rocket size={28} strokeWidth={2.4} />} className="w-[440px] uppercase" sound="whoosh" onClick={() => { g.setProfile({ face: 1, outfit: 'explorer' }); nav('/onboarding/avatar') }}>Continue</Button>
      </Panel>
    </Page>
  )
}
