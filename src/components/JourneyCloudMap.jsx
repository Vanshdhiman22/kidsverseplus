import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { ArrowLeft, ArrowRight, BookOpen, Check, Cloud, Compass, Cpu, LayoutList, Leaf, Lock, Map, MapPin, Power, Shapes, Sparkles } from 'lucide-react'
import { journeyCloud, TOPICS_PER_CLOUD } from '../lib/journey-clouds.js'
import { currentJourneyStation } from '../lib/journey-route.js'
import { nextJourneyStop } from '../lib/journey-auto-travel.js'
import { sfx } from '../lib/sound.js'
import { journeyWorldTheme } from '../lib/journey-world-theme.js'
import Logo from './Logo.jsx'
import { UserChip } from './TopBar.jsx'
import { stationDistrict } from '../lib/station-district.js'
import IllustratedStationWorld from './IllustratedStationWorld.jsx'
import './JourneyCloudMap.css'
import './JourneyWorld.css'
import './StationTown.css'
import './IllustratedJourney.css'

const NO_ADVANCES = []
const WORLD_ICONS = { maths: Shapes, books: BookOpen, nature: Leaf, technology: Cpu, discovery: Compass }

function CloudContents({ cloud, seen, advanced, autoTravel, engineEffects, onVisit, onPark, onAutoAdvance, onChangePhase, registerStart, registerVisit, onFocusTopic, subject, reduced, visible, onFallback, loading, error }) {
  const available = cloud.stations.filter(station => station.available)
  const remembered = seen - cloud.offset
  const first = currentJourneyStation(available)
  const [parked, setParked] = useState(remembered >= 0 && remembered < available.length ? remembered : first)
  const [trip, setTrip] = useState(null)
  const activeTrip = useRef(null), sequence = useRef(0)
  const interacted = useRef(false)
  const identities=cloud.stations.map(station=>station.id || '_').join(':')
  useLayoutEffect(()=>{
    activeTrip.current=null;sequence.current++;interacted.current=false
    setTrip(null)
    setParked(remembered>=0&&remembered<available.length?remembered:currentJourneyStation(available))
  },[subject,cloud.offset,identities])
  const latest = useRef({ cloud, onVisit, onPark, onAutoAdvance, onChangePhase })
  latest.current = { cloud, onVisit, onPark, onAutoAdvance, onChangePhase }
  const selected = trip?.index ?? parked
  useEffect(() => { onFocusTopic(selected, Boolean(trip)) }, [selected, Boolean(trip), onFocusTopic])
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
    registerVisit.current = visit
    return () => { registerStart.current = null; registerVisit.current = null }
  })
  return <>
    <IllustratedStationWorld subject={subject} cloud={cloud} parked={parked} selected={selected} trip={trip}
      engineEffects={engineEffects} reduced={reduced} onArrive={arrive} onVisit={visit} onNextCloud={nextCloud} visible={visible} onFallback={onFallback} loading={loading} error={error} />
    {trip && <span className="sr-only" role="status">{trip.gate ? `Driving to Phase ${cloud.phase + 1}` : `Driving to ${cloud.stations[trip.index].name}`}</span>}
  </>
}

