import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MessageCircle, Phone, ShieldCheck } from 'lucide-react'
import Page from '../components/Page.jsx'
import Scene from '../components/Scene.jsx'
import { TopBar } from '../components/TopBar.jsx'
import { Panel } from '../components/Panel.jsx'
import { Steps } from '../components/Stepper.jsx'
import Button from '../components/Button.jsx'
import { api } from '../lib/api.js'
import { validWhatsappNumber, whatsappDigits } from '../lib/parent-contact.js'
import { ONBOARDING_STEPS } from './CreateChild.jsx'
import './ParentWhatsApp.css'

export default function ParentWhatsApp() {
  const nav = useNavigate()
  const input = useRef(null)
  const saving = useRef(false)
  const [number, setNumber] = useState('')
  const [parent, setParent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [touched, setTouched] = useState(false)
  const [reload, setReload] = useState(0)
  const invalid = touched && !validWhatsappNumber(number)

  useEffect(() => {
    let active = true
    setLoading(true); setLoadError('')
    api.parentMe().then(response => {
      if (!active) return
      const details = response?.parent ?? response
      setParent(details)
      setNumber(whatsappDigits(details.whatsapp_number || ''))
    }).catch(() => {
      if (active) setLoadError('We couldn’t load your parent details. Please try again.')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [nav, reload])

  const submit = async event => {
    event.preventDefault()
    if (saving.current || loading || loadError) return
    setTouched(true); setSaveError('')
    if (!validWhatsappNumber(number)) { input.current?.focus(); return }
    saving.current = true; setBusy(true)
    try {
      const saved = await api.saveParentWhatsApp(`+91${number}`)
      const details = saved?.parent ?? saved
      if (details?.whatsapp_number !== `+91${number}`) throw new Error('Save not confirmed')
      nav('/onboarding/grade-board')
    } catch {
      setSaveError('Your number couldn’t be saved. Please try again.')
    } finally {
      saving.current = false; setBusy(false)
    }
  }

  return <Page className="parent-whatsapp-page">
    <Scene name="setup" />
    <TopBar back={false} showControls={false}
      center={<Steps steps={ONBOARDING_STEPS} current={1} className="w-[900px]" />}
      right={<span className="pill whatsapp-parent-badge"><ShieldCheck size={20} aria-hidden="true" /> Parent contact</span>} />

    <div className="whatsapp-layout">
      <div className="whatsapp-intro">
        <span className="chip whatsapp-step"><MessageCircle size={18} aria-hidden="true" /> Parent contact</span>
        <h1>A little closer<br />to their learning.</h1>
        <p>Add a parent’s WhatsApp number for communication about your child’s learning.</p>
        <div className="whatsapp-note">
          <MessageCircle size={28} aria-hidden="true" />
          <div><strong>No OTP needed</strong><p>Just add a number you use on WhatsApp, save it and continue.</p></div>
        </div>
      </div>

      <Panel className="whatsapp-card" initial="hidden" animate="show">
        <div className="whatsapp-card-heading"><span className="icon-orb"><Phone size={28} aria-hidden="true" /></span><div><span className="label-caps">Parent or guardian</span><h2>Your WhatsApp number</h2></div></div>
        <p className="whatsapp-card-description">Which number would you like to use as your parent contact?</p>
        {loading ? <p role="status" className="whatsapp-status">Loading your details…</p>
          : loadError ? <div className="whatsapp-status"><p role="alert">{loadError}</p><Button type="button" variant="secondary" onClick={() => setReload(value => value + 1)}>Try again</Button></div>
            : <form onSubmit={submit} noValidate aria-busy={busy}>
              <label htmlFor="parent-whatsapp">WhatsApp number</label>
              <div className="whatsapp-input-wrap"><span aria-hidden="true">+91</span><input id="parent-whatsapp" ref={input} type="tel" inputMode="tel" autoComplete="tel-national" maxLength={18} placeholder="10-digit mobile number" value={number} disabled={busy} aria-invalid={invalid} aria-describedby={`whatsapp-help${invalid ? ' whatsapp-number-error' : ''}`} onBlur={() => setTouched(true)} onChange={event => { setNumber(whatsappDigits(event.target.value)); setSaveError('') }} /></div>
              <p id="whatsapp-help" className="whatsapp-help">We’ll save this as a contact number. No verification code will be sent.</p>
              {invalid && <p id="whatsapp-number-error" className="whatsapp-error" role="alert">Enter a valid 10-digit Indian mobile number starting with 6, 7, 8 or 9.</p>}
              {parent?.phone && validWhatsappNumber(whatsappDigits(parent.phone)) && <button className="whatsapp-use-mobile" type="button" disabled={busy} onClick={() => { setNumber(whatsappDigits(parent.phone)); setTouched(false); setSaveError(''); input.current?.focus() }}>Use my saved mobile number</button>}
              {saveError && <p role="alert" className="whatsapp-error">{saveError}</p>}
              <Button type="submit" size="lg" arrow disabled={busy} className="whatsapp-continue">{busy ? 'Saving…' : 'Save and continue'}</Button>
            </form>}
        <button type="button" className="whatsapp-back" disabled={busy} onClick={() => nav('/onboarding/child')}><ArrowLeft size={19} aria-hidden="true" /> Back to child details</button>
      </Panel>
    </div>
  </Page>
}
