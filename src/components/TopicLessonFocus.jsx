import React, { useLayoutEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, ChevronUp, ClipboardCheck, Cpu, Globe2, Leaf, Lock, Pencil, Play, Sparkles } from 'lucide-react'
import Logo from './Logo.jsx'
import { StatPill, UserChip } from './TopBar.jsx'
import { WORLDS, spriteFor } from '../data/catalog.js'
import './TopicLessonFocus.css'

const subjectIcons = { maths: Sparkles, literacy: BookOpen, evs: Leaf, computer: Cpu, general: Globe2 }
const isDone = mission => ['completed', 'mastered'].includes(mission?.status)
const missionKey = (mission, index) => String(mission.mission_id ?? `concept-${index}`)
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

function ConceptArtwork({ world, title, topicTitle }) {
  const art = useRef(null)
  useLayoutEffect(() => {
    const fit = () => art.current?.style.setProperty('--art-scale', Math.min(1, art.current.clientHeight / 225))
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(art.current)
    return () => observer.disconnect()
  }, [])
  const Icon = subjectIcons[world] || BookOpen
  const shapes = world === 'maths' && /shape|spatial|position|3d|2d|object|geometry/i.test(`${topicTitle} ${title}`)
  const variant = /3d|object|solid|movement/i.test(title) ? 'solids' : /spatial|position|relation/i.test(title) ? 'space' : 'shapes'
  const planet = WORLDS.find(w => w.id === world)?.img
  return <div ref={art} className={`topic-focus__art ${shapes ? `topic-focus__art--${variant}` : 'topic-focus__art--world'}`} aria-hidden="true"><div className="topic-focus__art-stage">
    <span className="topic-focus__spark topic-focus__spark--one"><Sparkles /></span><span className="topic-focus__spark topic-focus__spark--two"><Sparkles /></span>
    <div className="topic-focus__orbit" />
    {shapes ? <div className="topic-focus__shape-scene"><span className="topic-focus__arch" /><span className="topic-focus__shape topic-focus__shape--ball" /><span className="topic-focus__shape topic-focus__shape--cube" /><span className="topic-focus__shape topic-focus__shape--triangle" /><span className="topic-focus__shape topic-focus__shape--cylinder" /></div>
      : <div className="topic-focus__subject-art">{planet ? <img src={planet} alt="" /> : <Icon size={100} strokeWidth={1.2} />}<span><Icon size={30} strokeWidth={1.8} /></span></div>}
    <div className="topic-focus__pedestal" />
  </div></div>
}

