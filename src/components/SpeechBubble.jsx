import React, { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { cn } from '../lib/utils.js'
import { lead } from '../lib/motion.js'

/* Pops in with a spring, optionally types its text out like a game dialogue. */
export default function SpeechBubble({ tail = 'left', text, children, delay = 0.6, type = true, className, style, speed = 12 }) {
  delay = lead(delay)
  const [shown, setShown] = useState(type && typeof text === 'string' ? '' : text)
  useEffect(() => {
    if (!type || typeof text !== 'string') { setShown(text); return }
    let i = 0; let id
    const start = setTimeout(() => {
      id = setInterval(() => { i++; setShown(text.slice(0, i)); if (i >= text.length) clearInterval(id) }, speed)
    }, delay * 1000 + 120)
    return () => { clearTimeout(start); clearInterval(id) }
  }, [text, type, delay, speed])
  return (
    <motion.div
      className={cn('bubble px-6 py-4', className)}
      data-tail={tail}
      style={{ transformOrigin: tail === 'left' ? 'left center' : tail === 'right' ? 'right center' : tail?.startsWith('bottom') ? 'bottom left' : 'top left', ...style }}
      initial={{ opacity: 0, scale: 0.6, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 460, damping: 22, delay }}
    >
      <span className="tail" />
      {children ?? shown}
      {type && typeof text === 'string' && shown.length < text.length && <span className="inline-block w-[3px] h-[1em] bg-primary ml-1 align-middle animate-pulse" />}
    </motion.div>
  )
}
