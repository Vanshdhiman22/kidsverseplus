import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, BookOpen, ClipboardCheck, Activity } from 'lucide-react'
import Page from '../components/Page.jsx'
import { useGame } from '../state/GameProvider.jsx'
import { apiRequest, getToken } from '../lib/api.js'
import { loadLearningPath } from '../lib/gameApi.js'
import { loadParentEvidence } from '../lib/parent-evidence.js'
import { useLiveResource } from '../lib/useLiveResource.js'
import './ParentEvidenceLive.css'

export default function ParentEvidenceLive() {
  const nav = useNavigate()
  const { state } = useGame()
  const studentId = state.activeChildId
  const subject = state.progress.world || 'maths'
  const [retry, setRetry] = useState(0)
  const resource = useLiveResource(() => loadParentEvidence({
    request: apiRequest, resolveTopic: loadLearningPath, studentId, subject,
  }), [studentId, subject, getToken(), retry], { enabled: Boolean(studentId && getToken()) })
  const report = resource.data
  const score = report?.latest_test_score
  const hasScore = score != null && Number.isFinite(Number(score))
  return <Page className="parent-evidence-live"><main className="evidence-shell">
    <header><button onClick={() => nav('/parent')}><ArrowLeft size={20} aria-hidden="true" /> Parent overview</button><span>{state.profile.name}'s learning</span></header>
    <section className="evidence-panel" aria-busy={resource.loading}>
      <h1>Learning activity</h1>
      <p>Saved progress for the current learning topic.</p>
      {resource.loading && <p role="status">Loading the saved learning summary…</p>}
      {resource.error && <div role="alert"><p>{resource.error}</p><button onClick={() => setRetry(value => value + 1)}>Retry</button></div>}
      {!studentId && <p>Choose a child to see their learning activity.</p>}
      {report && <>
        <h2>{report.topic.name}</h2><p>{report.subject} · {state.profile.board} · Grade {state.profile.grade}</p>
        <div className="evidence-metrics">
          <article><BookOpen aria-hidden="true" /><h3>Missions completed</h3><strong>{report.missions_completed ?? '—'} / {report.missions_total ?? '—'}</strong><p>Completed missions in this topic.</p></article>
          <article><ClipboardCheck aria-hidden="true" /><h3>Latest test</h3><strong>{hasScore ? `${Number(score)}%` : '—'}</strong><p>{hasScore ? 'Latest completed test in this topic.' : 'No completed test score is available yet.'}</p></article>
          <article><Activity aria-hidden="true" /><h3>Learning activity</h3><strong>{report.learning_events ?? '—'}</strong><p>Recorded learning events, which may include multiple events per session.</p></article>
        </div>
        <div className="evidence-detail"><h2>About this summary</h2><p>These are saved topic totals. Individual answers and session history are not available in this summary. Challenge practice does not add scores or XP.</p></div>
      </>}
      <footer><button onClick={() => nav('/parent/plan')}>See suggested steps</button><button onClick={() => nav('/learn')}>Explore lessons</button></footer>
    </section>
  </main></Page>
}
