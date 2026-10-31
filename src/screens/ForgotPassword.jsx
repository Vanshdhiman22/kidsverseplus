import React, { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Mail, ShieldCheck } from 'lucide-react'
import Page from '../components/Page.jsx'
import Scene from '../components/Scene.jsx'
import { Panel } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import { api } from '../lib/api.js'
import Field from '../components/AuthField.jsx'

export default function ForgotPassword() {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const saving = useRef(false)
  const errorSummary = useRef(null)
  const submit = async event => {
    event.preventDefault()
    if (saving.current) return
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setError('Enter a valid parent email address.'); requestAnimationFrame(() => errorSummary.current?.focus()); return }
    saving.current = true
    setBusy(true); setError('')
    try {
      const response = await api.forgotPassword(email.trim().toLowerCase())
      if (response.delivery === 'not_configured') { setError('Password reset delivery is not available yet. Please contact support.'); return }
      setSent(true)
    }
    catch (error) { setError(error.status === 404 ? 'Password reset is currently unavailable. Please contact support.' : error.message || 'Could not send reset instructions. Please try again.') }
    finally { saving.current = false; setBusy(false) }
  }
  return <Page className="kv-auth">
    <Scene name="login" />
    <Panel className="kv-auth__panel absolute left-[510px] top-[135px] w-[650px] min-h-[620px] px-12 py-10" initial="hidden" animate="show">
      <button className="flex items-center gap-2 text-[17px] font-extrabold text-primary-ink" onClick={() => nav('/parent/login')}><ArrowLeft size={20} /> Back to login</button>
      <div className="mt-10 text-center"><span className="mx-auto w-[72px] h-[72px] rounded-[22px] grid place-items-center text-white bg-gradient-to-br from-violet-600 to-blue-500"><ShieldCheck size={34} /></span><h1 className="mt-5 font-display font-extrabold text-[45px] text-ink">Reset your password</h1></div>
      {sent ? <div role="status" className="mt-9 rounded-[24px] border-2 border-emerald-300 bg-emerald-50 p-7 text-center"><span className="mx-auto w-14 h-14 rounded-full bg-emerald-500 text-white grid place-items-center"><Check size={29} strokeWidth={3} /></span><h2 className="mt-4 font-display font-extrabold text-[27px] text-ink">Check your email</h2><p className="mt-2 text-[17px] font-semibold text-ink-2">If an account exists for <strong>{email}</strong>, we sent its password reset instructions.</p><Button className="mt-6 w-full h-[58px]" onClick={() => nav('/parent/login')}>Return to Login</Button></div> : <form noValidate onSubmit={submit} aria-busy={busy}>
        <p className="mt-3 text-center text-[18px] font-semibold text-ink-3">Enter the email used for your parent account.</p>
        <div className="mt-8"><Field id="reset-email" name="email" label="Parent email" icon={Mail} type="email" autoComplete="username" required autoFocus disabled={busy} placeholder="parent@example.com" value={email} onChange={e => setEmail(e.target.value)} /></div>
        {error && <p ref={errorSummary} tabIndex={-1} role="alert" className="mt-3 text-[15px] font-bold text-red-600">{error}</p>}
        <Button type="submit" arrow aria-busy={busy} className="mt-7 w-full h-[62px] uppercase text-[20px]" disabled={busy}>{busy ? 'Sending…' : 'Send Reset Link'}</Button>
        <p className="mt-5 text-center text-[14px] font-semibold text-ink-3">For privacy, the confirmation does not reveal whether an email is registered.</p>
      </form>}
    </Panel>
  </Page>
}
