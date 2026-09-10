import React from 'react'
import { motion } from 'motion/react'
import manifest from '../../public/art/chars/manifest.json'
import { lead } from '../lib/motion.js'
import { useGame } from '../state/GameProvider.jsx'
import { SLOTS, childSrc, childBox, novaLayer } from '../data/poses.js'
import { companionLayout } from '../data/companionLayout.js'

/* Scene: the designer's own backdrop for a screen, with the UI and characters
   painted out (tools/scene.py). Pinned to the 1672x941 canvas; on wider windows
   its own edges are mirrored into the side bands so it runs to the window edge. */
export default function Scene({ name, wings = 'mirror' }) {
  const src = `/art/scenes/${name}.webp`
  /* `mirror` folds the scene's own edge into the side band, which reads naturally
     for scenery. Use `stretch` when the edge carries something recognisable (the
     Home backdrop has a neon sign there, and mirrored text reads backwards): it
     smears the outermost pixels instead, so the colour continues with no content. */
  const stretch = wings === 'stretch'
  const wing = side => ({
    position: 'absolute', top: 0, height: 941, width: 'var(--bleed, 0px)', [side]: 'calc(0px - var(--bleed, 0px))',
    backgroundImage: `url(${src})`,
    backgroundSize: stretch ? '20000px 941px' : '1672px 941px',
    backgroundPosition: side === 'left' ? 'left top' : 'right top',
    transform: stretch ? undefined : 'scaleX(-1)',
  })
  return (
    <motion.div className="scene absolute inset-0 pointer-events-none select-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
      <div style={wing('left')} aria-hidden /><div style={wing('right')} aria-hidden />
      <img src={src} alt="" draggable={false} decoding="async" fetchpriority="high" className="absolute left-0 top-0 w-[1672px] h-[941px] max-w-none" />
    </motion.div>
  )
}

/* Cutout: a character lifted straight out of the design, placed exactly where
   the designer put it, then given life: a spring entrance and a slow breathe. */
export function Cutout({ id, src, box, delay = 0.3, amp = 8, dur = 3.8, float = true, dx = 0, dy = 0, scale = 1, className, style }) {
  const pos = box ?? manifest[id]
  if (!pos) return null
  const [x, y, w, h] = pos
  const img = src ?? `/art/chars/${id}.webp`
  const d = lead(delay)
  return (
    <motion.div className={className} style={{ position: 'absolute', left: x + dx, top: y + dy, width: w * scale, height: h * scale, ...style }}
      initial={{ opacity: 0, y: 28, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 24, delay: d }}>
      <div className="char-shadow" style={{ width: '70%' }} />
      <motion.img src={img} alt="" draggable={false} className="block w-full h-full object-contain" style={{ filter: 'drop-shadow(0 18px 24px rgba(40,20,120,.28))' }}
        animate={float ? { y: [0, -amp, 0], rotate: [0, 0.5, 0, -0.5, 0] } : undefined} transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut', delay: d + 0.4 }} />
    </motion.div>
  )
}

/* Child: the cutout drawn as whichever character this player picked.
   `screen` is a key in SLOTS. The pose, the box and the animation all come from
   the design and never change -- only the child does. Until that character's
   render for this pose exists, this draws the master art, so the screen always
   looks as approved. */
export function Child({ screen, ...rest }) {
  const { profile } = useGame().state
  const slot = SLOTS[screen]
  if (!slot?.cutout) return null
  /* The public/login/setup journey introduces the master boy. Avatar selection is the
     boundary: only screens after the picker use the saved choice. */
  const beforeSelection = ['landing', 'login', 'child', 'setup'].includes(screen)
  const face = beforeSelection ? 1 : Number(profile.face)
  const src = childSrc(face, screen, { outfit: profile.outfit })
  /* The pose path is only ever returned when a substitute is actually being drawn, so it
     is the exact signal for "the approved fused art is no longer on screen" -- and that is
     the only moment Nova has to be put back as her own layer. */
  const swapped = face !== 1 && typeof src === 'string' && (src.includes('/chars/pose/') || src.includes('/art/avatar/'))
  const nova = swapped ? novaLayer(screen) : null
  // Welcome's cards begin at x=696 / y=578; its old fused-art box
  // extends into them. Keep both companions above the cards and below text.
  const region = screen === 'welcome' ? [290, 330, 390, 375]
    : screen === 'nova' ? [135, 260, 680, 550]
    : manifest[slot.cutout]
  const pair = nova ? companionLayout(region, childBox(face, screen) ?? manifest[slot.cutout], nova.box) : null
  return (
    <>
      <Cutout id={slot.cutout} src={src} box={pair?.child ?? childBox(face, screen)} {...rest}
        style={rest.style} />
      {/* Nova is drawn after the child. Several replacement poses are wider than the
          master and otherwise cover her face/body in lesson sidebars. */}
      {nova && <Cutout id={`nova:${slot.cutout}`} src={nova.src} box={pair.nova}
        {...rest} amp={(rest.amp ?? 8) * 0.7}
        dur={(rest.dur ?? 3.8) * 1.15} />}
    </>
  )
}
