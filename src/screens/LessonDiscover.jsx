import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Lightbulb, Volume2, Star, Clock, Lock, Music, Headphones, ChevronDown } from 'lucide-react'
import { Child } from '../components/Scene.jsx'
import Page from '../components/Page.jsx'
import { Panel } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import { LessonVisual } from '../components/LessonModels.jsx'
import { useGame } from '../state/GameProvider.jsx'
import { ACTIVE_CONTENT_ID, useContent, discoverContent } from '../content/index.js'
import { sfx } from '../lib/sound.js'
import { cn } from '../lib/utils.js'


export default function LessonDiscover() {
  const nav = useNavigate()
  const g = useGame(); const { name, face } = g.state.profile; const { xp } = g.state.stats
  const [opened, setOpened] = React.useState(0)      // hints revealed so far
  /* Everything this screen says comes from the learning package; the JSX is the template. */
  const pkg = useContent(ACTIVE_CONTENT_ID)
  const C = discoverContent(pkg)
  const M = pkg.mission
  const HINTS = C.hints

  return (
    <Page>
      {/* No painted scene here -- the designer's board is flat and the cards carry the
          screen. The app's own themed backdrop is left to show through, rather than a
          hardcoded wash: the light gradient that used to sit here had no dark variant,
          so in dark mode it put a near-white sheet under everything. */}

      {/* left column: who you are, what the mission is, and Nova */}
      <Panel className="absolute left-[19px] top-[10px] w-[272px] h-[820px] p-0 overflow-hidden">
        <div className="pt-6 flex flex-col items-center text-center">
          <div className="flex items-center gap-2">
            <img src="/art/planet-sm.webp" alt="" className="w-[52px] floaty" />
            <div className="text-left">
              <div className="font-display font-extrabold text-[27px] leading-none grad-text uppercase tracking-wide">Kidsverse</div>
              <div className="mt-1 text-[9px] font-extrabold tracking-[0.18em] text-ink-3">LEARN &bull; EXPLORE &bull; ACHIEVE</div>
            </div>
          </div>
        </div>

        <div className="mt-6 px-5 flex items-start gap-3">
          <img src="/art/planet-sm.webp" alt="" className="w-[42px] shrink-0 floaty" style={{ filter: 'hue-rotate(150deg) saturate(1.4)' }} />
          <div className="leading-tight">
            <div className="font-display font-extrabold text-[21px] text-ink uppercase">{M.rail.title}</div>
          </div>
        </div>
        <p className="mt-3 px-5 text-[15px] font-semibold text-ink-2 leading-snug">{M.rail.blurb}</p>

        <div className="mt-4 mx-4 card p-4">
          <div className="flex items-center justify-between">
            <span className="font-display font-extrabold text-[19px] text-primary-ink">Nova</span>
            <button className="text-primary-ink" onClick={() => sfx.success()} aria-label="Hear Nova"><Volume2 size={20} /></button>
          </div>
          <p className="mt-1 text-[15px] font-bold text-ink-2 leading-snug">{C.nova.speech}</p>
        </div>

        {/* The cutout's own box already sits in this column, so it needs no offset. */}
        <Child screen="discover" delay={0.4} amp={6} />

        <div className="absolute left-4 right-4 bottom-5">
          <div className="card px-4 py-3">
            <div className="flex items-center gap-2">
              <img src="/art/planet-sm.webp" alt="" className="w-[26px]" />
              <span className="leading-tight"><span className="block font-display font-extrabold text-[15px] text-ink">Small Steps</span><span className="block font-display font-extrabold text-[15px] text-ink">Big Futures</span></span>
            </div>
            <div className="mt-2 h-[7px] rounded-full bg-[var(--lavender-2)] overflow-hidden">
              <motion.div className="h-full rounded-full" style={{ background: 'var(--grad-primary)' }} initial={{ width: 0 }} animate={{ width: '38%' }} transition={{ duration: 0.9, delay: 0.5 }} />
            </div>
          </div>
        </div>
      </Panel>

      {/* top row: the six steps, then the child's own numbers */}
      <motion.div className="absolute left-[1275px] top-[36px] pill h-[46px] px-4 gap-2" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <Star size={20} fill="currentColor" className="text-gold" />
        <span className="font-display font-extrabold text-[18px] text-ink">{xp.toLocaleString()} XP</span>
      </motion.div>
      <motion.div className="absolute left-[1406px] top-[28px]" initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <div className="pill h-[68px] pl-2 pr-4 gap-3">
          <img src={`/art/kid${face}-face-sm.webp`} alt="" className="w-[52px] h-[52px] rounded-full object-cover border-2 border-white shadow-md" />
          <div className="leading-tight">
            <div className="font-display font-extrabold text-[19px] text-ink">Hi, {name}!</div>
            <div className="text-[14px] font-bold text-ink-3">Keep Exploring!</div>
          </div>
          <ChevronDown size={20} className="text-ink-3" />
        </div>
      </motion.div>

      {/* the mission itself */}
      <Panel className="absolute left-[305px] top-[90px] w-[1140px] h-[760px] p-7">
        <div className="flex items-start gap-4">
          <span className="w-[60px] h-[60px] rounded-[18px] grid place-items-center font-display font-extrabold text-[26px] text-white shrink-0" style={{ background: 'var(--grad-primary)', boxShadow: 'var(--glow-primary)' }}>{M.code}</span>
          <div className="leading-tight">
            <div className="text-[13px] font-extrabold tracking-[0.14em] text-primary-ink">LEARNING MISSION</div>
            <div className="mt-0.5 font-display font-extrabold text-[38px] tracking-[-0.02em] text-ink">{M.title} <span className="text-gold">{M.emoji}</span></div>
            <div className="mt-1 max-w-[680px] text-[18px] font-semibold text-ink-2 leading-snug">{M.subtitle}</div>
          </div>
          <div className="ml-auto flex items-center gap-3 pt-1">
            <span className="pill h-[50px] px-4 gap-2 text-[17px] font-bold text-ink-2"><Clock size={20} className="text-primary-ink" /> {M.duration_min[0]}&ndash;{M.duration_min[1]} min</span>
            <span className="pill h-[50px] px-4 gap-2 text-[17px] font-extrabold text-primary-ink"><Star size={20} fill="currentColor" className="text-gold" /> +{M.xp} XP</span>
          </div>
        </div>

        <div className="mt-5 rounded-[28px] border-[1.5px] border-[var(--line)] bg-[var(--glass)] h-[455px] relative overflow-hidden">
          {/* Generated package content replaces the old hardcoded astronaut crew. */}
          <motion.div className="absolute left-[28px] top-[28px] w-[580px] h-[399px] flex flex-col gap-4"
            initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }}>
            <div className="card px-6 py-4">
              <div className="text-[12px] font-extrabold tracking-[0.14em] text-primary-ink uppercase">Concept</div>
              <div className="mt-1 font-display font-extrabold text-[30px] leading-tight text-ink">{C.model.title}</div>
              <p className="mt-2 text-[17px] font-semibold text-ink-2 leading-snug">{C.model.caption}</p>
            </div>
            <div className="card px-6 py-5 flex-1">
              <div className="text-[12px] font-extrabold tracking-[0.14em] text-primary-ink uppercase">How it works</div>
              <p className="mt-2 text-[18px] font-bold text-ink-2 leading-relaxed">{C.prompt.statement}</p>
              <p className="mt-4 font-display font-extrabold text-[29px] leading-tight text-primary-ink">{C.prompt.question.split('\n').map((line, i) => <React.Fragment key={i}>{i > 0 && <br />}{line}</React.Fragment>)}</p>
            </div>
          </motion.div>

          <motion.div className="absolute right-[28px] top-[28px] w-[450px] h-[399px] card overflow-hidden"
            initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, delay: 0.1 }}>
            <LessonVisual model={C.model} fill />
          </motion.div>
        </div>

        <div className="mt-4 rounded-[20px] border-[1.5px] border-[var(--line)] bg-[var(--glass)] h-[62px] px-5 flex items-center gap-3">
          <span className="icon-orb w-[36px] h-[36px] shrink-0"><Lightbulb size={20} /></span>
          <p className="text-[17px] font-semibold text-ink-2">Think about: {(C.think_about.emphasis ? C.think_about.text.split(C.think_about.emphasis) : [C.think_about.text]).map((part, i, arr) => <React.Fragment key={i}>{part}{i < arr.length - 1 && <span className="font-extrabold text-primary-ink">{C.think_about.emphasis}</span>}</React.Fragment>)}</p>
          <Button size="sm" arrow className="ml-auto h-[46px] px-6 uppercase text-[17px]" sound="whoosh" onClick={() => nav('/missions/fractions/learn')}>Start Learning</Button>
        </div>
      </Panel>

      {/* right rail: help, offered before it is asked for */}
      <Panel className="absolute left-[1460px] top-[90px] w-[195px] h-[760px] p-4 flex flex-col">
        <div className="flex items-center gap-2"><Lightbulb size={19} className="text-gold" /><span className="font-display font-extrabold text-[17px] text-ink">NEED A HINT?</span></div>
        <p className="mt-1 text-[13px] font-semibold text-ink-3 leading-snug">Stuck? Get a little help to move ahead.</p>

        <div className="mt-3 flex flex-col gap-2.5">
          {HINTS.map((h, i) => {
            const open = i < opened, next = i === opened
            return (
              <motion.button key={i} type="button" disabled={!open && !next}
                className={cn('text-left rounded-[16px] border-[1.5px] p-3 transition-colors', open ? 'border-[var(--primary)] bg-[var(--tint-primary)]' : 'border-[var(--line)] bg-[var(--glass)]', next && 'hover:border-[var(--primary)]')}
                onClick={() => { if (next) { sfx.tap(); setOpened(o => o + 1) } }}
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + i * 0.07 }}>
                <div className="flex items-center gap-1.5">
                  {open ? <Lightbulb size={14} className="text-gold" /> : <Lock size={13} className="text-ink-3" />}
                  <span className={cn('font-display font-extrabold text-[15px]', open ? 'text-primary-ink' : 'text-ink-2')}>Hint {i + 1}</span>
                </div>
                {/* The text used to render regardless of `open`, so the lock, the disabled
                    state and the Hint button were all theatre -- every hint was readable
                    from the first paint. */}
                <p className={cn('mt-1 text-[13px] font-semibold leading-snug', open ? 'text-ink-2' : 'text-ink-3')}>
                  {open ? h : next ? 'Tap to reveal' : `Tap hint ${i} first`}
                </p>
              </motion.button>
            )
          })}
        </div>

        <div className="mt-auto">
          <div className="font-display font-extrabold text-[15px] text-ink">Still not sure?</div>
          <p className="mt-1 text-[13px] font-semibold text-ink-3 leading-snug">Review the concept image and learning objective together.</p>
          <div className="mt-3 card p-3 text-[13px] font-semibold text-ink-2 leading-snug">{C.think_about.text}</div>
        </div>
      </Panel>

      {/* bottom bar */}
      <motion.button className="absolute left-[30px] bottom-[28px] pill w-[52px] h-[52px] justify-center text-primary-ink" onClick={() => sfx.tap()} aria-label="Music" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}><Music size={22} /></motion.button>
      <motion.button className="absolute left-[95px] bottom-[22px] pill h-[64px] px-5 gap-3 text-left" onClick={() => sfx.success()} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.52 }}>
        <span className="icon-orb w-[40px] h-[40px]"><Volume2 size={20} /></span>
        <span className="leading-tight"><span className="block text-[15px] font-extrabold text-ink">Tap to hear the mission</span><span className="block text-[12px] font-semibold text-ink-3">Listen anytime!</span></span>
      </motion.button>
      <Button variant="outline" size="sm" icon={<Lightbulb size={19} className="text-gold" />} className="absolute left-[360px] bottom-[26px] h-[56px] px-6 text-[18px]" onClick={() => setOpened(o => Math.min(HINTS.length, o + 1))}>Hint</Button>
      <Button variant="outline" size="sm" icon={<Headphones size={19} />} className="absolute left-[500px] bottom-[26px] h-[56px] px-6 text-[18px]" sound="tap" onClick={() => sfx.success()}>Listen</Button>
    </Page>
  )
}
