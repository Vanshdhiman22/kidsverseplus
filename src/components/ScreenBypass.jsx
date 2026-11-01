import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { screenBypassDestination } from '../lib/screen-bypass.js'
import './ScreenBypass.css'

export default function ScreenBypass({ inline = false, disabled = false }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const destination = screenBypassDestination(pathname, import.meta.env.DEV)
  if (!destination || (!inline && pathname === '/onboarding/whatsapp')) return null

  return <aside className={`screen-bypass ${inline ? 'screen-bypass--inline' : ''}`} aria-label="Local screen testing">
    <div><strong>Local screen testing</strong><span>Continue without saving this step.</span></div>
    <button type="button" disabled={disabled} onClick={() => navigate(destination.path)} aria-label={`Bypass screen. Next: ${destination.label}`}>
      Bypass screen <ArrowRight size={18} aria-hidden="true" />
    </button>
  </aside>
}
