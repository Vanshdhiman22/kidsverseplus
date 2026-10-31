import React, { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { GameProvider, useGame } from './state/GameProvider.jsx'
import BackButton from './components/BackButton.jsx'
import NavDrawer from './components/NavDrawer.jsx'
import { useTrailRecorder } from './lib/nav.js'
import Stage from './components/Stage.jsx'
import ScreenErrorBoundary from './components/ScreenErrorBoundary.jsx'
import Cosmos from './components/Cosmos.jsx'
import NovaIsland from './components/NovaIsland.jsx'
import SettingsSheet from './components/SettingsSheet.jsx'
import NovaAgent from './components/NovaAgent.jsx'
import MusicPlayer from './components/MusicPlayer.jsx'
import Landing from './screens/Landing.jsx'
import MockInspector from './components/MockInspector.jsx'
import DevDummyNavigator from './components/DevDummyNavigator.jsx'
import MockDemo from './screens/MockDemo.jsx'
import MockParentGate from './screens/MockParentGate.jsx'
import DemoEntry from './screens/DemoEntry.jsx'
import { API_MODE, getToken } from './lib/api.js'
import { needsSignIn } from './lib/route-access.js'
import ParentGate from './components/ParentGate.jsx'
import { hasParentAccess } from './lib/parent-access.js'
import { isReviewMode, exitReviewMode } from './lib/reviewMode.js'
import AuditBridge from './components/AuditBridge.jsx'
import usePrefetch from './lib/useRoutePrefetch.js'
const ApiAudit = import.meta.env.DEV ? lazy(() => import('./screens/ApiAudit.jsx')) : null
const MockApiReview = import.meta.env.DEV ? lazy(() => import('./screens/MockApiReview.jsx')) : null

const lazyScreen = p => lazy(p)
const ParentLogin = lazyScreen(() => import('./screens/ParentLogin.jsx'))
const ForgotPassword = lazyScreen(() => import('./screens/ForgotPassword.jsx'))
const CreateAccount = lazyScreen(() => import('./screens/CreateAccount.jsx'))
const CreateChild = lazyScreen(() => import('./screens/CreateChild.jsx'))
const ParentWhatsApp = lazyScreen(() => import('./screens/ParentWhatsApp.jsx'))
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
const GuidedLearning = lazyScreen(() => import('./screens/GuidedLearning.jsx'))
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
const ChallengePractice = lazyScreen(() => import('./screens/ChallengePractice.jsx'))
const BattleOpponents = lazyScreen(() => import('./screens/BattleOpponents.jsx'))
const BattlePreview = lazyScreen(() => import('./screens/BattlePreview.jsx'))
const Battle = lazyScreen(() => import('./screens/Battle.jsx'))
const BattleResult = lazyScreen(() => import('./screens/BattleResult.jsx'))
const Leaderboard = lazyScreen(() => import('./screens/Leaderboard.jsx'))
const Profile = lazyScreen(() => import('./screens/Profile.jsx'))
const OurJourney = lazyScreen(() => import('./screens/OurJourney.jsx'))
const BreakPasses = lazyScreen(() => import('./screens/BreakPasses.jsx'))
const SwitchStudent = lazyScreen(() => import('./screens/SwitchStudent.jsx'))
const ParentOverview = lazyScreen(() => import('./screens/ParentOverview.jsx'))
const ParentEvidence = lazyScreen(() => import('./screens/ParentEvidence.jsx'))
const ParentPlan = lazyScreen(() => import('./screens/ParentPlan.jsx'))
const ApiTestLab = lazyScreen(() => import('./screens/ApiTestLab.jsx'))
const ScreenIndex = lazyScreen(() => import('./screens/ScreenIndex.jsx'))
const ContentPreview = lazyScreen(() => import('./screens/ContentPreview.jsx'))

/* Route list, kept as the single place the screen order is written down. */
export const SCREENS = [
  ['/', '01 Landing'], ['/parent/login', '02 Parent Login'], ['/parent/forgot-password', '02a Forgot Password'], ['/parent/create-account', '02b Create Account'], ['/onboarding/child', '03 Create Child'], ['/onboarding/whatsapp', '03b Parent WhatsApp'], ['/onboarding/grade-board', '04 Learning Setup'],
  ['/onboarding/avatar', '05 Avatar'], ['/onboarding/interests', '06 Interests'], ['/onboarding/goals', '07 Goals'], ['/onboarding/nova', '08 Meet Nova'],
  ['/welcome', '09 First Welcome'], ['/home', '10 Home'], ['/learn', '11 Learn Hub'], ['/journey', '12 Journey Map'], ['/learn/topics/maths', '13 Topic'],
  ['/missions/fractions', '14 Lesson Â· Discover'], ['/missions/fractions/learn', '15 Learn Before Quiz'], ['/missions/fractions/spot-mistake', '16 Spot the Mistake'], ['/missions/fractions/complete', '17 Mission Complete'],
  ['/tests', '18 Test Arena'], ['/tests/mixed/intro', '19 Test Intro'], ['/tests/mixed/question', '20 Test Question'], ['/tests/mixed/result', '21 Test Result'],
  ['/extra', '22 Extra Learning'], ['/extra/reading', '23 Reading Fluency'], ['/extra/confidence', '24 Confidence Mission'], ['/challenge', '25 Challenge Home'],
  ['/challenge/opponents', '26 Battle Opponents'], ['/challenge/preview', '27 Battle Preview'], ['/challenge/battle', '28 Battle'], ['/challenge/result', '29 Battle Result'],
  ['/challenge/leaderboard', '30 Leaderboard'], ['/profile', '31 Profile'], ['/profile/journey', '32 Our Journey'], ['/profile/break-passes', '32a Break Passes'], ['/switch', '33 Switch Student'],
  ['/parent', '34 Parent Overview'], ['/parent/evidence', '35 Parent Topic Evidence'], ['/parent/plan', '36 Parent Next Plan'],
  ['/api-test', 'Dev Â· API Test Lab'],
  ['/screens', 'Dev Â· Screen Index'],
]

/* Space-themed placeholder while a lazy chunk loads (a few ms on a warm cache). */
const Loading = () => <div className="screen grid place-items-center" role="status" aria-label="Loading screen"><motion.div className="w-[64px] h-[64px] rounded-full border-4 border-t-transparent" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }} /></div>

