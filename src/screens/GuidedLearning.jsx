import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Check, ChevronLeft, ChevronRight, Lightbulb, RefreshCw, Volume2 } from 'lucide-react'
import Page from '../components/Page.jsx'
import Scene from '../components/Scene.jsx'
import { routeSubject, useRouteContent, withSubject } from '../content/index.js'
import { learningSteps, learningMini } from '../content/learning-steps.js'
import { explanationWays } from '../content/explanation-ways.js'
import { sfx } from '../lib/sound.js'
import { speak } from '../lib/voice.js'
import './GuidedLearning.css'
import ContentStatus from '../components/ContentStatus.jsx'
import { API_MODE } from '../lib/api.js'


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

function StepMedia({ step, index }) {
  const [failed, setFailed] = useState(false)
  if (!step.image) return null
  return failed
    ? <div className="kv-learning__text-visual" role="status"><BookOpen size={30} /><span>Image unavailable</span><small>Check the image URL for this CMS step.</small></div>
    : <figure className="kv-learning__media"><img src={step.image} alt={step.imageAlt || `${step.title || "Lesson"} illustration`} onError={() => setFailed(true)} /></figure>
}

export default function GuidedLearning() {
  const nav = useNavigate()
  const pkg = useRouteContent()
  const steps = learningSteps(pkg)
  const [stepIndex, setStepIndex] = useState(() => import.meta.env.DEV || API_MODE==='mock' ? Math.max(0,Math.min(Math.max(steps.length - 1, 0),Number(new URLSearchParams(window.location.search).get('auditStep')) || 0)) : 0)
  const [pageIndex, setPageIndex] = useState(0)
  const [wayIndex, setWayIndex] = useState(() => import.meta.env.DEV || API_MODE==='mock' ? Math.max(0,Math.min(2,Number(new URLSearchParams(window.location.search).get('auditWay')) || 0)) : 0)
  const [picks, setPicks] = useState({})
  const heading = useRef(null)
  const activeIndex = Math.min(stepIndex, Math.max(steps.length - 1, 0))
  const step = steps[activeIndex] ?? {}
  const isExample = step.stepKey === 'example'
  const lastStep = activeIndex === steps.length - 1
  const ways = isExample ? explanationWays(step) : []
  const activeWayIndex = Math.min(wayIndex, Math.max(ways.length - 1, 0))
  const currentWay = isExample ? ways[activeWayIndex] : null
  const currentBody = currentWay?.body || step.body
  const currentSpeech = currentWay?.speech || step.speech
  const currentKey = currentWay?.key || step.key
  const mediaStep = isExample ? { ...step, image: currentWay?.image || null, imageAlt: currentWay?.imageAlt || step.imageAlt } : step
  const pages = splitPages(currentBody)
  const page = Math.min(pageIndex, pages.length - 1)
  useEffect(() => {
    if (!window.matchMedia('(max-width: 1024px)').matches || !heading.current) return
    heading.current.closest('.stage-root')?.scrollTo({ top: 0 })
    heading.current.focus({ preventScroll: true })
  }, [activeIndex, page, activeWayIndex])
  const mini = currentWay ? learningMini(currentWay.mini) : step.mini
  useEffect(() => {
    const query = new URLSearchParams(window.location.search)
    const previewIndex = name => import.meta.env.DEV || API_MODE === 'mock' ? Math.max(0, Math.floor(Number(query.get(name)) || 0)) : 0
    setStepIndex(Math.min(previewIndex('auditStep'), Math.max(steps.length - 1, 0)))
    setPageIndex(0); setWayIndex(previewIndex('auditWay')); setPicks({})
  }, [pkg.apiMissionId, pkg.content_version])
  const pickKey = `${stepIndex}:${isExample ? activeWayIndex : 0}`
  const pick = picks[pickKey]
  const correct = !!mini?.answer && pick === mini.answer
  const canAdvance = page < pages.length - 1 || !mini || correct

  const previous = () => {
    sfx.tap()
    if (page > 0) setPageIndex(page - 1)
    else if (stepIndex > 0) { setStepIndex(stepIndex - 1); setPageIndex(0); setWayIndex(0) }
    else nav(`/learn/topics/${routeSubject()}`)
  }
  const next = () => {
    if (page < pages.length - 1) { setPageIndex(page + 1); sfx.tap(); return }
    if (mini && !correct) return
    sfx.whoosh()
    if (lastStep) nav(withSubject('/missions/fractions/spot-mistake'))
    else { setStepIndex(stepIndex + 1); setPageIndex(0); setWayIndex(0) }
  }

  if (pkg.contentLoading || pkg.contentError || !steps.length || (mini && (!mini.question || !mini.options.length || !mini.answer))) return <ContentStatus pkg={pkg} />
  return <Page className="kv-learning-screen">
      {pkg.contentSource==='api-preview'&&<div className="absolute left-1/2 top-[8px] z-[100] -translate-x-1/2 rounded-full bg-white px-5 py-2 text-[15px] font-bold text-indigo-800 shadow">Live API questions · Read-only local preview</div>}
    <Scene name="learn" />
    <main className="kv-learning">
      <nav className="kv-learning__progress" style={{gridTemplateColumns:`repeat(${steps.length}, minmax(0, 1fr))`}} aria-label="Learning steps">{steps.map((item, index) => <div className={`kv-learning__milestone ${index === stepIndex ? 'is-current' : ''} ${index < stepIndex ? 'is-done' : ''}`} key={item.id}><span>{index < stepIndex ? <Check size={21} /> : index + 1}</span><div><strong>{item.label}</strong><small>{item.title}</small></div></div>)}</nav>

      <section className={`kv-learning__canvas kv-learning__canvas--${stepIndex}`} aria-label={`${step.label} lesson`}>
        <div className="kv-learning__canvas-head"><span className="kv-learning__eyebrow">{step.label} · {activeIndex + 1} of {steps.length}</span>{pages.length > 1 && <span className="kv-learning__page-count">Page {page + 1} / {pages.length}</span>}</div>
        <div className="kv-learning__title-row"><h1 ref={heading} tabIndex={-1}>{step.title}</h1><button type="button" onClick={() => speak(`${step.title}. ${currentBody}`)} aria-label="Hear lesson"><Volume2 size={24} /></button></div>
        <div className={`kv-learning__media-row ${mediaStep.image ? '' : 'kv-learning__media-row--text-only'}`}>
          <div className="kv-learning__written">
            <div className="kv-learning__teaching"><span>{isExample ? `${currentWay.label} · Way ${activeWayIndex + 1} of ${ways.length}` : step.label}</span><p className="kv-learning__body" aria-live={isExample ? 'polite' : undefined}>{pages[page]}</p></div>
            <div className="kv-learning__idea"><Lightbulb size={28} /><div><small>{lastStep ? 'Take this into the quiz' : 'The big idea'}</small><strong>{currentKey}</strong></div></div>
          </div>
          <StepMedia key={`${stepIndex}:${mediaStep.image}`} step={mediaStep} index={stepIndex} />
        </div>
        {isExample && ways.length > 1 && <button type="button" className="kv-learning__alternate" onClick={() => { setWayIndex((activeWayIndex + 1) % ways.length); setPageIndex(0); sfx.tap() }}><RefreshCw size={18} />Try another way</button>}
        {pages.length > 1 && page < pages.length - 1 && <button type="button" className="kv-learning__more" onClick={() => setPageIndex(page + 1)}>Continue reading <ChevronRight size={18} /></button>}
      </section>

      <aside className="kv-learning__nova" aria-label="Nova explains"><button type="button" className="kv-learning__speech" onClick={() => speak(currentSpeech)}><span><strong>Nova says</strong><Volume2 size={20} /></span><p>{currentSpeech}</p></button><img src="/art/hd/nova-guide.webp" alt="Nova, your learning buddy" /></aside>

      {mini && <section className="kv-learning__quiz" aria-label="Tiny check question"><div className="kv-learning__quiz-heading"><span>?</span><div><small>Try it yourself</small><h2>{mini.question}</h2></div></div><div className="kv-learning__answers" style={{ '--answer-count': Math.min(Math.max(mini.options.length, 2), 5) }}>{mini.options.map((option, index) => <button type="button" key={option.key} className={`${pick === option.key ? (correct ? 'is-correct' : 'is-wrong') : ''}`} onClick={() => { setPicks(previousPicks => ({ ...previousPicks, [pickKey]: option.key })); option.key === mini.answer ? sfx.success() : sfx.wrong() }}><span>{String.fromCharCode(65 + index)}</span>{option.label}</button>)}</div><p className={`kv-learning__feedback ${correct ? 'is-correct' : ''}`}>{pick == null ? 'Choose one answer to continue.' : correct ? mini.explanation : 'Not quite. Look at the lesson and try again.'}</p></section>}

      <footer className="kv-learning__footer"><button type="button" className="kv-learning__previous" onClick={previous}><ChevronLeft size={22} />Previous</button><button type="button" className="kv-learning__next" disabled={!canAdvance} onClick={next}>{page < pages.length - 1 ? 'Continue' : lastStep ? 'Start quiz' : `Next: ${steps[activeIndex + 1]?.label}`}<ChevronRight size={22} /></button></footer>
    </main>
  </Page>
}
