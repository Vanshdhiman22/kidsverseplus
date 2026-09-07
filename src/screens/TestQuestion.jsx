import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { AlarmClock, Volume2, Star, Check } from 'lucide-react'
import Scene, { Cutout } from '../components/Scene.jsx'
import Page, { Stack, Item } from '../components/Page.jsx'
import { TopBar } from '../components/TopBar.jsx'
import { Panel, Card } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import Character from '../components/Character.jsx'
import SpeechBubble from '../components/SpeechBubble.jsx'
import { Fraction } from '../components/Widgets.jsx'
import { QUESTIONS } from '../data/catalog.js'
import { useGame } from '../state/GameProvider.jsx'
import { sfx } from '../lib/sound.js'
import { cn } from '../lib/utils.js'

const LETTERS = ['A', 'B', 'C', 'D']

export default function TestQuestion() {
  const nav = useNavigate()
  const g = useGame(); const { name } = g.state.profile
  const [qi, setQi] = useState(0)
  const [pick, setPick] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [secs, setSecs] = useState(8 * 60 + 15)
  /* The result screen used to invent every number it showed. The run's own answers and
     clock are carried out of here instead. */
  const START = 8 * 60 + 15
  const [correct, setCorrect] = useState(0)
  const q = QUESTIONS[qi]
  /* Was `total = 10, shown = qi + 3` -- staged for the design render. The child now
     arrives here straight from the daily mission, so the count has to be the real one. */
  const total = QUESTIONS.length, shown = qi + 1
  useEffect(() => { const id = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000); return () => clearInterval(id) }, [])
  const mm = String(Math.floor(secs / 60)).padStart(2, '0'), ss = String(secs % 60).padStart(2, '0')
  const submit = () => {
    if (pick == null) return
    if (submitted) {
      if (qi + 1 >= QUESTIONS.length) {
        sfx.whoosh()
        nav('/tests/mixed/result', { state: { correct, total: QUESTIONS.length, seconds: START - secs } })
        return
      }
      setQi(qi + 1); setPick(null); setSubmitted(false); sfx.tap(); return
    }
    setSubmitted(true)
    if (pick === q.answer) { setCorrect(c => c + 1); sfx.success() } else sfx.wrong()
  }
  return (
    <Page>
      <Scene name="question" />
      <TopBar right={<motion.div className="pill h-[84px] px-6 gap-4" animate={secs < 60 ? { scale: [1, 1.04, 1] } : {}} transition={{ duration: 1, repeat: Infinity }}><span className="icon-orb w-[50px] h-[50px]"><AlarmClock size={28} /></span><span className="leading-tight"><span className="block font-display font-extrabold text-[36px] text-ink tabular-nums leading-none">{mm}:{ss}</span><span className="label-caps">Time remaining</span></span></motion.div>} showControls={false} />
      <motion.div className="absolute left-[360px] top-[36px] pl-6 border-l-2 border-[var(--line)]" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}><div className="eyebrow text-[15px]">Test Mode</div><div className="font-display font-extrabold text-[26px] leading-none text-ink uppercase">Mixed Concept Test</div><div className="text-[15px] font-semibold text-ink-3">Focused assessment. You've got this! 🚀</div></motion.div>
      <motion.div className="absolute left-[795px] top-[50px] flex items-center gap-5" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <span className="pill h-[50px] px-5 font-display font-extrabold text-[19px] text-primary-ink uppercase">Question {shown} / {total}</span>
        <div className="relative w-[270px] h-[12px] rounded-full bg-[var(--lavender-2)] overflow-hidden"><motion.div className="absolute left-0 top-0 h-full rounded-full" style={{ background: 'var(--grad-primary)' }} animate={{ width: `${(shown / total) * 100}%` }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} /></div>
        <span className="font-display font-extrabold text-[20px] text-ink">{Math.round((shown / total) * 100)}%</span>
      </motion.div>

      <Character src="/art/hd/q-boy.webp" w={260} x={95} y={170} delay={0.14} podium />
      <motion.div className="absolute left-[55px] top-[725px] pill h-[80px] px-5 gap-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}><span className="icon-orb w-[50px] h-[50px] text-gold" style={{ background: 'rgba(251,191,36,.16)' }}><Star size={26} fill="currentColor" /></span><span className="leading-tight"><span className="block font-display font-extrabold text-[22px] text-ink">{name}</span><span className="block text-[15px] font-semibold text-primary-ink">Explorer in Learning</span></span></motion.div>
      <Character src="/art/hd/q-nova.webp" w={230} x={1395} y={370} delay={0.17} amp={10} />
      <div className="absolute left-[1355px] top-[190px]"><SpeechBubble tail="bottom" text="Read the question aloud if you need, Explorer. ✨" delay={0.3} className="w-[200px] text-[17px]" /></div>
      <motion.button className="absolute left-[1575px] top-[262px] w-[64px] h-[64px] rounded-full pill justify-center text-primary-ink" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => sfx.success()} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring' }}><Volume2 size={28} /></motion.button>
      <motion.div className="absolute left-[1345px] top-[725px] pill h-[80px] px-5 gap-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}><img src="/art/22-novahead.webp" alt="" className="w-[50px]" /><span className="leading-tight"><span className="block font-display font-extrabold text-[22px] text-ink">Nova</span><span className="block text-[15px] font-semibold text-primary-ink">Your AI Learning Buddy</span></span></motion.div>

      <Panel className="absolute left-[360px] top-[165px] w-[955px] h-[500px] p-8" initial="hidden" animate="show">
        <motion.div key={`q${qi}`} initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="flex items-center justify-center gap-4 font-display font-extrabold text-[40px] text-ink">{q.q} <Fraction n={q.frac[0]} d={q.frac[1]} size={24} /> ?</motion.div>
        <Stack key={`o${qi}`} className="mt-6 grid grid-cols-4 gap-6" start={0.2} delay={0.08}>
              {q.options.map(([n, d], i) => {
                const on = pick === i; const right = submitted && i === q.answer; const wrongPick = submitted && on && i !== q.answer
                return (
                  <Item key={i} v="pop"><Card hover={!submitted} selected={on && !submitted} className={cn('relative h-[290px] flex flex-col items-center pt-5 overflow-hidden', wrongPick && 'shake')} style={right ? { boxShadow: '0 0 0 3px #22c55e, 0 20px 40px -16px rgba(34,197,94,.5)', borderColor: '#22c55e' } : wrongPick ? { boxShadow: '0 0 0 3px #ef4444', borderColor: '#ef4444' } : undefined} onClick={() => { if (!submitted) { sfx.select(); setPick(i) } }}>
                    <div className="w-full px-4 flex items-center justify-between"><span className={cn('w-[40px] h-[40px] rounded-full grid place-items-center font-display font-extrabold text-[20px]', on || right ? 'text-white' : 'text-primary-ink bg-[var(--lavender)]')} style={on || right ? { background: right ? '#22c55e' : 'var(--grad-primary)' } : undefined}>{LETTERS[i]}</span>{on || right ? <motion.span className="w-[34px] h-[34px] rounded-full grid place-items-center text-white" style={{ background: right ? '#22c55e' : 'var(--grad-primary)' }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}><Check size={20} strokeWidth={3.5} /></motion.span> : <span className="radio" />}</div>
                    <div className="flex-1 grid place-items-center text-ink"><Fraction n={n} d={d} size={54} /></div>
                    <AnimatePresence>{right && <motion.div className="w-full py-3 text-center" style={{ background: 'var(--success-bg)', color: 'var(--success-ink)' }} initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }} transition={{ type: 'spring', stiffness: 300, damping: 24 }}><div className="font-extrabold text-[18px] flex items-center justify-center gap-2"><Check size={18} strokeWidth={3.5} /> Great job!</div><div className="text-[14px] font-semibold">That's correct.</div></motion.div>}</AnimatePresence>
                    <AnimatePresence>{wrongPick && <motion.div className="w-full py-3 text-center" style={{ background: 'var(--danger-bg)', color: 'var(--danger-ink)' }} initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }}><div className="font-extrabold text-[18px]">Not quite</div><div className="text-[14px] font-semibold">Look at the green one.</div></motion.div>}</AnimatePresence>
                  </Card></Item>
                )
              })}
        </Stack>
      </Panel>
      <motion.div className="absolute left-[530px] top-[665px]" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Button size="lg" arrow className="w-[600px] h-[112px] uppercase text-[32px]" sub={submitted ? (qi + 1 >= QUESTIONS.length ? 'See your results' : 'Next question') : 'Review your choice and submit'} disabled={pick == null} sound="whoosh" onClick={submit}>{submitted ? (qi + 1 >= QUESTIONS.length ? 'Finish Test' : 'Next Question') : 'Submit Answer'}</Button>
      </motion.div>
    </Page>
  )
}
