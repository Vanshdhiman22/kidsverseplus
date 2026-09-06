import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Rocket, BookOpen, Flag, Mic, ChevronRight, Check, Lock, Plus, MapPin, Flame, Star } from 'lucide-react'
import Scene, { Cutout } from '../components/Scene.jsx'
import Page, { Stack, Item } from '../components/Page.jsx'
import { TopBar, UserChip } from '../components/TopBar.jsx'
import { Panel, Card } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import Dock, { DOCK_JOURNEY } from '../components/Dock.jsx'
import { deriveStations, WORLD_DONE, WORLDS } from '../data/catalog.js'
import { useGame } from '../state/GameProvider.jsx'
import { bleedL, bleedR } from '../components/Stage.jsx'
import { sfx } from '../lib/sound.js'
import { cn } from '../lib/utils.js'

/* The road the car drives on — a single SVG path, also used as the CSS offset-path. */
const ROAD = 'M 620 150 C 760 130, 900 170, 1010 235 S 1230 190, 1280 300 S 1150 420, 1080 470 S 900 520, 830 560 S 1020 660, 1080 700 S 1300 720, 1480 780'

function Node({ n, i }) {
  const icon = { done: <Check size={22} strokeWidth={3.5} />, here: <MapPin size={22} strokeWidth={2.6} />, next: <Plus size={22} strokeWidth={3} />, locked: <Lock size={20} /> }[n.state]
  const color = { done: '#22c55e', here: '#f59e0b', next: '#3b82f6', locked: '#94a3b8' }[n.state]
  return (
    <motion.div className={cn('absolute card px-4 py-3 flex items-center gap-3', n.state === 'here' && 'card-selected')} style={{ left: n.x, top: n.y, minWidth: 190 }} initial={{ opacity: 0, scale: 0.6, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.08 + i * 0.12 }} whileHover={{ scale: 1.04 }}>
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
  const stations = deriveStations(subject, WORLD_DONE[subject] ?? 0)
  const worldName = WORLDS.find(w => w.id === subject)?.name ?? 'Maths'
  return (
    <Page>
      <Scene name="journey" />
      <Cutout id="journey-0" delay={0.3} amp={6} />
      {/* The car drives the road: CSS offset-path along the same curve. */}
      {stations.map((n, i) => <Node key={subject + n.id} n={n} i={i} />)}
      <motion.div key={subject} className="absolute left-[1268px] top-[535px]" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}><Button size="sm" arrow className="h-[52px] px-6 text-[18px] uppercase" sound="whoosh" onClick={() => nav('/learn/topics/fractions')}>Continue {stations.find(s => s.state === 'here')?.sub ?? 'Fractions'}</Button></motion.div>

      <TopBar right={<><div className="pill h-[60px] px-5 gap-4 text-[20px] font-extrabold text-ink"><span className="flex items-center gap-2 text-orange-500"><Flame size={22} fill="currentColor" /> <span className="text-ink">{xp.toLocaleString()}</span></span><span className="w-px h-6 bg-[var(--line)]" /><span className="flex items-center gap-2 text-gold"><Star size={22} fill="currentColor" /> <span className="text-ink">28</span></span></div><UserChip name={name} face={face} /></>} showControls={false} />
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
      <Dock items={DOCK_JOURNEY} compact />
    </Page>
  )
}
