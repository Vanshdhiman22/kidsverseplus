import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from 'motion/react'
import { ArrowLeft, ArrowRight, Check, ChevronDown, Cloud, Lock, MapPin, Play, Power, Rocket } from 'lucide-react'
import { journeyCloud, TOPICS_PER_CLOUD } from '../lib/journey-clouds.js'
import { CLOUD_PLATFORMS, cloudJourneyRoute } from '../lib/journey-cloud-route.js'
import { currentJourneyStation } from '../lib/journey-route.js'
import { nextJourneyStop } from '../lib/journey-auto-travel.js'
import { charByFace } from '../data/poses.js'
import { sfx } from '../lib/sound.js'
import './JourneyCloudMap.css'

const COLORS = ['#23bafa', '#ffc72a', '#e347ee', '#68dc2b', '#fb466d', '#24d6ed', '#b654ee', '#ffbb27', '#ed4fe7', '#ffd02f']
const NO_ADVANCES = []

function TopicStation({ station, index, current, travelling, onVisit }) {
  const point = CLOUD_PLATFORMS[index]
  return <button type="button" className={`journey-cloud__station ${station.available ? 'is-available' : 'is-future'} ${current ? 'is-current' : ''}`}
    style={{ left: point.x - 105, top: point.y - 135, '--station-color': COLORS[index] }}
    disabled={!station.available} aria-current={current ? 'location' : undefined}
    aria-label={`${station.available ? 'Open' : 'Coming soon:'} topic ${station.number}: ${station.name}${station.completed ? ', completed' : ''}`}
    title={station.available ? station.name : 'This topic will appear when its lessons are ready.'} onClick={() => onVisit(index)}>
    <span className="journey-cloud__number" aria-hidden="true">{station.number}</span>
    {station.art ? <span className={`journey-cloud__topic-art art-${station.art}`} aria-hidden="true" />
      : <span className="journey-cloud__future-art" aria-hidden="true"><Cloud size={40} /><Lock size={16} /></span>}
    <span className="journey-cloud__station-label">{station.completed && <Check size={16} aria-hidden="true" />}<span>{station.name}</span>{station.available && !station.completed && <ArrowRight size={14} aria-hidden="true" />}</span>
    {current && travelling && <span className="sr-only">Driving to this topic</span>}
  </button>
}

function JourneyCar({ road, initialIndex, trip, face, engineEffects, onArrive, onVisit }) {
  const controls = useAnimationControls()
  const reduced = useReducedMotion()
  const displayFace = charByFace(face).face
  const initialStop = useRef(road.stops[initialIndex] ?? road.stops[0]).current
  useEffect(() => {
    if (!trip) return
    let active = true
    const destination = trip.gate ? 100 : road.stops[trip.index]
    const duration = reduced ? 0 : Math.min(3.2, Math.max(.8, Math.abs(destination - road.stops[trip.from]) * .04))
    controls.start({ offsetDistance: `${destination}%`, transition: { duration, ease: [0.35, 0, 0.3, 1] } })
      .then(() => { if (active) onArrive(trip) })
    return () => { active = false; controls.stop() }
  }, [trip, road, reduced, controls, onArrive])
  const facingLeft = trip && !trip.gate && road.anchors[trip.index].x < road.anchors[trip.from].x
  return <motion.button type="button" className={`journey-cloud__car ${engineEffects ? 'is-engine-on' : ''} ${trip ? 'is-driving' : ''}`} aria-label="Open lessons at your car's current topic"
    style={{ offsetPath: `path("${road.path}")`, offsetRotate: '0deg', offsetAnchor: '50% 90%' }}
    initial={{ offsetDistance: `${initialStop}%` }} animate={controls} onClick={onVisit}>
    <span className="journey-cloud__you"><MapPin size={19} fill="currentColor" aria-hidden="true" />{trip ? 'On the way' : 'You are here'}</span>
    <span className="journey-cloud__vehicle-direction" style={{ transform: facingLeft ? 'scaleX(-1)' : undefined }}>
      <span className="journey-cloud__exhaust" aria-hidden="true">{[0, 1, 2, 3].map(puff => <i key={puff} style={{ '--puff': puff }} />)}</span>
      <span className="journey-cloud__engine-body"><img src={displayFace === 4 ? '/art/chars/journey-girl-02.webp' : '/art/chars/journey-0.webp'} width="146" height="142" alt="" draggable={false} /></span>
    </span>
  </motion.button>
}

