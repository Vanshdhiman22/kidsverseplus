import { API_MODE } from '../lib/api.js'
import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { AlarmClock, Volume2, Star, Check } from 'lucide-react'
import Scene, { Cutout } from '../components/Scene.jsx'
import Page, { Stack, Item } from '../components/Page.jsx'
import { TopBar } from '../components/TopBar.jsx'
import { Panel, Card } from '../components/Panel.jsx'
import Button from '../components/ApiButton.jsx'
import { peekTestQuestion, prepareTestQuestion, getTestAttempt, queueTestAnswer, finishBufferedTest } from '../lib/gameApi.js'
import Character from '../components/Character.jsx'
import SpeechBubble from '../components/SpeechBubble.jsx'
import { QUESTIONS as LEGACY_QUESTIONS } from '../data/catalog.js'
import { childSrc } from '../data/poses.js'
import { useGame } from '../state/GameProvider.jsx'
import { sfx } from '../lib/sound.js'
import { cn } from '../lib/utils.js'
import { useRouteContent, routeSubject, withSubject } from '../content/index.js'
import QuestionVisual from '../components/QuestionVisual.jsx'
import { speak } from '../lib/voice.js'
import { assessmentBank, cmsQuestions, finishCmsAssessment, reviewAnswer } from '../content/assessment.js'

import { normalizeApiQuestion, testSeconds } from '../lib/live-data.js'
import ContentStatus from '../components/ContentStatus.jsx'

