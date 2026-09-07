import React, { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { Swords, BookOpen, Timer, Target, PieChart, Clock, ChevronRight, CalendarDays, Star, Calculator, Zap, ChevronRight as Chev } from 'lucide-react'
import Scene, { Child } from '../components/Scene.jsx'
import Page, { Stack, Item } from '../components/Page.jsx'
import { TopBar, UserChip, StatPill } from '../components/TopBar.jsx'
import { Panel, Card } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import { Bar, Counter, Confetti, Sparkles } from '../components/Widgets.jsx'
import { BOTS } from '../data/battle.jsx'
import { useGame } from '../state/GameProvider.jsx'
import { sfx } from '../lib/sound.js'

const ICONS = { Maths: Calculator, Literacy: BookOpen, Speed: Zap }
const COLORS = { Maths: '#3b82f6', Literacy: '#a855f7', Speed: '#22c55e' }

export default function BattleResult() {
  const nav = useNavigate(); const [sp] = useSearchParams()
  const bot = BOTS.find(b => b.id === sp.get('bot')) ?? BOTS[0]
  const me = Number(sp.get('me') ?? 4), bs = Number(sp.get('bot_s') ?? 5)
  const won = me > bs
  const g = useGame(); const { name, face } = g.state.profile; const { xp } = g.state.stats
  useEffect(() => { const t = setTimeout(() => (won ? sfx.success() : sfx.unlock()), 400); const t2 = setTimeout(() => g.addXp(30, 'Battle'), 1500); return () => { clearTimeout(t); clearTimeout(t2) } }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Page>
      <Scene name="bresult" />
      {won && <Confetti />}
      <TopBar center={<span className="pill h-[48px] px-5 text-[17px] font-bold text-ink-2">Challenge <ChevronRight size={16} /> <span className="text-ink font-extrabold">29 Battle Result</span></span>} right={<><StatPill kind="xp" value={xp.toLocaleString()} /><UserChip name={name} sub={`Level ${g.level}`} face={face} /></>} showControls={false} />

      <Panel className="absolute left-[25px] top-[105px] w-[415px] h-[675px] p-5" initial="hidden" animate="show">
        <div className="text-center font-display font-extrabold text-[18px] text-ink uppercase tracking-wide">Battle Arena</div>
        <div className="mt-3 flex items-center gap-2">
          <Card className="flex-1 h-[110px] p-2 flex items-center gap-2" style={{ borderColor: '#38bdf8' }}><img src={`/art/kid${face}-face-sm.webp`} alt="" className="w-[64px] h-[64px] rounded-2xl object-cover" /><span className="flex-1 text-center leading-none"><span className="block text-[13px] font-extrabold text-ink-3 uppercase">{name}</span><span className="block font-display font-extrabold text-[50px] text-sky-500">{me}</span></span></Card>
          <span className="font-display font-extrabold text-[26px] grad-text">VS</span>
          <Card className="flex-1 h-[110px] p-2 flex items-center gap-2" style={{ borderColor: '#a855f7' }}><span className="flex-1 text-center leading-none"><span className="block text-[13px] font-extrabold text-ink-3 uppercase">{bot.name}</span><span className="block font-display font-extrabold text-[50px] text-purple-500">{bs}</span></span><img src={bot.img} alt="" className="w-[64px] h-[64px] rounded-2xl object-cover object-top" /></Card>
        </div>
        <div className="mt-3 pill h-[44px] justify-center gap-4 text-[15px] font-bold text-ink-2"><span className="flex items-center gap-1"><Timer size={16} /> Round 7/10</span><span className="w-px h-5 bg-[var(--line)]" /><span className="flex items-center gap-1"><Clock size={16} /> 00:22</span></div>
        <div className="mt-4 font-display font-extrabold text-[16px] text-ink uppercase tracking-wide">{bot.name} strengths</div>
        <div className="mt-2 flex flex-col gap-3">{bot.strengths.map(([k, v]) => { const I = ICONS[k]; return <div key={k} className="flex items-center gap-3"><span className="icon-orb w-[36px] h-[36px] text-white" style={{ background: COLORS[k] }}><I size={18} /></span><span className="w-[70px] text-[16px] font-bold text-ink">{k}</span><Bar value={v / 5} h={8} className="flex-1" delay={0.3} /><span className="text-[14px] font-extrabold text-ink-3">{v}/5</span></div> })}</div>
        <div className="mt-4 flex items-center gap-3"><img src="/art/hd/nova-v2.webp" alt="" className="w-[64px] floaty" /><div className="card px-3 py-2 text-[14px] font-semibold text-ink-2 leading-snug">{bot.tip}</div></div>
        <div className="mt-5 flex flex-col gap-3"><Button size="md" icon={<Swords size={22} />} className="w-full h-[58px] uppercase text-[20px]" sound="whoosh" onClick={() => nav(`/challenge/battle?bot=${bot.id}`)}>Battle again</Button><Button variant="outline" size="md" icon={<BookOpen size={20} />} className="w-full h-[52px] uppercase text-[17px] text-sky-600 border-sky-400" onClick={() => nav('/missions/fractions')}>Practise first</Button></div>
      </Panel>

      <Stack className="absolute left-[545px] top-[115px] w-[600px] text-center" start={0.3}>
        <Item v="pop"><h1 className="font-display font-extrabold text-[96px] leading-none uppercase" style={{ background: 'linear-gradient(90deg,#a855f7,#ec4899)', WebkitBackgroundClip: 'text', color: 'transparent' }}>{won ? 'You won!' : 'So close!'}</h1></Item>
        <Item className="mt-2 font-display font-extrabold text-[34px] text-ink">{name} <span className="text-sky-500">{me}</span> <span className="text-[26px] text-ink-3">vs</span> <span className="text-purple-500">{bs}</span> {bot.name}</Item>
      </Stack>
      <Sparkles n={8} seed={29} className="left-[520px] top-[100px] w-[650px] h-[300px]" />
      <Child screen="bresult" delay={0.6} amp={6} />
      <Panel className="absolute left-[545px] top-[672px] w-[585px] h-[130px] px-8 flex items-center gap-8" initial="hidden" animate="show">
        <div><div className="label-caps">You earned!</div><div className="mt-1 flex items-center gap-6"><span className="flex items-center gap-2"><span className="icon-orb w-[46px] h-[46px] text-gold" style={{ background: '#fef3c7' }}><Star size={24} fill="currentColor" /></span><span className="leading-none"><span className="block font-display font-extrabold text-[28px] text-ink">+<Counter to={15} delay={0.3} /></span><span className="text-[13px] font-bold text-ink-3">Stars</span></span></span><span className="flex items-center gap-2"><span className="icon-orb w-[46px] h-[46px] text-white" style={{ background: 'var(--grad-primary)' }}><span className="text-[12px] font-extrabold">XP</span></span><span className="leading-none"><span className="block font-display font-extrabold text-[28px] text-ink">+<Counter to={30} delay={0.3} /></span><span className="text-[13px] font-bold text-ink-3">XP</span></span></span></div></div>
        <span className="w-px h-16 bg-[var(--line)]" />
        <div className="flex-1"><div className="label-caps">Next level</div><Bar value={g.levelPct / 100} h={10} className="mt-2" delay={0.3} /><div className="mt-1 text-[14px] font-bold text-ink-3">{g.state.stats.xp % 400} / 400 XP</div></div>
        <span className="w-[54px] h-[54px] grid place-items-center text-white font-display font-extrabold text-[22px]" style={{ background: 'var(--grad-primary)', clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)' }}>{g.level}</span>
      </Panel>

      <Panel className="absolute left-[1245px] top-[105px] w-[400px] h-[655px] p-5" initial="hidden" animate="show">
        <div className="flex items-center gap-3"><img src="/art/hd/nova-v2.webp" alt="" className="w-[80px] floaty" /><div className="card px-4 py-3 text-[15px] font-bold text-ink-2 leading-snug">That was close. {bot.name} got us on fraction word problems.</div></div>
        <div className="mt-4 font-display font-extrabold text-[15px] text-ink uppercase tracking-wide">What you did well</div>
        <div className="mt-2 grid grid-cols-2 gap-3">{[[Target, '#ef4444', 'Accuracy improved'], [PieChart, '#3b82f6', 'Fractions stronger']].map(([I, c, t]) => <Card key={t} className="h-[90px] p-3 flex items-center gap-3"><span className="icon-orb w-[46px] h-[46px]" style={{ color: c, background: `${c}1f` }}><I size={24} /></span><span className="text-[15px] font-bold text-ink leading-snug">{t}</span></Card>)}</div>
        <div className="mt-4 font-display font-extrabold text-[15px] text-ink uppercase tracking-wide">Next recommendation</div>
        <Card hover className="mt-2 h-[80px] px-4 flex items-center gap-3" onClick={() => nav('/missions/fractions')}><span className="icon-orb w-[46px] h-[46px] text-orange-500" style={{ background: '#ffedd5' }}><Timer size={24} /></span><span className="flex-1 leading-tight"><span className="block font-extrabold text-[17px] text-primary-ink">5-minute Fraction Mission</span><span className="block text-[13px] font-semibold text-ink-3">Sharpen your fraction skills.</span></span><Chev size={22} className="text-ink-3" /></Card>
        <div className="mt-5 flex flex-col gap-3"><Button size="md" arrow className="w-full h-[58px] uppercase text-[20px]" sound="whoosh" onClick={() => nav('/missions/fractions')}><img src="/art/22-novahead.webp" alt="" className="w-[34px]" /> Train with Nova</Button><Button variant="ghost" size="md" icon={<CalendarDays size={20} />} className="w-full h-[52px] uppercase text-[17px]" onClick={() => nav('/challenge')}>Rematch later</Button></div>
      </Panel>
    </Page>
  )
}