export default function JourneyCloudMap({ worlds = [], name, face, subject, subjectName, previewOnly = false, catalogReady = true, choices = [], seen, advanced = NO_ADVANCES, loading, error, checkingProgress,
  onVisit, onPark, onAutoAdvance, onSubject, onBack, onRetry }) {
  const [requestedPhase, setRequestedPhase] = useState(Math.floor((Number(seen) || 0) / TOPICS_PER_CLOUD) + 1)
  const [autoTravel, setAutoTravel] = useState(true)
  const [engineEffects, setEngineEffects] = useState(true)
  const [view, setView] = useState('map')
  const [focus, setFocus] = useState({ index: 0, travelling: false })
  const [novaGreeting, setNovaGreeting] = useState(false)
  const cloud = useMemo(()=>journeyCloud(worlds, requestedPhase, subject),[worlds,requestedPhase,subject])
  const startAction = useRef(null), visitAction = useRef(null)
  const root = useRef(null), board = useRef(null)
  const subjectTabs = useRef(null)
  const reduced = useReducedMotion()
  const theme = journeyWorldTheme(subject, subjectName)
  const district = stationDistrict(subject)
  const WorldIcon = WORLD_ICONS[theme.icon] || Compass
  const selected = cloud.stations[focus.index]?.available ? cloud.stations[focus.index] : cloud.stations.find(station => station.available)
  const onFocusTopic = useCallback((index, travelling) => setFocus(previous => previous.index === index && previous.travelling === travelling ? previous : { index, travelling }), [])
  const available = cloud.stations.filter(station => station.available)
  const status = loading ? 'Finding your topics…' : error || (previewOnly ? 'This world is waiting for its first topics.' : checkingProgress ? 'Checking your progress…' : `${cloud.available} ${cloud.available === 1 ? 'topic' : 'topics'} ready to explore.`)
  const canStart = !loading && !error && cloud.available > 0
  const choiceKeys = choices.map(choice => choice.key).join('|')
  useLayoutEffect(()=>{
    setRequestedPhase(Math.floor((Number(seen)||0)/TOPICS_PER_CLOUD)+1)
    setAutoTravel(true);setFocus({index:0,travelling:false});setNovaGreeting(false)
  },[subject])
  useEffect(() => {
    const strip = subjectTabs.current
    const revealSelected = () => {
      const selectedTab = strip?.querySelector('[aria-pressed="true"]')
      if (selectedTab) strip.scrollLeft = selectedTab.offsetLeft - (strip.clientWidth - selectedTab.offsetWidth) / 2
    }
    revealSelected()
    const observer = new ResizeObserver(revealSelected)
    observer.observe(strip)
    return () => observer.disconnect()
  }, [subject, choiceKeys])
  useEffect(() => {
    const compact = window.matchMedia('(max-height: 560px)')
    const adjust = () => { if (compact.matches) setView('topics') }
    adjust()
    compact.addEventListener('change', adjust)
    return () => compact.removeEventListener('change', adjust)
  }, [])

  return <div ref={root} className="journey-world station-town illustrated-journey" data-subject={subject} data-view={view} data-district={district.kind} data-animations={engineEffects ? 'on' : 'off'}
    style={{ '--journey-accent': theme.accent, '--journey-bright': theme.bright, '--journey-tint': theme.tint, '--journey-sky': theme.sky, '--town-roof':district.roof, '--town-side':district.side, '--town-wall':district.wall, '--town-land':district.land }}>
    <header className="journey-world__header">
      <div className="journey-world__brand"><button type="button" className="journey-world__back" aria-label="Back to home" onClick={onBack}><ArrowLeft size={20} /></button><Logo /></div>
      <UserChip name={name} face={face} sub="Exploring with Nova" />
    </header>
    <nav ref={subjectTabs} className="journey-world__subjects" aria-label="Choose your subject world">
      {choices.map(choice => {
        const item = journeyWorldTheme(choice.key, choice.name), Icon = WORLD_ICONS[item.icon] || Compass
        return <button type="button" key={choice.key} aria-pressed={choice.key === subject} onClick={() => onSubject(choice.key)} style={{ '--choice-accent': item.accent, '--choice-tint': item.tint }}>
          <span className="journey-world__subject-icon"><Icon size={22} aria-hidden="true" /></span><span>{item.label}</span>{choice.previewOnly && catalogReady && <small>Soon</small>}
        </button>
      })}
    </nav>
    <main className="journey-world__body">
      <aside className="journey-world__sidebar" aria-label="Journey details">
        <section className="journey-world__hero">
          <div className="journey-world__planet" aria-hidden="true"><img src={theme.art} width="76" height="76" alt="" decoding="async" /></div>
          <div><p className="journey-world__eyebrow">MY JOURNEY</p><h1>{theme.label} World</h1><p className="journey-world__tagline">{theme.description}</p></div>
        </section>
        <section className="journey-world__phase" aria-label={`Phase ${cloud.phase} progress`}>
          <div><span className="journey-world__cloud-icon"><Cloud size={23} aria-hidden="true" /></span><strong>Cloud {String(cloud.phase).padStart(2, '0')}</strong><small>{previewOnly ? 'Preview' : `${cloud.completed} / 10`}</small></div>
          <div className="journey-world__progress-dots" aria-hidden="true">{cloud.stations.map(station => <span key={station.number} className={station.completed ? 'is-done' : station.available ? 'is-ready' : ''}>{station.completed && <Check size={11} />}</span>)}</div>
          <p>{previewOnly ? 'Topics coming soon' : 'Complete 10 topics to reach the next cloud'}</p>
        </section>
        <section className="journey-world__topics" aria-labelledby="journey-topics-heading">
          <div className="journey-world__topics-heading"><h2 id="journey-topics-heading">In this cloud</h2><span>{loading ? 'Loading…' : `${cloud.available} ${cloud.available === 1 ? 'topic' : 'topics'}`}</span></div>
          <div className="journey-world__topic-links">
            {available.length ? available.map(station => <button type="button" key={station.id} aria-current={selected?.id === station.id ? 'location' : undefined} onClick={() => visitAction.current?.(station.index - cloud.offset)}>
              <span>{station.completed ? <Check size={16} /> : String(station.number).padStart(2, '0')}</span><strong>{station.name}</strong><ArrowRight size={16} aria-hidden="true" />
            </button>) : <div className="journey-world__empty"><WorldIcon size={29} aria-hidden="true" /><strong>{error ? 'Let’s reconnect' : loading ? 'Finding your topics' : 'Your adventure is on its way'}</strong><p>{error ? 'Your map is ready. Try checking its topics again.' : loading ? 'You can explore the map while Nova checks.' : 'Your topics will appear here when they are published.'}</p></div>}
          </div>
          <button type="button" className={`town-nova-buddy ${novaGreeting ? 'is-greeting' : ''}`} aria-label="Say hello to Nova" onClick={()=>{setNovaGreeting(value=>!value);sfx.select()}}><span className="town-nova-bubble">{novaGreeting ? "You're the driver. Let's discover!" : 'Pick a station. I’m coming too!'}</span><img src="/art/nova/welcome.webp" width="135" height="165" alt="Nova waving hello" decoding="async" /><span className="town-nova-caption">{novaGreeting ? 'Let’s go, explorer!' : 'Tap Nova to say hi'}</span></button>
        </section>
        <p className="journey-world__status" role={error ? 'alert' : 'status'}>{status}</p>
      </aside>
      <section className="journey-world__adventure" aria-label={`${theme.label} topic journey`}>
        <div className="journey-world__toolbar"><div><span className="journey-world__eyebrow">PHASE {cloud.phase} · {district.name}</span><h2>Your learning stations</h2></div><div className="journey-world__tools">
          <button type="button" className="journey-world__engine" aria-pressed={engineEffects} aria-label={engineEffects ? 'Pause world animations' : 'Play world animations'} onClick={() => setEngineEffects(value => !value)}><Power size={18} /></button>
          <div className="journey-world__view" role="group" aria-label="Journey view"><button type="button" aria-pressed={view === 'map'} onClick={() => setView('map')}><Map size={16} />Map</button><button type="button" aria-pressed={view === 'topics'} onClick={() => setView('topics')}><LayoutList size={16} />Topics</button></div>
        </div></div>
        <div ref={board} className="journey-world__board">
          <div className="journey-cloud__viewport" role="region" aria-label="Journey map with ten topic stops" hidden={view !== 'map'}>
            <CloudContents cloud={cloud} face={face} seen={seen} subject={subject} reduced={reduced}
              advanced={advanced} autoTravel={autoTravel} engineEffects={engineEffects} onVisit={onVisit} onPark={onPark} onAutoAdvance={onAutoAdvance}
              onChangePhase={phase => { setAutoTravel(true); setRequestedPhase(phase) }} registerStart={startAction} registerVisit={visitAction}
              onFocusTopic={onFocusTopic} visible={view === 'map'} onFallback={()=>setView('topics')} loading={loading} error={error} />
          </div>
          {view === 'topics' && <div className="journey-world__list" aria-label="Topics in this cloud">{cloud.stations.map(station => <button type="button" key={station.id || `future-${station.number}`} disabled={!station.available || focus.travelling} onClick={() => visitAction.current?.(station.index - cloud.offset)}>
            <span>{station.completed ? <Check size={20} /> : String(station.number).padStart(2, '0')}</span><div><small>{station.completed ? 'Completed' : station.available ? 'Topic' : loading ? 'Loading…' : error ? 'Unavailable' : 'Coming soon'}</small><strong>{station.available ? station.name : 'A new discovery awaits'}</strong></div>{station.available ? <ArrowRight size={18} /> : <Lock size={16} />}
          </button>)}</div>}
          {previewOnly && view === 'map' && <div className="journey-world__preview-badge"><WorldIcon size={15} /><span>{theme.label} world preview</span><span>·</span><span>Coming soon</span></div>}
          {loading && <div className="town-sync" role="status"><Sparkles size={15} /><span>Finding your published topics…</span></div>}
        </div>
        <footer className="journey-world__dock">
          <span className="journey-world__dock-icon"><MapPin size={22} /></span><div className="journey-world__destination" aria-live="polite"><small>{focus.travelling ? 'ON THE WAY' : selected ? 'YOUR NEXT DISCOVERY' : 'A NEW WORLD TO EXPLORE'}</small><strong>{selected?.name || `${theme.label} adventure`}</strong><p>{selected ? 'Drive to this topic and explore its concepts.' : 'New topics will appear as they become available.'}</p></div>
          <button type="button" disabled={(!canStart && !error) || focus.travelling} onClick={() => error ? onRetry?.() : cloud.canGoNext ? startAction.current?.() : selected && visitAction.current?.(selected.index - cloud.offset)}>{error ? 'Try again' : loading ? 'Loading topics…' : focus.travelling ? 'Driving…' : cloud.canGoNext ? 'Next cloud' : selected ? 'Explore topic' : 'Coming soon'}<ArrowRight size={19} /></button>
        </footer>
        {cloud.phase > 1 && <button type="button" className="journey-world__previous" onClick={() => { setAutoTravel(false); setRequestedPhase(cloud.phase - 1) }}><ArrowLeft size={16} />Previous cloud</button>}
      </section>
    </main>
  </div>
}
