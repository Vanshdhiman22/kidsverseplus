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

const addition = normalizeContentPackage(additionStudio, 'addition-introduction', fractions)
const BUNDLED = { 'fractions-equal-parts': fractions, 'addition-introduction': addition }
export const ACTIVE_CONTENT_ID = import.meta.env.VITE_LEARNING_PACKAGE_ID || 'addition-introduction'
const API = import.meta.env.VITE_CONTENT_API

const cache = new Map()

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
  const [pkg, setPkg] = useState(() => getContent(id))
  useEffect(() => {
    let live = true
    fetchRemote(id).then(remote => { if (live && remote) setPkg(remote) })
    return () => { live = false }
  }, [id])
  return pkg
}

/* Small helpers the screens share, so each does not re-derive the same things. */
export const discoverContent = pkg => pkg.discover.contents[pkg.discover.selected ?? 0]
export const checkQuestion = pkg => pkg.check.questions[pkg.check.selected ?? 0]
export const fill = (text, vars) => String(text ?? '').replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''))
