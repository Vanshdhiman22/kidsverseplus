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

  return (
    <Page>
      <Scene name="league" />
      <Child screen="league" delay={0.3} amp={5} />
      <Panel className="absolute left-[345px] top-[105px] w-[935px] h-[660px] p-10" initial="hidden" animate="show">
        <div className="flex items-center gap-4"><Trophy size={48} className="text-gold" /><h1 className="font-display font-extrabold text-[52px] text-ink">Learning League</h1></div>
        <Card className="mt-7 p-6"><div className="flex items-center gap-3 text-primary-ink"><Users size={28} /><h2 className="font-display font-extrabold text-[26px]">No live rankings yet</h2></div><p className="mt-3 text-[18px] font-semibold text-ink-2">Friends, India and Global rankings need a real leaderboard service. We will not show made-up players, ranks or points.</p></Card>
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
