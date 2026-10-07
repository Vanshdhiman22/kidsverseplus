import {apiRequest,getToken} from '../lib/api.js'
import {useLiveResource} from '../lib/useLiveResource.js'
import {subjectKey} from '../lib/live-data.js'
import {routeSubject} from '../content/index.js'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Trophy, Users, Star } from 'lucide-react'
import Scene, { Child } from '../components/Scene.jsx'
import Page from '../components/Page.jsx'
import { Panel, Card } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import { useGame } from '../state/GameProvider.jsx'

export default function Leaderboard() {
  const nav = useNavigate()
  const g = useGame()
  const { name } = g.state.profile
  const xp = g.state.stats.xp ?? 0
  const battles = g.state.stats.battles ?? 0

  const subject=routeSubject()
  const resource=useLiveResource(async()=>{
    const {challenges}=await apiRequest('/challenges')
    const challenge=challenges.find(c=>subjectKey(c.slug)===subjectKey(subject))
    if(!challenge)throw new Error('No leaderboard available for this subject.')
    return apiRequest(`/challenges/${challenge.id}/leaderboard?scope=global`)
  },[subject,getToken()],{enabled:Boolean(getToken())})
  const rankings=resource.data?.entries
  return (
    <Page>
      <Scene name="league" />
      <Child screen="league" delay={0.3} amp={5} />
      <Panel className="absolute left-[345px] top-[105px] w-[935px] h-[660px] p-10" initial="hidden" animate="show">
        <div className="flex items-center gap-4"><Trophy size={48} className="text-gold" /><h1 className="font-display font-extrabold text-[52px] text-ink">Learning League</h1></div>
        {rankings ? <Card className="mt-7 p-6"><h2 className="font-display text-[26px] font-bold">Leaderboard</h2>{rankings.map(row=><div key={row.rank} className="flex justify-between py-3 border-b text-[20px]"><b>#{row.rank} {row.name}</b><span>{row.xp} XP</span></div>)}</Card> : <Card className="mt-7 p-6"><div className="flex items-center gap-3 text-primary-ink"><Users size={28} /><h2 className="font-display font-extrabold text-[26px]">No live rankings yet</h2></div><p className="mt-3 text-[18px] font-semibold text-ink-2">{resource.loading ? "Loading rankings…" : resource.error || "No rankings available."}</p></Card>}
        <div className="mt-7 grid grid-cols-2 gap-5">
          <Card className="p-6"><div className="text-[14px] font-extrabold uppercase text-primary-ink">{name}'s earned XP</div><div className="mt-2 font-display font-extrabold text-[40px] text-ink">{xp.toLocaleString()}</div></Card>
          <Card className="p-6"><div className="text-[14px] font-extrabold uppercase text-primary-ink">Battles played</div><div className="mt-2 font-display font-extrabold text-[40px] text-ink">{battles}</div></Card>
        </div>
        <div className="mt-8 flex items-center gap-3 text-[16px] font-semibold text-ink-2"><Star size={22} className="text-gold" /> Your own progress still counts, even without a public ranking.</div>
        <Button size="md" arrow className="mt-8 h-[60px] px-8" onClick={() => nav('/challenge')}>Back to challenges</Button>
      </Panel>
    </Page>
  )
}
