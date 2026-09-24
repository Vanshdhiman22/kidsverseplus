/* The content layer.
 *
 * The three lesson screens used to carry their words, hints, options and answers as
 * constants in the JSX. That made "add a mission" a code change, and it left the
 * backend nothing to plug into. A learning step is now a package -- one JSON object per
 * mission, in the shape documented in docs/CONTENT-CONTRACT.md -- and the screens are
 * templates that render whatever package they are handed.
 *
 * Two sources, same shape:
 *   - bundled: src/content/<id>.json, always present, what ships today
 *   - remote:  VITE_CONTENT_API/learning-packages/<id>, used when the env var is set
 *
 * The bundled copy renders on the first frame; if a remote package arrives and parses,
 * it replaces it. A remote failure is logged and the bundled copy stays -- a child never
 * sees an empty screen because a service was slow. */
import { useEffect, useState } from 'react'
import fractions from './fractions-equal-parts.json'
import additionStudio from './packages/addition-introduction.json'
import { normalizeContentPackage } from './normalize.js'
import { subjectDemoRaw } from './subject-demos.js'
import { useGame } from '../state/GameProvider.jsx'
import { loadMission } from '../lib/gameApi.js'

const addition = normalizeContentPackage(additionStudio, 'addition-introduction', fractions)
const BUNDLED = { 'fractions-equal-parts': fractions, 'addition-introduction': addition }
for (const subject of ['literacy', 'evs', 'computer', 'general']) BUNDLED[`demo-${subject}`] = normalizeContentPackage(subjectDemoRaw(subject), `demo-${subject}`, addition)
export const ACTIVE_CONTENT_ID = import.meta.env.VITE_LEARNING_PACKAGE_ID || 'addition-introduction'
const API = import.meta.env.VITE_CONTENT_API
const FRONTEND_ONLY = import.meta.env.VITE_API_MODE === 'mock'

const cache = new Map()
const previewStepImages = new Map()

export function clearPreviewStepImages() {
  for (const url of previewStepImages.values()) URL.revokeObjectURL(url)
  previewStepImages.clear()
}

export function setPreviewStepImage(stepKey, file) {
  const previous = previewStepImages.get(stepKey)
  if (previous) URL.revokeObjectURL(previous)
  previewStepImages.set(stepKey, URL.createObjectURL(file))
}

export function getContent(id) {
  const pkg = BUNDLED[id]
  if (!pkg) throw new Error(`no bundled learning package "${id}"`)
  return pkg
}

async function fetchRemote(id) {
  if (!API) return null
  if (cache.has(id)) return cache.get(id)
  const p = fetch(`${API.replace(/\/$/, '')}/learning-packages/${id}`)
    .then(r => (r.ok ? r.json() : Promise.reject(new Error(`${r.status} ${r.statusText}`))))
    .then(pkg => normalizeContentPackage(pkg, id, getContent(id)))
    .catch(err => { console.warn(`[content] remote package "${id}" not used:`, err.message); return null })
  cache.set(id, p)
  return p
}

/** The package for a learning step. Bundled at once, remote when it lands. */
export function useContent(id) {
  const g = useGame()
  const preview = new URLSearchParams(window.location.search).has('contentPreview') || sessionStorage.getItem('kidsverse-content-preview-active') === '1'
  const previewPackage = () => {
    if (!preview) return null
    try {
      const saved = sessionStorage.getItem('kidsverse-content-preview')
      if (!saved) return null
      const content = JSON.parse(saved)
      const steps = content.learn_before_test?.steps
      if (Array.isArray(steps)) content.learn_before_test.steps = steps.map(step => ({
        ...step,
        image_url: previewStepImages.get(step.step_key) ?? step.image_url,
      }))
      return normalizeContentPackage(content, id, getContent(id))
    } catch (error) {
      console.warn('[content] preview package not used:', error.message)
      return null
    }
  }
  const [pkg, setPkg] = useState(() => previewPackage() ?? getContent(id))
  useEffect(() => {
    let live = true
    const imported = previewPackage()
    if (imported) { setPkg(imported); return () => { live = false } }
    setPkg(getContent(id))
    if (!FRONTEND_ONLY) fetchRemote(id).then(remote => { if (live && remote) setPkg(remote) })
    const subject = id.startsWith('demo-') ? id.slice(5) : 'maths'
    if (!FRONTEND_ONLY && g.state.activeChildId) loadMission(g.state.activeChildId, subject).then(mission => {
      if (!live) return
      if (mission.content?.discover && mission.content?.check) {
        setPkg(current => current.studio
          ? { ...current, apiMissionId: mission.id, apiXpReward: mission.xp_reward }
          : { ...mission.content, apiMissionId: mission.id })
        return
      }
      // The current backend supplies mission identity, XP and lifecycle APIs while
      // dynamic lesson/question content is still pending. Keep the safe bundled lesson,
      // but bind the live mission metadata so the screen represents the server record.
      setPkg(current => ({
        ...current,
        apiMissionId: mission.id,
        apiXpReward: mission.xp_reward,
        mission: { ...current.mission, title: mission.name || current.mission.title },
      }))
    }).catch(error => { if (live) g.notice(error.message) })
    return () => { live = false }
  }, [id, g.state.activeChildId, preview])
  return pkg
}

export const routeSubject = () => new URLSearchParams(window.location.search).get('subject') || 'maths'
export const withSubject = (path, subject = routeSubject()) => {
  const url = new URL(path, window.location.origin)
  url.searchParams.set('subject', subject)
  if (new URLSearchParams(window.location.search).has('contentPreview') || sessionStorage.getItem('kidsverse-content-preview-active') === '1') url.searchParams.set('contentPreview', '1')
  return `${url.pathname}${url.search}`
}
export function useRouteContent() {
  const subject = routeSubject()
  return useContent(subject === 'maths' ? ACTIVE_CONTENT_ID : `demo-${subject}`)
}

/* Small helpers the screens share, so each does not re-derive the same things. */
export const discoverContent = pkg => pkg.discover.contents[pkg.discover.selected ?? 0]
export const checkQuestion = pkg => pkg.check.questions[pkg.check.selected ?? 0]
export const fill = (text, vars) => String(text ?? '').replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''))
