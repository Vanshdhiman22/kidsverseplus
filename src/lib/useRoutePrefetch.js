import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { prefetchPlan } from './prefetch-plan.js'

const screens = import.meta.glob(['../screens/*.jsx', '!../screens/Api*.jsx', '!../screens/Mock*.jsx', '!../screens/ScreenIndex.jsx', '!../screens/ContentPreview.jsx'])

export default function useRoutePrefetch() {
  const { pathname } = useLocation()
  useEffect(() => {
    const connection = navigator.connection
    if (window.parent !== window || connection?.saveData || /2g/.test(connection?.effectiveType || '')) return
    let cancelled = false
    let idleId
    const timer = setTimeout(() => {
      const warm = () => {
        if (cancelled) return
        // Route modules are small and cached by the module loader. Artwork loads
        // with its own screen, instead of downloading every backdrop at login.
        for (const name of prefetchPlan(pathname)) void screens[`../screens/${name}.jsx`]?.().catch(() => {})
      }
      if (window.requestIdleCallback) idleId = window.requestIdleCallback(warm, { timeout: 2000 })
      else warm()
    }, 900)
    return () => { cancelled = true; clearTimeout(timer); if (idleId != null) window.cancelIdleCallback?.(idleId) }
  }, [pathname])
}
