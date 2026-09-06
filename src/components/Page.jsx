import React from 'react'
import { motion } from 'motion/react'
import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../lib/utils.js'
import { page, stagger, rise, pop, slideLeft, slideRight, riseSoft, lead } from '../lib/motion.js'
import { sfx } from '../lib/sound.js'

/* Every screen mounts inside a Page so route changes get the same cinematic
   blur/scale cross-fade, and children can opt into staggered reveals. */
export default function Page({ className, children, style }) {
  return (
    <motion.section className={cn('screen', className)} style={style} variants={page} initial="initial" animate="animate" exit="exit">
      {children}
    </motion.section>
  )
}

export const Stack = ({ className, children, delay = 0.08, start = 0.1, style, ...rest }) => (
  <motion.div className={className} style={style} variants={stagger(delay, start)} initial="hidden" animate="show" {...rest}>{children}</motion.div>
)
export const Item = ({ className, children, v = 'rise', style, ...rest }) => (
  <motion.div className={className} style={style} variants={{ rise, pop, left: slideLeft, right: slideRight, soft: riseSoft }[v]} {...rest}>{children}</motion.div>
)

export function BackButton({ to = -1, label = 'Back', className, style }) {
  const nav = useNavigate()
  return (
    <motion.button className={cn('pill h-[52px] pl-4 pr-6 text-[19px] font-bold text-ink hover:-translate-y-[2px] transition-transform', className)} style={style} onClick={() => { sfx.tap(); nav(to) }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: lead(0.3) }}>
      <ChevronLeft size={22} strokeWidth={2.8} /> {label}
    </motion.button>
  )
}
