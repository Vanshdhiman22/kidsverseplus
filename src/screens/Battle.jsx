import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronLeft, Timer, Zap, Calculator, BookOpen, Puzzle, Star, Check } from 'lucide-react'
import Scene, { Cutout } from '../components/Scene.jsx'
import Page, { Stack, Item } from '../components/Page.jsx'
import Logo from '../components/Logo.jsx'
import { UserChip, StatPill } from '../components/TopBar.jsx'
import { Panel, Card } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import SpeechBubble from '../components/SpeechBubble.jsx'
import { Bar, Fraction } from '../components/Widgets.jsx'
import { Vs } from './BattlePreview.jsx'
import { BOTS, BATTLE_QS } from '../data/battle.jsx'
import { useGame } from '../state/GameProvider.jsx'
import { bleedL, bleedR, safeT } from '../components/Stage.jsx'
import { sfx } from '../lib/sound.js'
import { cn } from '../lib/utils.js'
import { charByFace } from '../data/poses.js'

const ICONS = { Maths: Calculator, Literacy: BookOpen, Speed: Zap, Logic: Puzzle }
const COLORS = { Maths: '#3b82f6', Literacy: '#a855f7', Speed: '#22c55e', Logic: '#f59e0b' }

function Fighter({ side, name, score, energy, img, c }) {
  return (
    <Panel className={cn('absolute top-[150px] w-[590px] h-[245px] px-8 flex items-center gap-8', side === 'left' ? 'left-[105px]' : 'left-[980px] flex-row-reverse')} style={{ borderColor: c, boxShadow: `0 0 0 2px ${c}66, var(--glass-shadow)`, clipPath: side === 'left' ? 'polygon(0 0, 100% 0, 92% 100%, 0 100%)' : 'polygon(8% 0, 100% 0, 100% 100%, 0 100%)' }} initial="hidden" animate="show">
      <div className="w-[240px] h-[210px] grid place-items-center">{img}</div>
      <div className={cn('flex-1', side === 'left' ? 'text-left' : 'text-right')}>
        <div className="font-display font-extrabold text-[28px] text-ink uppercase tracking-wide">{name}</div>
        <motion.div key={score} className="font-display font-extrabold text-[86px] leading-none text-ink" initial={{ scale: 1.5, color: c }} animate={{ scale: 1, color: 'var(--ink)' }}>{score}</motion.div>
        <div className={cn('mt-1 flex items-center gap-2 text-[18px] font-bold text-ink-2', side === 'right' && 'justify-end')}><Zap size={20} style={{ color: c }} fill="currentColor" /> <span className="font-extrabold text-ink">{energy}</span> / 100</div>
        <Bar value={energy / 100} h={14} className="mt-2" delay={0.27} />
      </div>
    </Panel>
  )
}

function Strengths({ title, rows, className }) {
  return (
    <Panel className={cn('absolute w-[285px] p-5', className)} initial="hidden" animate="show">
      <div className="text-center font-display font-extrabold text-[16px] text-ink uppercase tracking-wide">{title}</div>
      <div className="mt-3 flex flex-col gap-3">{rows.map(([k, v]) => { const I = ICONS[k]; return <div key={k} className="flex items-center gap-3"><span className="icon-orb w-[36px] h-[36px] text-white" style={{ background: COLORS[k] }}><I size={18} /></span><span className="w-[70px] text-[16px] font-bold text-ink">{k}</span><Bar value={v / 5} h={8} className="flex-1" delay={0.3} /><span className="text-[14px] font-extrabold text-ink-3">{v}/5</span></div> })}</div>
    </Panel>
  )
}

