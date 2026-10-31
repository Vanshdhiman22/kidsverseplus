import React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { CalendarDays, Swords, BookOpen, ChevronRight, Star, TrendingUp } from 'lucide-react'
import Scene, { Child } from '../components/Scene.jsx'
import Page, { Stack, Item } from '../components/Page.jsx'
import { TopBar, UserChip } from '../components/TopBar.jsx'
import { Card } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import { Tilt, Sparkles } from '../components/Widgets.jsx'
import { useGame } from '../state/GameProvider.jsx'
import { api } from '../lib/api.js'
import {listTopicChallenges} from '../lib/gameApi.js'
import { useLiveResource } from '../lib/useLiveResource.js'
import { withSubject } from '../content/index.js'
import { isReviewMode } from '../lib/reviewMode.js'
import { selectedChallenge, battleAvailability } from '../lib/challenge-selection.js'

const CARDS = [
  { I: CalendarDays, c: '#7c3aed', t: 'Challenge practice', s: 'Answer the available challenge questions.', btn: 'Start', to: '/tests/mixed/intro?source=challenge', primary: true },
  { I: Swords, c: '#3b82f6', t: 'Battle Arena', s: 'Practise against a game opponent.', btn: 'Enter Battle', to: '/challenge/opponents', primary: true },
  { I: BookOpen, c: '#f97316', grad: 'linear-gradient(100deg,#fb923c,#ea580c)', t: 'Topic tests', s: 'Explore the tests available for your topic.', btn: 'Browse tests', to: '/tests' },
]

