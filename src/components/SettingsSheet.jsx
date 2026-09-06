import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Settings, X, Music, Bell, Volume2, Moon, Sun, Globe, Palette, UserCircle, Users, Lock, LogOut, Trash2, ChevronDown, Sparkles } from 'lucide-react'
import { useGame } from '../state/GameProvider.jsx'
import { useNovaVoice, listVoices, getPreferredVoice, setPreferredVoice } from '../lib/voice.js'
import { getMusicOn, setMusicOn } from './MusicPlayer.jsx'
import { Switch } from './Widgets.jsx'
import ParentGate from './ParentGate.jsx'
import { ScreenRows } from './ScreenFit.jsx'
import { bleedR, bleedX, safeT, safeB } from './Stage.jsx'
import { LANGS } from '../data/catalog.js'
import { sfx } from '../lib/sound.js'
import { cn } from '../lib/utils.js'

/* Settings — the gear in the top-right corner.
   Things a child may change alone (sound, voice, calm mode, language, their look) sit one tap away.
   Things a grown-up must do (parents zone, the parent code, wiping the adventure) ask for the code first. */
export const openSettings = () => window.dispatchEvent(new Event('kv:settings'))

function Row({ icon: Icon, tint, title, sub, children, onClick, danger }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag className={cn('w-full flex items-center gap-4 px-4 py-3 rounded-[18px] text-left transition-colors', onClick && 'hover:bg-[var(--lavender)] cursor-pointer')} onClick={onClick}>
      <span className="icon-orb w-[42px] h-[42px] shrink-0" style={{ color: tint, background: `${tint}1f` }}><Icon size={20} /></span>
      <span className="flex-1 leading-tight"><b className={cn('block text-[16px] font-extrabold', danger ? 'text-red-500' : 'text-ink')}>{title}</b>{sub && <i className="block text-[13px] font-semibold not-italic text-ink-3">{sub}</i>}</span>
      <span className="flex items-center gap-2">{children}</span>
    </Tag>
  )
}
const Section = ({ children }) => <h4 className="label-caps px-4 mt-4 mb-1">{children}</h4>

