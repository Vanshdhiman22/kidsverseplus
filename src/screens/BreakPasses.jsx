import React, { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CalendarCheck, Check, Flame, ShieldCheck, Sparkles, Ticket, X } from 'lucide-react'
import Page, { Item, Stack } from '../components/Page.jsx'
import Scene from '../components/Scene.jsx'
import { Panel } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import { TopBar, UserChip } from '../components/TopBar.jsx'
import { useGame } from '../state/GameProvider.jsx'
import { sfx } from '../lib/sound.js'

const dayKey = () => new Date().toISOString().slice(0, 10)

export default function BreakPasses() {
  const nav = useNavigate()
  const g = useGame()
  const { name, face } = g.state.profile
  const { streak } = g.state.stats
  const passes = g.state.stats.breakPasses ?? 5
  const usedToday = (g.state.stats.breakPassUsedDates ?? []).includes(dayKey())
  const [confirm, setConfirm] = useState(false)

  const activate = () => {
    g.useBreakPass(dayKey())
    sfx.success()
    setConfirm(false)
  }

  return (
    <Page>
      <Scene name="profile" />
      <TopBar back={false} logo="planet" right={<UserChip name={name || 'Explorer'} sub={`${streak} day streak`} face={face || 1} />} showControls={false} />

      <Stack className="absolute left-[110px] top-[105px] w-[620px]" start={0.15}>
        <Item><button className="flex items-center gap-2 text-[17px] font-extrabold text-ink" onClick={() => { sfx.tap(); nav('/profile') }}><ArrowLeft size={21} /> Back to My Space</button></Item>
        <Item className="mt-10"><span className="inline-flex h-[42px] items-center gap-2 rounded-full bg-violet-100 px-5 text-[14px] font-extrabold uppercase tracking-[.12em] text-violet-700"><Ticket size={19} /> Streak protection</span></Item>
        <Item><h1 className="mt-5 font-display text-[72px] font-extrabold leading-[.98] text-ink">Take a break.<br /><span className="grad-text">Keep your flame.</span></h1></Item>
        <Item className="mt-6 max-w-[560px] text-[23px] font-semibold leading-relaxed text-ink-2">Use one Break Pass when you need a day away. Your current streak stays safe, and you can return tomorrow refreshed.</Item>
        <Item className="mt-8 flex gap-4">
          <div className="pill h-[72px] px-5 gap-4"><span className="icon-orb h-11 w-11 bg-orange-100 text-orange-500"><Flame size={23} fill="currentColor" /></span><span><b className="block font-display text-[25px] text-ink">{streak} days</b><span className="text-[13px] font-bold text-ink-3">Current streak</span></span></div>
          <div className="pill h-[72px] px-5 gap-4"><span className="icon-orb h-11 w-11 bg-emerald-100 text-emerald-600"><ShieldCheck size={23} /></span><span><b className="block font-display text-[25px] text-ink">{usedToday ? 'Protected' : 'Ready'}</b><span className="text-[13px] font-bold text-ink-3">Today’s status</span></span></div>
        </Item>
      </Stack>

      <Panel className="absolute left-[790px] top-[120px] h-[690px] w-[750px] p-9" initial="hidden" animate="show">
        <div className="flex items-start justify-between"><div><p className="label-caps text-primary-ink">Your Break Passes</p><h2 className="mt-2 font-display text-[39px] font-extrabold text-ink">{passes} of 5 days available</h2><p className="mt-2 text-[17px] font-semibold text-ink-3">Each pass protects one missed learning day.</p></div><span className="grid h-[72px] w-[72px] place-items-center rounded-[22px] bg-violet-100 text-violet-600"><CalendarCheck size={36} /></span></div>

        <div className="mt-8 grid grid-cols-5 gap-3">
          {Array.from({ length: 5 }, (_, i) => {
            const available = i < passes
            return <motion.div key={i} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .18 + i * .07 }} className={`relative h-[190px] overflow-hidden rounded-[24px] border-2 p-4 text-center ${available ? 'border-violet-300 bg-gradient-to-b from-violet-50 to-white' : 'border-slate-200 bg-slate-100 opacity-55'}`}>
              <span className={`mx-auto grid h-14 w-14 place-items-center rounded-full ${available ? 'bg-violet-600 text-white' : 'bg-slate-300 text-white'}`}>{available ? <ShieldCheck size={28} /> : <Check size={28} />}</span>
              <p className="mt-4 label-caps">Day {i + 1}</p><p className="mt-2 font-display text-[18px] font-extrabold text-ink">{available ? 'Available' : 'Used'}</p>
              {available && <Sparkles size={15} className="absolute right-3 top-3 text-amber-400" />}
            </motion.div>
          })}
        </div>

        <div className={`mt-7 rounded-[22px] border-2 px-6 py-5 ${usedToday ? 'border-emerald-300 bg-emerald-50' : 'border-violet-200 bg-violet-50'}`}>
          <div className="flex items-center gap-4"><span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-white ${usedToday ? 'bg-emerald-500' : 'bg-violet-600'}`}>{usedToday ? <Check size={25} strokeWidth={3} /> : <Flame size={24} fill="currentColor" />}</span><div><p className="font-display text-[19px] font-extrabold text-ink">{usedToday ? 'Your streak is protected today!' : 'Need today off?'}</p><p className="text-[14px] font-semibold text-ink-3">{usedToday ? 'Come back tomorrow and continue your adventure.' : 'Activate one pass before the day ends.'}</p></div></div>
        </div>
        <Button className="mt-6 h-[64px] w-full uppercase text-[20px]" icon={<ShieldCheck size={24} />} disabled={usedToday || passes === 0} onClick={() => setConfirm(true)}>{usedToday ? 'Break Pass Active' : passes === 0 ? 'No Passes Left' : 'Use Break Pass'}</Button>
      </Panel>

      <AnimatePresence>{confirm && <motion.div className="absolute inset-0 z-[100] grid place-items-center bg-indigo-950/45 backdrop-blur-[8px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={e => e.target === e.currentTarget && setConfirm(false)}><motion.div role="dialog" aria-modal="true" aria-label="Use a Break Pass" className="relative w-[520px] rounded-[34px] border-2 border-white bg-white p-9 text-center shadow-2xl" initial={{ scale: .72, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: .85, opacity: 0 }}><button aria-label="Close" className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-violet-50 text-ink-3" onClick={() => setConfirm(false)}><X size={20} /></button><span className="mx-auto grid h-20 w-20 place-items-center rounded-[25px] bg-violet-100 text-violet-600"><ShieldCheck size={42} /></span><h2 className="mt-5 font-display text-[32px] font-extrabold text-ink">Protect today’s streak?</h2><p className="mt-3 text-[17px] font-semibold leading-relaxed text-ink-2">One Break Pass will be used. Your {streak}-day streak will stay exactly as it is.</p><div className="mt-7 grid grid-cols-2 gap-3"><Button variant="outline" className="h-[56px]" onClick={() => setConfirm(false)}>Not now</Button><Button className="h-[56px]" onClick={activate}>Use 1 Pass</Button></div></motion.div></motion.div>}</AnimatePresence>
    </Page>
  )
}
