import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { User, ShieldCheck, Lock, Check } from 'lucide-react'
import Scene, { Child } from '../components/Scene.jsx'
import Page, { Stack, Item } from '../components/Page.jsx'
import { TopBar } from '../components/TopBar.jsx'
import { Panel } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import { Steps } from '../components/Stepper.jsx'
import { Sparkles } from '../components/Widgets.jsx'
import { useGame } from '../state/GameProvider.jsx'

export const ONBOARDING_STEPS = ['Create Child', 'Learning Setup', 'Goals', 'Meet Nova']

export default function CreateChild() {
  const nav = useNavigate()
  const g = useGame()
  const [name, setName] = useState(g.state.profile.name || '')
  const ok = name.trim().length >= 2
  return (
    <Page>
      <Scene name="child" />
      <Child screen="child" delay={0.14} />
      <TopBar center={<Steps steps={ONBOARDING_STEPS} current={0} className="w-[820px]" />} right={<span className="pill h-[52px] px-5 text-[18px] font-bold text-ink"><User size={20} className="text-primary-ink" /> Parent Account</span>} showControls={false} />
      <Stack className="absolute left-[170px] top-[160px] w-[560px]" start={0.25}>
        <Item><h1 className="font-display font-extrabold text-[56px] leading-[1.05] text-ink">Let's build your<br />explorer profile. <span className="text-gold">✦</span></h1></Item>
        <Item className="mt-5 text-[22px] font-semibold text-ink-3 leading-snug w-[460px]">This helps us tailor a safe, joyful and personalised learning experience.</Item>
      </Stack>
      <motion.div className="absolute left-[100px] top-[790px] w-[600px] pill h-[100px] px-6 gap-5 rounded-[26px]" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <span className="icon-orb w-[56px] h-[56px]"><ShieldCheck size={30} strokeWidth={2.2} /></span>
        <span className="leading-tight flex-1">
          <span className="block font-display font-extrabold text-[20px] text-ink">Your child's privacy is our priority.</span>
          <span className="block text-[16px] font-semibold text-ink-3">We create a safe and secure space to learn and grow.</span>
        </span>
        <Lock size={26} className="text-ink-3" />
      </motion.div>

      <Panel className="absolute left-[820px] top-[150px] w-[740px] px-14 py-12" initial="hidden" animate="show">
        <Stack start={0.5}>
          <Item v="pop"><span className="chip h-[44px] px-5 text-[15px] tracking-[0.14em] uppercase">Step 1 of 4</span></Item>
          <Item><h2 className="mt-5 font-display font-extrabold text-[46px] leading-[1.08] text-ink">Who is beginning<br />their adventure? <span className="text-gold">✦</span></h2></Item>
          <Item className="mt-4 text-[21px] font-semibold text-ink-3 leading-snug">Tell us your explorer's name so we can personalise their learning journey.</Item>
          <Item className="mt-8">
            <label className="block text-[20px] font-extrabold text-ink mb-3">Child's first name</label>
            <div className="relative">
              <User size={26} strokeWidth={2.2} className="absolute left-6 top-1/2 -translate-y-1/2 text-primary-ink" />
              <input className="input h-[84px] text-[26px] rounded-[22px]" style={{ borderColor: ok ? 'var(--primary)' : undefined }} placeholder="Type a first name or nickname" value={name} onChange={e => setName(e.target.value)} autoFocus />
              <AnimatePresence>
                {ok && <motion.span className="absolute right-6 top-1/2 -translate-y-1/2 w-[32px] h-[32px] rounded-full grid place-items-center bg-green-500 text-white" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}><Check size={20} strokeWidth={3.5} /></motion.span>}
              </AnimatePresence>
            </div>
            <p className="mt-3 flex items-center gap-2 text-[16px] font-semibold text-ink-3"><ShieldCheck size={18} className="text-primary-ink" /> Only a first name or nickname is needed.</p>
          </Item>
          <Item v="pop" className="mt-9"><Button size="lg" arrow className="w-full uppercase" disabled={!ok} sound="whoosh" onClick={() => { g.setProfile({ name: name.trim() }); nav('/onboarding/grade-board') }}>Continue</Button></Item>
          <Item className="mt-5 text-center"><button className="text-[22px] font-extrabold text-primary-ink hover:underline" onClick={() => nav(-1)}>Back</button></Item>
        </Stack>
      </Panel>
    </Page>
  )
}
