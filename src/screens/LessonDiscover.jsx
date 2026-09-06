import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Search, BookOpen, Hand, Lightbulb, Pencil, Rocket, Volume2, Star, LogOut, Flame, Gem, Award } from 'lucide-react'
import Scene, { Child } from '../components/Scene.jsx'
import Page from '../components/Page.jsx'
import SideRail from '../components/SideRail.jsx'
import { UserChip } from '../components/TopBar.jsx'
import { Panel } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import Dock from '../components/Dock.jsx'
import { LessonRail } from '../components/Stepper.jsx'
import { Sparkles } from '../components/Widgets.jsx'
import { useGame } from '../state/GameProvider.jsx'
import { bleedR, safeB } from '../components/Stage.jsx'
import { sfx } from '../lib/sound.js'

export const LESSON_STEPS = [
  { key: 'discover', label: 'DISCOVER', icon: Search }, { key: 'learn', label: 'LEARN', icon: BookOpen }, { key: 'interact', label: 'INTERACT', icon: Hand },
  { key: 'think', label: 'THINK', icon: Lightbulb }, { key: 'practise', label: 'PRACTISE', icon: Pencil }, { key: 'apply', label: 'APPLY', icon: Rocket },
]

export function StatsStrip({ className, style }) {
  const g = useGame(); const { streak, xp } = g.state.stats; const level = g.level
  return (
    <motion.div className={className} style={style} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
      <div className="pill h-[86px] px-3 gap-2 rounded-[26px]">
        {[[Flame, '#f97316', streak, 'Day Streak'], [Gem, '#8b5cf6', xp.toLocaleString(), 'Nova Points'], [Award, '#f59e0b', `Level ${level}`, 'Explorer']].map(([I, c, v, l], i) => (
          <React.Fragment key={l}>
            <div className="flex items-center gap-3 px-3"><span className="icon-orb w-[46px] h-[46px]" style={{ color: c, background: `${c}1f` }}><I size={26} strokeWidth={2.4} fill={i === 0 ? c : 'none'} /></span><span className="leading-tight"><span className="block font-display font-extrabold text-[21px] text-ink">{v}</span><span className="block text-[13px] font-bold text-ink-3">{l}</span></span></div>
            {i < 2 && <span className="w-px h-10 bg-[var(--line)]" />}
          </React.Fragment>
        ))}
      </div>
    </motion.div>
  )
}