export default function ChallengeHome() {
  const nav = useNavigate()
  const g = useGame(); const { name, face } = g.state.profile; const { xp } = g.state.stats
  const [query, setQuery] = useSearchParams()
  const subject = query.get('subject') || g.state.progress.world || 'maths'
  const review = isReviewMode()
  const [retry, setRetry] = React.useState(0)
  const catalog = useLiveResource(() => listTopicChallenges(g.state.activeChildId,subject), [review,g.state.activeChildId,subject,retry], { enabled: !review && Boolean(g.state.activeChildId) })
  const available = review ? [{id:`review-challenge-${subject}`}]: catalog.data?.challenges || []
  const chosen = selectedChallenge(available, review ? '' : query.get('challenge'))
  const opponents = useLiveResource(() => api.challengeOpponents(chosen.id), [chosen?.id,review,g.state.activeChildId,retry], { enabled: !review && Boolean(chosen) })
  const battle = battleAvailability(chosen, opponents)
  const failed = catalog.error || opponents.error
  const displayCards = CARDS.map(card => {
    if (card.t === 'Battle Arena') {
      const status = catalog.loading
        ? { disabled: true, label: 'Loading…', message: 'Loading available concepts…' }
        : catalog.error
          ? { disabled: true, label: 'Could not load', message: 'We could not load concepts. Use Retry to try again.' }
          : !available.length
            ? { disabled: true, label: 'Not available yet', message: 'No battles are available for your topic yet. Try a test or explore lessons.' }
            : battle
      return {
        ...card, to: `/challenge/opponents?challenge=${encodeURIComponent(chosen?.id || '')}`,
        disabled: !review && status.disabled,
        s: review ? card.s : status.message, btn: review ? card.btn : status.label,
      }
    }
    if (card.t === 'Challenge practice' && !review) return {
      ...card,
      to: '/challenge/practice', disabled: !g.state.activeChildId,
      s: 'Practise published challenge questions. Scores and XP are not saved.',
      btn: 'Choose concept',
    }
    return card
  })
  return (
    <Page className="phone-game phone-challenge">
      <Scene name="challenge" />
      <Child screen="challenge" delay={0.4} amp={7} />
      <TopBar right={<><UserChip name={name} sub={`Explorer Level ${g.level}`} face={face} /><span className="pill h-[68px] px-5 gap-3 font-display font-extrabold text-[20px] text-ink"><Star size={24} className="text-gold" fill="currentColor" /> {xp.toLocaleString()} XP <img src="/art/22-novahead.webp" alt="" className="w-[40px]" /></span></>} showControls={false} />
      <Stack className="phone-challenge__heading absolute left-[50px] top-[135px]" start={0.25}>
        <Item className="eyebrow text-[18px] flex items-center gap-2"><img src="/art/planet-sm.webp" alt="" className="w-[30px]" /> Challenge Home</Item>
        <Item className="flex items-center gap-4"><span className="font-display font-extrabold text-[118px] leading-[0.9] grad-text tracking-tight">LEVEL UP</span><motion.span className="text-primary-ink" animate={{ y: [0, -10, 0], x: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity }}><TrendingUp size={80} strokeWidth={3} /></motion.span></Item>
        <Item><div className="font-display font-extrabold text-[38px] leading-none text-ink uppercase">With exciting challenges</div></Item>
        <Item className="mt-3 text-[20px] font-bold text-ink-2 flex items-center gap-2"><Star size={22} className="text-gold" fill="currentColor" /> Learn. Compete. Grow. Shine!</Item>
      </Stack>
      {!review&&available.length>0&&<label className="phone-challenge__choice absolute left-[180px] top-[340px] flex items-center gap-3 font-bold text-ink">Choose a concept<select className="rounded-xl border bg-white p-2 min-h-[44px]" value={chosen?.id||''} onChange={e=>setQuery(previous=>{const next=new URLSearchParams(previous);next.set('subject',subject);next.set('challenge',e.target.value);next.delete('opponent');return next})}><option value="" disabled>Choose a concept</option>{available.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>}
      <Sparkles n={6} seed={25} className="left-[40px] top-[120px] w-[700px] h-[280px]" />

      <Stack className="phone-challenge__cards absolute left-[180px] top-[405px] flex gap-[30px]" start={0.7} delay={0.1}>
        {displayCards.map(c => (
          <Item key={c.t} v="pop"><Tilt max={5}>
            <Card className="w-[450px] h-[260px] p-5 flex flex-col" aria-disabled={c.disabled || undefined}>
              <div className="flex items-start gap-4"><span className="icon-orb w-[86px] h-[86px]" style={{ color: c.c, background: `${c.c}1f` }}><c.I size={44} /></span><span className="flex-1 leading-tight"><span className="block font-display font-extrabold text-[24px] text-ink">{c.t}</span><span aria-live="polite" className="block mt-1 text-[16px] font-semibold text-ink-2">{c.s}</span>{c.tag && <span className="block mt-2 text-[16px] font-extrabold text-orange-500 text-right">{c.tag}</span>}</span></div>
              <div className="mt-auto">{c.primary ? <Button disabled={c.disabled} size="md" arrow className="w-full h-[54px] text-[19px] uppercase" sound="whoosh" onClick={e => { e.stopPropagation(); nav(withSubject(c.to, subject)) }}>{c.btn}</Button> : <Button size="md" className="w-full h-[54px] text-[18px] uppercase text-white" style={{ background: c.grad, boxShadow: `0 14px 30px -14px ${c.c}` }} onClick={e => { e.stopPropagation(); nav(withSubject(c.to, subject)) }}>{c.btn}<ChevronRight size={22} className="ml-auto" /></Button>}</div>
            </Card>
          </Tilt></Item>
        ))}
      </Stack>
      <div className="phone-challenge__links absolute left-[180px] top-[700px] flex items-center gap-4">
        <Button variant="outline" onClick={() => nav(withSubject('/learn', subject))}>Explore lessons</Button>
        <Button variant="ghost" onClick={() => nav('/profile')}>My progress</Button>
        {failed && <><span role="alert" className="font-semibold text-ink">Some options could not load.</span><Button variant="outline" onClick={() => setRetry(value => value + 1)}>Retry</Button></>}
      </div>

    </Page>
  )
}
