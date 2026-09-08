import React from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft } from 'lucide-react'
import { useBack, NO_BACK } from '../lib/nav.js'
import { sfx } from '../lib/sound.js'

/**
 * The way out for screens that carry a rail instead of a header.
 *
 * These screens are headerless, so the app's floating Back was pinning itself to the
 * top-left corner -- which on a rail layout is exactly where the wordmark sits. The two
 * overlapped, and a back control drawn across a logo reads as broken whether or not it
 * fires. Sitting inside the rail it collides with nothing, and it matches how every
 * other screen keeps its back inside its own header.
 *
 * Roots have nothing behind them, so there it draws nothing.
 */
export default function RailBack({ className }) {
  const { pathname } = useLocation()
  const back = useBack()
  if (NO_BACK.has(pathname)) return null
  return (
    <motion.button
      type="button"
      aria-label="Go back"
      className={'self-start mb-3 ml-1 h-[38px] pl-2 pr-4 rounded-full flex items-center gap-2 text-[16px] font-display font-extrabold text-primary-ink hover:bg-[var(--lavender)] transition-colors ' + (className ?? '')}
      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
      whileHover={{ x: -2 }}
      onClick={() => { sfx.tap(); back() }}
    >
      <ArrowLeft size={19} strokeWidth={2.8} /> Back
    </motion.button>
  )
}
