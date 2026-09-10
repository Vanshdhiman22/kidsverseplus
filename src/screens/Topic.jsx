import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useBack } from '../lib/nav.js'
import { motion } from 'motion/react'
import { ArrowLeft, BookOpen, Box, Trophy, Check, Lock, Loader, Pencil, ClipboardCheck, Rocket, Star } from 'lucide-react'
import Scene, { Cutout, Child } from '../components/Scene.jsx'
import Page, { Stack, Item } from '../components/Page.jsx'
import { TopBar, UserChip, StatPill } from '../components/TopBar.jsx'
import { Card } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import SpeechBubble from '../components/SpeechBubble.jsx'
import { topicFor, gradeLabel, WORLDS } from '../data/catalog.js'
import { useGame } from '../state/GameProvider.jsx'
import { cn } from '../lib/utils.js'


export default function Topic() {
  const nav = useNavigate()
  const { world = 'maths' } = useParams()
  /* Back goes where the child came from. This said "Back to Learn" and always went to the
     Learn Hub, which is wrong for the common path now: most children arrive from Home. */
  const goBack = useBack()
  const T = topicFor(world)
  /* The headline column is 500px and the tracks below start at a fixed y, so a long
     title must shrink rather than wrap -- two lines pushed the description down behind
     the syllabus cards. Sized off the title that shipped ("Fractions", 9 characters). */
  const titlePx = T.title.length <= 10 ? 86 : T.title.length <= 15 ? 62 : 50
  /* The designer's backdrop carried a fraction pizza here, which was right when Fractions
     was the only page this route served. Every subject opens it now, so the pizza was
     painted out and each world draws its own globe on the pedestal instead. */
  const globe = (WORLDS.find(w => w.id === world) ?? WORLDS[1]).img
  const g = useGame(); const { name, face, grade } = g.state.profile; const { xp, streak } = g.state.stats
  return (
    <Page>
      <Scene name="topic" />
      <TopBar back={false} right={<><div className="pill h-[68px] px-2 gap-0"><StatPill kind="streak" value={streak} label="Day streak" className="border-0 shadow-none bg-transparent" /><span className="w-px h-8 bg-[var(--line)]" /><StatPill kind="xp" value={xp.toLocaleString()} label="Nova XP" className="border-0 shadow-none bg-transparent" /></div><UserChip name={name} sub={gradeLabel(grade)} face={face} /></>} showControls={false} />
      <Stack className="absolute left-[50px] top-[115px] w-[500px]" start={0.2}>
        <Item><button className="flex items-center gap-2 text-[21px] font-extrabold text-primary-ink hover:underline" onClick={goBack}><ArrowLeft size={22} strokeWidth={2.6} /> Back</button></Item>
        <Item className="flex items-center gap-4"><h1 className="font-display font-extrabold leading-none text-ink whitespace-nowrap" style={{ fontSize: titlePx }}>{T.title}</h1><img src="/art/planet-sm.webp" alt="" className="w-[70px] floaty" /></Item>
        <Item className="text-[26px] font-extrabold text-primary-ink">{gradeLabel(grade)} <span className="text-ink-3">•</span> {T.subject}</Item>
        <Item className="mt-2 text-[18px] font-semibold text-ink-2 leading-snug">{T.desc}</Item>
      </Stack>
      <Stack className="absolute left-[45px] top-[345px] flex flex-col gap-3" start={0.6} delay={0.1}>
        {T.tracks.map(([t, items, st, k], ti) => { const [I, c] = [[BookOpen, '#3b82f6'], [Box, '#8b5cf6'], [Trophy, '#f59e0b']][ti]; return (
          <Item key={t} v="left"><Card hover className="w-[495px] px-5 py-3 flex items-center gap-4">
            <span className="icon-orb w-[60px] h-[60px] shrink-0" style={{ color: c, background: `${c}1a` }}><I size={30} strokeWidth={2} /></span>
            <div className="flex-1"><div className="font-display font-extrabold text-[18px] text-ink uppercase tracking-wide">{t}</div>{items.map(x => <div key={x} className="flex items-center gap-2 text-[14px] font-bold text-ink-2 leading-tight"><span className={cn('w-[15px] h-[15px] rounded-full grid place-items-center text-white', k === 'locked' ? 'bg-gold' : 'bg-green-500')}>{k === 'locked' ? <Star size={8} fill="currentColor" /> : <Check size={9} strokeWidth={4} />}</span>{x}</div>)}</div>
            <span className={cn('chip h-[36px] px-3 text-[13px] uppercase tracking-wider', k === 'done' && 'text-green-700', k === 'locked' && 'text-orange-600')} style={k === 'done' ? { background: '#dcfce7', color: '#15803d' } : k === 'locked' ? { background: '#fff7ed', color: '#c2410c' } : undefined}>{st}{k === 'done' ? <Check size={16} strokeWidth={3} /> : k === 'locked' ? <Lock size={14} /> : <Loader size={16} className="animate-spin" />}</span>
          </Card></Item>
        ) })}
      </Stack>

      <Child screen="topic" delay={0.4} />
      <motion.img src={globe} alt="" draggable={false} className="absolute left-[820px] top-[120px] w-[270px] pointer-events-none"
        style={{ filter: 'drop-shadow(0 26px 34px rgba(40,30,140,.4))' }}
        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1, y: [0, -12, 0], rotate: [0, 3, 0, -3, 0] }}
        transition={{ opacity: { delay: 0.25 }, scale: { type: 'spring', stiffness: 200, damping: 18, delay: 0.25 }, y: { duration: 6, repeat: Infinity, ease: 'easeInOut' }, rotate: { duration: 9, repeat: Infinity, ease: 'easeInOut' } }} />
      <Cutout id="topic-1" delay={0.19} amp={10} />
      <div className="absolute left-[1310px] top-[180px]"><SpeechBubble tail="left" text={T.nova} delay={0.3} className="w-[240px] text-[17px]" /></div>

      <Stack className="absolute left-[1225px] top-[612px] w-[400px]" start={1}>
        <Item v="pop"><Button size="lg" arrow icon={<Rocket size={26} strokeWidth={2.4} />} className="w-full h-[78px] uppercase text-[22px] px-6 whitespace-nowrap" sound="whoosh" onClick={() => nav('/missions/fractions')}>Learn with Nova</Button></Item>
        <Item v="pop" className="mt-4 grid grid-cols-2 gap-4"><Button variant="ghost" size="md" icon={<Pencil size={20} />} className="h-[68px] uppercase text-[17px] px-4 whitespace-nowrap" onClick={() => nav('/missions/fractions')}>Practise</Button><Button variant="ghost" size="md" icon={<ClipboardCheck size={20} />} className="h-[68px] uppercase text-[17px] px-4 whitespace-nowrap" onClick={() => nav('/tests/mixed/intro')}>Take Test</Button></Item>
      </Stack>
    </Page>
  )
}
