import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { AlarmClock, Volume2, Star, Check } from 'lucide-react'
import Scene, { Cutout } from '../components/Scene.jsx'
import Page, { Stack, Item } from '../components/Page.jsx'
import { TopBar } from '../components/TopBar.jsx'
import { Panel, Card } from '../components/Panel.jsx'
import Button from '../components/ApiButton.jsx'
import { getTestQuestion, submitAnswer, completeTest } from '../lib/gameApi.js'
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

const LETTERS = ['A', 'B', 'C', 'D']

export default function TestQuestion() {
  const nav = useNavigate()
  const [searchParams] = useSearchParams()
  const g = useGame(); const { name, face } = g.state.profile
  const [qi, setQi] = useState(0)
  const [pick, setPick] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [secs, setSecs] = useState(8 * 60 + 15)
  /* The result screen used to invent every number it showed. The run's own answers and
     clock are carried out of here instead. */
  const START = 8 * 60 + 15
  const [correct, setCorrect] = useState(0)
  const [review, setReview] = useState([])
  const [hintLevel, setHintLevel] = useState(0)
  const [apiQuestion, setApiQuestion] = useState(null)
  const [questionError, setQuestionError] = useState(null)
  const pkg = useRouteContent()
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
  const source = `${pkg.content_id}:${pkg.content_version}:${routeSubject()}:${assessmentSource}`
  const QUESTIONS = authoredQuestions ?? (pkg.assessments?.[assessmentSource]?.length ? pkg.assessments[assessmentSource] : legacyQuestions)
  useEffect(() => {
    if (authoredQuestions) { setApiQuestion(null); setQuestionError(null); return }
    let active = true
    setApiQuestion(null)
    setQuestionError(null)
    getTestQuestion(g.state.activeChildId, routeSubject(), qi + 1)
      .then(item => {
        if (!active) return
        const options = Array.isArray(item.options) ? item.options.map((option, index) => {
          if (option && typeof option === 'object') {
            const value = option.value ?? option.key ?? option.id ?? option.label ?? option.text
            return { key: String(value ?? `option_${index + 1}`), label: String(option.label ?? option.text ?? value ?? '') }
          }
          return { key: String(option), label: String(option) }
        }) : []
        setApiQuestion({
          question_id: item.id,
          instruction: item.question_text,
          options,
          answer: null,
          models: [],
          explanation: 'Your final result is calculated by the API.',
        })
      })
      .catch(error => { if (active) setQuestionError(error) })
    return () => { active = false }
  }, [g.state.activeChildId, qi, Boolean(authoredQuestions)])
  const q = authoredQuestions ? QUESTIONS[qi] : apiQuestion || QUESTIONS[qi]
  /* Was `total = 10, shown = qi + 3` -- staged for the design render. The child now
     arrives here straight from the daily mission, so the count has to be the real one. */
  const total = QUESTIONS.length, shown = qi + 1
  useEffect(() => { const id = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000); return () => clearInterval(id) }, [])
  useEffect(() => {
    if (secs !== 0) return
    // Keep the expired screen visible; Finish Test retries an unsuccessful API save.
    setSubmitted(true)
  }, [secs]) // eslint-disable-line react-hooks/exhaustive-deps
  const mm = String(Math.floor(secs / 60)).padStart(2, '0'), ss = String(secs % 60).padStart(2, '0')
  const submit = async () => {
    if (pick == null && secs > 0) return
    if (submitted || secs === 0) {
      if (qi + 1 >= QUESTIONS.length || secs === 0) {
        sfx.whoosh()
        const run = authoredQuestions
          ? finishCmsAssessment({ questions: QUESTIONS, review, seconds: START - secs, subject: routeSubject(), mode })
          : await completeTest(g.state.activeChildId, routeSubject()).then(result => ({ correct: result.correct_count, total: result.total_questions, seconds: START - secs, subject: routeSubject(), source: mode, review, attemptId: result.attemptId, completedAt: result.completed_at, xpAwarded: result.xp_awarded, apiSaved: true }))
        sessionStorage.setItem('kv:last-test-run', JSON.stringify(run)); sessionStorage.removeItem('kv:test-progress')
        nav(withSubject(`/tests/mixed/result${mode === 'challenge' ? '?source=challenge' : ''}`), { state: run })
        return
      }
      setQi(qi + 1); setPick(null); setSubmitted(false); setHintLevel(0); sfx.tap(); return
    }
    const saved = authoredQuestions ? null : await submitAnswer(g.state.activeChildId, routeSubject(), qi + 1, pick, q.instruction)
    setSubmitted(true)
    const isCorrect = authoredQuestions ? pick === q.answer : saved.is_correct
    const localReview = reviewAnswer(q, pick)
    setReview(items => [...items, authoredQuestions ? localReview : { ...localReview, correct: isCorrect, answerLabel: 'Calculated by API' }])
    if (isCorrect) { setCorrect(c => c + 1); sfx.success() } else sfx.wrong()
  }
  useEffect(() => {
    try {
      const state = JSON.parse(sessionStorage.getItem('kv:test-progress') || 'null')
      if (state?.source === source && state.qi < QUESTIONS.length) { setQi(state.qi); setCorrect(state.correct); setReview(state.review || []); setSecs(state.secs) }
    } catch {}
  }, [source, QUESTIONS.length])
  useEffect(() => {
    if (!submitted) sessionStorage.setItem('kv:test-progress', JSON.stringify({ qi, correct, review, secs, source }))
  }, [qi, correct, review, secs, source, submitted])
  return (
    <Page>
      <Scene name="question" />
      <TopBar right={<motion.div className="pill h-[84px] px-6 gap-4" animate={secs < 60 ? { scale: [1, 1.04, 1] } : {}} transition={{ duration: 1, repeat: Infinity }}><span className="icon-orb w-[50px] h-[50px]"><AlarmClock size={28} /></span><span className="leading-tight"><span className="block font-display font-extrabold text-[36px] text-ink tabular-nums leading-none">{mm}:{ss}</span><span className="label-caps">Time remaining</span></span></motion.div>} showControls={false} />
      <motion.div className="absolute left-[360px] top-[24px] w-[400px] pl-6 border-l-2 border-[var(--line)]" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}><div className="eyebrow text-[13px]">{mode === 'challenge' ? 'Challenge' : 'Test'} Mode · {pkg.subject}</div><div className="font-display font-extrabold text-[21px] leading-tight text-ink uppercase">{pkg.mission.title} {mode === 'challenge' ? 'Challenge' : 'Test'}</div><div className="text-[13px] font-semibold text-ink-3">{authoredQuestions ? `${q.difficulty} · ${mode === 'challenge' ? `${q.xp_on_correct} practice XP` : `${q.marks} mark${q.marks === 1 ? '' : 's'}`}` : 'Focused assessment. You’ve got this! 🚀'}</div></motion.div>
      <motion.div className="absolute left-[795px] top-[50px] flex items-center gap-5" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
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
      <div className="absolute left-[1395px] top-[190px]"><SpeechBubble tail="bottom" text={authoredQuestions ? q.nova?.speech || 'Take your time. Use the picture to help.' : 'Take your time. Use the picture to help.'} delay={0.3} className="w-[210px] text-[15px]" /></div>
      {authoredQuestions && <div className="absolute left-[1395px] top-[350px] w-[230px] rounded-2xl border border-white/80 bg-white/85 p-3 text-[14px] font-semibold text-ink-2"><button type="button" className="font-extrabold text-primary-ink" onClick={() => setHintLevel(level => Math.min(level + 1, q.models?.[0]?.hints?.length || 0))}>Need a hint? {hintLevel}/3</button>{hintLevel > 0 && <p className="mt-2">{q.models?.[0]?.hints?.[hintLevel - 1]}</p>}</div>}
      <motion.button aria-label="Hear question" className="absolute left-[1580px] top-[285px] w-[52px] h-[52px] rounded-full pill justify-center text-primary-ink" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }} onClick={() => speak(`${q.instruction}. ${q.options.map(option => option.label).join('. ')}`)} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring' }}><Volume2 size={23} /></motion.button>
      <motion.div className="absolute left-[1384px] top-[720px] pill h-[62px] px-4 gap-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}><img src="/art/22-novahead.webp" alt="" className="w-[42px]" /><span className="leading-tight"><span className="block font-display font-extrabold text-[18px] text-ink">Nova</span><span className="block text-[12px] font-semibold text-primary-ink">Learning buddy</span></span></motion.div>

      <Panel className="absolute left-[336px] top-[142px] w-[1000px] h-[590px] p-7" initial="hidden" animate="show">
        {questionError && <div className="mb-3 text-center text-[15px] font-extrabold text-red-500">{questionError.message}</div>}
        <motion.div key={`q${qi}`} initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="text-center font-display font-extrabold text-[30px] text-ink leading-tight">{q.instruction}</motion.div>
        <div className="mx-auto mt-3 h-[190px] w-[520px] rounded-[20px] overflow-hidden"><QuestionVisual question={q.instruction} model={q.models?.[0]} /></div>
        <Stack key={`o${qi}`} className={cn('mx-auto mt-4 grid gap-4', q.options.length <= 4 ? 'grid-cols-2 max-w-[720px]' : 'grid-cols-3 max-w-[880px]')} start={0.2} delay={0.08}>
              {q.options.map((option, i) => {
                const on = pick === option.key
                return (
                  <Item key={option.key} v="pop"><Card hover={!submitted} selected={on} role="button" tabIndex={submitted ? -1 : 0} aria-pressed={on} className="relative h-[92px] flex items-center px-5 gap-4 overflow-hidden" onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && !submitted && setPick(option.key)} onClick={() => { if (!submitted) { sfx.select(); setPick(option.key) } }}>
                    <span className={cn('shrink-0 w-[40px] h-[40px] rounded-full grid place-items-center font-display font-extrabold text-[20px]', on ? 'text-white' : 'text-primary-ink bg-[var(--lavender)]')} style={on ? { background: 'var(--grad-primary)' } : undefined}>{LETTERS[i]}</span>
                    <div className="flex-1 text-center font-display font-extrabold text-[22px] text-ink leading-tight">{option.label}</div>
                    {on ? <motion.span className="shrink-0 w-[30px] h-[30px] rounded-full grid place-items-center text-white" style={{ background: 'var(--grad-primary)' }} initial={{ scale: 0 }} animate={{ scale: 1 }}><Check size={18} strokeWidth={3.5} /></motion.span> : <span className="radio shrink-0" />}
                  </Card></Item>
                )
              })}
        </Stack>
        {authoredQuestions && submitted && <p className="mx-auto mt-3 max-w-[720px] text-center text-[15px] font-bold text-ink-2">{q.explanation || q.feedback_correct}</p>}
      </Panel>
      <motion.div className="absolute left-[576px] top-[748px] text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Button arrow className="w-[520px] h-[66px] uppercase text-[21px]" disabled={(!authoredQuestions && !apiQuestion) || (pick == null && secs > 0 && !submitted)} sound="whoosh" onClick={submit}>{!authoredQuestions && !apiQuestion ? 'Loading API Question…' : secs === 0 ? `Finish ${mode === 'challenge' ? 'Challenge' : 'Test'}` : submitted ? (qi + 1 >= QUESTIONS.length ? `Finish ${mode === 'challenge' ? 'Challenge' : 'Test'}` : 'Next Question') : 'Check Answer'}</Button>
        <p className="mt-2 text-[13px] font-extrabold text-ink-2">{pick == null ? 'Choose one answer to continue' : submitted ? (authoredQuestions ? 'Review the explanation, then continue' : 'Answer saved — results appear after the test') : 'Ready to lock in your answer'}</p>
      </motion.div>
    </Page>
  )
}
