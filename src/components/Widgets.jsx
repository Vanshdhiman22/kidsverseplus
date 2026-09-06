import React, { useEffect, useRef, useState } from 'react'
import { animate, motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import { cn, range, rand } from '../lib/utils.js'

/* ---------- Animated progress ring ---------- */
export function Ring({ size = 200, stroke = 16, value = 0.8, delay = 0.4, children, className, track = 'var(--lavender-2)', id = 'ring' }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r
  return (
    <div className={cn('relative grid place-items-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#38bdf8" /><stop offset="55%" stopColor="#7c5cff" /><stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <motion.circle cx={size / 2} cy={size / 2} r={r} stroke={`url(#${id}-g)`} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - value) }} transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], delay }}
          style={{ filter: 'drop-shadow(0 0 10px rgba(124,92,255,.55))' }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  )
}

/* ---------- Count-up number ---------- */
export function Counter({ to = 0, from = 0, duration = 1.4, delay = 0.3, format = v => Math.round(v).toLocaleString(), className }) {
  const [v, setV] = useState(from)
  useEffect(() => {
    const ctrl = animate(from, to, { duration, delay, ease: [0.16, 1, 0.3, 1], onUpdate: setV })
    return () => ctrl.stop()
  }, [to, from, duration, delay])
  return <span className={className}>{format(v)}</span>
}

/* ---------- Progress bar ---------- */
export function Bar({ value = 0.5, className, delay = 0.4, h = 10 }) {
  return (
    <div className={cn('bar', className)} style={{ height: h }}>
      <motion.i initial={{ width: 0 }} animate={{ width: `${value * 100}%` }} transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1], delay }} />
    </div>
  )
}

/* ---------- 3D tilt card ---------- */
export function Tilt({ children, className, max = 10, glare = true, style, ...rest }) {
  const ref = useRef(null)
  const rx = useMotionValue(0), ry = useMotionValue(0)
  const srx = useSpring(rx, { stiffness: 200, damping: 18 }), sry = useSpring(ry, { stiffness: 200, damping: 18 })
  const gx = useMotionValue(50), gy = useMotionValue(50)
  const glareBg = useTransform([gx, gy], ([x, y]) => `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,.35), transparent 60%)`)
  const onMove = e => {
    const b = ref.current.getBoundingClientRect()
    const px = (e.clientX - b.left) / b.width, py = (e.clientY - b.top) / b.height
    ry.set((px - 0.5) * max * 2); rx.set(-(py - 0.5) * max * 2); gx.set(px * 100); gy.set(py * 100)
  }
  const reset = () => { rx.set(0); ry.set(0) }
  return (
    <motion.div ref={ref} className={cn('relative', className)} style={{ rotateX: srx, rotateY: sry, transformStyle: 'preserve-3d', perspective: 900, ...style }} onPointerMove={onMove} onPointerLeave={reset} {...rest}>
      {children}
      {glare && <motion.div className="pointer-events-none absolute inset-0 rounded-[inherit]" style={{ background: glareBg, opacity: 0.7 }} />}
    </motion.div>
  )
}

/* ---------- Sparkles ---------- */
export function Sparkles({ n = 6, className, color = 'var(--gold)', size = 18, seed = 1 }) {
  const items = React.useMemo(() => range(n).map(i => ({ left: `${(i * 37 + seed * 13) % 100}%`, top: `${(i * 53 + seed * 29) % 100}%`, delay: `${(i * 0.37) % 2.4}s`, s: 0.6 + ((i * 7 + seed) % 5) / 6 })), [n, seed])
  return (
    <div className={cn('pointer-events-none absolute inset-0', className)} aria-hidden>
      {items.map((s, i) => (
        <svg key={i} className="sparkle" style={{ left: s.left, top: s.top, animationDelay: s.delay, color, width: size * s.s, height: size * s.s }} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c.6 6.8 4.6 11 12 12-7.4 1-11.4 5.2-12 12C11.4 17.2 7.4 13 0 12 7.4 11 11.4 6.8 12 0z" /></svg>
      ))}
    </div>
  )
}

/* ---------- Confetti burst (canvas) ---------- */
export function Confetti({ count = 220, duration = 4200, className }) {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current, ctx = c.getContext('2d')
    const w = c.width = c.offsetWidth * 2, h = c.height = c.offsetHeight * 2
    const colors = ['#7c5cff', '#38bdf8', '#fbbf24', '#ec4899', '#22c55e', '#ffffff', '#a855f7']
    const ps = range(count).map(() => ({ x: w * rand(0.2, 0.8), y: h * rand(0.25, 0.5), vx: rand(-9, 9), vy: rand(-22, -6), g: rand(0.25, 0.45), s: rand(6, 14), r: rand(0, Math.PI), vr: rand(-0.2, 0.2), c: colors[Math.floor(rand(0, colors.length))], k: Math.random() > 0.5 }))
    const t0 = performance.now(); let raf
    const draw = now => {
      const t = now - t0; ctx.clearRect(0, 0, w, h)
      const fade = Math.max(0, 1 - Math.max(0, t - duration * 0.6) / (duration * 0.4))
      for (const p of ps) {
        p.vy += p.g; p.x += p.vx; p.y += p.vy; p.vx *= 0.99; p.r += p.vr
        ctx.save(); ctx.globalAlpha = fade; ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c
        if (p.k) ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); else { ctx.beginPath(); ctx.arc(0, 0, p.s / 3, 0, Math.PI * 2); ctx.fill() }
        ctx.restore()
      }
      if (t < duration) raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [count, duration])
  return <canvas ref={ref} className={cn('pointer-events-none absolute inset-0 w-full h-full', className)} />
}

/* ---------- iOS-style switch ---------- */
export function Switch({ on, onChange, className }) {
  return (
    <button className={cn('relative w-[62px] h-[34px] rounded-full transition-colors', className)} style={{ background: on ? 'var(--grad-primary)' : 'var(--lavender-2)', boxShadow: on ? 'var(--glow-primary)' : 'none' }} onClick={() => onChange?.(!on)} role="switch" aria-checked={on}>
      <motion.span className="absolute top-[4px] w-[26px] h-[26px] rounded-full bg-white shadow-md" animate={{ left: on ? 32 : 4 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
    </button>
  )
}

/* ---------- Fraction ---------- */
export function Fraction({ n, d, size = 28, className }) {
  return <span className={cn('fraction', className)} style={{ fontSize: size }}><span>{n}</span><span>{d}</span></span>
}

/* ---------- Art icon (3D webp icons) ---------- */
export function ArtIcon({ name, size = 56, className, float }) {
  return <img src={`/art/${name}.webp`} alt="" className={cn('object-contain', float && 'floaty', className)} style={{ width: size, height: size, filter: 'drop-shadow(0 8px 14px rgba(60,40,160,.3))' }} />
}
