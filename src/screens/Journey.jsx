import React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Page from '../components/Page.jsx'
import JourneyCloudMap from '../components/JourneyCloudMap.jsx'
import { useGame } from '../state/GameProvider.jsx'
import { checkedJourney, subjectKey } from '../lib/live-data.js'
import { journeyStationUrl } from '../lib/journey-route.js'
import { loadJourneyProgress } from '../lib/journey-progress.js'
import { usePublishedSubjects } from '../lib/usePublishedSubjects.js'
import { api, getToken } from '../lib/api.js'
import { useLiveResource } from '../lib/useLiveResource.js'
import { isReviewMode } from '../lib/reviewMode.js'
import { reviewLearning } from '../lib/review-learning.js'
import { ACTIVE_CONTENT_ID } from '../content/index.js'
import { WORLDS } from '../data/catalog.js'
import { journeySubjectChoices, journeySubjectQuery } from '../lib/journey-subjects.js'
import { journeyDisplaySnapshot, journeyDisplayData } from '../lib/journey-display-cache.js'
import { journeyWorldTheme } from '../lib/journey-world-theme.js'

export default function Journey() {
  const nav = useNavigate()
  const g = useGame()
  const { name, face } = g.state.profile
  const studentId = g.state.activeChildId
  const [query, setQuery] = useSearchParams()
  const review = isReviewMode()
  const token = getToken()
  const displayCache = React.useRef({ studentId, token, subjects:new Map() })
  if (displayCache.current.studentId !== studentId || displayCache.current.token !== token) displayCache.current = { studentId, token, subjects:new Map() }
  const [refreshKey, setRefreshKey] = React.useState(0)
  const subjects = usePublishedSubjects(studentId, refreshKey)
  React.useEffect(() => {
    // Warm the existing small illustrations once, never hold map rendering on
    // an image download or decode. Subsequent subject switches use browser cache.
    const artwork=[...WORLDS.map(world=>journeyWorldTheme(world.id).art),'/art/nova/welcome.webp','/art/journey/topic-props.webp','/art/journey-car.webp']
    artwork.forEach(src=>{ const picture=new Image(); picture.decoding='async'; picture.src=src })
  }, [])
  const requested = subjectKey(query.get('subject') || g.state.progress.world || 'maths')
  const choices = journeySubjectChoices(subjects.data || [], WORLDS)
  // Keep artwork/route aliases separate from the API's published subject slug.
  const subject = choices.find(item => item.key === requested)?.key || choices[0]?.key || requested
  const selectedSubject = choices.find(item => item.key === subject)
  const apiSubject = journeySubjectQuery(subject, subjects.data || [])
  const previewOnly = !subjects.loading && !subjects.error && Boolean(selectedSubject?.previewOnly)
  React.useEffect(() => {
    if (!previewOnly && !subjects.loading && choices.length && subject && g.state.progress.world !== subject) g.setProgress({ world: subject })
    if (choices.length && subject !== requested) setQuery({ subject }, { replace: true })
  }, [subject, requested, choices.length, previewOnly, subjects.loading, g.state.progress.world])
  const resource = useLiveResource(
    () => api.studentJourney(studentId, apiSubject).then(data => checkedJourney(data, subject)),
    [studentId, subject, apiSubject, token, refreshKey], { enabled: !review && !previewOnly && !subjects.error && (!subjects.loading || subject === 'maths') && Boolean(studentId && subject && token) },
  )
  const sample = React.useMemo(() => review ? reviewLearning(subject, { contentId: ACTIVE_CONTENT_ID }) : null, [review, subject])
  const rawJourney = journeyDisplayData({ previewOnly, sample:sample?.journey, live:resource.data, cached:displayCache.current.subjects.get(subject) })
  const progress = useLiveResource(
    () => loadJourneyProgress({ journey: rawJourney, studentId, readTopic: api.studentTopic }),
    [studentId, subject, token, rawJourney], { enabled: !review && Boolean(resource.data && studentId && token) },
  )
  React.useEffect(() => {
    const latest = progress.data || resource.data
    if (!review && latest) displayCache.current.subjects.set(subject, journeyDisplaySnapshot(latest))
  }, [subject, resource.data, progress.data, review])
  const worlds = progress.data?.worlds || rawJourney?.worlds || []
  const visitStation = (station, index) => {
    const url = journeyStationUrl(subject, station)
    if (!url) return
    g.markJourneySeen(subject, index)
    nav(url)
  }
  const rememberAdvance = (topicId, index) => {
    // Per-child visual history only. Completion and XP still come from the API.
    const history = g.state.progress.journeyAdvanced || {}
    g.setProgress({
      journeyAdvanced: { ...history, [subject]: [...new Set([...(history[subject] || []), topicId])] },
      journeySeen: { ...g.state.progress.journeySeen, [subject]: index },
    })
  }
  return <Page className="journey-cloud-page journey-world-page">
    <JourneyCloudMap key={studentId} worlds={worlds} name={name} face={face} subject={subject}
      choices={choices} seen={g.state.progress.journeySeen?.[subject]} catalogReady={!subjects.loading && !subjects.error}
      previewOnly={previewOnly} subjectName={selectedSubject?.name}
      loading={!review && (subjects.loading || resource.loading) && !rawJourney} error={subjects.error || resource.error}
      checkingProgress={!review && Boolean(rawJourney) && (progress.loading || resource.loading)} onVisit={visitStation}
      advanced={g.state.progress.journeyAdvanced?.[subject]} onAutoAdvance={rememberAdvance}
      onPark={index => g.markJourneySeen(subject, index)}
      onSubject={id => setQuery({ subject: id })} onBack={() => nav('/home')} onRetry={()=>setRefreshKey(value=>value+1)} />
  </Page>
}