function CloudContents({ cloud, road, face, seen, advanced, autoTravel, engineEffects, onVisit, onPark, onAutoAdvance, onChangePhase, registerStart }) {
  const available = cloud.stations.filter(station => station.available)
  const remembered = seen - cloud.offset
  const first = currentJourneyStation(available)
  const [parked, setParked] = useState(remembered >= 0 && remembered < available.length ? remembered : first)
  const [trip, setTrip] = useState(null)
  const activeTrip = useRef(null), sequence = useRef(0)
  const interacted = useRef(false)
  const latest = useRef({ cloud, onVisit, onPark, onAutoAdvance, onChangePhase })
  latest.current = { cloud, onVisit, onPark, onAutoAdvance, onChangePhase }
  const selected = trip?.index ?? parked
  const visit = index => {
    const station = cloud.stations[index]
    if (!station?.available || (trip?.index === index && !trip.gate)) return
    interacted.current = true
    sfx.select()
    if (parked === index && !trip) return onVisit(station, station.index)
    const id = ++sequence.current
    activeTrip.current = id
    setTrip({ id, index, from: parked })
  }
  const nextCloud = () => {
    if (!cloud.canGoNext || trip?.gate) return
    interacted.current = true
    sfx.select()
    const id = ++sequence.current
    activeTrip.current = id
    setTrip({ id, index: 9, from: parked, gate: true })
  }
  const arrive = useCallback(completedTrip => {
    if (completedTrip.id !== activeTrip.current) return
    activeTrip.current = null
    const current = latest.current
    if (completedTrip.gate) {
      if (completedTrip.automatic) current.onAutoAdvance(completedTrip.sourceId, current.cloud.offset + TOPICS_PER_CLOUD)
      else current.onPark(current.cloud.offset + TOPICS_PER_CLOUD)
      current.onChangePhase(current.cloud.phase + 1)
    } else {
      const station = current.cloud.stations[completedTrip.index]
      if (station?.available) {
        if (completedTrip.automatic) current.onAutoAdvance(completedTrip.sourceId, station.index)
        else current.onVisit(station, station.index)
      }
    }
    setParked(completedTrip.index)
    setTrip(null)
  }, [])
  useEffect(() => {
    if (!autoTravel || trip || interacted.current) return
    const next = nextJourneyStop(cloud, parked, advanced)
    if (!next) return
    // Let the completion state become visible before setting off. Manual input wins.
    const timer = setTimeout(() => {
      if (interacted.current) return
      const id = ++sequence.current
      activeTrip.current = id
      setTrip({ ...next, id, from: parked, automatic: true })
    }, 500)
    return () => clearTimeout(timer)
  }, [cloud, parked, advanced, autoTravel, trip])
  useEffect(() => {
    registerStart.current = () => cloud.canGoNext ? nextCloud() : visit(selected)
    return () => { registerStart.current = null }
  })
  return <>
    {cloud.stations.map((station, index) => <TopicStation key={station.number} station={station} index={index}
      current={available.length > 0 && selected === index} travelling={Boolean(trip)} onVisit={visit} />)}
    {available.length > 0 && <JourneyCar road={road} initialIndex={parked} trip={trip} face={face} engineEffects={engineEffects} onArrive={arrive} onVisit={() => visit(selected)} />}
    <button type="button" className={`journey-cloud__gate ${cloud.canGoNext ? 'is-open' : ''}`} disabled={!cloud.canGoNext}
      aria-label={`Phase ${cloud.phase + 1}. ${cloud.canGoNext ? 'Drive to the next cloud' : 'Complete all 10 topics to unlock'}`} onClick={nextCloud}>
      <strong>Phase {cloud.phase + 1}</strong><span>{cloud.canGoNext ? <>Next cloud is ready <ArrowRight size={18} /></> : <>Complete all 10<br />to unlock</>}</span>
    </button>
    {trip && <span className="journey-cloud__announcement" role="status">{trip.gate ? `Driving to Phase ${cloud.phase + 1}` : `Driving to ${cloud.stations[trip.index].name}`}</span>}
  </>
}

