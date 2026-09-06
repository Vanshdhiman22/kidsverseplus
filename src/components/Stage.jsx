import React, { useEffect, useRef } from 'react'
import { useGame } from '../state/GameProvider.jsx'

export const STAGE_W = 1672
export const STAGE_H = 941

/* The game is composed on a 1672x941 canvas and scaled to the window with one
   transform, like a game engine's FIT mode. On a window wider than 16:9 that
   leaves a band of dead space at each side, so we also publish `--bleed`: how
   far, in stage pixels, the real window edge sits beyond the canvas. Frame
   elements (top bar, side rail, floating buttons) use the helpers below to
   reach that true edge while the composition itself stays centred. */
export const bleedL = (n = 0) => ({ left: `calc(${n}px - var(--bleed, 0px))` })
export const bleedR = (n = 0) => ({ right: `calc(${n}px - var(--bleed, 0px))` })
export const bleedX = (n = 0) => ({ ...bleedL(n), ...bleedR(n) })

/* Fill mode crops the canvas top and bottom. `--safe-t/-b` say by how much, so
   the HUD can step inward and stay on screen while the artwork bleeds past it. */
export const safeT = (n = 0) => ({ top: `calc(${n}px + var(--safe-t, 0px))` })
export const safeB = (n = 0) => ({ bottom: `calc(${n}px + var(--safe-b, 0px))` })

/* `zoom` re-runs layout at the target size, so text, icons and borders are drawn
   at the screen's real resolution instead of being a 1672px bitmap stretched up
   (which is what `transform: scale` does, and why the UI read soft on big
   monitors). Older engines without zoom fall back to the transform. */
const CAN_ZOOM = typeof CSS !== 'undefined' && CSS.supports?.('zoom', '2')

export default function Stage({ children }) {
  const g = useGame()
  const mode = g.state.settings.screenFit ?? 'auto'
  const zoom = g.state.settings.zoom ?? 1
  const ref = useRef(null)

  useEffect(() => {
    const root = document.documentElement
    const apply = () => {
      const w = window.innerWidth, h = window.innerHeight
      /* Stretch scales the axes independently, so the board reaches all four
         edges without ever cropping — the art just reads a little wider. */
      const fit = Math.min(w / STAGE_W, h / STAGE_H)
      const sx = (mode === 'stretch' ? w / STAGE_W : fit) * zoom
      const sy = (mode === 'stretch' ? h / STAGE_H : fit) * zoom
      root.style.setProperty('--fit-x', String(sx))
      root.style.setProperty('--fit-y', String(sy))
      root.style.setProperty('--bleed', `${Math.max(0, (w / sx - STAGE_W) / 2)}px`)
      const crop = Math.max(0, (STAGE_H - h / sy) / 2)
      root.style.setProperty('--safe-t', `${crop}px`)
      root.style.setProperty('--safe-b', `${crop}px`)
      const el = ref.current
      if (!el) return
      if (CAN_ZOOM) {
        el.style.zoom = String(sy)
        /* only stretch mode needs a second, non-uniform axis */
        el.style.transform = Math.abs(sx - sy) > 0.001 ? `scaleX(${sx / sy})` : ''
      } else {
        el.style.transform = `scale(${sx}, ${sy})`
      }
    }
    apply()
    window.addEventListener('resize', apply)
    window.visualViewport?.addEventListener('resize', apply)
    return () => { window.removeEventListener('resize', apply); window.visualViewport?.removeEventListener('resize', apply) }
  }, [mode, zoom])

  return (
    <div className="stage-root">
      <div className="stage" ref={ref}>{children}</div>
    </div>
  )
}
