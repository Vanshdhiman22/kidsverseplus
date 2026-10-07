import React from 'react'
import { useNavigate } from 'react-router-dom'
import Page from './Page.jsx'
import { Panel } from './Panel.jsx'
import Button from './Button.jsx'

export default function ContentStatus({ pkg, activity = 'lesson' }) {
  const nav = useNavigate()
  return <Page><div className="screen grid place-items-center"><Panel className="w-[640px] p-10 text-center" role="status">
    <h1 className="font-display text-[34px] font-extrabold text-ink">{pkg.contentLoading ? `Loading your ${activity}…` : `${activity.charAt(0).toUpperCase() + activity.slice(1)} unavailable`}</h1>
    <p className="mt-4 text-[20px] font-semibold text-ink-2">{pkg.contentLoading ? 'Nova is getting everything ready.' : `We could not load this ${activity}. Try again or choose another activity.`}</p>
    {!pkg.contentLoading && <div className="mt-6 flex justify-center gap-4"><Button onClick={() => window.location.reload()}>Try again</Button><Button variant="outline" onClick={() => nav('/learn')}>Back to Learn</Button></div>}
  </Panel></div></Page>
}
