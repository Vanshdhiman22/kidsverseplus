import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { CalendarDays, Swords, Trophy, Medal, ChevronRight, Star, HelpCircle, TrendingUp } from 'lucide-react'
import Scene, { Child } from '../components/Scene.jsx'
import Page, { Stack, Item } from '../components/Page.jsx'
import { TopBar, UserChip } from '../components/TopBar.jsx'
import { Panel, Card } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import { Tilt, Sparkles } from '../components/Widgets.jsx'
import { useGame } from '../state/GameProvider.jsx'
import { api } from '../lib/api.js'
import { useLiveResource } from '../lib/useLiveResource.js'
import { ACTIVE_CONTENT_ID, useContent, withSubject } from '../content/index.js'

const CARDS = [
  { I: CalendarDays, c: '#7c3aed', t: 'Challenge practice', s: 'Answer the available challenge questions.', btn: 'Start', to: '/tests/mixed/intro?source=challenge', primary: true },
  { I: Swords, c: '#3b82f6', t: 'Battle Arena', s: 'Practise against a game opponent.', btn: 'Enter Battle', to: '/challenge/opponents', primary: true },
  { I: Medal, c: '#f97316', grad: 'linear-gradient(100deg,#fb923c,#ea580c)', t: 'My Progress', s: 'See your recorded activity.', btn: 'View Profile', to: '/profile' },
]

export default function ChallengeHome() {
  const nav = useNavigate()
  const g = useGame(); const { name, face } = g.state.profile; const { xp } = g.state.stats
  const subject = new URLSearchParams(window.location.search).get('subject') || g.state.progress.world || 'maths'
  const pkg = useContent(subject === 'maths' ? ACTIVE_CONTENT_ID : `demo-${subject}`)
  const cards = CARDS.map(card => card.t === 'Challenge practice' && pkg.studio?.challenge?.questions?.length ? {
    ...card,
    s: `${pkg.studio.challenge.questions.length} question${pkg.studio.challenge.questions.length === 1 ? '' : 's'} about ${pkg.mission.title}.`,
  } : card)
  return (
    <Page>
      <Scene name="challenge" />
      <Child screen="challenge" delay={0.4} amp={7} />
      <TopBar right={<><UserChip name={name} sub={`Explorer Level ${g.level}`} face={face} /><span className="pill h-[68px] px-5 gap-3 font-display font-extrabold text-[20px] text-ink"><Star size={24} className="text-gold" fill="currentColor" /> {xp.toLocaleString()} XP <img src="/art/22-novahead.webp" alt="" className="w-[40px]" /></span></>} showControls={false} />
      <Stack className="absolute left-[50px] top-[135px]" start={0.25}>
        <Item className="eyebrow text-[18px] flex items-center gap-2"><img src="/art/planet-sm.webp" alt="" className="w-[30px]" /> Challenge Home</Item>
        <Item className="flex items-center gap-4"><span className="font-display font-extrabold text-[118px] leading-[0.9] grad-text tracking-tight">LEVEL UP</span><motion.span className="text-primary-ink" animate={{ y: [0, -10, 0], x: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity }}><TrendingUp size={80} strokeWidth={3} /></motion.span></Item>
        <Item><div className="font-display font-extrabold text-[38px] leading-none text-ink uppercase">With exciting challenges</div></Item>
        <Item className="mt-3 text-[20px] font-bold text-ink-2 flex items-center gap-2"><Star size={22} className="text-gold" fill="currentColor" /> Learn. Compete. Grow. Shine!</Item>
      </Stack>
      <Sparkles n={6} seed={25} className="left-[40px] top-[120px] w-[700px] h-[280px]" />

      <Stack className="absolute left-[180px] top-[405px] flex gap-[30px]" start={0.7} delay={0.1}>
        {cards.map(c => (
          <Item key={c.t} v="pop"><Tilt max={5}>
            <Card hover className="w-[450px] h-[235px] p-5 flex flex-col" onClick={() => nav(withSubject(c.to, subject))}>
              <div className="flex items-start gap-4"><span className="icon-orb w-[86px] h-[86px]" style={{ color: c.c, background: `${c.c}1f` }}><c.I size={44} /></span><span className="flex-1 leading-tight"><span className="block font-display font-extrabold text-[24px] text-ink">{c.t}</span><span className="block mt-1 text-[16px] font-semibold text-ink-2">{c.s}</span>{c.tag && <span className="block mt-2 text-[16px] font-extrabold text-orange-500 text-right">{c.tag}</span>}</span></div>
              <div className="mt-auto">{c.primary ? <Button size="md" arrow className="w-full h-[54px] text-[19px] uppercase" sound="whoosh" onClick={e => { e.stopPropagation(); nav(withSubject(c.to, subject)) }}>{c.btn}</Button> : <Button size="md" className="w-full h-[54px] text-[18px] uppercase text-white" style={{ background: c.grad, boxShadow: `0 14px 30px -14px ${c.c}` }} onClick={e => { e.stopPropagation(); nav(withSubject(c.to, subject)) }}>{c.btn}<ChevronRight size={22} className="ml-auto" /></Button>}</div>
            </Card>
          </Tilt></Item>
        ))}
      </Stack>

    </Page>
  )
}
