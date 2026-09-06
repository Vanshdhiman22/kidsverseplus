import React, { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { GameProvider } from './state/GameProvider.jsx'
import Stage from './components/Stage.jsx'
import Cosmos from './components/Cosmos.jsx'
import NovaIsland from './components/NovaIsland.jsx'
import SettingsSheet from './components/SettingsSheet.jsx'
import NovaAgent from './components/NovaAgent.jsx'
import MusicPlayer from './components/MusicPlayer.jsx'
import Landing from './screens/Landing.jsx'

const lazyScreen = p => lazy(p)
const ParentLogin = lazyScreen(() => import('./screens/ParentLogin.jsx'))
const CreateChild = lazyScreen(() => import('./screens/CreateChild.jsx'))
const LearningSetup = lazyScreen(() => import('./screens/LearningSetup.jsx'))
const Avatar = lazyScreen(() => import('./screens/Avatar.jsx'))
const Interests = lazyScreen(() => import('./screens/Interests.jsx'))
const Goals = lazyScreen(() => import('./screens/Goals.jsx'))
const MeetNova = lazyScreen(() => import('./screens/MeetNova.jsx'))
const Welcome = lazyScreen(() => import('./screens/Welcome.jsx'))
const Home = lazyScreen(() => import('./screens/Home.jsx'))
const LearnHub = lazyScreen(() => import('./screens/LearnHub.jsx'))
const Journey = lazyScreen(() => import('./screens/Journey.jsx'))
const Topic = lazyScreen(() => import('./screens/Topic.jsx'))
const LessonDiscover = lazyScreen(() => import('./screens/LessonDiscover.jsx'))
const ExplainWay = lazyScreen(() => import('./screens/ExplainWay.jsx'))
const SpotMistake = lazyScreen(() => import('./screens/SpotMistake.jsx'))
const MissionComplete = lazyScreen(() => import('./screens/MissionComplete.jsx'))
const TestArena = lazyScreen(() => import('./screens/TestArena.jsx'))
const TestIntro = lazyScreen(() => import('./screens/TestIntro.jsx'))
const TestQuestion = lazyScreen(() => import('./screens/TestQuestion.jsx'))
const TestResult = lazyScreen(() => import('./screens/TestResult.jsx'))
const ExtraLearning = lazyScreen(() => import('./screens/ExtraLearning.jsx'))
const ReadingFluency = lazyScreen(() => import('./screens/ReadingFluency.jsx'))
const ConfidenceMission = lazyScreen(() => import('./screens/ConfidenceMission.jsx'))
const ChallengeHome = lazyScreen(() => import('./screens/ChallengeHome.jsx'))
const BattleOpponents = lazyScreen(() => import('./screens/BattleOpponents.jsx'))
const BattlePreview = lazyScreen(() => import('./screens/BattlePreview.jsx'))
const Battle = lazyScreen(() => import('./screens/Battle.jsx'))
const BattleResult = lazyScreen(() => import('./screens/BattleResult.jsx'))
const Leaderboard = lazyScreen(() => import('./screens/Leaderboard.jsx'))
const Profile = lazyScreen(() => import('./screens/Profile.jsx'))
const OurJourney = lazyScreen(() => import('./screens/OurJourney.jsx'))
const SwitchStudent = lazyScreen(() => import('./screens/SwitchStudent.jsx'))
const ParentOverview = lazyScreen(() => import('./screens/ParentOverview.jsx'))
const ParentEvidence = lazyScreen(() => import('./screens/ParentEvidence.jsx'))
const ParentPlan = lazyScreen(() => import('./screens/ParentPlan.jsx'))

/* Route list, kept as the single place the screen order is written down. */
export const SCREENS = [
  ['/', '01 Landing'], ['/parent/login', '02 Parent Login'], ['/onboarding/child', '03 Create Child'], ['/onboarding/grade-board', '04 Learning Setup'],
  ['/onboarding/avatar', '05 Avatar'], ['/onboarding/interests', '06 Interests'], ['/onboarding/goals', '07 Goals'], ['/onboarding/nova', '08 Meet Nova'],
  ['/welcome', '09 First Welcome'], ['/home', '10 Home'], ['/learn', '11 Learn Hub'], ['/journey', '12 Journey Map'], ['/learn/topics/fractions', '13 Topic'],
  ['/missions/fractions', '14 Lesson · Discover'], ['/missions/fractions/explain', '15 Explain Another Way'], ['/missions/fractions/spot-mistake', '16 Spot the Mistake'], ['/missions/fractions/complete', '17 Mission Complete'],
  ['/tests', '18 Test Arena'], ['/tests/mixed/intro', '19 Test Intro'], ['/tests/mixed/question', '20 Test Question'], ['/tests/mixed/result', '21 Test Result'],
  ['/extra', '22 Extra Learning'], ['/extra/reading', '23 Reading Fluency'], ['/extra/confidence', '24 Confidence Mission'], ['/challenge', '25 Challenge Home'],
  ['/challenge/opponents', '26 Battle Opponents'], ['/challenge/preview', '27 Battle Preview'], ['/challenge/battle', '28 Battle'], ['/challenge/result', '29 Battle Result'],
  ['/challenge/leaderboard', '30 Leaderboard'], ['/profile', '31 Profile'], ['/profile/journey', '32 Our Journey'], ['/switch', '33 Switch Student'],
  ['/parent', '34 Parent Overview'], ['/parent/evidence', '35 Parent Topic Evidence'], ['/parent/plan', '36 Parent Next Plan'],
]

/* Space-themed placeholder while a lazy chunk loads (a few ms on a warm cache). */
const Loading = () => <div className="screen grid place-items-center"><motion.div className="w-[64px] h-[64px] rounded-full border-4 border-t-transparent" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }} /></div>

