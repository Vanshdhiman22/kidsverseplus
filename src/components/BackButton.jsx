import React from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft } from 'lucide-react'
import { useBack, needsFloatingBack } from '../lib/nav.js'
import { sfx } from '../lib/sound.js'

/**
 * One Back for the whole app.
 *
 * v2 left the way out to each screen: whichever dock or rail that screen happened to
 * draw. That works until a screen drops its dock -- then it silently becomes a dead
 * end, which is exactly what happened to the Learn Hub and the Test Arena. A single
 * button mounted above the routes cannot be forgotten by a new screen.
 *
 * It only draws on the handful of screens that render no header: everywhere else the
 * same trail is reached through TopBar's own back control, which cannot collide with a
 * logo the way a floating button pinned to the same corner does.
 */
export default function BackButton() {
  const { pathname } = useLocation()
  const back = useBack()
  if (!needsFloatingBack(pathname)) return null
  return (
    <motion.button
      type="button"
      className="absolute left-[24px] top-[24px] z-40 pill h-[48px] pl-3 pr-5 gap-2 text-primary-ink"
      aria-label="Go back"
      initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}
      whileHover={{ x: -3 }}
      onClick={() => { sfx.tap(); back() }}
    >
      <ArrowLeft size={21} strokeWidth={2.6} />
      <span className="font-display font-extrabold text-[17px]">Back</span>
    </motion.button>
  )
}
