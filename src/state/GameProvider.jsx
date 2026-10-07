import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { setSoundEnabled } from '../lib/sound.js'
import { setVoiceEnabled } from '../lib/voice.js'

import { emptyProfile, emptyStats, emptyProgress, beginChild, finishChild, selectChild, migrateFamily, loginRoute, openAccount, hydrateRemoteFamily, beginRemoteChild, remoteStudent } from './family.js'
import { api as remote, apiRequest, API_MODE, setToken, warmCatalogs, clearSession, mockSnapshot } from '../lib/api.js'
import { isReviewMode, takeReviewSeed } from '../lib/reviewMode.js'
import { clearBrowserData } from '../lib/browserData.js'
import { selectApiAvatar } from '../lib/avatar-selection.js'
import { saveOnboardingStep } from '../lib/onboarding-save.js'

const KEY = `kidsverse-plus-v3-${API_MODE}${isReviewMode() ? '-review' : ''}`
/* A finished mission pays about 45 XP; 400 per level keeps a level within a few sittings. */
export const XP_PER_LEVEL = 1000
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
  const review = isReviewMode()
  try {
    const s = (review ? takeReviewSeed() : null) || migrateFamily(JSON.parse(localStorage.getItem(KEY)))
    if (s) return {
      ...initial, ...s,
      profile: { ...initial.profile, ...s.profile, name: s.profile?.name || (review ? 'Reviewer' : initial.profile.name) }, stats: { ...initial.stats, ...s.stats },
      settings: { ...initial.settings, ...s.settings }, progress: { ...initial.progress, ...s.progress },
      parentLock: { ...initial.parentLock, ...s.parentLock },
      children: s.children ?? initial.children, activeChildId: s.activeChildId ?? initial.activeChildId,
      toasts: [], flash: null, notices: [],
    }
  } catch {}
  return review ? { ...initial, profile: { ...initial.profile, name: 'Reviewer' } } : initial
}