export default function JourneyCloudMap({ worlds = [], name, face, subject, subjectName, previewOnly = false, choices = [], seen, advanced = NO_ADVANCES, loading, error, checkingProgress,
  onVisit, onPark, onAutoAdvance, onSubject, onBack }) {
  const [requestedPhase, setRequestedPhase] = useState(Math.floor((Number(seen) || 0) / TOPICS_PER_CLOUD) + 1)
  const [autoTravel, setAutoTravel] = useState(true)
  const [engineEffects, setEngineEffects] = useState(true)
  const cloud = journeyCloud(worlds, requestedPhase, subject)
  const road = useMemo(() => cloudJourneyRoute(), [])
  const startAction = useRef(null)
  const reduced = useReducedMotion()
  return <>
    <div className="journey-cloud__wings" aria-hidden="true" />
    <div className="journey-cloud__viewport" role="region" aria-label="Journey map. Scroll to explore all 10 topics" tabIndex={0}>
    <div className="journey-cloud__canvas">
    <img className="journey-cloud__background" src="/art/journey/cloud-world.webp" width="1672" height="941" alt="" fetchpriority="high" draggable={false} />
    <AnimatePresence mode="wait" initial={false}>
      <motion.div className="journey-cloud__map" key={cloud.phase} initial={{ opacity: 0, x: reduced ? 0 : 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: reduced ? 0 : -24 }} transition={{ duration: reduced ? 0 : .3 }}>
        <CloudContents key={cloud.stations.map(station => station.id || '_').join(':')} cloud={cloud} road={road} face={face} seen={seen}
          advanced={advanced} autoTravel={autoTravel} engineEffects={engineEffects} onVisit={onVisit} onPark={onPark} onAutoAdvance={onAutoAdvance}
          onChangePhase={phase => { setAutoTravel(true); setRequestedPhase(phase) }} registerStart={startAction} />
      </motion.div>
    </AnimatePresence>
    </div>
    </div>
    <p className="journey-cloud__scroll-hint">Swipe across the map to explore all 10 topics.</p>
    <aside className="journey-cloud__sidebar" aria-label="Journey details">
      <a href="/home" className="journey-cloud__brand" onClick={event => { event.preventDefault(); onBack() }} aria-label="Kidsverse home">
        <span className="journey-cloud__logo" aria-hidden="true"><span /></span>
        <strong>Kidsverse<span>+</span></strong><small>LEARN · GROW · ACHIEVE</small>
      </a>
      <div className="journey-cloud__intro"><h1>My Journey</h1><p title={`${name} + Nova`}>{name} + Nova</p></div>
      <label className="journey-cloud__subject"><Rocket size={26} aria-hidden="true" /><span className="sr-only">Choose subject</span>
        <select value={subject} onChange={event => onSubject(event.target.value)} disabled={choices.length < 2} aria-label="Choose subject" title={subjectName}
          style={{ fontSize: (subjectName?.length || 0) > 13 ? 19 : 24 }}>
          {choices.length ? choices.map(choice => <option key={choice.key} value={choice.key}>{choice.name}{choice.previewOnly ? ' · Coming soon' : ''}</option>) : <option value="">Mathematics</option>}
        </select>{choices.length > 1 && <ChevronDown size={18} aria-hidden="true" />}
      </label>
      <div className="journey-cloud__phase"><span><Cloud size={32} fill="currentColor" aria-hidden="true" /></span><div><strong>Phase {cloud.phase}</strong><small>10 topics</small></div></div>
      <div className="journey-cloud__progress" role="status" aria-live="polite"><span className="journey-cloud__ring" style={{ '--progress': `${cloud.completed * 10}%` }} aria-hidden="true" /><span><b>{cloud.completed} / 10</b> complete</span></div>
      <button type="button" className="journey-cloud__start" disabled={loading || Boolean(error) || !cloud.available}
        onClick={() => startAction.current?.()}><span><Play size={21} fill="currentColor" aria-hidden="true" /></span>{cloud.canGoNext ? 'Next cloud' : 'Start journey'}<ArrowRight size={25} aria-hidden="true" /></button>
      <p className="journey-cloud__availability" role={error ? 'alert' : 'status'}>{loading ? 'Finding your learning path…' : error || (previewOnly ? `${subjectName || 'This subject'} lessons are coming soon. Explore this Journey as they become available.` : checkingProgress ? 'Checking your progress…' : cloud.available < 10 ? `${cloud.available} ${cloud.available === 1 ? 'topic' : 'topics'} available. More coming soon.` : 'Choose a topic and explore.')}</p>
      <div className="journey-cloud__navigation">
        <button type="button" aria-pressed={engineEffects} aria-label={engineEffects ? 'Turn engine effects off' : 'Turn engine effects on'} title={engineEffects ? 'Turn engine effects off' : 'Turn engine effects on'} onClick={() => setEngineEffects(value => !value)}><Power size={18} aria-hidden="true" /></button>
        {cloud.phase > 1 && <button type="button" onClick={() => { setAutoTravel(false); setRequestedPhase(cloud.phase - 1) }}><ArrowLeft size={17} />Previous cloud</button>}<button type="button" onClick={onBack}><ArrowLeft size={17} />Back to home</button></div>
    </aside>
  </>
}
