import React, {useState} from 'react'
import {apiRequest,getToken} from '../lib/api.js'
import {useLiveResource} from '../lib/useLiveResource.js'
import {isReviewMode} from '../lib/reviewMode.js'
import {resolveMissionSubject,startMission} from '../lib/gameApi.js'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft, BookOpen, ClipboardCheck, MessageCircle, Target, TrendingUp } from 'lucide-react'
import Scene from '../components/Scene.jsx'
import Page from '../components/Page.jsx'
import ParentRail from '../components/ParentRail.jsx'
import { Panel, Card } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import { useGame } from '../state/GameProvider.jsx'
import { WORLDS, lessonProgress } from '../data/catalog.js'
import { bleedR } from '../components/Stage.jsx'

export default function ParentPlan() {
  const nav = useNavigate()
  const g = useGame()
  const { name } = g.state.profile
  const [openError,setOpenError]=useState('')
  const [opening,setOpening]=useState(false)
  const subject = g.state.progress.world || 'maths'
  const today=new Date();
  const week=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const resource=useLiveResource(()=>apiRequest(`/parent/plan?${new URLSearchParams({student_id:g.state.activeChildId,week})}`),[g.state.activeChildId,getToken(),week],{enabled:!isReviewMode()&&Boolean(g.state.activeChildId&&getToken())});
  const plan=resource.data;

  const subjectName = WORLDS.find(world => world.id === subject)?.name ?? 'Maths'
  const lastTest = g.state.progress.lastTest
  const journeyStops = lessonProgress(g.state.progress.worldDone).done
  const testSummary = lastTest?.total
    ? `${lastTest.correct} of ${lastTest.total} correct in the latest test.`
    : 'No completed test yet. A test can help show what to revisit.'
  const steps=(plan?.days||[]).filter(day=>day.mission_id&&(!day.student_id||day.student_id===g.state.activeChildId)).map(day=>({missionId:day.mission_id,subjectSlug:day.subject_slug,icon:BookOpen,color:'#7c3aed',title:`${day.date||day.day} · ${day.mission||day.title}`,detail:day.reason||day.topic||'',to:`/missions/fractions/learn?subject=${encodeURIComponent(day.subject_slug||subject)}&mission=${encodeURIComponent(day.mission_id)}`}))


  async function openStep(step){
    if(opening)return
    setOpening(true);setOpenError('')
    try{const target=step.subjectSlug||await resolveMissionSubject(g.state.activeChildId,step.missionId);await startMission(g.state.activeChildId,target,step.missionId);nav(`/missions/fractions/learn?subject=${encodeURIComponent(target)}&mission=${encodeURIComponent(step.missionId)}`)}
    catch(error){setOpenError(error.message)}finally{setOpening(false)}
  }
  return (
    <Page>
      <Scene name="plan" />
      <ParentRail />
      <Panel soft className="absolute left-[265px] top-[55px] w-[955px] h-[805px] p-8" initial="hidden" animate="show">
        <div className="text-[15px] font-extrabold uppercase tracking-wide text-primary-ink">Next steps</div>
        <h1 className="mt-2 font-display font-extrabold text-[43px] leading-tight text-ink">A simple learning plan for {name}</h1>
        <p className="mt-3 text-[18px] font-semibold text-ink-2">Choose an activity when it suits you. This is a suggestion, not a scheduled or scored plan.</p>
        <div className="mt-7 flex max-h-[580px] flex-col gap-4 overflow-y-auto">
          {resource.loading&&<p role="status">Loading the saved plan…</p>}
          {resource.error&&<p role="alert">{resource.error}</p>}
          {!resource.loading&&!resource.error&&!steps.length&&<p>No learning plan is available from the API yet.</p>}
          {openError&&<p role="alert">{openError}</p>}
          {steps.map(({ icon: Icon, color, title, detail, to,missionId,subjectSlug }, index) => (
            <Card key={title} className="min-h-[95px] p-3 flex items-center gap-5">
              <span className="w-[52px] h-[52px] rounded-2xl grid place-items-center text-white shrink-0" style={{ background: color }}><Icon size={27} /></span>
              <div className="flex-1"><div className="text-[12px] font-extrabold uppercase tracking-wide text-primary-ink">Step {index + 1}</div><div className="font-display font-extrabold text-[23px] text-ink">{title}</div><p className="mt-1 text-[15px] font-semibold text-ink-2">{detail}</p></div>
              <Button size="sm" arrow className="px-5 h-[48px]" disabled={opening} onClick={() => openStep({missionId,subjectSlug})}>{opening?'Opening…':'Open'}</Button>
            </Card>
          ))}
        </div>
        <div className="mt-7 rounded-2xl bg-[var(--lavender)]/60 p-5 text-[16px] font-semibold text-ink-2">
          As {name} completes activities, their recorded progress will appear in the parent overview.
        </div>
      </Panel>
      <Panel className="absolute top-[115px] w-[400px] p-6" style={bleedR(30)} initial="hidden" animate="show">
        <div className="flex items-center gap-3"><Target size={34} className="text-primary-ink" /><h2 className="font-display font-extrabold text-[25px] text-ink">What we know</h2></div>
        <Card className="mt-5 p-4"><div className="text-[13px] font-extrabold uppercase text-primary-ink">Latest test</div><p className="mt-2 text-[17px] font-semibold text-ink">{testSummary}</p></Card>
        <Card className="mt-3 p-4"><div className="text-[13px] font-extrabold uppercase text-primary-ink">Journey stops reached</div><p className="mt-2 text-[27px] font-display font-extrabold text-ink">{journeyStops}</p></Card>
        <div className="mt-5 flex items-start gap-3 text-[15px] font-semibold text-ink-2"><TrendingUp size={20} className="shrink-0 text-primary-ink" /><span>Recommendations become more useful as {name} completes lessons and tests.</span></div>
      </Panel>
      <motion.div className="absolute top-[675px] w-[400px]" style={bleedR(30)} initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }}>
        <Button variant="outline" size="md" icon={<ArrowLeft size={20} />} className="w-full h-[60px]" onClick={() => nav('/parent')}>Back to overview</Button>
      </motion.div>
    </Page>
  )
}