let seq = 0
function reducer(state, a) {
  switch (a.type) {
    case 'mockFamily': { const next=hydrateRemoteFamily(state,a.data.parent.email,a.data.students,a.data.resources['/avatar/characters'].characters);const stats=a.data.resources[`/students/${next.activeChildId}/home`]?.stats;return {...next,stats:{...next.stats,xp:stats?.total_xp ?? next.stats.xp,streak:stats?.day_streak ?? 0,battles:0},progress:{...next.progress,...a.data.demo.progress},parentLock:{pin:a.data.demo.pin}} }
    case 'remoteStats': return { ...state, stats: { ...state.stats, ...a.stats, xp: a.stats.total_xp ?? state.stats.xp, streak: a.stats.day_streak ?? state.stats.streak } }
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
    case 'useBreakPass': {
      const used = state.stats.breakPassUsedDates ?? []
      if ((state.stats.breakPasses ?? 5) <= 0 || used.includes(a.date)) return state
      return { ...state, stats: { ...state.stats, breakPasses: (state.stats.breakPasses ?? 5) - 1, breakPassUsedDates: [...used, a.date] } }
    }
    case 'clearToast': return { ...state, toasts: state.toasts.filter(t => t.id !== a.id) }
    case 'clearFlash': return { ...state, flash: null }
    case 'notice': return { ...state, notices: [...state.notices, { id: ++seq, message: a.message }] }
    case 'clearNotice': return { ...state, notices: state.notices.filter(n => n.id !== a.id) }
    case 'pin': return { ...state, parentLock: { pin: a.pin } }
    case 'refreshChildren': return { ...state, children: a.students.map(student => {
      const previous = state.children.find(child => child.id === student.id)
      const child = remoteStudent(student, a.characters)
      return { ...previous, ...child, stats: previous?.stats || child.stats, progress: previous?.progress || child.progress }
    }) }
    case 'switchChild': return selectChild(state, a.id)
    case 'addChild': return beginChild(state, a.name)
    case 'completeChild': return finishChild(state, a.id)
    case 'remoteFamily': return hydrateRemoteFamily(state, a.email, a.students, a.characters)
    case 'remoteChild': return beginRemoteChild(state, a.student)
    case 'authIntent': return { ...state, authIntent: a.intent }
    case 'openAccount': return openAccount(state, a.email)
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
    refreshFamily: async () => {
      const [{ students }, { characters }] = await Promise.all([remote.parentStudents(), remote.avatarCharacters()])
      dispatch({ type: 'refreshChildren', students, characters })
    },
    level: levelOf(state.stats.xp), levelPct: levelPct(state.stats.xp), toNext: XP_PER_LEVEL - (state.stats.xp % XP_PER_LEVEL),
    setProfile: patch => dispatch({ type: 'profile', patch }),
    setSettings: patch => {
      if(API_MODE==='mock'&&mockSnapshot.value&&state.activeChildId) {
        return apiRequest(`/students/${state.activeChildId}/settings`,{method:'PATCH',body:patch})
          .then(saved=>dispatch({type:'settings',patch:saved}))
          .catch(e=>dispatch({type:'notice',message:e.message}))
      }
      dispatch({type:'settings',patch})
    },
    setProgress: patch => dispatch({ type: 'progress', patch }),
    refreshStats: async () => {
      if (!state.activeChildId) return
      const home = await remote.studentHome(state.activeChildId)
      dispatch({ type: 'remoteStats', stats: home.stats })
    },
    /* The car has now been watched arriving at this station, so it should not drive
       there again the next time the map is opened. */
    markJourneySeen: (world, index) => dispatch({ type: 'journeySeen', world, index }),
    /* Move the child one station along the current world's map. */
    advanceStation: ({ world, base, per, total } = {}) => dispatch({ type: 'advanceStation', world, base, per, total }),
    addXp: (amount, label) => dispatch({ type: 'xp', amount, label }),
    bumpStreak: () => dispatch({ type: 'streak' }),
    useBreakPass: async date => {
      const result=await apiRequest(`/students/${state.activeChildId}/break-passes`,{method:'POST',body:{date}})
      dispatch({type:'remoteStats',stats:{breakPasses:result.available,breakPassUsedDates:result.used_dates}})
      return result
    },
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
    startMockDemo: async () => {
      if(API_MODE!=='mock') throw new Error('Open the local mock build first.')
      const response=await apiRequest('/demo/login',{method:'POST',body:{}})
      setToken(response.token)
      dispatch({type:'mockFamily',data:response.bootstrap})
      return '/mock-demo'
    },
    signOut: async () => {
      try { await remote.logout() } catch (error) { console.warn('Remote logout failed:', error.message) }
      finally { clearSession(); clearBrowserData(localStorage, sessionStorage); window.location.replace('/parent/login') }
    },
    signUp: async (email, password) => {
      const response = await remote.signUp({ email: email.trim().toLowerCase(), password })
      setToken(response.token)
      void warmCatalogs()
      dispatch({ type: 'remoteFamily', email, students: [] })
      return '/onboarding/child'
    },
    signIn: async (email, password) => {
      const response = await remote.login({ email: email.trim().toLowerCase(), password })
      setToken(response.token)
      if (API_MODE === 'mock' && response.bootstrap) {
        dispatch({type:'mockFamily',data:response.bootstrap})
        return '/home'
      }
      void warmCatalogs()
      const [{ students }, { characters }, parentResponse] = await Promise.all([apiRequest('/parent/students'), remote.avatarCharacters(), remote.parentMe().catch(() => null)])
      const parent = parentResponse?.parent ?? parentResponse
      dispatch({ type: 'remoteFamily', email, students, characters })
      if (!students.length) return '/onboarding/child'
      if (students.length === 1 && !students[0].onboarding_completed) return API_MODE === 'live' || parent?.phone_verified_at ? '/onboarding/grade-board' : '/onboarding/parent-details'
      return loginRoute({ children: students }, state.authIntent === 'parent')
    },
    addChild: async name => {
      const student = await apiRequest('/students', { method: 'POST', body: { name: name.trim() } })
      dispatch({ type: 'remoteChild', student })
      return student
    },
    completeChild: () => dispatch({ type: 'completeChild', id: crypto.randomUUID() }),
    saveGradeBoard: () => saveOnboardingStep({review:isReviewMode(),step:'grade-board',profile:state.profile,liveSave:() => apiRequest(`/students/${state.activeChildId}/grade-board`, { method: 'PATCH', body: { grade: state.profile.grade, board: state.profile.board } })}),
    saveAvatar: async () => {
      const result=await saveOnboardingStep({review:isReviewMode(),step:'avatar',profile:state.profile,liveSave:async () => {
        const [{ characters }, { items }] = await Promise.all([remote.avatarCharacters(), remote.avatarItems()])
        const selection=selectApiAvatar(state.profile,characters,items)
        return apiRequest(`/students/${state.activeChildId}/avatar`, {method:'PUT',body:selection})
      }})
      dispatch({type:'profile',patch:{face:Number(state.profile.face)||1,outfit:state.profile.outfit||'explorer'}})
      return result
    },
    saveInterests: () => saveOnboardingStep({review:isReviewMode(),step:'interests',profile:state.profile,liveSave:async () => {
      const { interests } = await remote.interests()
      const ids = state.profile.interests.map(key => interests.find(i => i.key === key)?.id)
      if (ids.length < 3 || ids.some(id => !id)) throw new Error('Select at least three available API interests.')
      return apiRequest(`/students/${state.activeChildId}/interests`, { method: 'PUT', body: { interest_ids: ids } })
    }}),
    saveGoals: () => saveOnboardingStep({review:isReviewMode(),step:'goals',profile:state.profile,liveSave:async () => {
      const { goals } = await remote.goals()
      const mapping = { school: 'master_school_topics', confidence: 'build_confidence', competition: 'prepare_competitions', reading: 'read_fluently', explore: 'explore_beyond_class', nova: 'not_sure_yet' }
      const ids = state.profile.goals.map(key => goals.find(v => v.key === (mapping[key] || key))?.id)
      if (ids.some(id => !id)) throw new Error('Selected goal is not in the API catalog.')
      return apiRequest(`/students/${state.activeChildId}/goals`, { method: 'PUT', body: { goal_ids: ids } })
    }}),
    greetNova: async () => {
      const response=await saveOnboardingStep({review:isReviewMode(),step:'nova',profile:state.profile,liveSave:async () => {
        await apiRequest(`/students/${state.activeChildId}/onboarding/steps/lobby/complete`, { method: 'POST', body: {} })
        return apiRequest(`/students/${state.activeChildId}/nova/greet`, { method: 'POST', body: {} })
      }})
      dispatch({ type: 'completeChild', id: state.activeChildId || (isReviewMode() ? `review-child-${crypto.randomUUID()}` : null) })
      return response
    },
    switchChild: id => dispatch({ type: 'switchChild', id }),
    reset: () => {
      clearBrowserData(localStorage, sessionStorage)
      // Reload also discards in-memory dummy tokens and cached account resources.
      window.location.replace('/')
    },
    toggleTheme: () => dispatch({ type: 'settings', patch: { theme: state.settings.theme === 'dark' ? 'light' : 'dark' } }),
    toggleSound: () => dispatch({ type: 'settings', patch: { sound: !state.settings.sound } }),
  }), [state])
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}
export const useGame = () => useContext(Ctx)
