import React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { Swords, BookOpen, Zap, Calculator, Puzzle, Shield, Lightbulb, Info, Award } from 'lucide-react'
import Scene, { Cutout, Child } from '../components/Scene.jsx'
import Page, { Stack, Item } from '../components/Page.jsx'
import { TopBar, UserChip, StatPill } from '../components/TopBar.jsx'
import { Panel, Card } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import SpeechBubble from '../components/SpeechBubble.jsx'
import { Bar, Sparkles } from '../components/Widgets.jsx'
import { BOTS, BATTLE_XP } from '../data/battle.jsx'
import { useGame } from '../state/GameProvider.jsx'

const ICONS = { Maths: Calculator, Literacy: BookOpen, Speed: Zap }
const COLORS = { Maths: '#3b82f6', Literacy: '#a855f7', Speed: '#22c55e' }

/* Big VS mark with a lightning slash behind it. */
export function Vs({ size = 120, className }) {
  return (
    <motion.div className={`relative grid place-items-center ${className ?? ''}`} style={{ width: size, height: size }} initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.17 }}>
      <motion.span className="absolute text-sky-400" style={{ fontSize: size * 1.1, lineHeight: 1 }} animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.5, repeat: Infinity }}>⚡</motion.span>
      <span className="relative font-display font-extrabold grad-text" style={{ fontSize: size * 0.7, lineHeight: 1 }}>VS</span>
    </motion.div>
  )
}

export default function BattlePreview() {
  const nav = useNavigate(); const [sp] = useSearchParams()
  const bot = BOTS.find(b => b.id === sp.get('bot')) ?? BOTS[0]
  const g = useGame(); const { name, face } = g.state.profile; const { xp } = g.state.stats
  return (
    <Page>
      <Scene name="preview" />
      <TopBar logo="plus" right={<><StatPill kind="bolt" value={xp.toLocaleString()} /><UserChip name={name} sub={`Level ${g.level}`} face={face} /></>} showControls={false} />
      <Child screen="preview" delay={0.4} amp={6} />
      {/* The opponent, not a fixed picture of Robo. preview-1 is Robo's cutout, so every
          battle showed his face under whichever name the headline announced -- wrong for
          three opponents out of four. `bot.cut` is a transparent figure of the bot the
          child actually picked; it is drawn bottom-aligned in the same slot so all four
          stand on one ground line despite differing heights. */}
      <motion.img key={bot.id} src={bot.cut} alt="" draggable={false}
        className="absolute left-[1090px] top-[193px] w-[405px] h-[567px] object-contain object-bottom pointer-events-none"
        style={{ filter: 'drop-shadow(0 26px 34px rgba(40,30,140,.4))' }}
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
        transition={{ opacity: { delay: 0.19 }, scale: { type: 'spring', stiffness: 200, damping: 18, delay: 0.19 }, y: { duration: 3.8, repeat: Infinity, ease: 'easeInOut' } }} />
      <Cutout id="preview-2" delay={0.3} amp={8} />

      <Stack className="absolute left-[500px] top-[110px] w-[680px] text-center" start={0.2}>
        <Item className="flex items-center justify-center gap-3 font-display font-extrabold text-[24px] text-ink uppercase tracking-wide"><span className="w-[60px] h-[3px] rounded-full" style={{ background: 'var(--grad-primary)' }} /> Prepare for battle <span className="w-[60px] h-[3px] rounded-full" style={{ background: 'var(--grad-primary)' }} /></Item>
        <Item className="mt-2 flex items-center justify-center gap-6"><span className="font-display font-extrabold text-[80px] leading-none text-ink uppercase">{name}</span><Vs size={120} /><span className="font-display font-extrabold text-[80px] leading-none text-ink uppercase">{bot.name}</span></Item>
      </Stack>
      <Sparkles n={5} seed={27} className="left-[480px] top-[90px] w-[700px] h-[200px]" />

      <Panel className="absolute left-[555px] top-[275px] w-[535px] p-6 pb-5" initial="hidden" animate="show">
        <div className="text-center font-display font-extrabold text-[22px] text-ink uppercase tracking-wide">{bot.name} strengths</div>
        <Stack className="mt-4 flex flex-col gap-3" start={0.8}>
          {bot.strengths.map(([k, v]) => { const I = ICONS[k]; const c = COLORS[k]; return <Item key={k} v="soft" className="flex items-center gap-4"><span className="icon-orb w-[48px] h-[48px] text-white" style={{ background: c }}><I size={24} /></span><span className="w-[110px] font-display font-bold text-[20px] text-ink">{k}</span><Bar value={v / 5} h={12} className="flex-1" delay={0.3} /><span className="w-[50px] text-right font-display font-extrabold text-[20px] text-ink">{v}/5</span></Item> })}
        </Stack>
        <div className="hairline my-3" />
        <div className="flex items-center gap-3 text-[16px] font-bold text-ink-2"><span className="font-display font-extrabold text-ink uppercase tracking-wide">{bot.name} likes</span><Puzzle size={20} className="text-primary-ink" /> {bot.likes}</div>
      </Panel>
      <div className="absolute left-[670px] top-[568px]"><SpeechBubble tail="left" delay={0.3} className="w-[440px] text-[20px]"><span className="flex items-center gap-2 font-display font-extrabold text-[18px] text-primary-ink uppercase tracking-wide">✦ Nova's strategy</span><span className="block mt-1 font-bold">{bot.tip}</span></SpeechBubble></div>

      <motion.div className="absolute left-[420px] top-[728px] flex items-center gap-5" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Button size="lg" arrow icon={<Swords size={30} />} className="w-[440px] h-[84px] uppercase text-[30px]" sound="whoosh" onClick={() => nav(`/challenge/battle?bot=${bot.id}`)}>Battle now</Button>
        <Button variant="outline" size="lg" icon={<BookOpen size={28} />} className="h-[84px] px-10 uppercase text-[24px] text-sky-600 border-sky-400" onClick={() => nav('/missions/fractions')}>Practise first</Button>
      </motion.div>
      <Panel className="absolute left-[270px] top-[830px] w-[1100px] h-[92px] px-8 grid grid-cols-3 items-center divide-x divide-[var(--line)]" initial="hidden" animate="show">
        {[[Award, '#f59e0b', 'Win reward', <span className="text-primary-ink">+{BATTLE_XP.win} XP</span>], [Shield, '#3b82f6', 'Fair match', 'Great battle! Even match.'], [Lightbulb, '#f59e0b', 'Tip', 'Keep practising to improve your weak areas!']].map(([I, c, t, s]) => <div key={t} className="flex items-center gap-3 px-4"><span className="icon-orb w-[44px] h-[44px]" style={{ color: c, background: `${c}1f` }}><I size={22} /></span><span className="leading-tight"><span className="block font-display font-extrabold text-[17px] text-ink uppercase">{t}</span><span className="block text-[14px] font-semibold text-ink-2">{s}</span></span>{t === 'Fair match' && <Info size={18} className="ml-auto text-ink-3" />}</div>)}
      </Panel>
    </Page>
  )
}