/* Screens with nobody signed in yet hide the progress pill; screens whose top centre is busy
   (lesson rail, question counter) hide the idle pill but still get the pop-ups. */
const NO_ISLAND = new Set(['/', '/parent/login', '/onboarding/child', '/onboarding/grade-board', '/onboarding/avatar', '/onboarding/interests', '/onboarding/goals', '/onboarding/nova'])
/* Screens whose top bar already carries the numbers, or whose top centre is busy:
   the resting pill stays away, but XP and level-up still pop through. */
const QUIET_ISLAND = ['/missions', '/tests', '/extra/', '/challenge/battle', '/challenge/preview', '/challenge/result', '/parent', '/switch']

function Overlays() {
  const { pathname } = useLocation()
  if (NO_ISLAND.has(pathname)) return <><SettingsSheet /><NovaAgent /></>
  return (
    <>
      <NovaIsland hidden={QUIET_ISLAND.some(p => pathname.startsWith(p))} />
      <SettingsSheet />
      <NovaAgent />
    </>
  )
}

/* Warm every route chunk and every backdrop while the machine is idle, so a tap
   never waits on the network or on a 3344px image decode. Runs once, after the
   first screen has settled, in small batches so it never competes with paint. */
function usePrefetch() {
  useEffect(() => {
    const net = navigator.connection
    if (net?.saveData || /2g/.test(net?.effectiveType ?? '')) return   // never spend a metered connection on this
    let dead = false
    const idle = window.requestIdleCallback ?? (fn => setTimeout(fn, 1))
    const chunks = [
      () => import('./screens/Home.jsx'), () => import('./screens/LearnHub.jsx'), () => import('./screens/TestArena.jsx'),
      () => import('./screens/ChallengeHome.jsx'), () => import('./screens/Profile.jsx'), () => import('./screens/Journey.jsx'),
      () => import('./screens/Topic.jsx'), () => import('./screens/LessonDiscover.jsx'), () => import('./screens/ExplainWay.jsx'),
      () => import('./screens/SpotMistake.jsx'), () => import('./screens/MissionComplete.jsx'), () => import('./screens/TestIntro.jsx'),
      () => import('./screens/TestQuestion.jsx'), () => import('./screens/TestResult.jsx'), () => import('./screens/ExtraLearning.jsx'),
      () => import('./screens/ReadingFluency.jsx'), () => import('./screens/ConfidenceMission.jsx'), () => import('./screens/BattleOpponents.jsx'),
      () => import('./screens/BattlePreview.jsx'), () => import('./screens/Battle.jsx'), () => import('./screens/BattleResult.jsx'),
      () => import('./screens/Leaderboard.jsx'), () => import('./screens/OurJourney.jsx'), () => import('./screens/SwitchStudent.jsx'),
      () => import('./screens/ParentOverview.jsx'), () => import('./screens/ParentEvidence.jsx'), () => import('./screens/ParentPlan.jsx'),
      () => import('./screens/Welcome.jsx'), () => import('./screens/Interests.jsx'), () => import('./screens/Goals.jsx'),
      () => import('./screens/Avatar.jsx'), () => import('./screens/MeetNova.jsx'), () => import('./screens/CreateChild.jsx'),
      () => import('./screens/LearningSetup.jsx'), () => import('./screens/ParentLogin.jsx'),
    ]
    const scenes = ['home', 'learn', 'arena', 'challenge', 'profile', 'journey', 'topic', 'discover', 'explain', 'spot',
      'complete', 'intro', 'question', 'result', 'extra', 'reading', 'confidence', 'opponents', 'preview', 'battle',
      'bresult', 'league', 'ourjourney', 'switch', 'parent', 'evidence', 'plan', 'welcome', 'interests', 'goals',
      'avatar', 'nova', 'child', 'setup', 'login', 'landing']
    const queue = [...chunks.map(f => () => f().catch(() => {})),
      ...scenes.map(n => () => { const i = new Image(); i.src = `/art/scenes/${n}.webp`; return i.decode?.().catch(() => {}) })]
    let i = 0
    const pump = () => {
      if (dead || i >= queue.length) return
      Promise.all(queue.slice(i, i + 3).map(f => f())).finally(() => { i += 3; idle(pump) })
    }
    const t = setTimeout(() => idle(pump), 900)
    return () => { dead = true; clearTimeout(t) }
  }, [])
}

