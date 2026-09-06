import React from 'react'
import { motion } from 'motion/react'
import { cn } from '../lib/utils.js'
import { rise } from '../lib/motion.js'

/* Glass panel: the frosted plates every design screen is built from. */
export const Panel = React.forwardRef(function Panel({ className, strong, soft, children, style, variants = rise, ...rest }, ref) {
  return (
    <motion.div ref={ref} variants={variants} className={cn('glass', strong && 'glass-strong', soft && 'glass-soft', className)} style={style} {...rest}>
      {children}
    </motion.div>
  )
})

export function Card({ className, selected, hover, children, variants = rise, onClick, ...rest }) {
  return (
    <motion.div variants={variants} onClick={onClick} className={cn('card', hover && 'card-hover', selected && 'card-selected', className)} {...rest}>
      {children}
    </motion.div>
  )
}

export function Check({ size = 30, className, show = true }) {
  return (
    <motion.span
      className={cn('check-badge', className)}
      style={{ width: size, height: size }}
      initial={{ scale: 0, rotate: -40 }}
      animate={show ? { scale: 1, rotate: 0 } : { scale: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 18 }}
    >
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
    </motion.span>
  )
}
