import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft, BookOpen, ClipboardCheck, MessageCircle, Target, TrendingUp } from 'lucide-react'
import Scene from '../components/Scene.jsx'
import Page from '../components/Page.jsx'
import ParentRail from '../components/ParentRail.jsx'
import { Panel, Card } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import { useGame } from '../state/GameProvider.jsx'
import { WORLDS, lessonProgress } from '../data/catalog.js'
import { bleedR } from '../components/Stage.jsx'

export default function ParentPlan() {
  const nav = useNavigate()
  const g = useGame()
  const { name } = g.state.profile
  const subject = g.state.progress.world || 'maths'
  const subjectName = WORLDS.find(world => world.id === subject)?.name ?? 'Maths'
  const lastTest = g.state.progress.lastTest
  const journeyStops = lessonProgress(g.state.progress.worldDone).done
  const testSummary = lastTest?.total
    ? `${lastTest.correct} of ${lastTest.total} correct in the latest test.`
    : 'No completed test yet. A test can help show what to revisit.'
  const steps = [
    { icon: BookOpen, color: '#7c3aed', title: `Explore ${subjectName}`, detail: 'Review the lesson and its three learning steps.', to: `/missions/fractions/learn?subject=${subject}` },
    { icon: ClipboardCheck, color: '#3b82f6', title: 'Practise with a test', detail: 'Use the available questions to check understanding.', to: `/tests/mixed/intro?subject=${subject}` },
    { icon: MessageCircle, color: '#22c55e', title: 'Read together', detail: 'Try the reading passage as an optional activity.', to: '/extra/reading' },
  ]

  return (
    <Page>
      <Scene name="plan" />
      <ParentRail />
      <Panel soft className="absolute left-[265px] top-[55px] w-[955px] h-[805px] p-8" initial="hidden" animate="show">
        <div className="text-[15px] font-extrabold uppercase tracking-wide text-primary-ink">Next steps</div>
        <h1 className="mt-2 font-display font-extrabold text-[43px] leading-tight text-ink">A simple learning plan for {name}</h1>
        <p className="mt-3 text-[18px] font-semibold text-ink-2">Choose an activity when it suits you. This is a suggestion, not a scheduled or scored plan.</p>
        <div className="mt-7 flex flex-col gap-4">
          {steps.map(({ icon: Icon, color, title, detail, to }, index) => (
            <Card key={title} className="min-h-[145px] p-5 flex items-center gap-5">
              <span className="w-[52px] h-[52px] rounded-2xl grid place-items-center text-white shrink-0" style={{ background: color }}><Icon size={27} /></span>
              <div className="flex-1"><div className="text-[12px] font-extrabold uppercase tracking-wide text-primary-ink">Step {index + 1}</div><div className="font-display font-extrabold text-[23px] text-ink">{title}</div><p className="mt-1 text-[15px] font-semibold text-ink-2">{detail}</p></div>
              <Button size="sm" arrow className="px-5 h-[48px]" onClick={() => nav(to)}>Open</Button>
            </Card>
          ))}
        </div>
        <div className="mt-7 rounded-2xl bg-[var(--lavender)]/60 p-5 text-[16px] font-semibold text-ink-2">
          As {name} completes activities, their recorded progress will appear in the parent overview.
        </div>
      </Panel>
      <Panel className="absolute top-[115px] w-[400px] p-6" style={bleedR(30)} initial="hidden" animate="show">
        <div className="flex items-center gap-3"><Target size={34} className="text-primary-ink" /><h2 className="font-display font-extrabold text-[25px] text-ink">What we know</h2></div>
        <Card className="mt-5 p-4"><div className="text-[13px] font-extrabold uppercase text-primary-ink">Latest test</div><p className="mt-2 text-[17px] font-semibold text-ink">{testSummary}</p></Card>
        <Card className="mt-3 p-4"><div className="text-[13px] font-extrabold uppercase text-primary-ink">Journey stops reached</div><p className="mt-2 text-[27px] font-display font-extrabold text-ink">{journeyStops}</p></Card>
        <div className="mt-5 flex items-start gap-3 text-[15px] font-semibold text-ink-2"><TrendingUp size={20} className="shrink-0 text-primary-ink" /><span>Recommendations become more useful as {name} completes lessons and tests.</span></div>
      </Panel>
      <motion.div className="absolute top-[675px] w-[400px]" style={bleedR(30)} initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }}>
        <Button variant="outline" size="md" icon={<ArrowLeft size={20} />} className="w-full h-[60px]" onClick={() => nav('/parent')}>Back to overview</Button>
      </motion.div>
    </Page>
  )
}