/* Screens with nobody signed in yet hide the progress pill; screens whose top centre is busy
   (lesson rail, question counter) hide the idle pill but still get the pop-ups. */
const NO_ISLAND = new Set(['/', '/parent/login', '/onboarding/child', '/onboarding/parent-details', '/onboarding/whatsapp', '/onboarding/grade-board', '/onboarding/avatar', '/onboarding/interests', '/onboarding/goals', '/onboarding/nova'])
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


function SessionGate({ children }) {
  useGame() // Recheck the browser session when sign-in/out updates account state.
  const location = useLocation()
  const nav = useNavigate()
  const [,refreshGate] = useState(0)
  if (API_MODE === 'live' && needsSignIn({ ...location, token: getToken(), review: isReviewMode(), development: import.meta.env.DEV })) return <Navigate to="/parent/login" replace />
  if (API_MODE === 'live' && !isReviewMode() && /^\/parent(?:\/evidence|\/plan)?$/.test(location.pathname) && !hasParentAccess(sessionStorage,getToken())) return <ParentGate onPass={()=>refreshGate(value=>value+1)} onCancel={()=>nav('/home')} />
  return children
}

function PreviewNotice() {
  useLocation()
  if (!isReviewMode()) return null
  return <div className="fixed bottom-2 left-1/2 z-[200] flex -translate-x-1/2 items-center gap-3 rounded-full border border-violet-200 bg-white px-4 py-2 text-sm font-bold text-indigo-950 shadow" role="status">Sample preview<button type="button" className="underline" onClick={exitReviewMode}>Exit preview</button></div>
}

