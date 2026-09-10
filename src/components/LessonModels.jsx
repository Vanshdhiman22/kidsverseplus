import React from 'react'
import { motion } from 'motion/react'
import { visualSource } from '../content/visuals.js'

/* ── the same fraction, told three ways ───────────────────────────────────
   A child who cannot see it in the pizza often sees it at once in a chocolate
   bar, or on a number line. Same question, same number of equal parts, a
   different picture — which is what "another way" swaps between.

   Every model takes the identical `parts` prop, so the swap can never quietly
   change the maths. Carried over from the v1 lesson board, where this lived on
   its own screen; here it is a control on the Learn screen instead, so the
   child never leaves the question to be told it differently. */

/* A model is cut either into `parts` equal pieces, or along an explicit `split`
   of weights. The split is what lets one picture pose an unequal-sharing question
   -- and because every model reads the same array, swapping the picture can never
   change the answer to that question. */
const weights = (parts, split) => split ?? Array.from({ length: parts }, () => 1 / parts)
const normalise = w => { const t = w.reduce((a, b) => a + b, 0); return w.map(v => v / t) }

/** The energy pizza the designer drew, cut into equal slices or an uneven split. */
export function Pizza({ parts = 1, split }) {
  const w = normalise(weights(parts, split))
  const cuts = w.length > 1 ? w.reduce((acc, v) => [...acc, acc[acc.length - 1] + v], [0]).slice(0, -1) : []
  return (
    <div className="relative w-[500px] h-[250px]">
      <div className="absolute left-1/2 top-[72px] -translate-x-1/2 w-[470px] h-[190px] podium" />
      <motion.img
        src="/art/pizza-energy.webp" alt="" draggable={false}
        className="absolute left-1/2 top-[18px] -translate-x-1/2 w-[430px]"
        style={{ filter: 'drop-shadow(0 30px 30px rgba(120,60,0,.35))' }}
        animate={{ y: [0, -10, 0], rotate: [0, 1, 0, -1, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* The cuts are drawn over the art, so the pizza itself is never redrawn.
          The viewBox is the asset's own pixel space and the ellipse is measured
          from it, so a cut ends on the crust instead of shooting past the plate. */}
      {cuts.length > 0 && (
        <svg className="absolute left-1/2 top-[18px] -translate-x-1/2 w-[430px] pointer-events-none" viewBox="0 0 325 191" aria-hidden>
          {cuts.map((t, i) => {
            const a = Math.PI * 2 * t - Math.PI / 2
            const x = 165 + Math.cos(a) * 138, y = 87 + Math.sin(a) * 81
            return (
              <g key={i}>
                <line x1="165" y1="87" x2={x} y2={y} stroke="rgba(60,20,0,.55)" strokeWidth="6" strokeLinecap="round" />
                <line x1="165" y1="87" x2={x} y2={y} stroke="rgba(255,255,255,.97)" strokeWidth="3" strokeLinecap="round" />
              </g>
            )
          })}
        </svg>
      )}
    </div>
  )
}

/** A chocolate bar snapped into `parts` equal chunks, or an uneven `split`. */
export function Bar({ parts = 1, split }) {
  const w = 100, h = 58, pad = 4, top = 7
  const inner = w - pad * 2, tall = h - top * 2
  const ws = normalise(weights(parts, split))
  const xs = ws.reduce((acc, v) => [...acc, acc[acc.length - 1] + v * inner], [pad])
  return (
    <div className="relative w-[500px] h-[250px] grid place-items-center">
      <div className="absolute left-1/2 top-[72px] -translate-x-1/2 w-[470px] h-[190px] podium" />
      <motion.svg
        className="relative w-[400px]" viewBox={`0 0 ${w} ${h}`} role="img"
        aria-label={ws.length > 1 ? `A chocolate bar in ${ws.length} parts` : 'One whole chocolate bar'}
        style={{ filter: 'drop-shadow(0 26px 26px rgba(74,36,17,.4))' }}
        animate={{ y: [0, -10, 0], rotate: [0, 1, 0, -1, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <rect x={pad} y={top} width={inner} height={tall} rx="5" fill="#4a2411" />
        {ws.map((_, i) => {
          const x = xs[i], cw = xs[i + 1] - xs[i]
          return (
            <g key={i}>
              {/* Each chunk is moulded, not flat: a lit top face over a darker base
                  is what makes it read as chocolate at a glance. */}
              <rect x={x + 1.8} y={top + 1.8} width={Math.max(0, cw - 3.6)} height={tall - 3.6} rx="3" fill="#8a4c26" />
              <rect x={x + 3.4} y={top + 3.4} width={Math.max(0, cw - 6.8)} height={(tall - 7) * 0.5} rx="2" fill="#a35e31" />
            </g>
          )
        })}
        {xs.slice(1, -1).map((x, i) => (
          <line key={i} x1={x} y1={top - 1} x2={x} y2={h - top + 1}
            stroke="#2a1408" strokeWidth="2.6" strokeLinecap="round" />
        ))}
      </motion.svg>
    </div>
  )
}

/** Zero to one, walked in `parts` equal jumps, or an uneven `split`. */
export function NumberLine({ parts = 1, split }) {
  const w = 100, h = 44, x0 = 8, x1 = 92, y = 24
  const ws = normalise(weights(parts, split))
  const xs = ws.reduce((acc, v) => [...acc, acc[acc.length - 1] + v * (x1 - x0)], [x0])
  return (
    <div className="relative w-[500px] h-[250px] grid place-items-center">
      <motion.svg
        className="relative w-[420px]" viewBox={`0 0 ${w} ${h}`} role="img"
        aria-label={ws.length > 1 ? `A number line from 0 to 1 in ${ws.length} jumps` : 'A number line from 0 to 1'}
        animate={{ y: [0, -8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <line x1={x0} y1={y} x2={x1} y2={y} stroke="var(--line)" strokeWidth="2.4" strokeLinecap="round" />
        {ws.map((_, i) => (
          <rect key={i} x={xs[i] + 1} y={y - 6} width={Math.max(0, xs[i + 1] - xs[i] - 2)} height="12" rx="3"
            fill={i % 2 ? 'rgba(139,92,246,.55)' : 'rgba(96,165,250,.55)'} />
        ))}
        {xs.map((x, i) => (
          <line key={i} x1={x} y1={y - 9} x2={x} y2={y + 9}
            stroke="var(--primary)" strokeWidth="2.4" strokeLinecap="round" />
        ))}
        <text x={x0} y={y + 20} fontSize="9" fill="var(--ink-3)" textAnchor="middle">0</text>
        <text x={x1} y={y + 20} fontSize="9" fill="var(--ink-3)" textAnchor="middle">1</text>
      </motion.svg>
    </div>
  )
}

/** The models "another way" cycles through, in order. `title` names the whole
    on screen, so the caption above the art always matches the picture. */
export const MODELS = [
  { key: 'pizza', label: 'Pizza',         title: '1 Whole Energy Pizza',  Art: Pizza },
  { key: 'bar',   label: 'Chocolate bar', title: '1 Whole Chocolate Bar', Art: Bar },
  { key: 'line',  label: 'Number line',   title: '0 to 1 Number Line',    Art: NumberLine },
]

/** Resolve a question/content visual from its data. Uploaded artwork wins; the
    built-in model remains a fallback for older fraction packages. */
export function LessonVisual({ model = {}, parts = 1, split, className = '' }) {
  const src = visualSource(model)
  const fallback = MODELS.find(item => item.key === model.key) ?? MODELS[0]
  const [failed, setFailed] = React.useState(false)
  React.useEffect(() => setFailed(false), [src])

  if (!src || failed) return <fallback.Art parts={parts} split={split} />

  return (
    <div className={`relative w-[500px] h-[250px] grid place-items-center ${className}`}>
      <motion.img
        key={src}
        src={src}
        alt={model.alt ?? model.visual?.alt ?? model.label ?? model.title ?? 'Question illustration'}
        draggable={false}
        className="max-w-[470px] max-h-[240px] w-auto h-auto object-contain"
        style={{ filter: 'drop-shadow(0 24px 28px rgba(40,20,120,.22))' }}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1, y: [0, -7, 0] }}
        transition={{ opacity: { duration: 0.25 }, scale: { duration: 0.25 }, y: { duration: 5, repeat: Infinity, ease: 'easeInOut' } }}
        onError={() => setFailed(true)}
      />
    </div>
  )
}
