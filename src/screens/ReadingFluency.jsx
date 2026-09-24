import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, CheckCircle2, Ear, RotateCcw, Volume2 } from 'lucide-react'
import Scene, { Child } from '../components/Scene.jsx'
import Page from '../components/Page.jsx'
import Logo from '../components/Logo.jsx'
import { Panel, Card } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import { useGame } from '../state/GameProvider.jsx'
import { bleedL, bleedR, safeT, safeB } from '../components/Stage.jsx'
import { speak } from '../lib/voice.js'
import { completeCompanionActivity } from '../lib/gameApi.js'

const PASSAGE = 'Under the pale moonlight, Aarav spotted a glowing path across the quiet dunes. He followed the lights and discovered a hidden cave filled with sparkling crystals.'

export default function ReadingFluency() {
  const nav = useNavigate()
  const g = useGame()
  const { name } = g.state.profile
  const [finished, setFinished] = useState(false)
  const [saving, setSaving] = useState(false)

  async function finish() {
    if (saving || finished) return
    setSaving(true)
    try {
      await completeCompanionActivity(g.state.activeChildId, ['read', 'reading'])
      g.finishReading()
      await g.refreshStats().catch(error => g.notice(error.message))
      setFinished(true)
    } catch (error) {
      g.notice(error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Page>
      <Scene name="reading" />
      <Panel className="absolute w-[265px] p-5" style={{ ...bleedL(10), ...safeT(10) }} initial="hidden" animate="show">
        <div className="text-center"><Logo variant="planet" tagline="LEARN • EXPLORE • ACHIEVE" stacked /></div>
        <div className="hairline my-4" />
        <div className="flex items-center gap-2 text-[16px] font-extrabold text-primary-ink uppercase tracking-wide"><BookOpen size={20} /> Reading practice</div>
        <div className="mt-2 font-display font-extrabold text-[28px] leading-tight text-ink">Moonlight Reading 🌙</div>
        <Card className="mt-4 p-4 text-[15px] font-semibold text-ink-2">Read at your own pace. You can listen to the passage first, then read it aloud or quietly.</Card>
        <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => nav('/extra')}>Back to activities</Button>
      </Panel>
      <Child screen="reading" delay={0.3} amp={5} />
      <Panel className="absolute left-[345px] top-[85px] w-[835px] h-[690px] p-7" initial="hidden" animate="show">
        <div className="text-[14px] font-extrabold uppercase tracking-wide text-primary-ink">One passage · guided practice</div>
        <h1 className="mt-2 font-display font-extrabold text-[42px] text-ink">Read the story, {name}</h1>
        <p className="mt-2 text-[17px] font-semibold text-ink-2">No microphone or automatic reading score is used on this screen.</p>
        <div className="mt-5 grid grid-cols-[1fr_300px] gap-5">
          <Card className="min-h-[390px] p-6 flex flex-col">
            <p className="font-display font-bold text-[27px] leading-[1.65] text-ink">{PASSAGE}</p>
            <Button variant="outline" size="sm" icon={<Volume2 size={19} />} className="mt-auto self-start" onClick={() => speak(PASSAGE)}>Listen to passage</Button>
          </Card>
          <img src="/art/crops/moonlight.webp" alt="Moonlit dunes and a sparkling cave" className="w-full h-[390px] rounded-[22px] object-cover" />
        </div>
        <div className="mt-5 rounded-2xl bg-[var(--lavender)]/60 p-4 text-[16px] font-semibold text-ink-2">Try telling someone what Aarav discovered. This is a self-paced activity; the app does not judge your voice.</div>
      </Panel>
      <Panel className="absolute top-[145px] w-[395px] p-5" style={bleedR(30)} initial="hidden" animate="show">
        <div className="flex items-center gap-2 text-[18px] font-display font-extrabold text-ink"><Ear size={24} className="text-primary-ink" /> Reading tips</div>
        <div className="mt-5 flex flex-col gap-3">
          {['Listen once if you want to hear the words.', 'Read each sentence without rushing.', 'Tell someone what happened in the story.'].map((tip, index) => <Card key={tip} className="p-4 flex items-start gap-3"><span className="w-[28px] h-[28px] shrink-0 rounded-full bg-[var(--lavender)] grid place-items-center text-primary-ink font-extrabold">{index + 1}</span><span className="text-[15px] font-semibold text-ink-2">{tip}</span></Card>)}
        </div>
      </Panel>
      <Panel className="absolute top-[570px] w-[395px] p-5" style={bleedR(30)} initial="hidden" animate="show">
        <div className="text-[15px] font-extrabold text-primary-ink uppercase">Activity status</div>
        <p className="mt-2 text-[16px] font-semibold text-ink-2">{finished ? 'Reading activity recorded.' : 'When you finish reading, confirm it yourself below.'}</p>
        {finished && <CheckCircle2 size={28} className="mt-3 text-green-600" />}
      </Panel>
      <div className="absolute left-[345px] flex items-center gap-4" style={safeB(24)}>
        <Button size="md" icon={<CheckCircle2 size={22} />} className="h-[62px] px-7" disabled={saving || finished} onClick={finish}>{saving ? 'Saving…' : finished ? 'Completed' : 'I finished reading'}</Button>
        <Button variant="outline" size="md" icon={<RotateCcw size={20} />} className="h-[62px] px-6" onClick={() => speak(PASSAGE)}>Hear it again</Button>
      </div>
      <Button size="md" arrow className="absolute w-[290px] h-[62px]" style={{ ...bleedR(50), ...safeB(24) }} onClick={() => nav('/extra')}>More activities</Button>
    </Page>
  )
}
