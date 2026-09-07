import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Rocket, BookOpen, Flag, Mic, ChevronRight, Check, Lock, Plus, MapPin, Flame, Star } from 'lucide-react'
import Scene from '../components/Scene.jsx'
import Page, { Stack, Item } from '../components/Page.jsx'
import { TopBar, UserChip } from '../components/TopBar.jsx'
import { Panel, Card } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import { deriveStations, STATION_SPOTS, WORLD_DONE, WORLDS } from '../data/catalog.js'
import { useGame } from '../state/GameProvider.jsx'
import { bleedL, bleedR } from '../components/Stage.jsx'
import { sfx } from '../lib/sound.js'
import { cn } from '../lib/utils.js'

/* Car sprite, in design pixels (public/art/chars/journey-0.webp ships at 2x). */
const CAR = { w: 211, h: 203 }   // 0.62 of the source art: a map token, not a hero

/* Where the car parks at each station, in design pixels.
   These are placed per station rather than derived as one fixed offset from the card.
   A single offset was taken from the Fractions card -- the one spot the designer drew
   the car in -- and it only suits that card: the islands are not laid out in step with
   the labels, so the same nudge put the car behind the left panel at one station and
   under the dock at another. Each point below sits on its own island, clear of the
   panel (x-170 > 355) and above the dock (y+85 < 831).
   Index matches STATION_SPOTS / the curriculum order. */
const CAR_STOPS = [
  [1030, 190],  // Number Forest
  [1500, 190],  // Addition City
  [990, 380],   // Multiplication Station
  [1101, 493],  // Fractions Galaxy -- the designer's own placement
  [1010, 610],  // Decimal Dunes
  [1150, 750],  // Geometry Heights
]

/**
 * The road, built as a smooth curve through the station cards in curriculum order.
 *
 * It is derived rather than hand-drawn on purpose. A hand-drawn path has no reason to
 * visit the stations in the order a child unlocks them — the previous one wandered back
 * on itself, so "advance one chapter" could move the car *backwards* along it. Deriving
 * the curve from the spots makes forward progress structural: station i is always
 * earlier on the path than station i+1.
 */
function roadFromSpots(spots) {
  const p = spots.map((s, i) => CAR_STOPS[i] ?? [s.x, s.y])
  const at = i => p[Math.max(0, Math.min(p.length - 1, i))]
  let d = `M ${p[0][0]} ${p[0][1]}`
  for (let i = 0; i < p.length - 1; i++) {
    const [x0, y0] = at(i - 1), [x1, y1] = at(i), [x2, y2] = at(i + 1), [x3, y3] = at(i + 2)
    // Catmull-Rom through the anchors, expressed as a cubic Bézier.
    d += ` C ${x1 + (x2 - x0) / 6} ${y1 + (y2 - y0) / 6},` +
         ` ${x2 - (x3 - x1) / 6} ${y2 - (y3 - y1) / 6},` +
         ` ${x2} ${y2}`
  }
  return d
}

/**
 * Each station's position along the road, as an offset-distance percentage.
 * The anchors lie exactly on the curve, so these come out in order by construction.
 */
function useRoad(spots) {
  return React.useMemo(() => {
    const d = roadFromSpots(spots)
    if (typeof document === 'undefined') return { d, stops: null }

    const NS = 'http://www.w3.org/2000/svg'
    const svg = document.createElementNS(NS, 'svg')
    svg.setAttribute('width', '0'); svg.setAttribute('height', '0')
    svg.style.cssText = 'position:absolute;left:-9999px;visibility:hidden'
    const path = document.createElementNS(NS, 'path')
    path.setAttribute('d', d)
    svg.appendChild(path); document.body.appendChild(svg)

    const total = path.getTotalLength()
    const N = 800
    const samples = []
    for (let i = 0; i <= N; i++) {
      const q = path.getPointAtLength((total * i) / N)
      samples.push([q.x, q.y, i / N])
    }
    document.body.removeChild(svg)

    const stops = spots.map((s, i) => {
      const [cx, cy] = CAR_STOPS[i] ?? [s.x, s.y]
      let best = 0, bestD = Infinity
      for (const [x, y, t] of samples) {
        const dd = (x - cx) ** 2 + (y - cy) ** 2
        if (dd < bestD) { bestD = dd; best = t }
      }
      return best * 100
    })
    return { d, stops }
  }, [spots])
}

