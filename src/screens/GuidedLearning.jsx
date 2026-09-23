import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Check, ChevronLeft, ChevronRight, Lightbulb, RefreshCw, Volume2 } from 'lucide-react'
import Page from '../components/Page.jsx'
import Scene from '../components/Scene.jsx'
import { discoverContent, routeSubject, useRouteContent, withSubject } from '../content/index.js'
import { explanationWays } from '../content/explanation-ways.js'
import { sfx } from '../lib/sound.js'
import { speak } from '../lib/voice.js'
import './GuidedLearning.css'

const STEP_NAMES = ['Understand', 'See an example', 'Remember']

function splitPages(value, max = 220) {
  const words = String(value || '').trim().split(/\s+/).filter(Boolean)
  if (!words.length) return ['']
  const pages = []
  let page = ''
  for (const word of words) {
    if (page && `${page} ${word}`.length > max) { pages.push(page); page = word }
    else page += `${page ? ' ' : ''}${word}`
  }
  if (page) pages.push(page)
  return pages
}

function toMini(raw, fallback) {
  const source = raw || fallback || {}
  const options = (Array.isArray(source.options) ? source.options : []).map((item, index) => typeof item === 'object'
    ? { key: String(item.key ?? `option_${index + 1}`), label: String(item.label ?? item.text ?? '') }
    : { key: `option_${index + 1}`, label: String(item) })
  const rawAnswer = source.answer ?? source.correct_answer ?? source.correctAnswer
  const answer = options.find(item => item.key === String(rawAnswer) || item.label.toLowerCase() === String(rawAnswer ?? '').toLowerCase())?.key
  return { question: source.question ?? source.instruction ?? 'Choose the best answer.', options, answer, explanation: source.explanation ?? 'That is the key idea.' }
}

function lessonSteps(pkg) {
  const content = discoverContent(pkg)
  const learning = pkg.studio?.learning_content ?? {}
  const authored = pkg.learn_before_test?.steps ?? pkg.studio?.learn_before_test?.steps ?? []
  const checks = pkg.assessments?.check_for_understanding?.length ? pkg.assessments.check_for_understanding : pkg.check.questions
  const fallbacks = [
    { title: pkg.mission.title, teaching_text: learning.teaching_method || content.model.caption, key_idea: pkg.learning_objective, nova_script: content.nova.speech },
    { title: 'See the idea in action', teaching_text: learning.explanation || content.prompt.statement, key_idea: learning.explanation || pkg.learning_objective, nova_script: learning.explanation || content.nova.speech },
    { title: 'Keep the big idea', teaching_text: learning.hints?.[2] || pkg.learning_objective, key_idea: learning.hints?.[2] || pkg.learning_objective, nova_script: learning.nova_feedback || content.nova.speech },
  ]
  return fallbacks.map((fallback, index) => {
    const key = ['understand', 'example', 'remember'][index]
    const step = authored.find(item => item.step_key === key) ?? authored[index] ?? {}
    return {
      title: step.title || fallback.title,
      body: step.teaching_text || fallback.teaching_text,
      key: step.key_idea || fallback.key_idea,
      speech: step.nova_script || fallback.nova_script,
      image: step.step_key ? (step.image_url || null) : (index === 0 ? content.model.image : null),
      imageAlt: step.image_alt || step.image_prompt || content.model.alt || `${STEP_NAMES[index]} illustration`,
      alternate_teaching_text: step.alternate_teaching_text || '',
      explanation_ways: step.explanation_ways,
      mini: toMini(step.mini_question, checks[index % Math.max(checks.length, 1)]),
    }
  })
}

function StepMedia({ step, index }) {
  const [failed, setFailed] = useState(false)
  if (!step.image) return null
  return failed
    ? <div className="kv-learning__text-visual" role="status"><BookOpen size={30} /><span>Image unavailable</span><small>Check the image URL for this CMS step.</small></div>
    : <figure className="kv-learning__media"><img src={step.image} alt={step.imageAlt || `${STEP_NAMES[index]} lesson illustration`} onError={() => setFailed(true)} /></figure>
}

