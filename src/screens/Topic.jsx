import React from 'react'
import {learningPathDisplay,nextLearningNode} from '../lib/learning-path-display.js'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useBack } from '../lib/nav.js'
import { motion } from 'motion/react'
import { ArrowLeft, BookOpen, Check, Lock, Pencil, ClipboardCheck, Rocket } from 'lucide-react'
import Scene, { Cutout, Child } from '../components/Scene.jsx'
import Page, { Stack, Item } from '../components/Page.jsx'
import { TopBar, UserChip, StatPill } from '../components/TopBar.jsx'
import { Card } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import SpeechBubble from '../components/SpeechBubble.jsx'
import { topicFor, gradeLabel, WORLDS } from '../data/catalog.js'
import { useGame } from '../state/GameProvider.jsx'
import { cn } from '../lib/utils.js'
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
  /* Back goes where the child came from. This said "Back to Learn" and always went to the
     Learn Hub, which is wrong for the common path now: most children arrive from Home. */
  const goBack = useBack()
  const localTopic = topicFor(world)
  const g = useGame(); const { name, face, grade } = g.state.profile; const { xp, streak } = g.state.stats
  const studentId = g.state.activeChildId
  const [starting, setStarting] = React.useState(false)
  const [startError, setStartError] = React.useState('')
  const [refresh,setRefresh] = React.useState(0)
  const review = isReviewMode()
  const { data: livePath, loading, error } = useLiveResource(
    () => loadLearningPath(studentId, world, requestedTopicId),
    [studentId, world, requestedTopicId, refresh],
    { enabled: !review && Boolean(studentId) },
  )
  const liveDetail = review ? reviewLearning(world,{grade,contentId:ACTIVE_CONTENT_ID}).path.detail : livePath?.detail
  const T = liveDetail ? {
    ...localTopic,
    title: liveDetail.name,
    subject: liveDetail.subject,
    desc: `Explore ${(liveDetail.name||'this topic').toLowerCase()} through short lessons, pictures and practice.`,
    nova: liveDetail.nodes?.length ? 'Choose an available lesson to get started.' : 'Lessons for this topic are not available yet. You can explore another topic.',
  } : localTopic
  // Only the mission API can claim completion. With no student/progress data, a mission is ready to start.
  const missions = learningPathDisplay(review || studentId ? liveDetail?.nodes || [] : [{ mission_id: world, name: T.title, status: 'unlocked' }],liveDetail?.tiers||[])
  const missionStatus = mission => [mission.displayLabel,mission.displayState]
  /* The headline column is 500px and the mission list starts at a fixed y, so a long
     title must shrink rather than wrap into the content below. */
  const titlePx = T.title.length <= 10 ? 86 : T.title.length <= 15 ? 62 : 42
  /* The designer's backdrop carried a fraction pizza here, which was right when Fractions
     was the only page this route served. Every subject opens it now, so the pizza was
     painted out and each world draws its own globe on the pedestal instead. */
  const globe = (WORLDS.find(w => w.id === world) ?? WORLDS[1]).img
  const practiceLesson=missions.find(m=>m.startable&&['completed','in_progress'].includes(m.status))
  const nextLesson=nextLearningNode(missions)
  const available=nextLesson&&!nextLesson.needsStart?nextLesson:null
  const firstStartable=nextLesson?.needsStart?nextLesson:null
  const openedKey = mission => `kv:lesson-opened:${review?'review':studentId}:${mission?.mission_id}`
  const hasOpened = mission => { try{return localStorage.getItem(openedKey(mission))==='1'}catch{return false} }
  const lessonButtonStyle = mission => ({
    background:hasOpened(mission)?'linear-gradient(135deg,#0f766e,#15803d)':'linear-gradient(135deg,#7c3aed,#2563eb)',
    color:'#fff',borderColor:'transparent',
    boxShadow:hasOpened(mission)?'0 8px 20px rgba(15,118,110,.24)':'0 8px 20px rgba(124,58,237,.24)',
  })
  const enterLesson = (mission,path='/missions/fractions/learn') => {
    try{localStorage.setItem(openedKey(mission),'1')}catch{}
    nav(`${path}?subject=${world}&mission=${mission.mission_id}`)
  }
  async function startListedMission(mission) {
    if(starting||review)return
    setStarting(true);setStartError('')
    try {
      await startMission(studentId,world,mission.mission_id)
      enterLesson(mission)
    } catch(error){setStartError(error.message)}
    finally{setStarting(false)}
  }
  async function openLesson() {
    if (starting) return
    if (available) { enterLesson(available); return }
    if (!firstStartable) return
    setStarting(true); setStartError('')
    try {
      const result=await startMission(studentId,world,firstStartable.mission_id)
      if(result.status!=='in_progress')throw new Error('The server did not confirm this lesson can start.')
      enterLesson(firstStartable)
    } catch(error) { setStartError(error.message) }
    finally { setStarting(false) }
  }

  if (!review && studentId && (loading || error)) return <ContentStatus activity="topics" pkg={{ contentLoading: loading, contentError: error }} />
  return (
    <Page className="responsive-page kv-topic">
      <Scene name="topic" />
      <TopBar back={false} right={<><div className="pill h-[68px] px-2 gap-0"><StatPill kind="streak" value={streak} label="Day streak" className="border-0 shadow-none bg-transparent" /><span className="w-px h-8 bg-[var(--line)]" /><StatPill kind="xp" value={xp.toLocaleString()} label="Nova XP" className="border-0 shadow-none bg-transparent" /></div><UserChip name={name} sub={gradeLabel(grade)} face={face} /></>} showControls={false} />
      <Stack className="absolute left-[50px] top-[115px] w-[500px]" start={0.2}>
        <Item><button className="flex items-center gap-2 text-[21px] font-extrabold text-primary-ink hover:underline" onClick={goBack}><ArrowLeft size={22} strokeWidth={2.6} /> Back</button></Item>
        <Item className="flex items-center gap-4"><h1 className="font-display font-extrabold leading-tight text-ink break-words min-w-0" style={{ fontSize: titlePx }}>{T.title}</h1>{T.title.length<20&&<img src="/art/planet-sm.webp" alt="" className="w-[70px] floaty" />}</Item>
        <Item className="text-[26px] font-extrabold text-primary-ink">{gradeLabel(grade)} <span className="text-ink-3">•</span> {T.subject}</Item>
        <Item className="mt-2 text-[18px] font-semibold text-ink-2 leading-snug">{T.desc}</Item>
      </Stack>
      <Stack className="absolute left-[45px] top-[375px] w-[495px]" start={0.6} delay={0.1}>
        <Item v="left" className="mb-3"><div className="font-display text-[17px] font-extrabold uppercase tracking-wider text-primary-ink">Your learning path</div></Item>
        <div className="flex max-h-[350px] flex-col gap-3 overflow-y-auto pr-1">
          {!missions.length && <p className="text-[20px] font-bold text-ink-2">No lessons are available for this topic yet.</p>}
          {missions.map((mission, index) => { const [status, key] = missionStatus(mission); return (
            <Item key={mission.mission_id ?? `${mission.name}-${index}`} v="left"><Card className="w-full min-h-[96px] px-5 py-4 flex items-center gap-4">
              <span className="icon-orb w-[58px] h-[58px] shrink-0" style={{ color: '#3b82f6', background: '#3b82f61a' }}><BookOpen size={28} strokeWidth={2} /></span>
              <div className="min-w-0 flex-1"><div className="text-[12px] font-extrabold uppercase tracking-wider text-primary-ink">Mission {index + 1}</div><div className="font-display font-extrabold text-[18px] leading-tight text-ink">{mission.name}</div></div>
              {!review&&mission.status==='locked'?<Button size="md" className="shrink-0 min-h-[48px] px-4 text-[15px]" disabled={starting} onClick={()=>startListedMission(mission)}>{starting?'Starting…':"Let’s start"}</Button>:mission.startable&&['completed','in_progress'].includes(mission.status)?<Button variant="primary" style={lessonButtonStyle(mission)} size="md" icon={<Pencil size={17} />} className="shrink-0 min-h-[48px] px-4 text-[15px] whitespace-nowrap" onClick={()=>enterLesson(mission)}>{mission.status==='completed'?'Practise again':hasOpened(mission)?'Continue lesson':"Let’s start"}</Button>:<span className={cn('chip h-[36px] shrink-0 px-3 text-[12px] uppercase tracking-wider', key === 'done' && 'text-green-700', key === 'locked' && 'text-orange-600')} style={key === 'done' ? { background: '#dcfce7', color: '#15803d' } : key === 'locked' ? { background: '#fff7ed', color: '#c2410c' } : undefined}>{status}{key === 'done' ? <Check size={16} strokeWidth={3} /> : key === 'locked' ? <Lock size={14} /> : null}</span>}
            </Card></Item>
          ) })}
        </div>
      </Stack>

      <Child screen="topic" delay={0.4} dx={110} dy={70} />
      <motion.img src={globe} alt="" draggable={false} className="absolute left-[950px] top-[75px] w-[170px] pointer-events-none"
        style={{ filter: 'drop-shadow(0 26px 34px rgba(40,30,140,.4))' }}
        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1, y: [0, -12, 0], rotate: [0, 3, 0, -3, 0] }}
        transition={{ opacity: { delay: 0.25 }, scale: { type: 'spring', stiffness: 200, damping: 18, delay: 0.25 }, y: { duration: 6, repeat: Infinity, ease: 'easeInOut' }, rotate: { duration: 9, repeat: Infinity, ease: 'easeInOut' } }} />
      <Cutout id="topic-1" delay={0.19} amp={10} />
      <div className="absolute left-[1310px] top-[180px]"><SpeechBubble tail="left" text={T.nova} delay={0.3} className="w-[240px] text-[17px]" /></div>

      <Stack className="absolute left-[1225px] top-[612px] w-[400px]" start={1}>
        {startError&&<p role="alert" className="text-red-700 font-bold">{startError}</p>}
        <Item v="pop"><Button style={lessonButtonStyle(available||firstStartable)} size="lg" arrow icon={<Rocket size={26} strokeWidth={2.4} />} className="w-full h-[78px] uppercase text-[22px] px-6 whitespace-nowrap" sound="whoosh" disabled={starting||(!available&&!firstStartable)} onClick={openLesson}>{starting?'Starting...':available?.status==='completed'?'Practise again':hasOpened(available||firstStartable)?'Continue lesson':"Let’s start"}</Button></Item>
        <Item v="pop" className="mt-4 grid grid-cols-2 gap-4"><Button variant="ghost" size="md" icon={<Pencil size={20} />} className="h-[68px] uppercase text-[17px] px-4 whitespace-nowrap" disabled={!practiceLesson} onClick={() => enterLesson(practiceLesson)}>Practise</Button><Button variant="ghost" size="md" icon={<ClipboardCheck size={20} />} className="h-[68px] uppercase text-[17px] px-4 whitespace-nowrap" onClick={() => nav(`/tests?subject=${world}`)}>Take Test</Button></Item>
      </Stack>
    </Page>
  )
}
