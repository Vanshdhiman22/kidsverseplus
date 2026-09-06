/* Shared motion vocabulary — every screen uses the same springs so the app feels like one game. */
export const EASE = [0.16, 1, 0.3, 1]
export const SPRING = { type: 'spring', stiffness: 260, damping: 26, mass: 0.9 }
export const SPRING_SOFT = { type: 'spring', stiffness: 170, damping: 24 }
export const SPRING_POP = { type: 'spring', stiffness: 520, damping: 22, mass: 0.7 }
export const SPRING_BOUNCE = { type: 'spring', stiffness: 380, damping: 14 }

/* No filter here on purpose: a lingering filter (even blur(0)) makes Chrome
   rasterise the whole scaled screen at low resolution — everything goes soft. */
/* Entrances stay springy but short: a screen must read as "already here" the
   moment it is clicked. Anything above ~0.3s of lead-in feels like loading, so
   `lead` clamps every hand-written delay in the screens to that budget. */
export const LEAD = 0.3
export const lead = (d = 0) => Math.min(d * 0.34, LEAD)

export const page = {
  initial: { opacity: 0, scale: 0.995 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.24, ease: EASE } },
  exit: { opacity: 0, transition: { duration: 0.16, ease: [0.4, 0, 1, 1] } },
}

export const stagger = (delay = 0.08, start = 0.05) => ({
  hidden: {},
  show: { transition: { staggerChildren: Math.min(delay, 0.04), delayChildren: lead(start) } },
})

export const rise = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.34, ease: EASE } },
}
export const riseSoft = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.34, ease: EASE } },
}
export const pop = {
  hidden: { opacity: 0, scale: 0.82 },
  show: { opacity: 1, scale: 1, transition: SPRING_POP },
}
export const slideLeft = {
  hidden: { opacity: 0, x: -22 },
  show: { opacity: 1, x: 0, transition: { duration: 0.34, ease: EASE } },
}
export const slideRight = {
  hidden: { opacity: 0, x: 22 },
  show: { opacity: 1, x: 0, transition: { duration: 0.34, ease: EASE } },
}
export const fromBottom = {
  hidden: { opacity: 0, y: 120 },
  show: { opacity: 1, y: 0, transition: { ...SPRING_SOFT, delay: 0.15 } },
}
export const hoverLift = { y: -4, transition: { duration: 0.35, ease: EASE } }
export const tap = { scale: 0.965 }