export default function TestQuestion() {
  const nav = useNavigate()
  const [searchParams] = useSearchParams()
  const g = useGame(); const { name, face } = g.state.profile
  const [qi, setQi] = useState(0)
  const [pick, setPick] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [secs, setSecs] = useState(null)
  /* The result screen used to invent every number it showed. The run's own answers and
     clock are carried out of here instead. */
  const [elapsed, setElapsed] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [review, setReview] = useState([])
  const [hintLevel, setHintLevel] = useState(API_MODE==='mock' && new URLSearchParams(window.location.search).get('mockScreen')==='43' ? 1 : 0)
  const [apiQuestion, setApiQuestion] = useState(null)
  const [questionError, setQuestionError] = useState(null)
  const [restoredSource, setRestoredSource] = useState(null)
  const pkg = useRouteContent({ loadLesson: false })
  const legacyQuestions = LEGACY_QUESTIONS.map((item, index) => ({
    question_id: `legacy-${index}`,
    instruction: item.q,
    options: item.options.map(([n, d], optionIndex) => ({ key: `option_${optionIndex + 1}`, label: `${n}/${d}` })),
    answer: `option_${item.answer + 1}`,
    models: [],
    feedback_correct: 'Great job! That is correct.',
    explanation: 'Look at the green answer.',
  }))
  const mode = searchParams.get('source') === 'challenge' ? 'challenge' : 'test'
  const assessmentSource = assessmentBank(mode)
  const authoredQuestions = cmsQuestions(pkg, mode)
  let apiAttempt = null
  try { apiAttempt = getTestAttempt(g.state.activeChildId, routeSubject(), mode) } catch {}
  const START = authoredQuestions ? 8 * 60 : testSeconds(apiAttempt?.test)
  const source = authoredQuestions ? `${g.state.activeChildId}:${pkg.content_id}:${pkg.content_version}:${routeSubject()}:${assessmentSource}` : `api:${apiAttempt?.attempt_id}`
  const QUESTIONS = authoredQuestions ?? (pkg.assessments?.[assessmentSource]?.length ? pkg.assessments[assessmentSource] : legacyQuestions)
  useEffect(() => {
    if (authoredQuestions) { setApiQuestion(null); setQuestionError(null); return }
    let active = true
    const ready = apiAttempt ? peekTestQuestion(g.state.activeChildId, routeSubject(), qi + 1, mode) : null
    setApiQuestion(ready ? normalizeApiQuestion(ready) : null)
    setQuestionError(null)
    Promise.resolve().then(() => prepareTestQuestion(g.state.activeChildId, routeSubject(), qi + 1, mode))
      .then(item => {
        if (!active) return
        setApiQuestion(normalizeApiQuestion(item))
        // Prepare two upcoming questions while the child answers this one.
        for (let order = qi + 2; order <= Math.min(qi + 3, apiAttempt?.total || 0); order++) {
          void prepareTestQuestion(g.state.activeChildId, routeSubject(), order, mode).catch(() => {})
        }
      })
      .catch(error => { if (active) setQuestionError(error) })
    return () => { active = false }
  }, [g.state.activeChildId, qi, Boolean(authoredQuestions), apiAttempt?.attempt_id, routeSubject(), mode])
  const q = authoredQuestions ? (QUESTIONS[qi] ?? QUESTIONS[0]) : apiQuestion || legacyQuestions[0]
  /* Was `total = 10, shown = qi + 3` -- staged for the design render. The child now
     arrives here straight from the daily mission, so the count has to be the real one. */
  const total = authoredQuestions ? QUESTIONS.length : (apiAttempt?.total ?? 0), shown = qi + 1
  useEffect(() => { setSecs(START); setElapsed(0) }, [source, START])
  useEffect(() => {
    if (!authoredQuestions && !apiQuestion) return
    const id = setInterval(() => { setSecs(s => s == null ? null : Math.max(0, s - 1)); setElapsed(s => s + 1) }, 1000)
    return () => clearInterval(id)
  }, [source, Boolean(apiQuestion), Boolean(authoredQuestions)])
  useEffect(() => {
    if (secs !== 0) return
    // Keep the expired screen visible; Finish Test retries an unsuccessful API save.
    setSubmitted(true)
  }, [secs]) // eslint-disable-line react-hooks/exhaustive-deps
  const mm = String(Math.floor(secs / 60)).padStart(2, '0'), ss = String(secs % 60).padStart(2, '0')
  const submit = async () => {
    if (finishing || (pick == null && secs !== 0 && !submitted)) return
    const finalReview = [...review]
    if (pick != null) {
      if (!authoredQuestions && !apiAttempt?.completion) queueTestAnswer(g.state.activeChildId, routeSubject(), qi + 1, pick, q.instruction, mode)
      const item = reviewAnswer(q, pick)
      finalReview[qi] = authoredQuestions ? item : { ...item, correct: null, answerLabel: 'Available after the test' }
    }
    setReview(finalReview)
    if (qi + 1 >= total || secs === 0) {
      setFinishing(true)
      try {
        const run = authoredQuestions
          ? finishCmsAssessment({ questions: QUESTIONS, review: finalReview, seconds: elapsed, subject: routeSubject(), mode })
          : await finishBufferedTest(g.state.activeChildId, routeSubject(), mode).then(result => ({ correct: result.correct_count, gradeScore: result.score, total: result.total_questions, seconds: elapsed, subject: routeSubject(), source: mode, review: finalReview.map((item, index) => ({ ...item, correct: result.answerResults?.[index + 1]?.is_correct ?? item.correct })), attemptId: result.attemptId, completedAt: result.completed_at, xpAwarded: result.xp_awarded, extraLearning: result.extra_learning, resultPending: result.resultPending, apiSaved: true, studentId: g.state.activeChildId }))
        sessionStorage.setItem('kv:last-test-run', JSON.stringify(run)); sessionStorage.removeItem('kv:test-progress')
        nav(withSubject(`/tests/mixed/result${mode === 'challenge' ? '?source=challenge' : ''}`), { state: run })
      } finally { setFinishing(false) }
      return
    }
    sessionStorage.setItem('kv:test-progress', JSON.stringify({ qi: qi + 1, correct, review: finalReview, secs, elapsed, source, pick: null, submitted: false }))
    const next = !authoredQuestions ? peekTestQuestion(g.state.activeChildId, routeSubject(), qi + 2, mode) : null
    setApiQuestion(next ? normalizeApiQuestion(next) : null); setQi(qi + 1); setPick(null); setSubmitted(false); setHintLevel(0); sfx.tap()
  }
  useEffect(() => {
    try {
      const state = JSON.parse(sessionStorage.getItem('kv:test-progress') || 'null')
      if (state?.source === source && state.qi < total) { setQi(state.qi); setCorrect(state.correct); setReview(state.review || []); setSecs(state.secs); setElapsed(state.elapsed || 0); setPick(state.pick ?? null); setSubmitted(Boolean(state.submitted)) }
    } catch {}
    setRestoredSource(source)
  }, [source, total])
  useEffect(() => {
    if (restoredSource !== source) return
    sessionStorage.setItem('kv:test-progress', JSON.stringify({ qi, correct, review, secs, elapsed, source, pick, submitted }))
  }, [qi, correct, review, secs, elapsed, source, pick, submitted, restoredSource])
  if (!authoredQuestions && (questionError || !apiQuestion)) return <ContentStatus activity="test" pkg={{ contentLoading: !questionError, contentError: questionError?.message }} />
  return (
    <Page className="phone-game phone-test">
      <Scene name="question" />
      <TopBar right={<motion.div className="pill h-[84px] px-6 gap-4" animate={secs < 60 ? { scale: [1, 1.04, 1] } : {}} transition={{ duration: 1, repeat: Infinity }}><span className="icon-orb w-[50px] h-[50px]"><AlarmClock size={28} /></span><span className="leading-tight"><span className="block font-display font-extrabold text-[36px] text-ink tabular-nums leading-none">{secs == null ? 'Untimed' : `${mm}:${ss}`}</span><span className="label-caps">Time remaining</span></span></motion.div>} showControls={false} />
      <motion.div className="phone-test__title absolute left-[360px] top-[24px] w-[400px] pl-6 border-l-2 border-[var(--line)]" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}><div className="eyebrow text-[13px]">{mode === 'challenge' ? 'Challenge' : 'Test'} Mode · {pkg.subject}</div><div className="font-display font-extrabold text-[21px] leading-tight text-ink uppercase">{authoredQuestions ? `${pkg.mission.title} ${mode === 'challenge' ? 'Challenge' : 'Test'}` : apiAttempt?.test?.name || 'Test'}</div><div className="text-[13px] font-semibold text-ink-3">{authoredQuestions ? `${q.difficulty} · ${mode === 'challenge' ? `${q.xp_on_correct} practice XP` : `${q.marks} mark${q.marks === 1 ? '' : 's'}`}` : 'Focused assessment. You’ve got this! 🚀'}</div></motion.div>
      <motion.div className="phone-test__progress absolute left-[795px] top-[50px] flex items-center gap-5" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <span className="pill h-[50px] px-5 font-display font-extrabold text-[19px] text-primary-ink uppercase">Question {shown} / {total}</span>
        <div className="relative w-[270px] h-[12px] rounded-full bg-[var(--lavender-2)] overflow-hidden"><motion.div className="absolute left-0 top-0 h-full rounded-full" style={{ background: 'var(--grad-primary)' }} animate={{ width: `${(shown / total) * 100}%` }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} /></div>
        <span className="font-display font-extrabold text-[20px] text-ink">{Math.round((shown / total) * 100)}%</span>
      </motion.div>

      {/* The side areas are stable game chrome. Question text, image and options remain data-driven. */}
      <div className="absolute left-[24px] top-[145px] bottom-[92px] w-[286px] rounded-[30px] border border-white/90 bg-white/55 shadow-[0_24px_65px_rgba(55,48,130,.12)] backdrop-blur-md" />
      <div className="absolute right-[24px] top-[145px] bottom-[92px] w-[286px] rounded-[30px] border border-white/90 bg-white/60 shadow-[0_24px_65px_rgba(55,48,130,.12)] backdrop-blur-md" />

      {/* Was the master boy hardcoded, so this screen alone kept showing him after a
          child picked someone else. The src comes from the slot now; the podium and
          the placement stay exactly as designed. */}
      <Character src={childSrc(face, 'question')} w={225} x={55} y={220} delay={0.14} podium />
      <motion.div className="absolute left-[48px] top-[720px] pill h-[62px] px-4 gap-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}><span className="icon-orb w-[40px] h-[40px] text-gold" style={{ background: 'rgba(251,191,36,.16)' }}><Star size={21} fill="currentColor" /></span><span className="leading-tight"><span className="block font-display font-extrabold text-[18px] text-ink">{name}</span><span className="block text-[12px] font-semibold text-primary-ink">Explorer in Learning</span></span></motion.div>
      <Character src="/art/hd/q-nova.webp" w={190} x={1420} y={395} delay={0.17} amp={8} />
      <div className="absolute left-[1395px] top-[190px]"><SpeechBubble tail="bottom" text={authoredQuestions ? q.nova?.speech || 'Take your time. Read each answer carefully.' : 'Take your time. Read each answer carefully.'} delay={0.3} className="w-[210px] text-[15px]" /></div>
      {!authoredQuestions && q.hints?.length>0 && <div className="phone-test__hints absolute left-[1395px] top-[350px] w-[230px] card p-4 text-[15px]"><button onClick={()=>setHintLevel(h=>Math.min(h+1,q.hints.length))}>Need a hint?</button>{hintLevel>0 && <p>{q.hints[hintLevel-1]}</p>}</div>}
      {authoredQuestions && <div className="phone-test__hints absolute left-[1395px] top-[350px] w-[230px] rounded-2xl border border-white/80 bg-white/85 p-3 text-[14px] font-semibold text-ink-2"><button type="button" className="font-extrabold text-primary-ink" onClick={() => setHintLevel(level => Math.min(level + 1, q.models?.[0]?.hints?.length || 0))}>Need a hint? {hintLevel}/3</button>{hintLevel > 0 && <p className="mt-2">{q.models?.[0]?.hints?.[hintLevel - 1]}</p>}</div>}
      <motion.button aria-label="Hear question" className="absolute left-[1580px] top-[285px] w-[52px] h-[52px] rounded-full pill justify-center text-primary-ink" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }} onClick={() => speak(`${q.instruction}. ${q.options.map(option => option.label).join('. ')}`)} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring' }}><Volume2 size={23} /></motion.button>
      <motion.div className="absolute left-[1384px] top-[720px] pill h-[62px] px-4 gap-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}><img src="/art/22-novahead.webp" alt="" className="w-[42px]" /><span className="leading-tight"><span className="block font-display font-extrabold text-[18px] text-ink">Nova</span><span className="block text-[12px] font-semibold text-primary-ink">Learning buddy</span></span></motion.div>

      <Panel className="phone-test__question absolute left-[336px] top-[142px] w-[1000px] h-[590px] p-7" initial="hidden" animate="show">
        {questionError && <div className="mb-3 text-center text-[15px] font-extrabold text-red-500">{questionError.message}</div>}
        <motion.div key={`q${qi}`} initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="text-center font-display font-extrabold text-[30px] text-ink leading-tight">{q.instruction}</motion.div>
        <div className="phone-test__visual mx-auto mt-3 h-[190px] w-[520px] rounded-[20px] overflow-hidden">{(authoredQuestions || q.models?.length > 0) && <QuestionVisual question={q.instruction} model={q.models?.[0]} />}</div>
        <Stack key={`o${qi}`} className={cn('phone-test__answers mx-auto mt-4 grid gap-4', q.options.length <= 4 ? 'grid-cols-2 max-w-[720px]' : 'grid-cols-3 max-w-[880px]')} start={0.2} delay={0.08}>
              {q.options.map((option, i) => {
                const on = pick === option.key
                return (
                  <Item key={option.key} v="pop"><Card hover={!finishing && secs !== 0} selected={on} role="button" tabIndex={finishing || secs === 0 ? -1 : 0} aria-pressed={on} className="relative h-[92px] flex items-center px-5 gap-4 overflow-hidden" aria-disabled={finishing || secs === 0} onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && !finishing && secs !== 0) { e.preventDefault(); setPick(option.key) } }} onClick={() => { if (!finishing && secs !== 0) { sfx.select(); setPick(option.key) } }}>
                    <span className={cn('shrink-0 w-[40px] h-[40px] rounded-full grid place-items-center font-display font-extrabold text-[20px]', on ? 'text-white' : 'text-primary-ink bg-[var(--lavender)]')} style={on ? { background: 'var(--grad-primary)' } : undefined}>{String.fromCharCode(65 + i)}</span>
                    <div className="flex-1 text-center font-display font-extrabold text-[22px] text-ink leading-tight">{option.label}</div>
                    {on ? <motion.span className="shrink-0 w-[30px] h-[30px] rounded-full grid place-items-center text-white" style={{ background: 'var(--grad-primary)' }} initial={{ scale: 0 }} animate={{ scale: 1 }}><Check size={18} strokeWidth={3.5} /></motion.span> : <span className="radio shrink-0" />}
                  </Card></Item>
                )
              })}
        </Stack>

      </Panel>
      <motion.div className="phone-test__action absolute left-[576px] top-[748px] text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Button arrow className="w-[520px] h-[66px] uppercase text-[21px]" disabled={finishing || (!authoredQuestions && !apiQuestion) || (pick == null && secs !== 0 && !submitted)} sound="whoosh" onClick={submit}>{qi + 1 >= total || secs === 0 ? `Finish ${mode === 'challenge' ? 'Challenge' : 'Test'}` : 'Next Question'}</Button>
        <p className="mt-2 text-[13px] font-extrabold text-ink-2">{finishing ? 'Submitting your answers. Please keep this page open.' : pick == null ? 'Choose one answer to continue' : 'Answer selected. All answers are submitted when you finish.'}</p>
      </motion.div>
    </Page>
  )
}