export default function LessonDiscover() {
  const nav = useNavigate()
  const g = useGame(); const { name, face } = g.state.profile; const { xp } = g.state.stats
  return (
    <Page>
      <Scene name="discover" />
      <SideRail active="learn" />
      <motion.div className="absolute top-[22px]" style={bleedR(24)} initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}><UserChip name={`Hi, ${name}!`} sub={<span className="flex items-center gap-1 text-orange-500"><Flame size={16} fill="currentColor" /> {xp.toLocaleString()}</span>} face={face} /></motion.div>
      <motion.div className="absolute left-[240px] top-[100px] flex items-center gap-4" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
        <img src="/art/planet-sm.webp" alt="" className="w-[84px] floaty" style={{ filter: 'hue-rotate(150deg) saturate(1.4)' }} />
        <div><div className="font-display font-extrabold text-[30px] leading-none text-ink uppercase">Fraction Rescue</div><div className="mt-1 font-display font-extrabold text-[20px] text-primary-ink uppercase tracking-wide">Stage 1 of 5</div><div className="mt-1 text-[16px] font-semibold text-ink-2">Help the crew share the supplies equally!</div></div>
      </motion.div>
      <LessonRail steps={LESSON_STEPS} current={0} className="absolute left-[655px] top-[95px]" compact />

      <Child screen="discover" delay={0.4} amp={6} scale={0.72} dx={12} dy={165} />
      <motion.div className="absolute left-[410px] top-[240px] card w-[200px] p-4" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.3 }}>
        <div className="flex items-center justify-between"><span className="font-display font-extrabold text-[20px] text-primary-ink">Nova</span><button className="text-primary-ink" onClick={() => sfx.success()}><Volume2 size={22} /></button></div>
        <p className="mt-1 text-[16px] font-bold text-ink-2 leading-snug">Let's explore! Look closely and see what you notice. 👀</p>
      </motion.div>

      <Panel className="absolute left-[655px] top-[225px] w-[925px] h-[565px] p-7 overflow-hidden" initial="hidden" animate="show">
        <Sparkles n={6} seed={6} />
        <div className="absolute inset-0 -z-10 opacity-40" style={{ background: 'radial-gradient(60% 50% at 40% 60%, rgba(251,146,60,.35), transparent 70%)' }} />
        <div className="w-[520px] text-center"><div className="font-display font-extrabold text-[30px] text-ink uppercase">1 Whole Energy Pizza <span className="text-gold">✦</span></div><div className="text-[18px] font-semibold text-ink-2">This pizza will be shared equally.</div></div>
        <motion.div className="absolute left-[60px] top-[150px] w-[500px] h-[240px]" initial={{ opacity: 0, scale: 0.5, rotate: -20 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 120, damping: 16, delay: 0.24 }}>
          <div className="absolute left-1/2 top-[70px] -translate-x-1/2 w-[470px] h-[190px] podium" />
          <motion.img src="/art/pizza-energy.webp" alt="" className="absolute left-1/2 top-[20px] -translate-x-1/2 w-[440px]" style={{ filter: 'drop-shadow(0 30px 30px rgba(120,60,0,.35))' }} animate={{ y: [0, -10, 0], rotate: [0, 1, 0, -1, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} />
        </motion.div>
        <motion.img src="/art/new/astronauts.webp" alt="" className="absolute right-[36px] top-[36px] w-[330px]" initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0, y: [0, -6, 0] }} transition={{ x: { type: 'spring', stiffness: 150, damping: 20, delay: 0.27 }, opacity: { delay: 0.27 }, y: { duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 } }} />
        <motion.div className="absolute right-[36px] top-[190px] w-[330px] card p-5 text-center" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <p className="text-[19px] font-bold text-ink-2 leading-snug">Four astronauts share one pizza equally.</p>
          <p className="mt-2 font-display font-extrabold text-[32px] leading-tight text-primary-ink">What do<br />you notice?</p>
          <span className="absolute left-1/2 -translate-x-1/2 -bottom-[24px] pill w-[48px] h-[48px] justify-center text-primary-ink"><Search size={22} /></span>
        </motion.div>
        <div className="absolute left-[30px] bottom-[28px] flex items-center gap-4">
          <button className="pill h-[70px] px-5 gap-4 text-left" onClick={() => sfx.success()}><span className="icon-orb w-[44px] h-[44px]"><Volume2 size={22} /></span><span className="leading-tight"><span className="block text-[16px] font-extrabold text-ink">Tap to hear the mission</span><span className="block text-[13px] font-semibold text-ink-3">Listen anytime!</span></span></button>
          <div className="card h-[90px] px-5 flex items-center gap-4"><span className="leading-tight"><span className="flex items-center gap-2 font-display font-extrabold text-[22px] text-orange-500"><Star size={22} fill="currentColor" className="text-gold" /> +20 XP</span><span className="block text-[14px] font-bold text-ink-2">Complete this stage<br />to earn your stars!</span></span><motion.img src="/art/chest.webp" alt="" className="w-[80px]" animate={{ rotate: [0, -6, 6, 0] }} transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1 }} /></div>
        </div>
        <div className="absolute right-[30px] bottom-[28px] flex flex-col items-center gap-2">
          <Button size="md" arrow className="w-[300px] h-[74px] uppercase text-[26px]" sound="whoosh" onClick={() => nav('/missions/fractions/explain')}>Continue</Button>
          <button className="flex items-center gap-2 text-[16px] font-bold text-ink-3 hover:text-primary-ink" onClick={() => nav('/journey')}>Exit Mission <LogOut size={18} /></button>
        </div>
      </Panel>

      <Dock className="left-[238px] translate-x-0" style={{ bottom: 22 }} compact />
      <StatsStrip className="absolute" style={{ ...bleedR(240), ...safeB(22) }} />
    </Page>
  )
}
