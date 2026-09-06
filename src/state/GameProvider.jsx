import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { setSoundEnabled } from '../lib/sound.js'
import { setVoiceEnabled } from '../lib/voice.js'

const KEY = 'kidsverse-plus-v2'
/* A finished mission pays about 45 XP; 400 per level keeps a level within a few sittings. */
export const XP_PER_LEVEL = 400
export const levelOf = xp => 1 + Math.floor(xp / XP_PER_LEVEL)
export const levelPct = xp => Math.round(((xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100)

const initial = {
  profile: { name: 'Aarav', grade: '4', board: 'CBSE', face: 1, outfit: 'explorer', interests: ['space', 'animals', 'art'], goals: ['school'], firstVisit: true },
  stats: { xp: 1250, xpToday: 240, streak: 7, coins: 320, badges: 12, day: 43 },
  settings: { theme: 'light', sound: true, music: true, voice: true, motion: true, lang: 'en', readAloud: true, screenFit: 'auto', zoom: 1 },
  progress: { lessonStage: 1, missionsDone: 0, mastery: 68, world: 'maths' },
  /* The family. `profile` is whichever child is signed in; the rest wait here
     with their own progress so switching does not overwrite anyone. */
  children: [
    { id: 'aarav', name: 'Aarav', grade: '4', board: 'CBSE', face: 1, outfit: 'explorer', img: '/art/crops/aarav-card.webp', xp: 1250, streak: 7, mastery: 72 },
    { id: 'mira', name: 'Mira', grade: '2', board: 'CBSE', face: 2, outfit: 'sprint', img: '/art/crops/mira.webp', xp: 640, streak: 3, mastery: 48 },
    { id: 'vihaan', name: 'Vihaan', grade: '1', board: 'CBSE', face: 3, outfit: 'ranger', img: '/art/crops/vihaan.webp', xp: 310, streak: 2, mastery: 36 },
  ],
  activeChildId: 'aarav',
  parentLock: { pin: null },
  /* Why the login screen was opened: 'play' continues into the child's setup,
     'parent' goes straight to the grown-up side after signing in. */
  authIntent: 'play',
  toasts: [], flash: null, notices: [],
}

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY))
    if (s) return {
      ...initial, ...s,
      profile: { ...initial.profile, ...s.profile }, stats: { ...initial.stats, ...s.stats },
      settings: { ...initial.settings, ...s.settings }, progress: { ...initial.progress, ...s.progress },
      parentLock: { ...initial.parentLock, ...s.parentLock },
      children: s.children ?? initial.children, activeChildId: s.activeChildId ?? initial.activeChildId,
      toasts: [], flash: null, notices: [],
    }
  } catch {}
  return initial
}

let seq = 0
function reducer(state, a) {
  switch (a.type) {
    case 'profile': return { ...state, profile: { ...state.profile, ...a.patch } }
    case 'settings': return { ...state, settings: { ...state.settings, ...a.patch } }
    case 'progress': return { ...state, progress: { ...state.progress, ...a.patch } }
    case 'xp': {
      const xp = state.stats.xp + a.amount
      const up = levelOf(xp) > levelOf(state.stats.xp)
      return { ...state, stats: { ...state.stats, xp, xpToday: state.stats.xpToday + a.amount, coins: state.stats.coins + a.amount, badges: up ? state.stats.badges + 1 : state.stats.badges },
        toasts: [...state.toasts, { id: ++seq, amount: a.amount, label: a.label }], flash: up ? 'levelup' : 'xp' }
    }
    case 'streak': return { ...state, stats: { ...state.stats, streak: state.stats.streak + 1 } }
    case 'clearToast': return { ...state, toasts: state.toasts.filter(t => t.id !== a.id) }
    case 'clearFlash': return { ...state, flash: null }
    case 'notice': return { ...state, notices: [...state.notices, { id: ++seq, message: a.message }] }
    case 'clearNotice': return { ...state, notices: state.notices.filter(n => n.id !== a.id) }
    case 'pin': return { ...state, parentLock: { pin: a.pin } }
    case 'switchChild': {
      const kids = state.children ?? []
      const next = kids.find(c => c.id === a.id)
      if (!next || a.id === state.activeChildId) return state
      // bank the signed-in child's numbers before handing over
      const saved = kids.map(c => c.id === state.activeChildId
        ? { ...c, name: state.profile.name, grade: state.profile.grade, board: state.profile.board,
            face: state.profile.face, outfit: state.profile.outfit, xp: state.stats.xp, streak: state.stats.streak }
        : c)
      return { ...state, children: saved, activeChildId: a.id,
        profile: { ...state.profile, name: next.name, grade: next.grade, board: next.board, face: next.face, outfit: next.outfit },
        stats: { ...state.stats, xp: next.xp, streak: next.streak },
        progress: { ...state.progress, mastery: next.mastery ?? state.progress.mastery } }
    }
    case 'authIntent': return { ...state, authIntent: a.intent }
    case 'reset': return { ...initial, settings: state.settings }
    default: return state
  }
}

const Ctx = createContext(null)
export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)
  useEffect(() => { try { const { toasts, flash, notices, ...rest } = state; localStorage.setItem(KEY, JSON.stringify(rest)) } catch {} }, [state])
  useEffect(() => { document.documentElement.dataset.theme = state.settings.theme }, [state.settings.theme])
  useEffect(() => { document.documentElement.dataset.motion = state.settings.motion ? 'full' : 'calm' }, [state.settings.motion])
  useEffect(() => { setSoundEnabled(state.settings.sound) }, [state.settings.sound])
  useEffect(() => { setVoiceEnabled(state.settings.voice) }, [state.settings.voice])
  const api = useMemo(() => ({
    state, dispatch,
    level: levelOf(state.stats.xp), levelPct: levelPct(state.stats.xp), toNext: XP_PER_LEVEL - (state.stats.xp % XP_PER_LEVEL),
    setProfile: patch => dispatch({ type: 'profile', patch }),
    setSettings: patch => dispatch({ type: 'settings', patch }),
    setProgress: patch => dispatch({ type: 'progress', patch }),
    addXp: (amount, label) => dispatch({ type: 'xp', amount, label }),
    bumpStreak: () => dispatch({ type: 'streak' }),
    clearToast: id => dispatch({ type: 'clearToast', id }),
    clearFlash: () => dispatch({ type: 'clearFlash' }),
    notice: message => dispatch({ type: 'notice', message }),
    clearNotice: id => dispatch({ type: 'clearNotice', id }),
    setParentPin: pin => dispatch({ type: 'pin', pin }),
    setAuthIntent: intent => dispatch({ type: 'authIntent', intent }),
    switchChild: id => dispatch({ type: 'switchChild', id }),
    reset: () => dispatch({ type: 'reset' }),
    toggleTheme: () => dispatch({ type: 'settings', patch: { theme: state.settings.theme === 'dark' ? 'light' : 'dark' } }),
    toggleSound: () => dispatch({ type: 'settings', patch: { sound: !state.settings.sound } }),
  }), [state])
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}
export const useGame = () => useContext(Ctx)
