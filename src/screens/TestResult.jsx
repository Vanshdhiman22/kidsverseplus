import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Star, Clock, Target, TrendingUp, Rocket, Gamepad2, Check, RefreshCw, ChevronRight, Award } from 'lucide-react'
import Scene, { Child } from '../components/Scene.jsx'
import Page, { Stack, Item } from '../components/Page.jsx'
import { TopBar, UserChip } from '../components/TopBar.jsx'
import { Panel, Card } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import { Ring, Counter, Confetti, Sparkles } from '../components/Widgets.jsx'
import { useGame } from '../state/GameProvider.jsx'
import { gradeLabel } from '../data/catalog.js'
import { sfx } from '../lib/sound.js'
import PerfectScorePopup from '../components/PerfectScorePopup.jsx'
import AttemptReview from '../components/AttemptReview.jsx'
import { useRouteContent, withSubject } from '../content/index.js'

export default function TestResult() {
  const nav = useNavigate()
  const g = useGame(); const { name, face, grade } = g.state.profile
  const [showReview, setShowReview] = useState(false)
  const pkg = useRouteContent()
  /* The run's real numbers, handed over by TestQuestion. Opened directly (a bookmark, a
     refresh) there is no run to report, so the score reads as not-taken rather than as a
     confident 8 / 10 nobody earned. */
  const routeRun = useLocation().state
  let savedRun = null
  try { savedRun = JSON.parse(sessionStorage.getItem('kv:last-test-run') || 'null') } catch {}
  const run = routeRun?.attemptId || routeRun?.runId ? routeRun : savedRun
  const score = run ? `${run.correct} / ${run.total}` : '—'
  const pct = run && run.total ? Math.round((run.correct / run.total) * 100) : 0
  const mins = run ? Math.max(1, Math.round(run.seconds / 60)) : null
  const timeTaken = mins ? `${mins} min` : '—'
  /* The breakdown bar read 8 correct / 2 attempted / 2 incorrect out of a 12 that matched
     nothing, directly under the real score. It is the same run, counted. */
  /* Raw #22c55e measured 2.20:1 against this panel in light mode -- below the 3:1 floor
     for a non-text swatch, so the Correct dot and its bar were barely there on white. The
     tokens carry a per-theme pair (4.85:1 light, 13.03:1 dark) and flip on their own. */
  const breakdown = [
    ['var(--success-ink)', 'Correct', run ? run.correct : 0],
    ['var(--danger-ink)', 'Incorrect', run ? run.total - run.correct : 0],
  ]
  useEffect(() => {
    if (!run?.attemptId && !run?.runId) { nav('/tests/mixed/intro', { replace: true }); return }
    const t = setTimeout(() => pct >= 70 ? sfx.success() : sfx.wrong(), 500)
    const rewardKey = `kv:rewarded:${run.attemptId || run.runId}`
    const t2 = setTimeout(() => { if (!localStorage.getItem(rewardKey)) { localStorage.setItem(rewardKey, '1'); g.finishQuiz(); g.recordTest(run) }; if (!run.local) g.refreshStats().catch(e => g.notice(e.message)) }, 1600)
    return () => { clearTimeout(t); clearTimeout(t2) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const mood = pct < 70 ? { heading: `Let’s practise, ${name}`, sub: 'Nova will help with the questions that felt tricky.' } : pct < 95 ? { heading: `Good progress, ${name}`, sub: 'Review your answers, then try once more.' } : { heading: `Great work, ${name}`, sub: 'Your skills are getting stronger.' }
  const wrongAnswers = run?.review?.filter(item => !item.correct) || []
  const rightAnswers = run?.review?.filter(item => item.correct) || []
  return (
    <Page>
      <Scene name="result" />
      <Child screen="result" delay={0.5} amp={7} />
      {pct >= 95 && <Confetti count={140} />}
      <TopBar back={false} right={<UserChip name={name} sub={gradeLabel(grade)} face={face} />} showControls={false} />
      <Stack className="absolute left-[160px] top-[135px]" start={0.2}>
        <Item v="pop"><span className="chip h-[44px] px-5 text-[16px] uppercase tracking-[0.12em] text-white" style={{ background: 'var(--grad-primary)' }}><Star size={18} className="text-gold" fill="currentColor" /> {run?.source === 'challenge' ? 'Challenge' : 'Test'} Result</span></Item>
        <Item><h1 className="mt-3 font-display font-extrabold text-[58px] leading-none text-ink">{mood.heading}</h1></Item>
        <Item className="mt-3 text-[22px] font-semibold text-ink-2">{mood.sub}</Item>
      </Stack>
      <Sparkles n={8} seed={21} className="left-[120px] top-[280px] w-[600px] h-[500px]" />

      <motion.div className="absolute left-[695px] top-[175px]" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.17 }}>
        <Ring size={340} stroke={22} value={pct / 100} id="res" delay={0.3}><div className="text-center leading-none"><motion.span className="inline-block text-gold" animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}><Star size={54} fill="currentColor" /></motion.span><div className="mt-2 font-display font-extrabold text-[84px] text-ink leading-none"><Counter to={pct} delay={0.3} />%</div><div className="mt-1 font-display font-extrabold text-[26px] text-primary-ink uppercase tracking-wide">Mastery</div><div className="mt-1 text-[18px] font-bold text-ink-3">Keep it up! ✨</div></div></Ring>
      </motion.div>
      <Panel className="absolute left-[650px] top-[560px] w-[405px] h-[130px] px-4 grid grid-cols-3 items-center divide-x divide-[var(--line)]" initial="hidden" animate="show">
        {[[Clock, timeTaken, 'Time Taken', '#7c5cff'], [Target, score, 'Score', '#8b5cf6'], [TrendingUp, run?.local ? 'Practice' : `+${run?.xpAwarded ?? 0} XP`, run?.local ? 'No API reward' : 'API reward', 'var(--success-ink)']].map(([I, v, l, c]) => <div key={l} className="flex flex-col items-center leading-tight"><I size={28} style={{ color: c }} /><span className="mt-1 font-display font-extrabold text-[24px] text-ink">{v}</span><span className="text-[14px] font-bold text-ink-3">{l}</span></div>)}
      </Panel>
      {/* The right-hand column starts at x=1075, so this row has to finish before it:
          the wider version ran to 1280 and sat on the Nova Recommends card. */}
      <motion.div className="absolute left-[350px] top-[725px] flex items-center gap-5" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Button size="lg" arrow icon={pct < 95 ? <RefreshCw size={28} /> : <Rocket size={28} strokeWidth={2.4} />} className="w-[470px] h-[92px] uppercase text-[23px]" sub={pct < 95 ? 'Review the idea before another attempt' : 'Focus. Improve. Master!'} sound="whoosh" onClick={() => nav(pct < 95 ? withSubject('/missions/fractions/learn') : withSubject(run?.source === 'challenge' ? '/tests/mixed/intro?source=challenge' : '/tests/mixed/intro'))}>{pct < 95 ? 'Practise First' : 'Try Another Test'}</Button>
        <Button variant="ghost" size="md" icon={<Gamepad2 size={24} />} className="w-[215px] h-[70px] px-4 uppercase text-[17px]" onClick={() => setShowReview(true)}>Review</Button>
      </motion.div>

      <Panel className="absolute left-[1075px] top-[125px] w-[495px] p-6" initial="hidden" animate="show">
        <div className="label-caps text-[14px]">Your Performance</div>
        <Stack className="mt-3 flex flex-col gap-3" start={0.8}>
          <Item v="soft"><Card className="h-[86px] px-5 flex items-center gap-4" style={{ background: 'var(--success-bg)', borderColor: '#86efac' }}><span className="w-[52px] h-[52px] rounded-full grid place-items-center text-green-600 bg-white/70"><Award size={28} /></span><span className="flex-1 leading-tight"><span className="block font-display font-extrabold text-[18px] text-green-700 uppercase">You solved {rightAnswers.length}</span><span className="block truncate text-[15px] font-bold text-ink">{rightAnswers[0]?.question || 'Keep practising the lesson'}</span></span><span className="w-[34px] h-[34px] rounded-full grid place-items-center border-2 border-green-500 text-green-600"><Check size={18} strokeWidth={3.5} /></span></Card></Item>
          <Item v="soft"><Card className="h-[86px] px-5 flex items-center gap-4" style={{ background: 'var(--danger-bg)', borderColor: '#fca5a5' }}><span className="w-[52px] h-[52px] rounded-full grid place-items-center text-red-500 bg-white/70"><RefreshCw size={26} /></span><span className="flex-1 leading-tight"><span className="block font-display font-extrabold text-[18px] text-red-600 uppercase">Review {wrongAnswers.length}</span><span className="block truncate text-[15px] font-bold text-ink">{wrongAnswers[0]?.question || 'No answers need review'}</span></span></Card></Item>
        </Stack>
      </Panel>
      <Panel className="absolute left-[1075px] top-[395px] w-[495px] p-6" initial="hidden" animate="show">
        <div className="label-caps text-[14px]">Visual Question Breakdown</div>
        <div className="mt-4 flex h-[22px] rounded-full overflow-hidden bg-[var(--lavender-2)]">
          {breakdown.map(([c, , v], i) => <motion.div key={c} style={{ background: c }} initial={{ width: 0 }} animate={{ width: `${run && run.total ? (v / run.total) * 100 : 0}%` }} transition={{ duration: 1, delay: 0.1 + i * 0.2, ease: [0.16, 1, 0.3, 1] }} />)}
        </div>
        <div className="mt-4 flex justify-between text-[17px] font-bold text-ink-2">{breakdown.map(([c, l, v]) => <span key={l} className="flex items-center gap-2"><span className="w-[14px] h-[14px] rounded-full" style={{ background: c }} />{l} <span className="font-extrabold text-ink ml-1">{v}</span></span>)}</div>
      </Panel>
      <Panel className="absolute left-[1075px] top-[555px] w-[495px] p-6" initial="hidden" animate="show">
        <div className="label-caps text-[14px]">Optional review</div>
        <Card hover className="mt-3 h-[110px] pr-5 flex items-center gap-4 overflow-hidden" onClick={() => nav(withSubject('/missions/fractions'))}>
          <img src="/art/hd/nova-v2.webp" alt="" className="h-[120px] object-contain -ml-2 floaty" />
          <span className="flex-1 leading-tight"><span className="block font-display font-extrabold text-[19px] text-primary-ink">Review {pkg.mission.title}</span><span className="block text-[15px] font-semibold text-ink-2">Go through the learning steps again.</span></span>
          <ChevronRight size={28} className="text-primary-ink" />
        </Card>
      </Panel>
      <PerfectScorePopup show={pct === 100 && !run?.local} mode={run?.source === 'challenge' ? 'challenge' : 'test'} />
      <AttemptReview open={showReview} items={run?.review || []} onClose={() => setShowReview(false)} />
    </Page>
  )
}
