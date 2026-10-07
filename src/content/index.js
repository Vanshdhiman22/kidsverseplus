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
 *   - remote:  VITE_API_BASE_URL/missions/<id>, resolved for the selected student
 *
 * Authenticated live content must load successfully before the lesson is usable.
 * Explicit UI review uses bundled fixtures; it never claims a live request worked. */
import { useEffect, useState } from 'react'
import { normalizeContentPackage } from './normalize.js'
import { getContent, DEFAULT_CONTENT_ID } from './bundled.js'
export { getContent } from './bundled.js'
import { useGame } from '../state/GameProvider.jsx'
import { loadMission } from '../lib/gameApi.js'
import { getToken } from '../lib/api.js'
import { normalizeMissionContent } from './mission.js'
import { isReviewMode } from '../lib/reviewMode.js'
import { contentSource } from './source-policy.js'

export const ACTIVE_CONTENT_ID = import.meta.env.VITE_LEARNING_PACKAGE_ID || DEFAULT_CONTENT_ID
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
      return { ...normalizeContentPackage(content, id, getContent(id)), contentSource: 'preview' }
    } catch (error) {
      console.warn('[content] preview package not used:', error.message)
      return null
    }
  }
  const token = getToken()
  const source = contentSource({ review: isReviewMode(), studentId: g.state.activeChildId, token })
  const useApi = source === 'api'
  const missionId = new URLSearchParams(window.location.search).get('mission') || undefined
  const resourceKey = `${source}:${missionId || ''}:${id}:${g.state.activeChildId}:${token}:${preview}`
  const initial = () => ({ ...getContent(id), contentSource: source, contentLoading: useApi, resourceKey })
  const [pkg, setPkg] = useState(() => ({ ...(previewPackage() ?? initial()), resourceKey }))
  useEffect(() => {
    let live = true
    const imported = previewPackage()
    if (imported) { setPkg({ ...imported, resourceKey }); return () => { live = false } }
    setPkg(initial())
    const subject = id.startsWith('demo-') ? id.slice(5) : 'maths'
    if (useApi) loadMission(g.state.activeChildId, subject, missionId).then(mission => {
      if (!live) return
      const normalized = normalizeMissionContent(mission, id, getContent(id), {
        ...mission.learningContext, grade: g.state.profile.grade, board: g.state.profile.board,
      })
      setPkg({ ...normalized, contentLoading: false, resourceKey })
    }).catch(error => {
      if (live) setPkg({ ...initial(), contentLoading: false, contentError: error.message })
    })
    return () => { live = false }
  }, [resourceKey, useApi])
  return pkg.resourceKey === resourceKey ? pkg : initial()
}

export const routeSubject = () => new URLSearchParams(window.location.search).get('subject') || 'maths'
export const withSubject = (path, subject = routeSubject()) => {
  const url = new URL(path, window.location.origin)
  url.searchParams.set('subject', subject)
  const missionId = new URLSearchParams(window.location.search).get('mission')
  if (missionId && !url.searchParams.has('mission')) url.searchParams.set('mission', missionId)
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
