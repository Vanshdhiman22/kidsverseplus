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
import { journeySubjectChoices } from '../lib/journey-subjects.js'

export default function Journey() {
  const nav = useNavigate()
  const g = useGame()
  const { name, face } = g.state.profile
  const studentId = g.state.activeChildId
  const [query, setQuery] = useSearchParams()
  const review = isReviewMode()
  const token = getToken()
  const subjects = usePublishedSubjects(studentId)
  const requested = subjectKey(query.get('subject') || g.state.progress.world || 'maths')
  const choices = journeySubjectChoices(subjects.data || [], WORLDS)
  // Start the Journey read alongside catalog discovery; don't wait for package metadata.
  const subject = choices.find(item => item.key === requested)?.key || choices[0]?.key || requested
  const selectedSubject = choices.find(item => item.key === subject)
  const previewOnly = !subjects.loading && Boolean(selectedSubject?.previewOnly)
  React.useEffect(() => {
    if (!previewOnly && !subjects.loading && choices.length && subject && g.state.progress.world !== subject) g.setProgress({ world: subject })
    if (choices.length && subject !== requested) setQuery({ subject }, { replace: true })
  }, [subject, requested, choices.length, previewOnly, subjects.loading, g.state.progress.world])
  const resource = useLiveResource(
    () => api.studentJourney(studentId, subject).then(data => checkedJourney(data, subject)),
    [studentId, subject, token], { enabled: !review && !previewOnly && Boolean(studentId && subject && token) },
  )
  const sample = React.useMemo(() => review ? reviewLearning(subject, { contentId: ACTIVE_CONTENT_ID }) : null, [review, subject])
  const rawJourney = sample?.journey || resource.data
  const progress = useLiveResource(
    () => loadJourneyProgress({ journey: rawJourney, studentId, readTopic: api.studentTopic }),
    [studentId, subject, token, rawJourney], { enabled: !review && Boolean(rawJourney && studentId && token) },
  )
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
  return <Page className="journey-cloud-page">
    <JourneyCloudMap key={`${studentId}:${subject}`} worlds={worlds} name={name} face={face} subject={subject}
      choices={choices} seen={g.state.progress.journeySeen?.[subject]}
      previewOnly={previewOnly} subjectName={selectedSubject?.name}
      loading={!review && (subjects.loading || resource.loading)} error={subjects.error || resource.error}
      checkingProgress={!review && progress.loading} onVisit={visitStation}
      advanced={g.state.progress.journeyAdvanced?.[subject]} onAutoAdvance={rememberAdvance}
      onPark={index => g.markJourneySeen(subject, index)}
      onSubject={id => setQuery({ subject: id })} onBack={() => nav('/home')} />
  </Page>
}
