import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { setSoundEnabled } from '../lib/sound.js'
import { setVoiceEnabled } from '../lib/voice.js'

import { backend, onboardingRoute, saveAvatarChoice, saveGoalKeys, saveInterestKeys } from '../lib/api.js'
import { emptyProfile, emptyStats, emptyProgress, beginChild, beginRemoteChild, finishChild, hydrateRemoteFamily, selectChild, migrateFamily, loginRoute } from './family.js'

const KEY = 'kidsverse-plus-v2'
/* A finished mission pays about 45 XP; 400 per level keeps a level within a few sittings. */
export const XP_PER_LEVEL = 400
export const levelOf = xp => 1 + Math.floor(xp / XP_PER_LEVEL)
export const levelPct = xp => Math.round(((xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100)

const initial = {
  profile: emptyProfile,
  stats: emptyStats,
  settings: { theme: 'light', sound: true, music: true, voice: true, motion: true, lang: 'en', readAloud: true, screenFit: 'auto', zoom: 1 },
  progress: emptyProgress,
  children: [],
  activeChildId: null,
  creatingChild: false,
  familyVersion: 1,
  accounts: {},
  parentLock: { pin: null },
  /* Why the login screen was opened: 'play' continues into the child's setup,
     'parent' goes straight to the grown-up side after signing in. */
  authIntent: 'play',
  toasts: [], flash: null, notices: [],
}

function load() {
  try {
    const s = migrateFamily(JSON.parse(localStorage.getItem(KEY)))
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
    case 'battle':
      return { ...state, stats: { ...state.stats, battles: state.stats.battles + 1 } }
    case 'reading':
      return { ...state, stats: { ...state.stats, reading: state.stats.reading + 1 } }
    case 'test':
      return { ...state, progress: { ...state.progress, lastTest: a.run } }
    case 'quiz':
      return { ...state, progress: { ...state.progress, quizzesDone: state.progress.quizzesDone + 1 } }
    case 'journeySeen':
      return { ...state, progress: { ...state.progress, journeySeen: { ...state.progress.journeySeen, [a.world]: a.index } } }
    case 'advanceStation': {
      const w = a.world ?? state.progress.world
      const done = state.progress.worldDone[w] ?? a.base ?? 0
      // One station's worth of lessons, so `here` lands on exactly the next stop.
      const next = Math.min(a.total ?? 20, Math.floor(done / a.per) * a.per + a.per)
      return { ...state, progress: { ...state.progress, worldDone: { ...state.progress.worldDone, [w]: next } } }
    }
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
    case 'switchChild': return selectChild(state, a.id)
    case 'addChild': return beginChild(state, a.name)
    case 'completeChild': return finishChild(state, a.id)
    case 'remoteFamily': return hydrateRemoteFamily(state, a.email, a.students, a.characters)
    case 'remoteChild': return beginRemoteChild(state, a.student)
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
    /* The car has now been watched arriving at this station, so it should not drive
       there again the next time the map is opened. */
    markJourneySeen: (world, index) => dispatch({ type: 'journeySeen', world, index }),
    /* Move the child one station along the current world's map. */
    advanceStation: ({ world, base, per, total } = {}) => dispatch({ type: 'advanceStation', world, base, per, total }),
    addXp: (amount, label) => dispatch({ type: 'xp', amount, label }),
    bumpStreak: () => dispatch({ type: 'streak' }),
    /* One finished test. Home's progress panel counts these. */
    finishQuiz: () => dispatch({ type: 'quiz' }),
    recordTest: run => dispatch({ type: 'test', run }),
    finishBattle: () => dispatch({ type: 'battle' }),
    finishReading: () => dispatch({ type: 'reading' }),
    clearToast: id => dispatch({ type: 'clearToast', id }),
    clearFlash: () => dispatch({ type: 'clearFlash' }),
    notice: message => dispatch({ type: 'notice', message }),
    clearNotice: id => dispatch({ type: 'clearNotice', id }),
    setParentPin: pin => dispatch({ type: 'pin', pin }),
    setAuthIntent: intent => dispatch({ type: 'authIntent', intent }),
    signUp: async (email, password) => {
      await backend.signup(email, password)
      dispatch({ type: 'remoteFamily', email, students: [] })
      return '/onboarding/child'
    },
    signIn: async (email, password) => {
      await backend.login(email, password)
      const [data, catalog] = await Promise.all([backend.students(), backend.avatarCharacters()])
      const students = data.students ?? []
      const next = hydrateRemoteFamily(state, email, students, catalog.characters ?? [])
      dispatch({ type: 'remoteFamily', email, students, characters: catalog.characters ?? [] })
      if (students.length === 1 && !students[0].onboarding_completed) {
        const status = await backend.onboardingStatus(students[0].id)
        return onboardingRoute(status.next_step)
      }
      return loginRoute(next, state.authIntent === 'parent')
    },
    addChild: async name => {
      const student = await backend.createStudent(name.trim())
      dispatch({ type: 'remoteChild', student })
      return student
    },
    completeChild: () => dispatch({ type: 'completeChild', id: crypto.randomUUID() }),
    saveGradeBoard: () => backend.saveGradeBoard(state.activeChildId, state.profile.grade, state.profile.board),
    saveAvatar: () => saveAvatarChoice(state.activeChildId, state.profile.face, state.profile.outfit),
    saveInterests: () => saveInterestKeys(state.activeChildId, state.profile.interests),
    saveGoals: () => saveGoalKeys(state.activeChildId, state.profile.goals),
    greetNova: () => backend.greetNova(state.activeChildId),
    switchChild: id => dispatch({ type: 'switchChild', id }),
    reset: () => dispatch({ type: 'reset' }),
    toggleTheme: () => dispatch({ type: 'settings', patch: { theme: state.settings.theme === 'dark' ? 'light' : 'dark' } }),
    toggleSound: () => dispatch({ type: 'settings', patch: { sound: !state.settings.sound } }),
  }), [state])
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}
export const useGame = () => useContext(Ctx)