export default function TopicLessonFocus({ topic, world, grade, name, face, xp, streak, concepts, initialMissionId, hasOpened, starting, error, review, onBack, onOpen, onPractice, onTest }) {
  const [selectedKey, setSelectedKey] = useState(String(initialMissionId ?? concepts[0]?.mission_id ?? ''))
  const scroller = useRef(null)
  const slots = useRef([])
  const frame = useRef(0)
  const selectedIndexRef = useRef(0)
  const selectedIndex = Math.max(0, concepts.findIndex((mission, index) => missionKey(mission, index) === selectedKey))
  const selected = concepts[selectedIndex]
  selectedIndexRef.current = selectedIndex
  const signature = concepts.map(missionKey).join('|')
  const completed = concepts.filter(isDone).length
  const Icon = subjectIcons[world] || BookOpen
  const action = isDone(selected) ? 'Practise again' : hasOpened(selected) ? 'Continue concept' : "Let’s start"
  const canOpen = selected && (selected.startable || !review && selected.status === 'locked')

  function centerConcept(index, smooth = true) {
    const track = scroller.current, slot = slots.current[index]
    if (!track || !slot) return
    track.scrollTo({ top: slot.offsetTop + slot.offsetHeight / 2 - track.clientHeight / 2, behavior: smooth && !reducedMotion() ? 'smooth' : 'instant' })
  }
  function syncFocus() {
    const track = scroller.current
    if (!track || !concepts.length) return
    const center = track.scrollTop + track.clientHeight / 2
    let closest = 0, distance = Infinity
    slots.current.slice(0, concepts.length).forEach((slot, index) => {
      if (!slot) return
      const delta = Math.abs(slot.offsetTop + slot.offsetHeight / 2 - center)
      slot.firstElementChild.style.setProperty('--lesson-focus', Math.max(0, 1 - delta / (track.clientHeight * .58)).toFixed(3))
      if (delta < distance) { distance = delta; closest = index }
    })
    setSelectedKey(missionKey(concepts[closest], closest))
  }
  function onScroll() {
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(syncFocus)
  }
  useLayoutEffect(() => {
    const track = scroller.current
    if (!track || !concepts.length) return
    const align = () => {
      track.style.setProperty('--track-height', `${track.clientHeight}px`)
      track.style.setProperty('--first-half', `${(slots.current[0]?.offsetHeight || 148) / 2}px`)
      track.style.setProperty('--last-half', `${(slots.current[concepts.length - 1]?.offsetHeight || 148) / 2}px`)
      centerConcept(selectedIndexRef.current, false)
      syncFocus()
    }
    align()
    const observer = new ResizeObserver(align)
    observer.observe(track)
    slots.current.slice(0, concepts.length).forEach(slot => slot && observer.observe(slot))
    return () => { observer.disconnect(); cancelAnimationFrame(frame.current) }
  }, [signature])
  function onKeyDown(event, index) {
    const target = { ArrowDown: Math.min(concepts.length - 1, index + 1), ArrowUp: Math.max(0, index - 1), Home: 0, End: concepts.length - 1 }[event.key]
    if (target === undefined) return
    event.preventDefault()
    slots.current[target]?.firstElementChild.focus({ preventScroll: true })
    centerConcept(target)
  }

  return <div className="topic-focus">
    <div className="topic-focus__sky" aria-hidden="true" />
    <header className="topic-focus__header"><Logo /><div className="topic-focus__account"><div className="topic-focus__stats"><StatPill kind="streak" value={streak} label="Day streak" /><StatPill kind="xp" value={Number(xp).toLocaleString()} label="Nova XP" /></div><UserChip name={name} face={face} sub={grade} /></div></header>
    <main className="topic-focus__main">
      <div className="topic-focus__breadcrumb"><button type="button" onClick={onBack}><ArrowLeft size={18} /> Back</button><span className="topic-focus__crumb-divider" /><span><Icon size={16} /> {topic.subject}</span><span> / </span><span>{grade}</span></div>
      <div className="topic-focus__intro"><div><p className="topic-focus__eyebrow">A little discovery. A big adventure.</p><h1>{topic.title}</h1><p className="topic-focus__description">{topic.desc}</p></div>
        {concepts.length > 0 && <div className="topic-focus__progress"><span style={{ '--progress': `${completed / concepts.length * 100}%` }} /><div><strong>{completed} / {concepts.length}</strong><small>concepts complete</small></div></div>}
      </div>
      <div className="topic-focus__layout">
        <section className="topic-focus__path" aria-labelledby="topic-path-heading">
          <div className="topic-focus__path-header"><h2 id="topic-path-heading">Your learning path</h2><span>{concepts.length ? `Concept ${selectedIndex + 1} of ${concepts.length}` : 'No concepts yet'}</span></div>
          {concepts.length ? <><p className="topic-focus__hint">Scroll to explore. Choose your next discovery.</p>
            <div ref={scroller} className="topic-focus__scroller" onScroll={onScroll} aria-label="Choose a concept">
              {concepts.map((mission, index) => <div className="topic-focus__slot" key={missionKey(mission, index)} ref={el => { slots.current[index] = el }}>
                <button type="button" className="topic-focus__lesson" aria-current={index === selectedIndex ? 'true' : undefined} aria-controls="focused-lesson"
                  aria-label={`Focus concept ${index + 1}: ${mission.name}. ${mission.displayLabel}`} onClick={() => centerConcept(index)} onFocus={() => centerConcept(index)} onKeyDown={event => onKeyDown(event, index)}>
                  <span className={`topic-focus__number${isDone(mission) ? ' is-done' : ''}`}>{isDone(mission) ? <Check size={25} strokeWidth={3} /> : String(index + 1).padStart(2, '0')}</span>
                  <span className="topic-focus__lesson-copy"><small className="topic-focus__in-focus">{index === selectedIndex ? 'In focus' : `Concept ${index + 1}`}</small><strong>{mission.name}</strong><small>{mission.displayLabel}</small></span>
                  <span className="topic-focus__lesson-marker">{mission.displayState === 'locked' ? <Lock size={18} /> : <ArrowRight size={20} />}</span>
                </button>
              </div>)}
            </div>
            <div className="topic-focus__scroll-controls"><button type="button" aria-label="Previous concept" disabled={selectedIndex === 0} onClick={() => centerConcept(selectedIndex - 1)}><ChevronUp size={21} /></button><span>Find your next adventure</span><button type="button" aria-label="Next concept" disabled={selectedIndex === concepts.length - 1} onClick={() => centerConcept(selectedIndex + 1)}><ChevronDown size={21} /></button></div>
          </> : <div className="topic-focus__empty"><BookOpen size={42} /><h3>More discoveries are on the way</h3><p>No concepts are available for this topic yet.</p><button type="button" onClick={onBack}>Explore other topics <ArrowRight size={18} /></button></div>}
        </section>
        <section id="focused-lesson" className="topic-focus__preview" aria-label="Selected concept">
          {selected ? <><div className="topic-focus__preview-heading"><span className="topic-focus__eyebrow"><Sparkles size={14} /> Your next discovery</span><span className={`topic-focus__status${isDone(selected) ? ' is-done' : ''}`}>{isDone(selected) && <Check size={13} />}{selected.displayLabel}</span></div>
            <div className="topic-focus__preview-copy" aria-live="polite" aria-atomic="true"><h2>{selected.name}</h2><p>{selected.description || `Explore ${selected.name.toLowerCase()} with Nova, then practise what you learn.`}</p></div>
            <ConceptArtwork world={world} title={selected.name} topicTitle={topic.title} />
            <div className="topic-focus__coach"><div className="topic-focus__companions"><img src={spriteFor('explorer', face)} alt="" /><img src="/art/chars/topic-1.webp" alt="" /></div><div><strong>You + Nova. Let’s discover!</strong><p>One concept, one new superpower.</p></div><Sparkles size={21} /></div>
            {error && <p className="topic-focus__error" role="alert">{error}</p>}
            <button type="button" className="topic-focus__start" disabled={starting || !canOpen} onClick={() => onOpen(selected)}><span><Play size={18} fill="currentColor" /></span>{starting ? 'Starting…' : canOpen ? action : selected.displayLabel}<ArrowRight size={24} /></button>
          </> : <div className="topic-focus__waiting"><img src="/art/chars/topic-1.webp" alt="Nova, your learning buddy" /><h2>Ready when you are!</h2><p>Your concepts will appear here when they are available.</p></div>}
          <div className="topic-focus__secondary"><button type="button" disabled={!onPractice || starting} onClick={onPractice}><Pencil size={18} /> Practise</button><button type="button" onClick={onTest}><ClipboardCheck size={18} /> Take test</button></div>
        </section>
      </div>
    </main>
  </div>
}