function Routed() {
  const location = useLocation()
  usePrefetch()
  /* No `mode="wait"`: the arriving screen starts drawing immediately and the
     old one fades out underneath it, so a click reads as instant. */
  return (
    <AnimatePresence initial={false}>
      <Suspense fallback={<Loading />} key={location.pathname}>
        <Routes location={location}>
          <Route path="/" element={<Landing />} />
          <Route path="/parent/login" element={<ParentLogin />} />
          <Route path="/onboarding/child" element={<CreateChild />} />
          <Route path="/onboarding/grade-board" element={<LearningSetup />} />
          <Route path="/onboarding/avatar" element={<Avatar />} />
          <Route path="/onboarding/interests" element={<Interests />} />
          <Route path="/onboarding/goals" element={<Goals />} />
          <Route path="/onboarding/nova" element={<MeetNova />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/home" element={<Home />} />
          <Route path="/learn" element={<LearnHub />} />
          <Route path="/journey" element={<Journey />} />
          <Route path="/learn/topics/fractions" element={<Topic />} />
          <Route path="/missions/fractions" element={<LessonDiscover />} />
          <Route path="/missions/fractions/explain" element={<ExplainWay />} />
          <Route path="/missions/fractions/spot-mistake" element={<SpotMistake />} />
          <Route path="/missions/fractions/complete" element={<MissionComplete />} />
          <Route path="/tests" element={<TestArena />} />
          <Route path="/tests/mixed/intro" element={<TestIntro />} />
          <Route path="/tests/mixed/question" element={<TestQuestion />} />
          <Route path="/tests/mixed/result" element={<TestResult />} />
          <Route path="/extra" element={<ExtraLearning />} />
          <Route path="/extra/reading" element={<ReadingFluency />} />
          <Route path="/extra/confidence" element={<ConfidenceMission />} />
          <Route path="/challenge" element={<ChallengeHome />} />
          <Route path="/challenge/opponents" element={<BattleOpponents />} />
          <Route path="/challenge/preview" element={<BattlePreview />} />
          <Route path="/challenge/battle" element={<Battle />} />
          <Route path="/challenge/result" element={<BattleResult />} />
          <Route path="/challenge/leaderboard" element={<Leaderboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/journey" element={<OurJourney />} />
          <Route path="/switch" element={<SwitchStudent />} />
          <Route path="/parent" element={<ParentOverview />} />
          <Route path="/parent/evidence" element={<ParentEvidence />} />
          <Route path="/parent/plan" element={<ParentPlan />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <GameProvider>
        <MotionConfig reducedMotion="user">
          <Cosmos lite />
          <MusicPlayer />
          <Stage><Routed /><Overlays /></Stage>
        </MotionConfig>
      </GameProvider>
    </BrowserRouter>
  )
}
