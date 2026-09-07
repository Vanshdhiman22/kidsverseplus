import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Mail, Lock, Eye, EyeOff, ShieldCheck, Heart, BarChart3, Smile, ArrowRight } from 'lucide-react'
import Scene, { Child } from '../components/Scene.jsx'
import Page, { Stack, Item } from '../components/Page.jsx'
import { TopBar } from '../components/TopBar.jsx'
import { Panel } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import { TrustRow } from './Landing.jsx'
import { useGame } from '../state/GameProvider.jsx'
import { sfx } from '../lib/sound.js'

const Field = ({ label, icon: Icon, type = 'text', placeholder, value, onChange, right }) => (
  <label className="block">
    <span className="block text-[19px] font-extrabold text-ink mb-2">{label}</span>
    <span className="relative block">
      <Icon size={24} strokeWidth={2.2} className="absolute left-6 top-1/2 -translate-y-1/2 text-ink-3" />
      <input className="input" type={type} placeholder={placeholder} value={value} onChange={onChange} />
      {right && <span className="absolute right-5 top-1/2 -translate-y-1/2">{right}</span>}
    </span>
  </label>
)

const Social = ({ label, children }) => (
  <button className="card card-hover h-[56px] flex items-center justify-center gap-3 text-[18px] font-extrabold text-ink" onClick={() => sfx.tap()}>{children}{label}</button>
)

export default function ParentLogin() {
  const nav = useNavigate()
  const g = useGame()
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [show, setShow] = useState(false)
  /* Where signing in leads depends on which door was used on the landing page:
     a parent who asked for the Parent Zone lands there, everyone else carries
     on into the child's setup. */
  const signIn = () => {
    if (!email.trim() || !pw.trim()) { g.notice('Enter your email and password to continue.'); return }
    const parent = g.state.authIntent === 'parent'
    g.setAuthIntent('play')
    nav(parent ? '/parent' : '/onboarding/child')
  }
  return (
    <Page>
      <Scene name="login" />
      <Child screen="login" delay={0.35} />
      <TopBar />
      <Stack className="absolute left-[130px] top-[150px] w-[700px]" start={0.2}>
        <Item><h1 className="font-display font-extrabold text-[80px] leading-[1.02] text-ink">Welcome back,<br />grown-up <span className="text-gold sparkle relative inline-block" style={{ position: 'relative' }}>✦</span></h1></Item>
        <Item className="mt-6 text-[28px] font-semibold text-ink-2">See the learning. Guide the journey.</Item>
      </Stack>
      <TrustRow compact className="absolute left-[65px] top-[810px]" items={[[ShieldCheck, '#22c55e', 'Safe & secure', "Your child's data is always protected."], [Heart, '#ec4899', 'Loved by parents', 'Trusted by thousands of families.'], [BarChart3, '#3b82f6', 'Real progress', 'Track growth that matters.']]} />

      <Panel className="absolute left-[905px] top-[78px] w-[665px] px-12 pt-7 pb-6" initial="hidden" animate="show">
        <div className="flex flex-col items-center text-center">
          <motion.span className="chip h-[40px] px-5 text-[14px] tracking-[0.14em] uppercase" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.14 }}><ShieldCheck size={18} strokeWidth={2.4} /> Parent Zone</motion.span>
          <h2 className="mt-3 font-display font-extrabold text-[48px] leading-none text-ink">Welcome back</h2>
          <p className="mt-1 text-[19px] font-semibold text-ink-3">Sign in to view your child's learning journey.</p>
        </div>
        <Stack className="mt-5 flex flex-col gap-4 [&_.input]:h-[62px] [&_.input]:text-[20px]" start={0.55}>
          <Item v="soft"><Field label="Email or phone number" icon={Mail} placeholder="Enter email or phone number" value={email} onChange={e => setEmail(e.target.value)} /></Item>
          <Item v="soft">
            <Field label="Password" icon={Lock} type={show ? 'text' : 'password'} placeholder="Enter your password" value={pw} onChange={e => setPw(e.target.value)} right={<button onClick={() => setShow(s => !s)} className="text-ink-3 hover:text-primary-ink">{show ? <EyeOff size={24} /> : <Eye size={24} />}</button>} />
            <div className="text-right mt-1"><button className="text-[16px] font-bold text-primary-ink hover:underline">Forgot password?</button></div>
          </Item>
          <Item v="pop"><Button size="md" arrow icon={<Lock size={24} strokeWidth={2.4} />} className="w-full h-[62px] uppercase text-[21px]" sound="whoosh" onClick={signIn}>Login to Kidsverse</Button></Item>
          <Item v="soft" className="flex items-center gap-4 text-[17px] font-bold text-ink-3"><span className="hairline flex-1" />or continue with<span className="hairline flex-1" /></Item>
          <Item v="soft" className="grid grid-cols-3 gap-4">
            <Social label="Google"><svg width="24" height="24" viewBox="0 0 24 24"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.4z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z"/><path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3.1a10 10 0 0 0 0 9z"/><path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.8 9.4 6 12 6z"/></svg></Social>
            <Social label="Apple"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.8 1.3 10.3.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8s2 .8 3.4.8 2.3-1.3 3.1-2.5c1-1.4 1.4-2.8 1.4-2.9-.1 0-2.7-1-2.7-4.2zM13.9 5c.7-.9 1.2-2 1-3.2-1 0-2.3.7-3 1.6-.7.8-1.2 2-1.1 3.1 1.2.1 2.3-.6 3.1-1.5z"/></svg></Social>
            <Social label="Microsoft"><svg width="22" height="22" viewBox="0 0 24 24"><rect x="2" y="2" width="9" height="9" fill="#F25022"/><rect x="13" y="2" width="9" height="9" fill="#7FBA00"/><rect x="2" y="13" width="9" height="9" fill="#00A4EF"/><rect x="13" y="13" width="9" height="9" fill="#FFB900"/></svg></Social>
          </Item>
          <Item v="soft">
            <button className="card card-hover w-full h-[60px] px-6 flex items-center gap-4" style={{ borderColor: 'var(--primary)' }} onClick={() => { sfx.whoosh(); g.setAuthIntent('play'); nav(g.state.children?.length > 1 ? '/switch' : '/home') }}>
              <Smile size={28} strokeWidth={2.2} className="text-primary-ink" />
              <span className="text-[21px] font-extrabold text-primary-ink flex-1 text-left">Kid login</span>
              <ArrowRight size={24} strokeWidth={2.6} className="text-primary-ink" />
            </button>
          </Item>
          <Item v="soft" className="text-center text-[18px] font-bold text-ink-3">New to Kidsverse? <button className="text-primary-ink font-extrabold hover:underline" onClick={() => nav('/parent/create-account')}>Create your account</button></Item>
        </Stack>
      </Panel>
    </Page>
  )
}