export default function GuidedLearning() {
  const nav = useNavigate()
  const pkg = useRouteContent()
  const steps = lessonSteps(pkg)
  const [stepIndex, setStepIndex] = useState(0)
  const [pageIndex, setPageIndex] = useState(0)
  const [wayIndex, setWayIndex] = useState(0)
  const [picks, setPicks] = useState({})
  const step = steps[stepIndex]
  const ways = stepIndex === 1 ? explanationWays(step) : []
  const currentWay = stepIndex === 1 ? ways[Math.min(wayIndex, ways.length - 1)] : null
  const currentBody = currentWay?.body || step.body
  const currentSpeech = currentWay?.speech || step.speech
  const currentKey = currentWay?.key || step.key
  const mediaStep = stepIndex === 1 ? { ...step, image: currentWay?.image || null, imageAlt: currentWay?.imageAlt || step.imageAlt } : step
  const pages = splitPages(currentBody)
  const page = Math.min(pageIndex, pages.length - 1)
  const mini = currentWay?.mini ? toMini(currentWay.mini, step.mini) : step.mini
  const pickKey = `${stepIndex}:${stepIndex === 1 ? wayIndex : 0}`
  const pick = picks[pickKey]
  const correct = !!mini.answer && pick === mini.answer
  const canAdvance = page < pages.length - 1 || correct

  const previous = () => {
    sfx.tap()
    if (page > 0) setPageIndex(page - 1)
    else if (stepIndex > 0) { setStepIndex(stepIndex - 1); setPageIndex(0); setWayIndex(0) }
    else nav(`/learn/topics/${routeSubject()}`)
  }
  const next = () => {
    if (page < pages.length - 1) { setPageIndex(page + 1); sfx.tap(); return }
    if (!correct) return
    sfx.whoosh()
    if (stepIndex === 2) nav(withSubject('/missions/fractions/spot-mistake'))
    else { setStepIndex(stepIndex + 1); setPageIndex(0); setWayIndex(0) }
  }

  return <Page>
    <Scene name="learn" />
    <main className="kv-learning">
      <nav className="kv-learning__progress" aria-label="Learning steps">{STEP_NAMES.map((name, index) => <div className={`kv-learning__milestone ${index === stepIndex ? 'is-current' : ''} ${index < stepIndex ? 'is-done' : ''}`} key={name}><span>{index < stepIndex ? <Check size={21} /> : index + 1}</span><div><strong>{name}</strong><small>{['Learn the idea', 'Watch it happen', 'Keep it in mind'][index]}</small></div></div>)}</nav>

      <section className={`kv-learning__canvas kv-learning__canvas--${stepIndex}`} aria-label={`${STEP_NAMES[stepIndex]} lesson`}>
        <div className="kv-learning__canvas-head"><span className="kv-learning__eyebrow">{STEP_NAMES[stepIndex]} · {stepIndex + 1} of 3</span>{pages.length > 1 && <span className="kv-learning__page-count">Page {page + 1} / {pages.length}</span>}</div>
        <div className="kv-learning__title-row"><h1>{step.title}</h1><button type="button" onClick={() => speak(`${step.title}. ${currentBody}`)} aria-label="Hear lesson"><Volume2 size={24} /></button></div>
        <div className={`kv-learning__media-row ${mediaStep.image ? '' : 'kv-learning__media-row--text-only'}`}>
          <div className="kv-learning__written">
            <div className="kv-learning__teaching"><span>{stepIndex === 0 ? 'Understand the idea' : stepIndex === 1 ? `${currentWay.label} · Way ${wayIndex + 1} of ${ways.length}` : 'Remember the rule'}</span><p className="kv-learning__body" aria-live={stepIndex === 1 ? 'polite' : undefined}>{pages[page]}</p></div>
            <div className="kv-learning__idea"><Lightbulb size={28} /><div><small>{stepIndex === 2 ? 'Take this into the quiz' : 'The big idea'}</small><strong>{currentKey}</strong></div></div>
          </div>
          <StepMedia key={`${stepIndex}:${mediaStep.image}`} step={mediaStep} index={stepIndex} />
        </div>
        {stepIndex === 1 && ways.length > 1 && <button type="button" className="kv-learning__alternate" onClick={() => { setWayIndex(index => (index + 1) % ways.length); setPageIndex(0); sfx.tap() }}><RefreshCw size={18} />Try another way</button>}
        {pages.length > 1 && page < pages.length - 1 && <button type="button" className="kv-learning__more" onClick={() => setPageIndex(page + 1)}>Continue reading <ChevronRight size={18} /></button>}
      </section>

      <aside className="kv-learning__nova" aria-label="Nova explains"><button type="button" className="kv-learning__speech" onClick={() => speak(currentSpeech)}><span><strong>Nova says</strong><Volume2 size={20} /></span><p>{currentSpeech}</p></button><img src="/art/hd/nova-guide.webp" alt="Nova, your learning buddy" /></aside>

      <section className="kv-learning__quiz" aria-label="Tiny check question"><div className="kv-learning__quiz-heading"><span>?</span><div><small>Try it yourself</small><h2>{mini.question}</h2></div></div><div className="kv-learning__answers" style={{ '--answer-count': Math.min(Math.max(mini.options.length, 2), 5) }}>{mini.options.map((option, index) => <button type="button" key={option.key} className={`${pick === option.key ? (correct ? 'is-correct' : 'is-wrong') : ''}`} onClick={() => { setPicks(previousPicks => ({ ...previousPicks, [pickKey]: option.key })); option.key === mini.answer ? sfx.success() : sfx.wrong() }}><span>{String.fromCharCode(65 + index)}</span>{option.label}</button>)}</div><p className={`kv-learning__feedback ${correct ? 'is-correct' : ''}`}>{pick == null ? 'Choose one answer to continue.' : correct ? mini.explanation : 'Not quite. Look at the lesson and try again.'}</p></section>

      <footer className="kv-learning__footer"><button type="button" className="kv-learning__previous" onClick={previous}><ChevronLeft size={22} />Previous</button><button type="button" className="kv-learning__next" disabled={!canAdvance} onClick={next}>{page < pages.length - 1 ? 'Continue' : stepIndex === 2 ? 'Start quiz' : `Next: ${STEP_NAMES[stepIndex + 1]}`}<ChevronRight size={22} /></button></footer>
    </main>
  </Page>
}
