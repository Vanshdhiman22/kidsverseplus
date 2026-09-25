import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, Clock3, HelpCircle, Sparkles } from 'lucide-react'
import Scene, { Child } from '../components/Scene.jsx'
import Page from '../components/Page.jsx'
import { TopBar, UserChip } from '../components/TopBar.jsx'
import { QUESTIONS } from '../data/catalog.js'
import { useGame } from '../state/GameProvider.jsx'
import { listTopicTests } from '../lib/gameApi.js'
import { useLiveResource } from '../lib/useLiveResource.js'
import { ACTIVE_CONTENT_ID, useContent } from '../content/index.js'
import { cmsQuestions } from '../content/assessment.js'
import './TestArena.css'

export default function TestArena() {
  const nav = useNavigate()
  const g = useGame()
  const { name, face } = g.state.profile
  const studentId = g.state.activeChildId
  const subject = g.state.progress.world || 'maths'
  const pkg = useContent(subject === 'maths' ? ACTIVE_CONTENT_ID : `demo-${subject}`)
  const { data: testCatalog, loading } = useLiveResource(
    () => listTopicTests(studentId, subject),
    [studentId, subject],
    { enabled: Boolean(studentId) },
  )
  const liveTest = testCatalog?.tests?.[0]
  const authoredQuestions = cmsQuestions(pkg, 'test')
  const title = authoredQuestions ? `${pkg.mission.title} Test` : liveTest?.name || `${pkg.mission.title} Test`
  const questionCount = authoredQuestions?.length || liveTest?.question_count || QUESTIONS.length
  const minutes = liveTest?.estimated_minutes || 8
  const intro = authoredQuestions
    ? `Questions about ${pkg.mission.title}.`
    : liveTest?.intro_text || `Questions about ${pkg.mission.title}.`
  const openTest = () => nav(`/tests/mixed/intro?subject=${encodeURIComponent(subject)}`)

  return (
    <Page className="test-arena">
      <Scene name="arena" />
      <div className="test-arena__wash" aria-hidden="true" />
      <TopBar back="/home" backLabel="Home" right={<UserChip name={name} face={face} />} showControls={false} />
      <main className="test-arena__stage">
        <section className="test-arena__art" aria-label="Your test companion">
          <div className="test-arena__art-orbit test-arena__art-orbit--one" aria-hidden="true" />
          <div className="test-arena__art-orbit test-arena__art-orbit--two" aria-hidden="true" />
          <div className="test-arena__art-copy">
            <span className="test-arena__art-kicker">A little challenge with Nova</span>
            <h1>Show what<br />you know<span>.</span></h1>
            <p>Take your time. Every answer helps you learn.</p>
          </div>
          <Child screen="arena" box={[122, 292, 620, 570]} float={false} delay={0.18} />
          <div className="test-arena__nova-note"><Sparkles size={21} aria-hidden="true" /> Nova is here to help</div>
        </section>
        <section className="test-arena__content" aria-labelledby="test-arena-title">
          <span className="test-arena__eyebrow">Test with Nova</span>
          <div className="test-arena__topline">
            <span className="test-arena__subject">{pkg.subject || subject}</span>
            <span className="test-arena__step">Your next step</span>
          </div>
          <h2 id="test-arena-title">{title}</h2>
          <p className="test-arena__intro">{intro}</p>
          <div className="test-arena__facts" aria-label="Test details">
            <div><span className="test-arena__fact-icon"><HelpCircle size={26} aria-hidden="true" /></span><strong>{questionCount}</strong><span>Questions</span></div>
            <div><span className="test-arena__fact-icon"><Clock3 size={26} aria-hidden="true" /></span><strong>{minutes}</strong><span>Minutes</span></div>
          </div>
          <div className="test-arena__path" aria-label="How the test works">
            <span>Answer each question</span><span aria-hidden="true">→</span>
            <span>See your score</span><span aria-hidden="true">→</span>
            <span>Review with Nova</span>
          </div>
          <div className="test-arena__footer">
            <p>Ready, {name}? You can review your answers at the end.</p>
            <motion.button type="button" onClick={openTest} className="test-arena__start"
              whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }} aria-label={`Open ${title}`}>
              <span>Open test</span><ArrowRight size={26} aria-hidden="true" />
            </motion.button>
          </div>
          {loading && !authoredQuestions && <span className="test-arena__loading" role="status">Loading test details…</span>}
        </section>
      </main>
    </Page>
  )
}
