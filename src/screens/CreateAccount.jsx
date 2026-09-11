import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Mail, Lock, Eye, EyeOff, ShieldCheck, Heart, BarChart3, User, Check } from 'lucide-react'
import Scene, { Child } from '../components/Scene.jsx'
import Page, { Stack, Item } from '../components/Page.jsx'
import { TopBar } from '../components/TopBar.jsx'
import { Panel } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import { TrustRow } from './Landing.jsx'
import { useGame } from '../state/GameProvider.jsx'
import { sfx } from '../lib/sound.js'
import { cn } from '../lib/utils.js'

const Field = ({ label, icon: Icon, type = 'text', placeholder, value, onChange, right, error }) => (
  <label className="block">
    <span className="block text-[19px] font-extrabold text-ink mb-2">{label}</span>
    <span className="relative block">
      <Icon size={24} strokeWidth={2.2} className="absolute left-6 top-1/2 -translate-y-1/2 text-ink-3" />
      <input className="input" type={type} placeholder={placeholder} value={value} onChange={onChange}
        style={error ? { borderColor: 'var(--red, #ef4444)' } : undefined} />
      {right && <span className="absolute right-5 top-1/2 -translate-y-1/2">{right}</span>}
    </span>
    {error && <span className="block mt-1 text-[15px] font-bold text-red-500">{error}</span>}
  </label>
)

/**
 * The grown-up's account, made before any child exists.
 *
 * "Create your account" used to drop straight onto the Create Child screen, so a family
 * could finish onboarding with a child profile and no account behind it — nothing to sign
 * back in with. The parent is signed up here first; the child steps follow.
 */
export default function CreateAccount() {
  const nav = useNavigate()
  const g = useGame()
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [tried, setTried] = useState(false)

  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email.trim())
  const pwOk = pw.length >= 6
  const matchOk = pw.length > 0 && pw === confirm
  const ready = emailOk && pwOk && matchOk && agreed

  const err = k => {
    if (!tried) return null
    if (k === 'email') return emailOk ? null : 'Enter a valid email address.'
    if (k === 'pw') return pwOk ? null : 'Use at least 6 characters.'
    if (k === 'confirm') return matchOk ? null : 'Both passwords must match.'
    return null
  }

  const create = () => {
    setTried(true)
    if (!ready) { sfx.wrong?.(); return }
    sfx.whoosh()
    /* Remember who the account belongs to, then hand over to the child steps. */
    g.setProfile({ parentEmail: email.trim() })
    g.setAuthIntent?.('parent')
    nav('/onboarding/child')
  }

  return (
    <Page>
      <Scene name="login" />
      <TopBar logo="plus" />
      <Child screen="login" delay={0.4} amp={6} />

      <Stack className="absolute left-[65px] top-[190px] w-[760px]" start={0.2}>
        <Item><h1 className="font-display font-extrabold text-[74px] leading-[1.04] text-ink">Let's set up<br />your family <span className="text-gold">✦</span></h1></Item>
        <Item className="mt-6 text-[26px] font-semibold text-ink-2">One grown-up account. Every child's journey inside it.</Item>
      </Stack>
      <TrustRow compact className="absolute left-[65px] top-[810px]" items={[[ShieldCheck, '#22c55e', 'Safe & secure', "Your child's data is always protected."], [Heart, '#ec4899', 'Loved by parents', 'Trusted by thousands of families.'], [BarChart3, '#3b82f6', 'Real progress', 'Track growth that matters.']]} />

      <Panel className="absolute left-[905px] top-[78px] w-[665px] px-12 pt-7 pb-6" initial="hidden" animate="show">
        <div className="flex flex-col items-center text-center">
          <motion.span className="chip h-[40px] px-5 text-[14px] tracking-[0.14em] uppercase" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.14 }}><ShieldCheck size={18} strokeWidth={2.4} /> Step 1 of 2 &middot; Parent</motion.span>
          <h2 className="mt-3 font-display font-extrabold text-[46px] leading-none text-ink">Create your account</h2>
          <p className="mt-1 text-[19px] font-semibold text-ink-3">You'll add your child on the next step.</p>
        </div>

        <Stack className="mt-5 flex flex-col gap-4 [&_.input]:h-[62px] [&_.input]:text-[20px]" start={0.55}>
          <Item v="soft"><Field label="Email address" icon={Mail} type="email" placeholder="you@example.com"
            value={email} onChange={e => setEmail(e.target.value)} error={err('email')} /></Item>
          <Item v="soft"><Field label="Password" icon={Lock} type={show ? 'text' : 'password'} placeholder="At least 6 characters"
            value={pw} onChange={e => setPw(e.target.value)} error={err('pw')}
            right={<button type="button" onClick={() => setShow(s => !s)} className="text-ink-3 hover:text-primary-ink">{show ? <EyeOff size={24} /> : <Eye size={24} />}</button>} /></Item>
          <Item v="soft"><Field label="Confirm password" icon={Lock} type={show ? 'text' : 'password'} placeholder="Type it once more"
            value={confirm} onChange={e => setConfirm(e.target.value)} error={err('confirm')} /></Item>

          <Item v="soft">
            <button type="button" className="flex items-start gap-3 text-left" onClick={() => { sfx.tap(); setAgreed(a => !a) }}>
              <span className={cn('mt-[2px] w-[26px] h-[26px] rounded-[8px] border-2 grid place-items-center shrink-0',
                agreed ? 'text-white' : 'border-[var(--line)]')}
                style={agreed ? { background: 'var(--grad-primary)', borderColor: 'transparent' } : undefined}>
                {agreed && <Check size={17} strokeWidth={3.5} />}
              </span>
              <span className="text-[17px] font-semibold text-ink-2 leading-snug">
                I'm the parent or guardian, and I agree to the <span className="text-primary-ink font-extrabold">Terms</span> and <span className="text-primary-ink font-extrabold">Privacy Policy</span>.
              </span>
            </button>
            {tried && !agreed && <span className="block mt-1 text-[15px] font-bold text-red-500">Please confirm to continue.</span>}
          </Item>

          <Item v="pop"><Button size="md" arrow icon={<User size={24} strokeWidth={2.4} />} className="w-full h-[62px] uppercase text-[21px]" sound="whoosh" onClick={create}>Create account</Button></Item>
          <Item v="soft" className="text-center text-[18px] font-bold text-ink-3">Already have one? <button className="text-primary-ink font-extrabold hover:underline" onClick={() => nav('/parent/login')}>Sign in</button></Item>
        </Stack>
      </Panel>
    </Page>
  )
}
