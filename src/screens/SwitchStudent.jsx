import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Search, Bell, Rocket, Plus, Users, ShieldCheck, ArrowRight, Flame } from 'lucide-react'
import Scene, { Cutout } from '../components/Scene.jsx'
import Page, { Stack, Item } from '../components/Page.jsx'
import SideRail from '../components/SideRail.jsx'
import ParentRail from '../components/ParentRail.jsx'
import ParentGate from '../components/ParentGate.jsx'
import { UserChip, IconPill } from '../components/TopBar.jsx'
import { Card } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import SpeechBubble from '../components/SpeechBubble.jsx'
import { Bar, Sparkles } from '../components/Widgets.jsx'
import { useGame, levelOf } from '../state/GameProvider.jsx'
import { gradeLabel } from '../data/catalog.js'
import { bleedR } from '../components/Stage.jsx'
import { sfx } from '../lib/sound.js'
import { cn } from '../lib/utils.js'


export default function SwitchStudent() {
  const nav = useNavigate()
  const g = useGame()
  const kids = g.state.children ?? []
  const active = g.state.activeChildId

  /* This screen is reached two ways, and the rail has to match the one that was used.
     A parent arriving from the Parent Zone was being handed the child's rail -- Home,
     Learn, Explore, Goals, Rewards -- which drops them into the child's app on the next
     tap. A child opening it from My Space should still get their own.
     `authIntent` is the fallback for a refresh, where the route state is gone. */
  const fromParent = useLocation().state?.from === 'parent' || g.state.authIntent === 'parent'
  const Rail = fromParent ? ParentRail : SideRail
  const railProps = fromParent ? {} : { active: 'home' }

  /* Handing the app to a different child is a grown-up action, and this screen prints
     every child's grade and progress, so it sits behind the same four-digit code that
     guards the Parent Zone rather than being open to whoever is holding the tablet. */
  const [unlocked, setUnlocked] = useState(false)

  /* Tapping a child used to switch the whole app and jump to Home in one go, so their
     details were never actually readable. Tapping now only previews them here; the
     handover happens on the explicit Continue button. */
  const [selected, setSelected] = useState(active)

  /* The signed-in child's row is only refreshed when they are switched away from, so
     until then the live profile and stats are the newer copy of the same numbers. */
  const live = c => (c && c.id === active
    ? { ...c, name: g.state.profile.name, grade: g.state.profile.grade, board: g.state.profile.board, xp: g.state.stats.xp, streak: g.state.stats.streak }
    : c)

  const kid = live(kids.find(c => c.id === selected)) ?? live(kids.find(c => c.id === active)) ?? kids[0]
  const others = kids.filter(c => c.id !== kid?.id)
  const isActive = kid?.id === active

  const preview = id => { sfx.select(); setSelected(id) }
  /* This screen sits behind the grown-up code, so whoever is here is a parent choosing
     which child to look at -- not a child signing in. Continue therefore opens that
     child's stats in the Parent Zone rather than handing the tablet to them. */
  const commit = () => {
    sfx.whoosh()
    if (kid.id !== active) g.switchChild(kid.id)
    /* A parent came here to read a child's progress, so they land on that child's stats.
       A child came here to be that child, so they land in the app. */
    nav(fromParent ? '/parent' : '/home')
  }

  if (!unlocked) {
    return (
      <Page>
        <Scene name="switch" />
        <Rail {...railProps} />
        <Stack className="absolute left-[340px] top-[95px]" start={0.2}>
          <Item><h1 className="font-display font-extrabold text-[64px] leading-none text-ink">Who's <span className="grad-text">exploring</span> today?</h1></Item>
          <Item className="mt-3 text-[22px] font-semibold text-ink-2">Switch between your children or manage their profiles. <span className="text-gold">✦</span></Item>
        </Stack>
        <Cutout id="switch-0" delay={0.5} amp={9} />
        <ParentGate onPass={() => setUnlocked(true)} onCancel={() => nav(-1)} />
      </Page>
    )
  }

  return (
    <Page>
      <Scene name="switch" />
      <Rail {...railProps} />
      <motion.div className="absolute top-[22px] flex items-center gap-3" style={bleedR(34)} initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <IconPill><Search size={22} /></IconPill><IconPill className="relative"><Bell size={22} /><span className="absolute top-3 right-3 w-[9px] h-[9px] rounded-full bg-red-500 border-2 border-white" /></IconPill>
        {fromParent
          ? <UserChip name="Parent Zone" sub="Manage Account" face={kid?.face ?? 1} />
          : <UserChip name={kid?.name ?? 'Explorer'} sub="Your space" face={kid?.face ?? 1} />}
      </motion.div>
      <Stack className="absolute left-[340px] top-[95px]" start={0.2}>
        <Item><h1 className="font-display font-extrabold text-[64px] leading-none text-ink">Who's <span className="grad-text">exploring</span> today?</h1></Item>
        <Item className="mt-3 text-[22px] font-semibold text-ink-2">{fromParent ? 'Tap a child, then open their full progress in the Parent Zone.' : 'Switch between your children or manage their profiles.'} <span className="text-gold">✦</span></Item>
      </Stack>
      <div className="absolute left-[240px] top-[325px]"><SpeechBubble tail="bottom" delay={0.3} className="w-[185px] text-[15px] text-center"><span className="font-display font-extrabold text-[20px] grad-text italic">Welcome back!</span><br />Ready for another great adventure?</SpeechBubble></div>
      <Cutout id="switch-0" delay={0.5} amp={9} />

      <Card key={kid.id} selected className="absolute left-[445px] top-[245px] w-[435px] h-[535px] p-5 flex flex-col">
        <Sparkles n={4} seed={33} />
        <span className="absolute left-4 top-4 chip h-[28px] px-3 text-[12px] uppercase tracking-wider text-white" style={{ background: 'var(--grad-primary)' }}>{isActive ? '✓ Signed in' : 'Preview'}</span>
        <div className="mt-6 flex gap-4 flex-1">
          <motion.img key={kid.img} src={kid.img} alt="" className="w-[205px] h-[410px] object-cover rounded-[18px]" animate={{ y: [0, -6, 0] }} transition={{ duration: 3.6, repeat: Infinity }} />
          <div className="flex-1 pt-6">
            <div className="font-display font-extrabold text-[40px] leading-none text-ink">{kid.name}</div>
            <div className="mt-2 flex gap-2"><span className="chip h-[30px] px-3 text-[14px] text-white" style={{ background: 'var(--grad-primary)' }}>{gradeLabel(kid.grade)}</span><span className="chip h-[30px] px-3 text-[14px]">{kid.board ?? 'CBSE'}</span></div>
            <div className="mt-4 text-[15px] font-bold text-ink-2">Explorer Level</div>
            <span className="mt-1 inline-grid w-[46px] h-[50px] place-items-center text-white font-display font-extrabold text-[22px]" style={{ background: 'var(--grad-primary)', clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)' }}>{levelOf(kid.xp ?? 0)}</span>
            <div className="mt-3 text-[15px] font-bold text-ink-2">Concepts Mastered</div>
            <div className="flex items-center gap-2"><Bar value={(kid.mastery ?? 0) / 100} h={8} className="flex-1" delay={0.27} /><span className="text-[15px] font-extrabold text-ink">{kid.mastery ?? 0}%</span></div>
            {/* Was a hardcoded "Space Explorer" mission, identical for all three children.
                Streak and XP are the numbers actually kept per child. */}
            <div className="mt-3 card p-3"><div className="text-[13px] font-bold text-ink-3">Progress so far</div><div className="flex items-center gap-2 mt-1"><span className="icon-orb w-[30px] h-[30px] text-gold" style={{ background: 'rgba(251,191,36,.16)' }}><Flame size={16} /></span><span className="leading-tight"><span className="block text-[15px] font-extrabold text-ink">{kid.streak ?? 0}-day streak</span><span className="block text-[11px] font-semibold text-ink-3">{(kid.xp ?? 0).toLocaleString()} XP earned</span></span></div></div>
          </div>
        </div>
        <Button size="md" icon={<Rocket size={22} />} className="mt-3 w-full h-[58px] uppercase text-[20px] rounded-full" sound="whoosh" onClick={commit}>{fromParent ? `See ${kid.name}'s stats` : `Continue as ${kid.name}`}</Button>
      </Card>

      <Stack className="absolute left-[895px] top-[290px] flex gap-[20px]" start={0.7} delay={0.1}>
        {others.map(o => <Item key={o.id} v="pop"><Card hover className={cn('w-[200px] h-[490px] p-4 flex flex-col items-center', o.id === active && 'card-selected')} onClick={() => preview(o.id)}>
          {o.id === active && <span className="absolute left-3 top-3 chip h-[24px] px-2 text-[11px] uppercase tracking-wider text-primary-ink">Signed in</span>}
          <img src={o.img} alt="" className="w-[170px] h-[300px] object-contain" />
          <div className="mt-2 self-start font-display font-extrabold text-[26px] text-ink">{o.name}</div>
          <div className="self-start flex gap-2"><span className="chip h-[26px] px-3 text-[12px] text-white" style={{ background: 'var(--grad-primary)' }}>{gradeLabel(o.grade)}</span><span className="chip h-[26px] px-3 text-[12px]">{o.board ?? 'CBSE'}</span></div>
          <div className="mt-3 self-start text-[13px] font-bold text-ink-2">Concepts Mastered</div>
          <div className="w-full flex items-center gap-2"><Bar value={(o.mastery ?? 0) / 100} h={7} className="flex-1" delay={0.3} /><span className="text-[13px] font-extrabold text-ink">{o.mastery ?? 0}%</span></div>
        </Card></Item>)}
        <Item v="pop"><button className="w-[240px] h-[490px] rounded-[26px] border-2 border-dashed border-[var(--primary)] flex flex-col items-center justify-center text-center hover:bg-[var(--lavender)] transition-colors" onClick={() => { sfx.tap(); nav('/onboarding/child') }}><span className="w-[100px] h-[100px] rounded-full border-2 border-[var(--primary)] grid place-items-center text-primary-ink"><Plus size={48} /></span><span className="mt-6 font-display font-extrabold text-[22px] text-ink uppercase">Add a child</span><span className="mt-2 text-[15px] font-semibold text-ink-3">Add another child<br />to your Kidsverse <span className="text-gold">✦</span></span></button></Item>
      </Stack>
      <motion.div className="absolute left-[785px] top-[800px]" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}><Button variant="outline" size="md" icon={<Users size={22} />} className="w-[305px] h-[54px] uppercase text-[18px]" onClick={() => nav('/parent')}>Manage profiles</Button></motion.div>
      <motion.button className="absolute left-[585px] top-[875px] pill h-[48px] px-6 gap-3 text-[16px] font-bold text-ink-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} onClick={() => { sfx.tap(); nav('/parent') }}><ShieldCheck size={20} className="text-primary-ink" /> <span className="text-ink font-extrabold">Parent Zone</span> <span className="w-px h-5 bg-[var(--line)]" /> Resources, settings and more for parents <ArrowRight size={18} /></motion.button>
    </Page>
  )
}