/**
 * The car drives the road between stations: on arrival it rolls from the station the
 * child last saw it at up to the one they are on now, so finishing a chapter is
 * something you watch happen rather than a sprite that was always parked there.
 *
 * It only drives when there is something to show. Re-opening the map replays nothing:
 * a car that sets off again every time you glance at the screen reads as decoration,
 * and the movement stops meaning "you got somewhere".
 */
function Car({ stations, road, seen, onArrive }) {
  const { d, stops } = road
  const hereIndex = Math.max(0, stations.findIndex(s => s.state === 'here'))
  const fromIndex = seen == null || seen > hereIndex ? hereIndex : seen
  const reduced = React.useRef(
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  ).current

  /* Record the arrival whenever the stored station is out of date -- including the very
     first view, which stores the current station without driving to it. Keying this off
     `fromIndex` instead would never fire on that first view, leaving nothing stored, and
     the next real advance would then have no earlier station to set off from. */
  React.useEffect(() => { if (seen !== hereIndex) onArrive?.(hereIndex) }, [seen, hereIndex, onArrive])

  if (!stops) return null
  const from = stops[fromIndex] ?? 0
  const to = stops[hereIndex] ?? 0
  // The route zig-zags between islands, so face the way we are actually travelling.
  const facing = (CAR_STOPS[hereIndex]?.[0] ?? 0) >= (CAR_STOPS[fromIndex]?.[0] ?? 0) ? 1 : -1
  const travel = reduced ? 0 : Math.min(2.8, 1.0 + Math.abs(to - from) * 0.045)

  return (
    <motion.div
      className="absolute left-0 top-0 z-[2] pointer-events-none"
      style={{
        offsetPath: `path("${d}")`,
        offsetRotate: '0deg',
        offsetAnchor: '50% 74%',        // wheels on the road, not the roof
        width: CAR.w, height: CAR.h,
      }}
      initial={{ offsetDistance: `${from}%`, opacity: 0, scale: 0.86 }}
      animate={{ offsetDistance: `${to}%`, opacity: 1, scale: 1 }}
      transition={{
        offsetDistance: { duration: travel, ease: [0.32, 0.72, 0.28, 1], delay: reduced ? 0 : 0.5 },
        opacity: { duration: 0.4, delay: 0.25 },
        scale: { type: 'spring', stiffness: 220, damping: 20, delay: 0.25 },
      }}
    >
      <motion.img
        src="/art/chars/journey-0.webp" alt="" draggable={false}
        className="w-full h-full object-contain drop-shadow-[0_20px_30px_rgba(40,30,120,.32)]"
        style={{ scaleX: facing }}
        animate={reduced ? undefined : { y: [0, -6, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: travel + 0.6 }}
      />
    </motion.div>
  )
}

function Node({ n, i }) {
  const icon = { done: <Check size={22} strokeWidth={3.5} />, here: <MapPin size={22} strokeWidth={2.6} />, next: <Plus size={22} strokeWidth={3} />, locked: <Lock size={20} /> }[n.state]
  const color = { done: '#22c55e', here: '#f59e0b', next: '#3b82f6', locked: '#94a3b8' }[n.state]
  return (
    <motion.div className={cn('absolute z-10 card px-4 py-3 flex items-center gap-3', n.state === 'here' && 'card-selected')} style={{ left: n.x, top: n.y, minWidth: 190 }} initial={{ opacity: 0, scale: 0.6, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.08 + i * 0.12 }} whileHover={{ scale: 1.04 }}>
      {n.state !== 'here' && n.state !== 'done' && <span className="w-[42px] h-[42px] rounded-full grid place-items-center text-white shrink-0" style={{ background: color, boxShadow: `0 0 0 4px ${color}33` }}>{icon}</span>}
      <div className="leading-tight">
        <div className={cn('font-display font-extrabold text-ink', n.state === 'here' ? 'text-[24px]' : 'text-[19px]')}>{n.name}</div>
        <div className="text-[15px] font-bold text-ink-3 flex items-center gap-2">{n.state === 'here' && <MapPin size={16} className="text-gold" />}{n.sub}</div>
        {n.state === 'next' && <div className="text-[13px] font-extrabold tracking-wider text-blue-500">NEXT</div>}
        {n.state === 'locked' && <div className="text-[13px] font-extrabold tracking-wider text-ink-3">LOCKED</div>}
        {n.state === 'here' && <div className="text-[14px] font-extrabold tracking-wider text-orange-500">⬇ YOU ARE HERE</div>}
      </div>
      {n.state === 'done' && <span className="ml-auto w-[30px] h-[30px] rounded-full bg-green-500 grid place-items-center text-white shadow-md"><Check size={18} strokeWidth={4} /></span>}
    </motion.div>
  )
}

export default function Journey() {
  const nav = useNavigate()
  const g = useGame(); const { name, face } = g.state.profile; const { xp } = g.state.stats
  const subject = g.state.progress.world ?? 'maths'
  const setSubject = id => g.setProgress({ world: id })
  const done = g.state.progress.worldDone?.[subject] ?? WORLD_DONE[subject] ?? 0
  const stations = deriveStations(subject, done)
  const worldName = WORLDS.find(w => w.id === subject)?.name ?? 'Maths'
  const road = useRoad(STATION_SPOTS)
  return (
    <Page>
      <Scene name="journey" />
      <Car key={`car-${subject}`} stations={stations} road={road} seen={g.state.progress.journeySeen?.[subject]} onArrive={i => g.markJourneySeen(subject, i)} />
      {stations.map((n, i) => <Node key={subject + n.id} n={n} i={i} />)}
      <motion.div key={subject} className="absolute z-10 left-[1268px] top-[535px]" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}><Button size="sm" arrow className="h-[52px] px-6 text-[18px] uppercase" sound="whoosh" onClick={() => nav(`/learn/topics/${subject}`)}>Continue {stations.find(s => s.state === 'here')?.sub ?? 'Fractions'}</Button></motion.div>

      <TopBar right={<><div className="pill h-[60px] px-5 gap-4 text-[20px] font-extrabold text-ink"><span className="flex items-center gap-2 text-orange-500"><Flame size={22} fill="currentColor" /> <span className="text-ink">{xp.toLocaleString()}</span></span><span className="w-px h-6 bg-[var(--line)]" /><span className="flex items-center gap-2 text-gold"><Star size={22} fill="currentColor" /> <span className="text-ink">{g.state.stats.badges}</span></span></div><UserChip name={name} face={face} /></>} showControls={false} />
      <Stack className="absolute top-[125px] w-[330px]" style={bleedL(55)} start={0.25}>
        <Item><h1 className="font-display font-extrabold text-[50px] leading-[1.05] text-ink">My Journey —<br /><span className="grad-text">{name} + Nova</span></h1></Item>
        <Item className="mt-1 font-display font-extrabold text-[34px] text-primary-ink">{worldName} World</Item>
        <Item className="mt-2 text-[19px] font-semibold text-ink-2 leading-snug">Explore, practice and master {worldName.toLowerCase()} step by step.</Item>
      </Stack>
      <Panel className="absolute top-[400px] w-[315px] p-5" style={bleedL(40)} initial="hidden" animate="show">
        <div className="text-[18px] font-extrabold text-ink-2">Switch Subject</div>
        <div className="mt-3 flex flex-col gap-2">
          {[['maths', 'Maths', Rocket], ['literacy', 'Literacy', BookOpen], ['evs', 'EVS / Science', Flag]].map(([id, l, I]) => <button key={id} className={cn('relative h-[56px] rounded-[16px] flex items-center gap-4 px-4 font-display font-extrabold text-[21px]', subject === id ? 'text-white' : 'text-ink')} onClick={() => { sfx.select(); setSubject(id) }}>{subject === id && <motion.span layoutId="subj" className="absolute inset-0 rounded-[16px]" style={{ background: 'var(--grad-primary)', boxShadow: 'var(--glow-primary)' }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}<span className="relative z-10 flex items-center gap-4"><I size={26} /> {l}</span></button>)}
        </div>
      </Panel>
      <Panel className="absolute top-[640px] w-[315px] p-5" style={bleedL(40)} initial="hidden" animate="show">
        <div className="text-[18px] font-extrabold text-ink-2">Companion Moments</div>
        <Stack className="mt-3 flex flex-col gap-2" start={0.9}>
          {[[Flag, 'Raise the Flag', '#ef4444', () => g.notice('Flag raised! Your grown-up will see it.')], [BookOpen, 'Read Together', '#8b5cf6', () => g.notice('Reading together is coming soon.')], [Mic, 'Talk with Nova', '#3b82f6', () => window.dispatchEvent(new Event('kv:agent'))]].map(([I, l, c, fn]) => <Item key={l} v="soft"><Card hover className="h-[50px] px-4 flex items-center gap-3 text-[17px] font-extrabold text-ink" onClick={() => { sfx.tap(); fn() }}><I size={22} style={{ color: c }} />{l}<ChevronRight size={20} className="ml-auto text-ink-3" /></Card></Item>)}
        </Stack>
      </Panel>
    </Page>
  )
}
