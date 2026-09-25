import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft, CheckCircle2, HeartHandshake, LockKeyhole, Phone, RefreshCw, ShieldCheck, UserRound } from 'lucide-react'
import Scene from '../components/Scene.jsx'
import Page, { Item, Stack } from '../components/Page.jsx'
import { TopBar } from '../components/TopBar.jsx'
import { Panel } from '../components/Panel.jsx'
import { Steps } from '../components/Stepper.jsx'
import Button from '../components/ApiButton.jsx'
import { useGame } from '../state/GameProvider.jsx'
import { api, API_MODE } from '../lib/api.js'
import { ONBOARDING_STEPS } from './CreateChild.jsx'

const phoneNumber = value => `+91${value.replace(/\D/g, '').slice(0, 10)}`

export default function ParentVerification() {
  const nav = useNavigate()
  const game = useGame()
  const [name, setName] = useState('')
  const [relation, setRelation] = useState('parent')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [challenge, setChallenge] = useState(null)
  const [verified, setVerified] = useState(false)
  const [message, setMessage] = useState('')
  const [demoCode, setDemoCode] = useState('')
  const [retryAt, setRetryAt] = useState(0)
  const [retrySeconds, setRetrySeconds] = useState(0)
  const validName = name.trim().length >= 2
  const validPhone = /^[6-9]\d{9}$/.test(phone)
  const childName = game.state.profile.name || 'your explorer'

  useEffect(() => {
    let active = true
    api.parentMe().then(parent => {
      if (!active) return
      if (parent.full_name) setName(previous => previous || parent.full_name)
      if (parent.relationship) setRelation(parent.relationship)
      if (parent.phone) setPhone(previous => previous || parent.phone.replace(/^\+91/, ''))
      if (parent.phone_verified_at) { setVerified(true); setMessage('This parent phone is already verified.') }
    }).catch(() => {})
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!retryAt) return
    const update = () => setRetrySeconds(Math.max(0, Math.ceil((retryAt - Date.now()) / 1000)))
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [retryAt])

  const requestCode = async () => {
    setMessage('')
    if (!validName || !validPhone) { setMessage('Enter your name and a valid 10-digit mobile number.'); return }
    if (!game.state.activeChildId) { setMessage('Add your child first, then verify your number.'); return }
    const response = await api.startParentVerification({ full_name: name.trim(), relationship: relation, phone: phoneNumber(phone), student_id: game.state.activeChildId })
    setChallenge(response.challenge_id)
    setRetryAt(Date.now() + 30000)
    setCode('')
    setDemoCode(API_MODE === 'mock' ? response.dev_code || '' : '')
    setMessage(`A 6-digit code was sent to +91 ••••••${phone.slice(-4)}.`)
  }

  const verify = async () => {
    if (!challenge || !/^\d{6}$/.test(code)) { setMessage('Enter the 6-digit code from your phone.'); return }
    const result = await api.verifyParentPhone({ challenge_id: challenge, code })
    if (!result.phone_verified) throw new Error('Phone verification was not confirmed. Please retry.')
    setVerified(true)
    setDemoCode('')
    setMessage('Phone verified. Your family setup is ready to continue.')
  }

  const updatePhone = value => {
    setPhone(value.replace(/\D/g, '').slice(0, 10))
    setChallenge(null); setVerified(false); setCode(''); setDemoCode(''); setMessage('')
  }

  return <Page>
    <Scene name="setup" />
    <TopBar center={<Steps steps={ONBOARDING_STEPS} current={1} className="w-[900px]" />} right={<span className="pill h-[52px] px-5 text-[18px] font-bold text-ink"><ShieldCheck size={20} className="text-primary-ink" /> Parent check</span>} showControls={false} />

    <Stack className="absolute left-[105px] top-[158px] w-[620px]" start={0.2}>
      <Item><span className="chip h-[44px] px-5 text-[15px] tracking-[0.14em] uppercase"><ShieldCheck size={18} /> Step 2 of 5</span></Item>
      <Item><h1 className="mt-6 font-display font-extrabold text-[60px] leading-[1.03] text-ink">A grown-up stays<br />in the loop. <span className="text-gold">✦</span></h1></Item>
      <Item className="mt-5 text-[23px] font-semibold text-ink-2 leading-snug">Before {childName} starts exploring, let&apos;s confirm who&apos;s guiding their learning.</Item>
      <Item className="mt-10">
        <Panel className="w-[545px] px-7 py-6" initial="hidden" animate="show">
          <div className="flex items-center gap-4"><span className="icon-orb w-[58px] h-[58px] bg-emerald-100 text-emerald-700"><LockKeyhole size={28} /></span><span className="font-display font-extrabold text-[21px] text-ink">Your number is for parent access</span></div>
          <p className="mt-3 text-[17px] font-semibold text-ink-3 leading-snug">The code confirms your phone. Children do not need a phone number, and a demo code is shown only with the local mock API.</p>
        </Panel>
      </Item>
    </Stack>

    <Panel className="absolute left-[800px] top-[112px] w-[750px] px-12 py-6" initial="hidden" animate="show">
      <div className="flex items-center gap-4"><span className="icon-orb w-[58px] h-[58px] bg-[var(--lavender)] text-primary-ink"><HeartHandshake size={30} /></span><span><span className="label-caps block">Parent or guardian</span><span className="font-display font-extrabold text-[35px] leading-tight text-ink">Your details</span></span></div>
      <p className="mt-2 text-[18px] font-semibold text-ink-3">Your account email is saved. Add your name and phone to finish verification.</p>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <label className="block"><span className="block mb-2 text-[17px] font-extrabold text-ink">Full name</span><span className="relative block"><UserRound size={22} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary-ink" /><input className="input h-[68px] pl-14 text-[19px]" autoComplete="name" placeholder="Your name" value={name} disabled={Boolean(challenge) || verified} onChange={e => setName(e.target.value)} /></span></label>
        <label className="block"><span className="block mb-2 text-[17px] font-extrabold text-ink">Relationship</span><select className="input h-[68px] text-[19px]" style={{ paddingLeft: 20 }} value={relation} disabled={Boolean(challenge) || verified} onChange={e => setRelation(e.target.value)}><option value="parent">Parent</option><option value="guardian">Legal guardian</option></select></label>
      </div>
      <label className="block mt-4"><span className="block mb-2 text-[17px] font-extrabold text-ink">Mobile number</span><span className="relative flex items-center"><span className="absolute left-5 flex items-center gap-2 font-extrabold text-[20px] text-primary-ink"><Phone size={21} /> +91</span><input className="input h-[66px] pl-[120px] text-[21px] tracking-[0.07em]" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="10-digit number" value={phone} disabled={verified} onChange={e => updatePhone(e.target.value)} aria-invalid={phone.length > 0 && !validPhone} /></span></label>
      {!challenge && !verified && <div className="mt-4"><Button size="md" arrow className="w-full h-[62px] uppercase text-[20px]" disabled={!validName || !validPhone || !game.state.activeChildId || retrySeconds > 0} onClick={requestCode}>{retrySeconds > 0 ? `Resend in ${retrySeconds}s` : 'Send verification code'}</Button></div>}

      {challenge && !verified && <motion.div className="mt-4 rounded-[22px] border-2 border-[var(--line)] bg-[var(--lavender)] p-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 text-[19px] font-extrabold text-ink"><Phone size={22} className="text-primary-ink" /> Enter your 6-digit code</div>
        <input className="input mt-3 h-[64px] text-center text-[30px] tracking-[0.45em]" style={{ paddingLeft: 20, paddingRight: 20 }} type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="••••••" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} aria-label="One-time code" />
        {demoCode && <p className="mt-2 text-[15px] font-bold text-amber-700">Local mock code: <span className="font-mono text-[18px]">{demoCode}</span> · No SMS was sent.</p>}
        <div className="mt-3 flex gap-3"><Button size="md" className="flex-1 h-[56px] uppercase" disabled={code.length !== 6} onClick={verify}>Verify phone</Button><button type="button" className="pill h-[56px] px-5 text-[16px] font-extrabold text-primary-ink" onClick={() => { setChallenge(null); setCode(''); setDemoCode(''); setMessage('Enter your details to request a fresh code.') }}><RefreshCw size={17} /> Change details</button></div>
        <button type="button" className="mt-2 text-[15px] font-extrabold text-primary-ink hover:underline disabled:opacity-50" disabled={retrySeconds > 0} onClick={requestCode}>{retrySeconds > 0 ? `Resend code in ${retrySeconds}s` : 'Resend code'}</button>
      </motion.div>}

      {message && <p role="status" className="mt-4 text-[16px] font-bold text-ink-2">{message}</p>}
      {verified && <div className="mt-4"><Button size="md" arrow className="w-full h-[62px] uppercase text-[20px]" onClick={() => nav('/onboarding/grade-board')}><CheckCircle2 size={23} /> Continue to learning setup</Button></div>}
      <button type="button" className="mt-5 flex items-center gap-2 text-[17px] font-extrabold text-primary-ink hover:underline" onClick={() => nav('/onboarding/child')}><ArrowLeft size={18} /> Back to child name</button>
    </Panel>
  </Page>
}
