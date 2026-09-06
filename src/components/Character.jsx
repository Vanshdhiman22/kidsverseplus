import React from 'react'
import { motion } from 'motion/react'
import { cn } from '../lib/utils.js'

/* A character standing on the stage. Slides up with a spring on entry,
   then breathes: a slow bob with a counter-scaling shadow, and a tiny sway. */
export default function Character({ src, w = 320, x, y, right, bottom, delay = 0.2, amp = 9, dur = 3.8, flip, glow, podium, className, style, float = true, drop = 110 }) {
  return (
    <motion.div
      className={cn('absolute', className)}
      style={{ width: w, left: x, top: y, right, bottom, ...style }}
      initial={{ opacity: 0, y: drop, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 150, damping: 20, delay }}
    >
      {podium && <div className="podium" style={{ width: w * 1.15, height: w * 0.32, left: '50%', transform: 'translateX(-50%)', bottom: -w * 0.1 }} />}
      <div className="char-shadow" style={{ width: '70%' }} />
      <motion.img
        src={src}
        alt=""
        className={cn('relative block w-full h-auto', glow && 'glow-pulse')}
        style={{ transform: flip ? 'scaleX(-1)' : undefined, filter: glow ? undefined : 'drop-shadow(0 18px 24px rgba(40,20,120,.28))' }}
        animate={float ? { y: [0, -amp, 0], rotate: [0, 0.6, 0, -0.6, 0] } : undefined}
        transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut', delay: delay + 0.6 }}
      />
    </motion.div>
  )
}
