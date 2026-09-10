export const emptyProfile = { name: '', grade: '4', board: 'CBSE', face: null, outfit: 'explorer', interests: [], goals: [], firstVisit: true }
export const emptyStats = { xp: 0, xpToday: 0, streak: 0, coins: 0, badges: 0, day: 1, battles: 0, reading: 0, bestStreak: 0 }
export const emptyProgress = { lessonStage: 1, quizzesDone: 0, mastery: 0, world: 'maths', worldDone: {}, journeySeen: {}, lastTest: null }
export const accountKey = value => value.trim().toLowerCase()

export function saveChild(state) {
  if (!state.activeChildId || state.creatingChild) return state.children
  const child = { ...state.profile, id: state.activeChildId, stats: state.stats, progress: state.progress,
    xp: state.stats.xp, streak: state.stats.streak, mastery: state.progress.mastery }
  const exists = state.children.some(c => c.id === child.id)
  return exists ? state.children.map(c => c.id === child.id ? child : c) : [...state.children, child]
}

export function selectChild(state, id) {
  const children = saveChild(state)
  const child = children.find(c => c.id === id)
  if (!child) return state
  return { ...state, children, activeChildId: id, creatingChild: false,
    profile: { ...emptyProfile, ...child, parentEmail: state.profile.parentEmail },
    stats: { ...emptyStats, ...child.stats, xp: child.stats?.xp ?? child.xp ?? 0, streak: child.stats?.streak ?? child.streak ?? 0 },
    progress: { ...emptyProgress, ...child.progress, mastery: child.progress?.mastery ?? child.mastery ?? 0 } }
}

export function beginChild(state, name) {
  return { ...state, children: saveChild(state), activeChildId: null, creatingChild: true,
    profile: { ...emptyProfile, name: name.trim(), parentEmail: state.profile.parentEmail },
    stats: { ...emptyStats }, progress: { ...emptyProgress } }
}

export function finishChild(state, id) {
  if (!state.profile.name.trim() || !state.profile.face) return state
  const next = { ...state, activeChildId: state.activeChildId ?? id, creatingChild: false }
  return { ...next, children: saveChild(next) }
}

// Local account separation for the existing browser-based sign-in flow.
export function openAccount(state, email) {
  const key = accountKey(email)
  const oldKey = accountKey(state.profile.parentEmail ?? '')
  const accounts = { ...state.accounts }
  const snapshot = { profile: state.profile, stats: state.stats, progress: state.progress,
    children: saveChild(state), activeChildId: state.activeChildId, creatingChild: state.creatingChild, parentLock: state.parentLock }
  if (oldKey) accounts[oldKey] = snapshot
  const family = key === oldKey ? snapshot : accounts[key]
  return { ...state, ...(family ?? { profile: { ...emptyProfile }, stats: { ...emptyStats }, progress: { ...emptyProgress }, children: [], activeChildId: null, creatingChild: false, parentLock: { pin: null } }),
    accounts, profile: { ...(family?.profile ?? emptyProfile), parentEmail: key } }
}

export function loginRoute(state, parent = false) {
  if (state.creatingChild) return '/onboarding/grade-board'
  if (!state.children.length) return '/onboarding/child'
  return parent ? '/parent' : state.children.length > 1 ? '/switch' : '/home'
}

export function remoteStudent(student, characters = []) {
  const characterId = student.avatar?.character_id
  const face = characterId ? characters.findIndex(c => c.id === characterId) + 1 : 0
  return {
    id: student.id,
    name: student.name,
    grade: student.grade ?? '',
    board: student.board ?? '',
    face: student.face ?? (face || null),
    outfit: student.outfit ?? 'explorer',
    avatar: student.avatar ?? null,
    onboardingCompleted: Boolean(student.onboarding_completed ?? student.onboarding_completed_at),
    stats: { ...emptyStats }, progress: { ...emptyProgress },
  }
}

export function hydrateRemoteFamily(state, email, students, characters = []) {
  const children = students.map(student => remoteStudent(student, characters))
  const currentId = children.some(c => c.id === state.activeChildId) ? state.activeChildId : children[0]?.id ?? null
  const base = { ...state, accounts: {}, children, activeChildId: null, creatingChild: false,
    profile: { ...emptyProfile, parentEmail: email.trim().toLowerCase() }, stats: { ...emptyStats }, progress: { ...emptyProgress } }
  return currentId ? selectChild(base, currentId) : base
}

export function beginRemoteChild(state, student) {
  return { ...beginChild(state, student.name), activeChildId: student.id }
}

export function migrateFamily(saved) {
  if (!saved || saved.familyVersion) return saved
  const demos = { aarav: ['Aarav', 1, 'explorer'], mira: ['Mira', 4, 'sprint'], vihaan: ['Vihaan', 2, 'ranger'] }
  const isDemo = c => demos[c.id]?.every((v, i) => v === [c.name, c.face, c.outfit][i])
  const children = (saved.children ?? []).filter(c => !isDemo(c))
  const active = { ...saved.profile, id: saved.activeChildId ?? 'aarav' }
  if (active.name && !isDemo(active) && !children.some(c => c.id === active.id)) {
    children.push({ ...active, stats: saved.stats, progress: saved.progress })
  }
  const next = { ...saved, children, familyVersion: 1, activeChildId: null, creatingChild: false }
  return children.length ? selectChild(next, children.find(c => c.id === active.id)?.id ?? children[0].id)
    : { ...next, profile: { ...emptyProfile, parentEmail: saved.profile?.parentEmail }, stats: { ...emptyStats }, progress: { ...emptyProgress } }
}
