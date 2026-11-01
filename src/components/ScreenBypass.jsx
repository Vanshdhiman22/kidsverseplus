import React, { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { NAVIGATION_SCREENS, screenNavigation, screenNavigationPath } from '../lib/screen-bypass.js'
import './ScreenBypass.css'

export default function ScreenBypass() {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const dock = useRef(null)
  const { current, previous, next } = screenNavigation(pathname)

  useEffect(() => {
    const root = document.documentElement
    const measure = () => root.style.setProperty('--screen-navigation-height', `${dock.current?.getBoundingClientRect().height || 0}px`)
    const observer = new ResizeObserver(measure)
    observer.observe(dock.current)
    measure()
    return () => { observer.disconnect(); root.style.removeProperty('--screen-navigation-height') }
  }, [])

  const go = path => navigate(screenNavigationPath(path, pathname, search))
  return <nav ref={dock} className="screen-bypass" aria-label="Screen navigation">
    <div className="screen-bypass__description"><strong>Screen navigation</strong><span>Changing screens won’t save this step.</span></div>
    <label className="screen-bypass__picker">
      <span className="sr-only">Go to screen</span>
      <select value={current?.path || ''} onChange={event => go(event.target.value)}>
        {!current && <option value="" disabled>Choose a screen</option>}
        {NAVIGATION_SCREENS.map(([path, label]) => <option key={path} value={path}>{label}</option>)}
      </select>
    </label>
    <div className="screen-bypass__actions">
      <button type="button" disabled={!previous} onClick={() => go(previous.path)} title={previous?.label}>
        <ArrowLeft size={18} aria-hidden="true" /> Previous screen
      </button>
      <button type="button" disabled={!next} onClick={() => go(next.path)} title={next?.label}>
        Next screen <ArrowRight size={18} aria-hidden="true" />
      </button>
    </div>
  </nav>
}
