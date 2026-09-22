import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Rocket, Trophy, Home, Check, Flag, TrendingUp, ArrowRight, Star, RefreshCw } from 'lucide-react'
import Scene, { Child, Cutout } from '../components/Scene.jsx'
import Page, { Stack, Item } from '../components/Page.jsx'
import { TopBar, UserChip } from '../components/TopBar.jsx'
import { Panel, Card } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import SpeechBubble from '../components/SpeechBubble.jsx'
import { Ring, Counter, Bar, Confetti, Sparkles } from '../components/Widgets.jsx'
import { WORLD_DONE, STATION_PER, STATION_TOTAL } from '../data/catalog.js'

/* This screen is the end of the Fractions mission, which belongs to Maths. It used to
   credit `progress.world` -- whatever the Journey map's subject switcher was last left
   on -- so a child who browsed the Literacy map and then finished Fractions advanced
   Literacy instead. */
import { useGame } from '../state/GameProvider.jsx'
import { sfx } from '../lib/sound.js'
import { useAccent } from '../lib/accent.js'
import { useRouteContent, fill, withSubject, routeSubject } from '../content/index.js'
import PerfectScorePopup from '../components/PerfectScorePopup.jsx'
import AttemptReview from '../components/AttemptReview.jsx'

/* Chunky 3D headline: layered text-shadows give the extruded, toy-like look. */
const Chunky = ({ children, className, delay = 0 }) => (
  <motion.div className={className} initial={{ opacity: 0, scale: 0.3, rotate: -12, y: 40 }} animate={{ opacity: 1, scale: 1, rotate: -4, y: 0 }} transition={{ type: 'spring', stiffness: 220, damping: 14, delay }} style={{ fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.01em', color: '#fff', WebkitTextStroke: '2px #7c3aed', textShadow: '0 2px 0 #c4b5fd, 0 4px 0 #a78bfa, 0 6px 0 #8b5cf6, 0 8px 0 #7c3aed, 0 12px 0 #5b21b6, 0 20px 30px rgba(91,33,182,.45)' }}>{children}</motion.div>
)

export default function MissionComplete() {
  const nav = useNavigate()
  const location = useLocation()
  const g = useGame(); const { name, face } = g.state.profile; const { xp } = g.state.stats; const level = g.level
  const ac = useAccent()
  const [showReview, setShowReview] = useState(false)
  /* Words from the package. XP, the mastery ring and the skill bars are about the child,
     so they are never read from content -- see docs/CONTENT-CONTRACT.md. */
  const pkg = useRouteContent()
  const K = pkg.complete
  let savedResult = {}
  try { savedResult = JSON.parse(sessionStorage.getItem('kv:last-mission-score') ?? '{}') } catch { savedResult = {} }
  const result = location.state?.attemptId ? location.state : savedResult
  const XP = result.xpAwarded ?? 0
  const validResult = Boolean(result?.attemptId && Number.isFinite(Number(result.score)) && Number(result.total) > 0)
  const score = Number(result?.score ?? 0)
  const total = Number(result?.total ?? Math.min(pkg.check.questions.length, 6))
  const scoreRatio = total > 0 ? score / total : 0
  const scorePercent = Math.round(scoreRatio * 100)
  const OUTCOME = { understood: [Trophy, '#7c3aed'], improved: [TrendingUp, '#3b82f6'], next: [Flag, '#22c55e'] }
  useEffect(() => {
    if (!validResult) { nav(withSubject('/missions/fractions/spot-mistake'), { replace: true }); return }
    const t = setTimeout(() => sfx.unlock(), 300)
    const rewardKey = `kv:rewarded:${result.attemptId}`
    const t2 = setTimeout(() => { if (!localStorage.getItem(rewardKey)) { const world = routeSubject(); localStorage.setItem(rewardKey, '1'); g.advanceStation({ world, base: WORLD_DONE[world] ?? 0, per: STATION_PER, total: STATION_TOTAL }) }; g.refreshStats().catch(e => g.notice(e.message)) }, 1400)
    return () => { clearTimeout(t); clearTimeout(t2) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const mood = scorePercent < 70 ? { title: 'LET’S TRY AGAIN', message: 'A little practice will make this easier.' } : scorePercent < 95 ? { title: 'GOOD PROGRESS', message: 'You are close. Review the tricky parts and try again.' } : { title: 'MISSION COMPLETE!', message: K.encouragement }
  const outcomeCards = [
    { kind: 'understood', heading: scorePercent >= 70 ? 'YOU UNDERSTOOD' : 'KEEP LEARNING', skill: K.topic_label, description: scorePercent >= 70 ? `You solved ${score} of ${total} picture questions.` : 'Review the picture and count each group slowly.', value: score },
    { kind: 'improved', heading: 'YOU PRACTISED', skill: 'Combine and count', description: 'Every try helps your brain remember the steps.', value: score },
    { kind: 'next', heading: 'NEXT', skill: scorePercent < 95 ? 'Practise tricky questions' : 'Try a new challenge', description: scorePercent < 95 ? 'Nova will guide you through another example.' : 'You are ready to use the idea in a new way.' },
  ]
  return (
    <Page>
      <Scene name="complete" />
      {scorePercent < 70
        ? <Cutout id="complete-0" src="/art/generated/complete-low-score.png" delay={0.6} amp={3} />
        : <Child screen="complete" delay={0.6} amp={7} />}
      {scorePercent >= 95 && <Confetti />}
      <TopBar back={false} logo="planet" right={<><UserChip name={`Hi, ${name}! 👋`} sub={`Explorer Level ${level}`} face={face} /><span className="pill h-[68px] px-6 gap-3 font-display font-extrabold text-[24px] text-ink"><Star size={28} className="text-gold" fill="currentColor" /> <Counter to={xp} from={xp - XP} delay={0.3} /> XP</span></>} showControls={false} />
      <div className="absolute left-[150px] top-[120px] w-[700px] text-center">
        <Chunky className="text-[92px] leading-[0.9]" delay={0.2}>{mood.title.split(' ')[0]}</Chunky>
        <Chunky className="text-[92px] leading-[0.9] -mt-2" delay={0.35}>{mood.title.split(' ').slice(1).join(' ')}</Chunky>
        <motion.div className="mt-4 font-display font-extrabold text-[38px] text-sky-500" style={{ rotate: -4 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.27 }}>{K.topic_label}</motion.div>
      </div>
      <Sparkles n={12} seed={8} className="left-[80px] top-[80px] w-[800px] h-[700px]" />
      <motion.div className="absolute left-[520px] top-[400px] font-display font-extrabold text-[40px] text-primary-ink text-center leading-none" initial={{ opacity: 0, y: 30, scale: 0.5 }} animate={{ opacity: 1, y: [30, -10, 0], scale: 1 }} transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 14 }}>+{XP}<br /><span className="text-[26px]">XP</span></motion.div>
      <div className={scorePercent < 70 ? 'absolute left-[650px] top-[430px] z-20' : 'absolute left-[40px] top-[540px]'}><SpeechBubble tail={scorePercent < 70 ? 'left' : 'right'} delay={0.3} className="w-[220px] text-[17px]">{scorePercent < 70 ? `That's okay, ${name}. Let’s practise together.` : scorePercent < 95 ? `Good try, ${name}. You are getting closer.` : fill(K.nova.speech, { name })}</SpeechBubble></div>

      <Panel className="absolute left-[930px] top-[110px] w-[655px] h-[240px] p-6 flex items-center gap-8" initial="hidden" animate="show">
        <div className="relative"><div className="label-caps absolute -top-1 left-0 whitespace-nowrap">Your Score</div><Ring size={180} stroke={16} value={scoreRatio} id="mc" delay={0.27} className="mt-6"><div className="text-center leading-none"><div className="font-display font-extrabold text-[44px] text-ink"><Counter to={scorePercent} delay={0.27} />%</div><div className="text-[15px] font-bold text-ink-3 mt-1">{score}/{total} correct</div></div></Ring></div>
        <div className="flex-1"><div className="font-display font-extrabold text-[26px] text-ink">{K.topic_label}</div><div className="mt-2 font-display font-extrabold text-[32px] text-primary-ink">Score: {score}/{total}</div><div className="text-[18px] font-semibold text-ink-2">{mood.message}</div></div>
      </Panel>
      <Stack className="absolute left-[850px] top-[365px] flex gap-[18px]" start={1} delay={0.12}>
        {outcomeCards.map(o => { const [I, c0] = OUTCOME[o.kind] ?? OUTCOME.next; return [I, c0, o.heading, o.skill, o.description, o.value] }).map(([I, c0, t, s, d, v], i) => { const c = ac(c0); return (
          <Item key={t} v="pop"><Card hover className="relative w-[240px] h-[300px] p-5 flex flex-col items-center text-center">
            {v != null && <span className="absolute top-3 right-3 w-[28px] h-[28px] rounded-full grid place-items-center text-white" style={{ background: c }}><Check size={16} strokeWidth={3.5} /></span>}
            <span className="icon-orb w-[74px] h-[74px]" style={{ color: c, background: `${c}1f` }}><I size={38} strokeWidth={2} /></span>
            <div className="mt-3 font-display font-extrabold text-[18px] uppercase" style={{ color: c }}>{t}</div>
            <div className="text-[17px] font-extrabold text-primary-ink">{s}</div>
            <div className="mt-1 text-[14px] font-semibold text-ink-2 leading-snug">{d}</div>
            <div className="mt-auto w-full">{v != null ? <div className="flex items-center gap-3"><Bar value={total ? v / total : 0} h={8} className="flex-1" delay={0.3 + i * 0.1} /><span className="text-[14px] font-extrabold text-ink-2">{v}/{total}</span></div> : <span className="flex justify-end text-ink-2"><ArrowRight size={24} /></span>}</div>
          </Card></Item>
        ) })}
      </Stack>
      <Stack className="absolute left-[850px] top-[685px] w-[755px]" start={1.4}>
        <Item v="pop" className={`grid gap-4 ${scorePercent < 95 ? 'grid-cols-3' : 'grid-cols-2'}`}><Button size="md" arrow icon={<Rocket size={22} />} className="h-[70px] uppercase text-[18px]" sound="whoosh" onClick={() => nav(withSubject(K.next_step))}>Nova's next step</Button>{scorePercent < 95 && <Button variant="outline" size="md" icon={<RefreshCw size={22} />} className="h-[70px] uppercase text-[18px]" onClick={() => nav(withSubject('/missions/fractions/learn'))}>Practise First</Button>}<Button variant="outline" size="md" icon={<Trophy size={22} />} className="h-[70px] uppercase text-[18px]" onClick={() => nav(withSubject('/tests/mixed/intro?source=challenge'))}>Try a challenge</Button></Item>
        <Item v="pop" className="mt-4 grid grid-cols-2 gap-4"><Button variant="outline" size="md" className="h-[58px] text-[18px]" onClick={() => setShowReview(true)}>Review Answers</Button><Button variant="ghost" size="md" icon={<Home size={22} />} className="h-[58px] text-[18px]" onClick={() => nav('/journey')}>Back to Journey</Button></Item>
      </Stack>
      <PerfectScorePopup show={scorePercent === 100} mode="mission" />
      <AttemptReview open={showReview} items={result?.review || []} onClose={() => setShowReview(false)} />
    </Page>
  )
}