export default function SettingsSheet() {
  const g = useGame(); const s = g.state.settings
  const nav = useNavigate(); const { pathname } = useLocation()
  const voice = useNovaVoice()
  const [open, setOpen] = useState(false)
  const [music, setMusic] = useState(getMusicOn)
  const [gate, setGate] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [voices, setVoices] = useState(() => listVoices())
  const [voiceName, setVoiceName] = useState(getPreferredVoice)
  useEffect(() => { const on = () => setOpen(true); window.addEventListener('kv:settings', on); return () => window.removeEventListener('kv:settings', on) }, [])
  useEffect(() => { const load = () => setVoices(listVoices()); load(); speechSynthesis?.addEventListener?.('voiceschanged', load); return () => speechSynthesis?.removeEventListener?.('voiceschanged', load) }, [])
  useEffect(() => { setOpen(false); setConfirm(null) }, [pathname])
  useEffect(() => { if (!open) return; const k = e => { if (e.key === 'Escape') setOpen(false) }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k) }, [open])

  const set = patch => { sfx.tap(); g.setSettings(patch) }
  const guarded = what => { sfx.tap(); setGate(what) }
  const passed = () => {
    const what = gate; setGate(null)
    if (what === 'parents') { setOpen(false); nav('/parent') }
    if (what === 'pin') { g.setParentPin(null); setGate('newpin') }
    if (what === 'newpin') g.notice('Parent code changed.')
    if (what === 'reset') setConfirm('reset')
  }
  const langLabel = LANGS.find(l => l.id === (s.lang ?? 'en'))?.label ?? 'English'

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.div className="absolute z-40" style={{ background: 'rgba(10,8,40,.35)', ...bleedX(0), ...safeT(0), ...safeB(0) }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.section className="absolute w-[460px] z-50 glass glass-strong flex flex-col overflow-hidden" style={{ ...bleedR(20), ...safeT(20), ...safeB(20) }} role="dialog" aria-label="Settings" initial={{ x: 80, opacity: 0, scale: 0.98 }} animate={{ x: 0, opacity: 1, scale: 1 }} exit={{ x: 80, opacity: 0, scale: 0.98 }} transition={{ type: 'spring', stiffness: 260, damping: 26 }}>
              <header className="flex items-center gap-4 px-6 pt-5 pb-3">
                <span className="icon-orb w-[48px] h-[48px]"><Settings size={24} /></span>
                <div className="flex-1"><b className="block font-display font-extrabold text-[24px] text-ink leading-none">Settings</b><p className="text-[14px] font-semibold text-ink-3">Make Kidsverse+ just right for you.</p></div>
                <button className="pill w-[40px] h-[40px] justify-center text-ink" onClick={() => setOpen(false)} aria-label="Close"><X size={18} /></button>
              </header>
              <div className="flex-1 overflow-auto no-scrollbar px-3 pb-4">
                <Section>Sound</Section>
                <Row icon={Music} tint="#a855f7" title="Music" sub="The soft tune in the background"><Switch on={music} onChange={v => { sfx.tap(); setMusicOn(v); setMusic(v) }} /></Row>
                <Row icon={Bell} tint="#f59e0b" title="Sound effects" sub="Taps, cheers and whooshes"><Switch on={s.sound} onChange={v => set({ sound: v })} /></Row>
                <Row icon={Volume2} tint="#38bdf8" title="Nova reads aloud" sub="Nova says every step out loud"><button className="chip h-[32px] px-3 text-[13px]" disabled={!s.voice} onClick={() => voice.say("Hi! I'm Nova. I'll read everything out loud for you.")}>▶ Hear</button><Switch on={s.voice} onChange={v => { set({ voice: v }); if (!v) voice.stop() }} /></Row>
                {voices.length > 1 && s.voice && (
                  <Row icon={Sparkles} tint="#38bdf8" title="Nova's voice" sub="Voices on this device">
                    <span className="relative"><select className="appearance-none pill h-[36px] pl-3 pr-8 text-[13px] font-bold text-ink max-w-[170px]" value={voiceName} onChange={e => { setVoiceName(e.target.value); setPreferredVoice(e.target.value); voice.say("Hi! I'm Nova. Does this sound better?") }}><option value="">Best available</option>{voices.map(v => <option key={v.name} value={v.name}>{v.name.replace(/^Microsoft |^Google /, '')}{v.natural ? ' ✦' : ''}</option>)}</select><ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-ink-3" /></span>
                  </Row>
                )}
                <Section>Screen</Section>
                <ScreenRows />
                <Row icon={s.theme === 'dark' ? Moon : Sun} tint="#818cf8" title="Dark mode" sub="Night sky instead of day"><Switch on={s.theme === 'dark'} onChange={v => set({ theme: v ? 'dark' : 'light' })} /></Row>
                <Row icon={Moon} tint="#6366f1" title="Calm mode" sub="Fewer moving and flashing things"><Switch on={!s.motion} onChange={v => set({ motion: !v })} /></Row>
                <Row icon={Globe} tint="#22c55e" title="Language" sub={`${langLabel}${s.lang === 'en' ? ' · more coming soon' : ''}`}>
                  <span className="relative"><select className="appearance-none pill h-[36px] pl-3 pr-8 text-[13px] font-bold text-ink" value={s.lang ?? 'en'} onChange={e => set({ lang: e.target.value })}>{LANGS.map(l => <option key={l.id} value={l.id} disabled={l.soon}>{l.label}{l.soon ? ' · soon' : ''}</option>)}</select><ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-ink-3" /></span>
                </Row>
                <Section>Me</Section>
                <Row icon={Palette} tint="#ec4899" title="Change my look" sub="Pick a new face or outfit" onClick={() => { sfx.select(); setOpen(false); nav('/onboarding/avatar') }} />
                <Row icon={UserCircle} tint="#6d8cff" title="My profile" sub="Badges, streaks and cards" onClick={() => { sfx.select(); setOpen(false); nav('/profile') }} />
                <Section>Grown-ups 🔒</Section>
                <Row icon={Users} tint="#a855f7" title="Parents zone" sub="Reports, goals and screen time" onClick={() => guarded('parents')} />
                <Row icon={Lock} tint="#fbbf24" title="Change the parent code" sub="The four digits grown-ups use" onClick={() => guarded('pin')} />
                <Row icon={LogOut} tint="#94a3b8" title="Sign out" sub="Your progress stays saved" onClick={() => { sfx.tap(); setConfirm('signout') }} />
                <Row icon={Trash2} tint="#f0665a" title="Start over" sub="Erases everything on this device" danger onClick={() => guarded('reset')} />
                <p className="mt-4 text-center text-[12px] font-extrabold tracking-[0.2em] text-ink-3 uppercase">Kidsverse+ · Learn · Grow · Achieve</p>
              </div>
              <AnimatePresence>
                {confirm && (
                  <motion.div className="absolute inset-x-4 bottom-4 card p-5" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} role="alertdialog">
                    <b className="block font-display font-extrabold text-[20px] text-ink">{confirm === 'reset' ? 'Start the whole adventure over?' : 'Sign out?'}</b>
                    <p className="mt-1 text-[14px] font-semibold text-ink-3">{confirm === 'reset' ? 'Every lesson, badge and star on this device will be erased. This cannot be undone.' : 'Your progress stays saved. Sign back in to carry on where you left off.'}</p>
                    <div className="mt-3 flex gap-3">
                      <button className="btn btn-ghost btn-sm flex-1" onClick={() => setConfirm(null)}>{confirm === 'reset' ? 'Keep my progress' : 'Stay'}</button>
                      <button className="btn btn-primary btn-sm flex-1" style={confirm === 'reset' ? { background: 'linear-gradient(95deg,#ef4444,#f97316)' } : undefined} onClick={() => { sfx.whoosh(); setConfirm(null); setOpen(false); if (confirm === 'reset') g.reset(); nav('/') }}>{confirm === 'reset' ? 'Yes, erase it' : 'Sign out'}</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          </>
        )}
      </AnimatePresence>
      <AnimatePresence>{gate && <ParentGate onCancel={() => setGate(null)} onPass={passed} />}</AnimatePresence>
    </>
  )
}
