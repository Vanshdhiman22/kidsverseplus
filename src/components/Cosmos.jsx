import React, { useEffect, useMemo, useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import { range, rand } from '../lib/utils.js'

/* The living sky behind every screen: gradient sky, twinkling star canvas,
   drifting nebula, parallax planets, rising motes, shooting stars, the
   Kidsverse city on the horizon and a glossy floor. Everything reacts to
   the mouse with a soft spring so the world feels three-dimensional. */
export default function Cosmos({ city = true, planets = true, lite = false }) {
  /* Every screen now paints the designer's own backdrop over the whole canvas,
     so the living sky is only ever visible in the letterbox bands. `lite` keeps
     the gradient and drops the canvas, motes and pointer parallax; that is a
     rAF loop and a spring per pointer move we would otherwise burn for nothing. */
  if (lite) return <div className="cosmos" aria-hidden><div className="sky" /><div className="vignette" /></div>
  return <CosmosFull city={city} planets={planets} />
}

function CosmosFull({ city, planets }) {
  const mx = useMotionValue(0), my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 40, damping: 20 })
  const sy = useSpring(my, { stiffness: 40, damping: 20 })

  useEffect(() => {
    const onMove = e => {
      mx.set((e.clientX / window.innerWidth - 0.5) * 2)
      my.set((e.clientY / window.innerHeight - 0.5) * 2)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [mx, my])

  const l1x = useTransform(sx, v => v * -10), l1y = useTransform(sy, v => v * -6)
  const l2x = useTransform(sx, v => v * -22), l2y = useTransform(sy, v => v * -14)
  const l3x = useTransform(sx, v => v * -38), l3y = useTransform(sy, v => v * -20)
  const cityX = useTransform(sx, v => `calc(-50% + ${v * -16}px)`)

  const motes = useMemo(() => range(18).map(i => ({
    left: `${rand(2, 98)}%`, animationDuration: `${rand(12, 26)}s`, animationDelay: `${-rand(0, 20)}s`,
    width: rand(3, 7), height: rand(3, 7), opacity: rand(0.4, 0.9),
  })), [])

  return (
    <div className="cosmos" aria-hidden>
      <div className="sky" />
      <motion.div className="nebula" style={{ x: l1x, y: l1y }} />
      <StarCanvas />
      {planets && (
        <>
          <motion.img className="planet floaty" src="/art/planet-sm.webp" alt="" style={{ x: l3x, y: l3y, right: '0.5%', top: '22%', width: 116, opacity: .8, animationDuration: '7s' }} />
          <motion.img className="planet floaty" src="/art/22-moon.webp" alt="" style={{ x: l2x, y: l2y, left: '0.8%', top: '13%', width: 56, opacity: .45, animationDuration: '11s', animationDelay: '-5s' }} />
        </>
      )}
      <div className="shoot s1" /><div className="shoot s2" />
      {motes.map((m, i) => <i key={i} className="mote" style={m} />)}
      {city && <motion.img className="city" src="/art/city-band.webp" alt="" style={{ x: cityX }} />}
      <div className="floor" />
      <div className="vignette" />
    </div>
  )
}

function StarCanvas() {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current; const ctx = c.getContext('2d')
    let w, h, raf, stars
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = c.width = window.innerWidth * dpr; h = c.height = window.innerHeight * dpr
      stars = range(190).map(() => ({ x: Math.random() * w, y: Math.random() * h * 0.85, r: rand(0.6, 2.2) * dpr, p: rand(0, Math.PI * 2), s: rand(0.4, 1.6), vx: rand(-0.02, 0.02) * dpr }))
    }
    resize(); window.addEventListener('resize', resize)
    let t = 0
    const draw = () => {
      t += 0.016
      ctx.clearRect(0, 0, w, h)
      for (const s of stars) {
        const a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * s.s + s.p))
        s.x += s.vx; if (s.x < 0) s.x = w; if (s.x > w) s.x = 0
        ctx.beginPath(); ctx.fillStyle = `rgba(255,255,255,${a})`
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill()
        if (s.r > 1.7) { ctx.fillStyle = `rgba(190,180,255,${a * 0.25})`; ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2); ctx.fill() }
      }
      if (!reduce) raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={ref} />
}
