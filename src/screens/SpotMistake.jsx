import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Flame, Star, Lightbulb, Headphones, Volume2, Check, Lock, RefreshCw, CircleHelp } from 'lucide-react'
import Scene, { Child } from '../components/Scene.jsx'
import Page, { Stack, Item } from '../components/Page.jsx'
import Logo from '../components/Logo.jsx'
import { Panel, Card } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import { LessonVisual } from '../components/LessonModels.jsx'
import { ACTIVE_CONTENT_ID, useContent, checkQuestion } from '../content/index.js'
import { useGame } from '../state/GameProvider.jsx'
import { bleedL, bleedR, safeB, safeT } from '../components/Stage.jsx'
import { sfx } from '../lib/sound.js'
import { cn } from '../lib/utils.js'

/* The mis-cut the child has to catch. Every model is drawn from this one array,
   so telling it another way changes the picture and never the answer: these four
   parts are not equal whichever way you look at them. */
const SPLIT = [0.34, 0.19, 0.29, 0.18]


export default function SpotMistake() {
  const nav = useNavigate()
  const g = useGame(); const { streak, xpToday } = g.state.stats
  const [picks, setPicks] = useState([])
  const [locked, setLocked] = useState(false)
  const [score, setScore] = useState(0)
  const [hints, setHints] = useState(1)
  const [wrong, setWrong] = useState(0)
  const [showWhy, setShowWhy] = useState(false)
  /* Offered right on the question, not a screen further on: a child who cannot see
     it in the pizza often sees it at once in a bar or on a number line. */
  const [model, setModel] = useState(0)
  const pkg = useContent(ACTIVE_CONTENT_ID)
  const questions = pkg.check.questions.slice(0, 6)
  const [questionIndex, setQuestionIndex] = useState(() => Math.min(pkg.check.selected ?? 0, questions.length - 1))
  /* The question, its options, the right answer, the hints for each picture and the
     feedback all come from the learning package. This file is the template. */
  const Q = questions[questionIndex] ?? checkQuestion(pkg)
  const QM = Q.models[model % Q.models.length]
  const HINTS = QM.hints
  const answers = Array.isArray(Q.answer) ? Q.answer : [Q.answer]
  const multi = Q.type === 'multi_select' || Q.type === 'pick_n' || Array.isArray(Q.answer)
  const requiredCount = Q.required_count ?? answers.length
  const answered = multi ? picks.length === requiredCount : picks.length === 1
  const correct = answered && picks.length === answers.length && picks.every(v => answers.includes(v))
  const choose = v => {
    if (locked) return
    if (!multi) {
      setPicks([v])
      setLocked(true)
      if (answers.includes(v)) { sfx.success(); setScore(value => value + 1); g.addXp(Q.xp_on_correct, Q.title) } else { sfx.wrong(); setWrong(w => w + 1) }
      return
    }

    const next = picks.includes(v)
      ? picks.filter(key => key !== v)
      : picks.length < requiredCount ? [...picks, v] : picks
    setPicks(next)
    if (next.length === requiredCount) {
      const right = next.length === answers.length && next.every(key => answers.includes(key))
      setLocked(true)
      if (right) { sfx.success(); setScore(value => value + 1); g.addXp(Q.xp_on_correct, Q.title) }
      else { sfx.wrong(); setWrong(w => w + 1) }
    } else sfx.tap()
  }
  return (
    <Page>
      <Scene name="spot" />
      <motion.div className="absolute" style={{ ...bleedL(24), ...safeT(24) }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}><Logo variant="planet" tagline="LEARN • EXPLORE • ACHIEVE" /></motion.div>
      <Panel className="absolute top-[110px] w-[250px] p-5" style={bleedL(24)} initial="hidden" animate="show">
        <div className="flex items-center gap-3"><span className="icon-orb w-[40px] h-[40px] text-orange-500" style={{ background: 'rgba(249,115,22,.14)' }}><Flame size={22} fill="currentColor" /></span><span className="leading-tight"><span className="label-caps block">Streak</span><span className="font-display font-extrabold text-[20px] text-ink">{streak} days</span></span></div>
        <div className="hairline my-4" />
        <div className="flex items-center gap-3"><span className="icon-orb w-[40px] h-[40px] text-gold" style={{ background: 'rgba(251,191,36,.16)' }}><Star size={22} fill="currentColor" /></span><span className="leading-tight"><span className="label-caps block">XP Today</span><span className="font-display font-extrabold text-[20px] text-ink"><motion.span key={xpToday} initial={{ scale: 1.4, color: '#7c5cff' }} animate={{ scale: 1, color: 'var(--ink)' }} className="inline-block">{xpToday}</motion.span> XP</span></span></div>
      </Panel>
      <Child screen="spot" delay={0.5} />

      <Panel className="absolute left-[320px] top-[90px] w-[1010px] h-[705px] p-8 overflow-hidden" initial="hidden" animate="show">
        <div className="text-center"><div className="label-caps mb-2">Question {questionIndex + 1} of {questions.length}</div><h1 className="font-display font-extrabold text-[54px] leading-none text-ink">{Q.title}</h1><motion.div className="mx-auto mt-3 h-[6px] w-[90px] rounded-full" style={{ background: 'var(--grad-primary)' }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.2 }} /><p className="mt-3 text-[21px] font-semibold text-ink-2 leading-snug">{Q.instruction.split('\n').map((l, i) => <React.Fragment key={i}>{i > 0 && <br />}{l}</React.Fragment>)}</p></div>
        {/* The thing being judged. It lives here in the DOM, not in the backdrop,
            so it can be re-drawn as a different model on request. */}
        <div className="absolute left-[255px] top-[196px]">
          {/* Keyed, but with no exit to wait on: the new model mounts at once, so
              the picture and the words that name it can never disagree. */}
          <motion.div key={`${Q.question_id}:${QM.key}:${QM.image ?? QM.image_url ?? ''}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
            <LessonVisual model={QM} split={Q.split ?? SPLIT} />
          </motion.div>
        </div>
        {/* Tucked into the corner beside NO rather than sitting between the picture
            and the answers, where it read as a third thing to choose. */}
        {Q.models.length > 1 && !locked && (
          <div className="absolute right-[26px] bottom-[26px] w-[182px] h-[150px] flex flex-col items-center justify-center gap-2">
            <Button variant="outline" size="sm" icon={<RefreshCw size={17} />} className="w-full h-[62px] px-3 text-[15px] leading-tight"
              onClick={() => { sfx.tap(); setModel(m => (m + 1) % Q.models.length) }}>Show it another way</Button>
            <span className="text-[13px] font-bold text-ink-3 text-center">Showing: {QM.label}</span>
          </div>
        )}
        {locked && (
          <motion.div className="absolute right-[26px] bottom-[26px] w-[210px]" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }}>
            <Button variant="outline" size="sm" icon={<CircleHelp size={18} />} className="w-full h-[46px] text-[16px]"
              onClick={() => { sfx.tap(); setShowWhy(open => !open) }}>{showWhy ? 'Hide Why' : 'Why?'}</Button>
            <AnimatePresence>
              {showWhy && (
                <motion.div className="mt-3 card p-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                  <div className="eyebrow text-[13px] flex items-center gap-2"><CircleHelp size={16} className="text-primary-ink" /> Why this answer?</div>
                  <div className="mt-2 max-h-[145px] overflow-y-auto pr-2 text-[14px] font-semibold text-ink-2 leading-relaxed" tabIndex={0}>
                    {Q.explanation || (correct ? Q.feedback_correct : QM.feedback_wrong)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
        <div className={cn('absolute left-[58px] bottom-[26px] grid gap-4', Q.options.length > 4 ? 'grid-cols-3 w-[704px]' : 'grid-cols-2 w-[688px]')}>
          {Q.options.map(({ key: v, label: big, sub }) => {
            const on = picks.includes(v)
            /* A wrong pick should not leave the child guessing which one was right:
               once they have answered, NO carries its green tick and colour whether
               or not it was the card they tapped. Nothing is coloured before that. */
            const right = locked && answers.includes(v)
            const wrong = locked && on && !answers.includes(v)
            /* `selected` paints its own lavender, which would sit on top of the green
               and make a right answer look merely picked, so once a card is marked
               right or wrong that colour is the one left to read. */
            return (
              <Card key={v} hover selected={on && !right && !wrong}
                className={cn('relative flex flex-col items-center justify-center text-center px-5 transition-colors', Q.options.length > 2 ? 'h-[104px]' : 'h-[150px]', right && 'bg-[var(--success-bg)]', wrong && 'bg-[var(--danger-bg)]')}
                style={right ? { boxShadow: '0 0 0 3px #22c55e, 0 20px 44px -16px rgba(34,197,94,.5)' } : wrong ? { boxShadow: '0 0 0 3px #ef4444' } : undefined}
                aria-disabled={locked} onClick={() => choose(v)}>
                <span className="absolute top-4 right-4">
                  {right || wrong
                    ? <motion.span initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                        className={cn('w-[34px] h-[34px] rounded-full grid place-items-center text-white font-extrabold', right ? 'bg-green-500' : 'bg-red-500')}>
                        {right ? <Check size={20} strokeWidth={3.5} /> : '✕'}
                      </motion.span>
                    : <span className="radio" />}
                </span>
                <span className={cn('font-display font-extrabold leading-tight', Q.options.length > 2 ? 'text-[25px]' : 'text-[46px]', right ? 'text-[var(--success-ink)]' : wrong ? 'text-[var(--danger-ink)]' : 'text-ink')}>{big}</span>
                {sub && <span className={cn('mt-1 font-semibold text-ink-2', Q.options.length > 2 ? 'text-[14px]' : 'text-[19px]')}>{sub}</span>}
              </Card>
            )
          })}
        </div>
      </Panel>

      <Panel className="absolute top-[90px] w-[280px] h-[705px] p-5" style={bleedR(27)} initial="hidden" animate="show">
        <div className="eyebrow text-[17px] flex items-center gap-2"><Lightbulb size={20} className="text-gold" fill="currentColor" /> Hint Progress</div>
        <Stack className="mt-3 flex flex-col gap-3" start={0.7}>
          {HINTS.map((h, i) => {
            const st = i < hints ? 'open' : i === hints ? 'next' : 'locked'
            return (
              <Item key={i} v="soft"><Card hover={st === 'next'} className="px-4 py-3 flex items-center gap-3" onClick={() => st === 'next' && (sfx.unlock(), setHints(hints + 1))}>
                <span className={cn('w-[38px] h-[38px] rounded-full grid place-items-center text-white shrink-0', st === 'open' ? 'bg-green-500' : st === 'next' ? 'bg-blue-500' : 'bg-[var(--lavender-2)] text-ink-3')}>{st === 'open' ? <Check size={20} strokeWidth={3.5} /> : st === 'next' ? <span className="font-display font-extrabold text-[17px]">{i + 1}</span> : <Lock size={18} />}</span>
                <span className="leading-tight"><span className="block font-extrabold text-[17px] text-ink">Hint {i + 1}</span><span className="block text-[14px] font-semibold text-ink-3">{st === 'locked' ? 'Tap hint 2 first' : st === 'next' ? 'Tap to reveal' : h}</span></span>
              </Card></Item>
            )
          })}
        </Stack>
        <AnimatePresence>
          {locked && (
            <motion.div className="mt-4 card p-4" initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
              <div className="flex items-center gap-2"><img src="/art/22-novahead.webp" alt="" className="w-[40px]" /><span className="eyebrow text-[14px]">Nova's Feedback</span></div>
              <p className="mt-2 text-[16px] font-bold text-ink-2 leading-snug">{correct ? Q.feedback_correct : QM.feedback_wrong}</p>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {correct && (
            <motion.div className="mt-4 rounded-[22px] p-4 text-white" style={{ background: 'var(--grad-primary)', boxShadow: 'var(--glow-primary)' }} initial={{ opacity: 0, scale: 0.6, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 360, damping: 16, delay: 0.2 }}>
              <div className="font-display font-extrabold text-[26px] flex items-center gap-2"><Star size={24} className="text-gold" fill="currentColor" /> +{Q.xp_on_correct} XP</div>
              <div className="text-[16px] font-bold opacity-90">Keep it up! 🎉</div>
            </motion.div>
          )}
        </AnimatePresence>
      </Panel>

      <motion.div className="absolute flex items-center gap-3" style={{ ...bleedL(24), ...safeB(37) }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.27 }}>
        <button className="pill h-[74px] px-4 gap-4 text-left" onClick={() => sfx.success()}><span className="icon-orb w-[54px] h-[54px] text-white" style={{ background: 'var(--grad-primary)' }}><Volume2 size={26} /></span><span className="leading-tight"><span className="block text-[17px] font-extrabold text-ink">Tap to hear the question</span><span className="block text-[13px] font-semibold text-ink-3">Listen anytime!</span></span></button>
        <button className="pill h-[60px] px-5 gap-2 text-[18px] font-extrabold text-ink" onClick={() => hints < HINTS.length && (sfx.unlock(), setHints(hints + 1))}><Lightbulb size={22} className="text-gold" fill="currentColor" /> Hint</button>
        <button className="pill h-[60px] px-5 gap-2 text-[18px] font-extrabold text-ink" onClick={() => sfx.tap()}><Headphones size={22} className="text-primary-ink" /> Listen</button>
      </motion.div>
      <motion.div className="absolute" style={{ ...bleedR(24), ...safeB(69) }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}><Button size="md" arrow className="w-[300px] h-[66px] text-[22px]" disabled={!locked} sound="whoosh" onClick={() => {
        if (questionIndex === questions.length - 1) {
          const result = { score, total: questions.length }
          sessionStorage.setItem('kv:last-mission-score', JSON.stringify(result))
          nav('/missions/fractions/complete', { state: result })
          return
        }
        setQuestionIndex(i => i + 1); setPicks([]); setLocked(false); setHints(1); setWrong(0); setModel(0); setShowWhy(false)
      }}>{questionIndex === questions.length - 1 ? 'Finish Mission' : 'Next Question'}</Button></motion.div>
    </Page>
  )
}