function Routed() {
  const location = useLocation()
  useTrailRecorder()
  usePrefetch()
  /* No `mode="wait"`: the arriving screen starts drawing immediately and the
     old one fades out underneath it, so a click reads as instant. */
  return (
    <AnimatePresence initial={false}>
      <Suspense fallback={<Loading />} key={location.pathname + location.search}>
        <Routes location={location}>
          <Route path="/" element={<Landing />} />
          <Route path="/parent/login" element={<ParentLogin />} />
          <Route path="/demo" element={<DemoEntry />} />
          <Route path="/parent/forgot-password" element={<ForgotPassword />} />
          <Route path="/parent/create-account" element={<CreateAccount />} />
          <Route path="/onboarding/child" element={<CreateChild />} />
          <Route path="/onboarding/parent-details" element={<Navigate to="/onboarding/whatsapp" replace />} />
          <Route path="/onboarding/whatsapp" element={<ParentWhatsApp />} />
          <Route path="/onboarding/grade-board" element={<LearningSetup />} />
          <Route path="/onboarding/avatar" element={<Avatar />} />
          <Route path="/onboarding/interests" element={<Interests />} />
          <Route path="/onboarding/goals" element={<Goals />} />
          <Route path="/onboarding/nova" element={<MeetNova />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/home" element={<Home />} />
          <Route path="/learn" element={<LearnHub />} />
          <Route path="/journey" element={<Journey />} />
          <Route path="/learn/topics/:world" element={<Topic />} />
          <Route path="/missions/fractions" element={<Navigate to={`/missions/fractions/learn${location.search}`} replace />} />
          <Route path="/missions/fractions/learn" element={<GuidedLearning />} />
          {API_MODE === 'mock' && <Route path="/content-preview" element={<ContentPreview />} />}
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
          <Route path="/challenge/practice" element={<ChallengePractice />} />
          <Route path="/challenge/opponents" element={<BattleOpponents />} />
          <Route path="/challenge/preview" element={<BattlePreview />} />
          <Route path="/challenge/battle" element={<Battle />} />
          <Route path="/challenge/result" element={<BattleResult />} />
          <Route path="/challenge/leaderboard" element={<Leaderboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/journey" element={<OurJourney />} />
          <Route path="/profile/break-passes" element={<BreakPasses />} />
          <Route path="/switch" element={<SwitchStudent />} />
          {API_MODE==='mock' && <Route path="/mock/parent-pin" element={<MockParentGate/>}/>}
          <Route path="/parent" element={<ParentOverview />} />
          <Route path="/parent/evidence" element={<ParentEvidence />} />
          <Route path="/parent/plan" element={<ParentPlan />} />
          <Route path="/api-test" element={<ApiTestLab />} />
          <Route path="/screens" element={<ScreenIndex />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  )
}

export default function App() {
  if(import.meta.env.DEV && API_MODE==='mock' && window.location.pathname==='/mock-api-review')return <Suspense fallback={<div>Loading mock API responsesâ€¦</div>}><MockApiReview/></Suspense>
  if(API_MODE==='mock' && window.location.pathname==='/mock-demo') return <GameProvider><MockDemo/></GameProvider>
  if (import.meta.env.DEV && window.location.pathname === '/api-audit') return <Suspense fallback={<div>Loading API auditâ€¦</div>}><ApiAudit /></Suspense>
  return (
    <ScreenErrorBoundary><BrowserRouter>
      <GameProvider>
        <MotionConfig reducedMotion="user">
          <Cosmos lite />
          <MusicPlayer />
          <AuditBridge />
          {API_MODE==='mock'&&<><MockInspector /><DevDummyNavigator screens={SCREENS} /></>}
          <Stage><SessionGate><Routed /></SessionGate><NavDrawer /><BackButton /><Overlays /></Stage><PreviewNotice />
        </MotionConfig>
      </GameProvider>
    </BrowserRouter></ScreenErrorBoundary>
  )
}