export default function Battle() {
  const nav = useNavigate(); const [sp] = useSearchParams()
  const bot = BOTS.find(b => b.id === sp.get('bot')) ?? BOTS[0]
  const g = useGame(); const { name, face } = g.state.profile; const { xp } = g.state.stats
  /* The left fighter is whoever is signed in. girl_02 has a bespoke waist-up battle pose;
     every other face still uses its square head crop. */
  const portrait = charByFace(face).id === 'girl_02' ? '/art/chars/pose/P12/girl_02.webp' : `/art/kid${face}-face.webp`
  const [round, setRound] = useState(0)
  /* Was [3, 3]: the scoreboard opened at three-all before a question had been asked,
     and that seed rode all the way to the result screen, so four wrong answers still
     reported three points scored. */
  const [score, setScore] = useState([0, 0])
  const [pick, setPick] = useState(null)
  const [done, setDone] = useState(false)
  const [secs, setSecs] = useState(22)
  const [elapsed, setElapsed] = useState(0)   // the result screen printed a fixed 00:22
  const q = BATTLE_QS[round % BATTLE_QS.length]
  /* Energy was 85 and 70, fixed, for the whole battle. A bar that never moves while a
     fight is happening is a picture of a bar. Each point the other side takes costs a
     share of it, so it reads as what is left. */
  const energy = side => Math.max(0, Math.round(100 - (score[side] / BATTLE_QS.length) * 100))
  /* The clock used to roll straight back to 22 and keep going, so the round timer was
     decoration: a child could sit on one question forever. Time out now costs the round,
     which is what the countdown has been implying all along. */
  useEffect(() => {
    if (done) return
    if (secs <= 0) { sfx.wrong(); setDone(true); setScore(([a, b]) => [a, b + 1]); return }
    const id = setTimeout(() => { setSecs(x => x - 1); setElapsed(e => e + 1) }, 1000)
    return () => clearTimeout(id)
  }, [secs, done])  // eslint-disable-line react-hooks/exhaustive-deps
  const submit = () => {
    if (pick == null) return
    if (done) {
      if (round + 1 >= BATTLE_QS.length) { sfx.whoosh(); nav(`/challenge/result?bot=${bot.id}&me=${score[0]}&bot_s=${score[1]}&t=${elapsed}`); return }
      setRound(round + 1); setPick(null); setDone(false); setSecs(22); return
    }
    const right = pick === q.answer; setDone(true)
    if (right) { sfx.success(); setScore(([a, b]) => [a + 1, b]) } else { sfx.wrong(); setScore(([a, b]) => [a, b + 1]) }
  }
  return (
    <Page>
      <Scene name="battle" />
      <motion.div className="absolute" style={{ ...bleedL(24), ...safeT(20) }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}><Logo variant="planet" tagline="LEARN • EXPLORE • ACHIEVE" /></motion.div>
      <motion.button className="absolute left-[30px] top-[100px] pill h-[44px] px-4 text-[15px] font-bold text-ink" style={bleedL(30)} onClick={() => { sfx.tap(); nav('/challenge') }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.14 }}><ChevronLeft size={18} /> Leave battle</motion.button>
      <Stack className="absolute left-[560px] top-[30px] w-[560px] text-center" start={0.2}>
        <Item className="font-display font-extrabold text-[40px] leading-none grad-text uppercase flex items-center justify-center gap-4"><Star size={26} className="text-gold" fill="currentColor" /> Live Battle Arena <Star size={26} className="text-gold" fill="currentColor" /></Item>
        <Item className="mt-2 font-display font-extrabold text-[22px] text-ink-2 uppercase tracking-wide">Round {round + 1} / {BATTLE_QS.length}</Item>
      </Stack>
      <motion.div className="absolute flex items-center gap-3" style={{ ...bleedR(24), ...safeT(22) }} initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}><StatPill kind="streak" value={g.state.stats.streak} label="Day streak" /><StatPill kind="xp" value={xp.toLocaleString()} /><UserChip name={name} face={face} /></motion.div>

      <Fighter side="left" name={name} score={score[0]} energy={energy(1)} c="#38bdf8" img={<motion.img src={portrait} alt="" className="h-[210px] max-w-[230px] object-contain" animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity }} />} />
      <Fighter side="right" name={bot.name} score={score[1]} energy={energy(0)} c="#a855f7" img={<span />} />
      <Cutout id="battle-0" delay={0.17} amp={9} />
      <Vs size={130} className="absolute left-[770px] top-[150px]" />
      <motion.div className="absolute left-[725px] top-[325px] pill h-[62px] px-6 gap-3 font-display font-extrabold text-[30px] text-ink tabular-nums" animate={secs <= 5 ? { scale: [1, 1.06, 1], color: ['var(--ink)', 'var(--danger-ink)', 'var(--ink)'] } : {}} transition={{ duration: 0.8, repeat: Infinity }} initial={{ opacity: 0, y: 20 }}><Timer size={28} className="text-primary-ink" /> 00:{String(secs).padStart(2, '0')}</motion.div>

      {/* Was three invented ratings -- Maths 4, Literacy 2, Speed 3 -- identical for every
          child and unchanged by anything they did. This battle's own tally is real. */}
      <Panel className="absolute left-[105px] top-[420px] w-[285px] p-5" initial="hidden" animate="show">
        <div className="text-center font-display font-extrabold text-[16px] text-ink uppercase tracking-wide">This battle</div>
        <div className="mt-3 flex flex-col gap-3">
          {[['Correct', score[0], '#22c55e'], ['Missed', score[1], '#ef4444'], ['Round', `${round + 1} / ${BATTLE_QS.length}`, '#7c5cff']].map(([k, v, c]) => (
            <div key={k} className="flex items-center gap-3">
              <span className="w-[10px] h-[10px] rounded-full shrink-0" style={{ background: c }} />
              <span className="flex-1 text-[15px] font-bold text-ink-2">{k}</span>
              <span className="font-display font-extrabold text-[20px] text-ink tabular-nums">{v}</span>
            </div>
          ))}
        </div>
      </Panel>
      <Strengths title={`${bot.name} strengths`} rows={bot.strengths} className="left-[1285px] top-[420px]" />
      <Panel className="absolute left-[105px] top-[640px] w-[285px] h-[140px] p-4 flex items-center gap-3" initial="hidden" animate="show"><img src="/art/hd/nova-v2.webp" alt="" className="w-[80px] floaty" /><div><div className="text-[14px] font-extrabold text-ink uppercase tracking-wide">Nova's Coach Tip</div><div className="mt-1 card px-3 py-2 text-[14px] font-bold text-ink-2 leading-snug">Focus on accuracy over speed! 🎯</div></div></Panel>
      <Panel className="absolute left-[1285px] top-[640px] w-[285px] h-[140px] p-4 flex items-center gap-3" initial="hidden" animate="show"><img src="/art/hd/nova-v2.webp" alt="" className="w-[80px] floaty" /><p className="text-[15px] font-bold text-ink-2 leading-snug">{done
          ? (pick === q.answer ? `Nice one \u2014 that is ${score[0]} to ${bot.name}'s ${score[1]}.` : `${bot.name} takes that one. Next question.`)
          : `${bot.name} is quick on fractions. Read the shaded part before you answer.`}</p></Panel>

      <Panel className="absolute left-[415px] top-[415px] w-[840px] h-[415px] p-7" initial="hidden" animate="show">
        <motion.div key={round} className="text-center font-display font-extrabold text-[30px] text-ink" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}>{q.q}</motion.div>
        <div className="mt-4 mx-auto flex w-[640px] h-[86px] rounded-[10px] overflow-hidden border-2 border-[var(--line)]">
          {Array.from({ length: q.total }, (_, i) => <motion.span key={`${round}-${i}`} className="flex-1 border-r-2 border-[var(--line)] last:border-0" initial={{ background: 'rgba(255,255,255,.9)' }} animate={{ background: i < q.shaded ? '#a78bfa' : 'rgba(255,255,255,.9)' }} transition={{ delay: 0.06 + i * 0.1 }} />)}
        </div>
        <Stack key={`o${round}`} className="mt-5 grid grid-cols-4 gap-5" start={0.3} delay={0.08}>
          {q.options.map(([n, d], i) => { const on = pick === i, right = done && i === q.answer, wrong = done && on && !right; return (
            <Item key={i} v="pop"><Card hover={!done} selected={on && !done} className={cn('relative h-[120px] grid place-items-center text-ink', wrong && 'shake')} style={right ? { boxShadow: '0 0 0 3px #22c55e', borderColor: '#22c55e' } : wrong ? { boxShadow: '0 0 0 3px #ef4444', borderColor: '#ef4444' } : undefined} onClick={() => { if (!done) { sfx.select(); setPick(i) } }}>
              {(on || right) && <span className="absolute -top-3 -right-1 w-[30px] h-[30px] rounded-full grid place-items-center text-white" style={{ background: right ? '#22c55e' : 'var(--grad-primary)' }}><Check size={16} strokeWidth={3.5} /></span>}
              <Fraction n={n} d={d} size={36} />
            </Card></Item>) })}
        </Stack>
        <div className="mt-5 flex justify-center"><Button size="md" arrow className="w-[525px] h-[62px] uppercase text-[24px]" disabled={pick == null} sound="whoosh" onClick={submit}>{done ? (round + 1 >= BATTLE_QS.length ? 'See result' : 'Next round') : 'Submit answer'}</Button></div>
      </Panel>
    </Page>
  )
}
