import React from 'react'
import { learningPathDisplay, nextLearningNode } from '../lib/learning-path-display.js'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useBack } from '../lib/nav.js'
import Page from '../components/Page.jsx'
import TopicLessonFocus from '../components/TopicLessonFocus.jsx'
import { topicFor, gradeLabel } from '../data/catalog.js'
import { useGame } from '../state/GameProvider.jsx'
import ContentStatus from '../components/ContentStatus.jsx'
import { loadLearningPath, startMission } from '../lib/gameApi.js'
import { useLiveResource } from '../lib/useLiveResource.js'
import { isReviewMode } from '../lib/reviewMode.js'
import { reviewLearning } from '../lib/review-learning.js'
import { ACTIVE_CONTENT_ID } from '../content/index.js'

export default function Topic() {
  const nav = useNavigate()
  const { world = 'maths' } = useParams()
  const [query] = useSearchParams()
  const requestedTopicId = query.get('topic') || undefined
  const goBack = useBack()
  const localTopic = topicFor(world)
  const g = useGame()
  const { name, face, grade } = g.state.profile
  const { xp, streak } = g.state.stats
  const studentId = g.state.activeChildId
  const [starting, setStarting] = React.useState(false)
  const [startError, setStartError] = React.useState('')
  const review = isReviewMode()
  const { data: livePath, loading, error } = useLiveResource(
    () => loadLearningPath(studentId, world, requestedTopicId),
    [studentId, world, requestedTopicId],
    { enabled: !review && Boolean(studentId) },
  )
  const liveDetail = review ? reviewLearning(world, { grade, contentId: ACTIVE_CONTENT_ID }).path.detail : livePath?.detail
  const topic = liveDetail ? {
    ...localTopic, title: liveDetail.name, subject: liveDetail.subject,
    desc: liveDetail.description || `Explore ${(liveDetail.name || 'this topic').toLowerCase()} through concepts, pictures and practice.`,
  } : localTopic
  // The existing API exposes playable CMS concepts as mission nodes. Keep their mission IDs.
  const concepts = learningPathDisplay(review || studentId ? liveDetail?.nodes || [] : [{ mission_id: world, name: topic.title, status: 'unlocked' }])
  const nextLesson = nextLearningNode(concepts)
  const practiceLesson = concepts.find(m => m.startable && ['completed', 'in_progress'].includes(m.status))
  const openedKey = mission => `kv:lesson-opened:${review ? 'review' : studentId}:${mission?.mission_id}`
  const hasOpened = mission => { try { return localStorage.getItem(openedKey(mission)) === '1' } catch { return false } }
  const enterLesson = mission => {
    try { localStorage.setItem(openedKey(mission), '1') } catch {}
    nav(`/missions/fractions/learn?subject=${world}&mission=${mission.mission_id}`)
  }
  async function openLesson(mission) {
    if (starting || !mission) return
    // Preserve the existing mission-start rules and server authorization.
    if (mission.startable && !mission.needsStart) { enterLesson(mission); return }
    if (review || mission.status !== 'locked' && !mission.needsStart) return
    setStarting(true); setStartError('')
    try {
      const result = await startMission(studentId, world, mission.mission_id)
      if (mission.needsStart && result.status !== 'in_progress') throw new Error('The server did not confirm this lesson can start.')
      enterLesson(mission)
    } catch (error) { setStartError(error.message) }
    finally { setStarting(false) }
  }
  if (!review && studentId && (loading || error)) return <ContentStatus activity="topics" pkg={{ contentLoading: loading, contentError: error }} />
  return <Page className="topic-focus-page">
    <TopicLessonFocus key={`${studentId}:${world}:${requestedTopicId || liveDetail?.id || ''}`}
      topic={topic} world={world} grade={gradeLabel(grade)} name={name} face={face} xp={xp} streak={streak}
      concepts={concepts} initialMissionId={nextLesson?.mission_id} hasOpened={hasOpened}
      starting={starting} error={startError} review={review} onBack={goBack} onOpen={openLesson}
      onPractice={practiceLesson ? () => enterLesson(practiceLesson) : undefined}
      onTest={() => nav(`/tests?subject=${world}`)} />
  </Page>
}
