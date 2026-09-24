import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Clock, ChevronRight, HelpCircle, Check } from 'lucide-react'
import Scene, { Cutout, Child } from '../components/Scene.jsx'
import Page, { Stack, Item } from '../components/Page.jsx'
import { TopBar, UserChip, StatPill } from '../components/TopBar.jsx'
import { Card } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import SpeechBubble from '../components/SpeechBubble.jsx'
import { ArtIcon, Tilt } from '../components/Widgets.jsx'
import { QUESTIONS, TESTS } from '../data/catalog.js'
import { useGame } from '../state/GameProvider.jsx'
import { cn } from '../lib/utils.js'
import { listTopicTests } from '../lib/gameApi.js'
import { useLiveResource } from '../lib/useLiveResource.js'
import { ACTIVE_CONTENT_ID, useContent } from '../content/index.js'
import { cmsQuestions } from '../content/assessment.js'

export default function TestArena() {
  const nav = useNavigate()
  const g = useGame(); const { name, face } = g.state.profile; const { streak, coins, xp } = g.state.stats
  const studentId = g.state.activeChildId
  const subject = g.state.progress.world || 'maths'
  const pkg = useContent(subject === 'maths' ? ACTIVE_CONTENT_ID : `demo-${subject}`)
  const { data: testCatalog } = useLiveResource(
    () => listTopicTests(studentId, subject),
    [studentId, subject],
    { enabled: Boolean(studentId) },
  )
  const liveTest = testCatalog?.tests?.[0]
  const authoredQuestions = cmsQuestions(pkg, 'test')
  const test = {
    ...TESTS.find(item => item.id === 'mixed'),
    name: authoredQuestions ? `${pkg.mission.title} Test` : liveTest?.name || 'Mixed Test',
    desc: authoredQuestions ? `Questions about ${pkg.mission.title}.` : liveTest?.intro_text || 'Practise and review what you know.',
    q: `${authoredQuestions?.length || liveTest?.question_count || QUESTIONS.length} Questions`,
    time: `${liveTest?.estimated_minutes || 8} min`,
  }
  const TestCard = ({ t, wide, i }) => (
    <Item v="pop"><Tilt max={5}>
      <Card hover className="relative w-[600px] h-[255px] p-6 flex flex-col" onClick={() => nav(`/tests/mixed/intro?subject=${subject}`)}>
        <div className="flex items-start gap-4"><ArtIcon name={t.icon} size={wide ? 70 : 76} float /><div className="flex-1 leading-tight"><div className="font-display font-extrabold text-[22px] text-ink">{t.name}</div><div className="mt-1 text-[15px] font-semibold text-ink-2 leading-snug">{t.desc}</div></div></div>
        <div className="mt-auto flex items-center gap-4 text-[15px] font-bold text-ink-3">{(t.q ?? (t.id === 'mixed' ? `${QUESTIONS.length} Questions` : null)) && <span className="flex items-center gap-1"><HelpCircle size={17} /> {t.q ?? `${QUESTIONS.length} Questions`}</span>}<span className="flex items-center gap-1"><Clock size={17} /> {t.time}</span>{!t.recommended && <ChevronRight size={22} className="ml-auto text-primary-ink" />}</div>
        <Button size="sm" arrow className="mt-3 w-full h-[50px] text-[18px] uppercase" sound="whoosh">Open test</Button>
      </Card>
    </Tilt></Item>
  )
  return (
    <Page>
      <Scene name="arena" />
      <Cutout id="arena-1" delay={0.17} amp={10} />
      <Child screen="arena" delay={0.4} amp={6} />
      <TopBar back="/home" backLabel="Home" right={<><StatPill kind="xp" value={`${streak} days`} label="Streak" /><StatPill kind="bolt" value={xp.toLocaleString()} label="XP" /><StatPill kind="coins" value={coins} label="Nova Coins" /><UserChip name={name} face={face} /></>} showControls={false} />
      <Stack className="absolute left-[90px] top-[98px]" start={0.2}>
        <Item className="eyebrow text-[19px]">Test Arena</Item>
        <Item className="flex items-center gap-4"><h1 className="font-display font-extrabold text-[62px] leading-none text-ink">Test with Nova</h1><img src="/art/planet-sm.webp" alt="" className="w-[56px] floaty" /></Item>
        <Item className="mt-1 text-[21px] font-semibold text-ink-2 w-[340px] leading-snug">Choose a test and grow your skills.</Item>
      </Stack>
      <div className="absolute left-[680px] top-[140px]"><SpeechBubble tail="bottom" text="Ready to test your knowledge? Pick a test below! 🚀" delay={0.3} className="w-[220px] text-[18px]" /></div>

      <Stack className="absolute left-[470px] top-[450px]" start={0.7}><TestCard t={test} /></Stack>
    </Page>
  )
}
