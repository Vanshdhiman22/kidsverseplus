/* Nova's voice: the browser's speech engine, best voice first.
   A vendor voice can be plugged in later behind the same `say()`; nothing here calls outside the device. */
import { useCallback, useEffect, useRef, useState } from 'react'

const RANK = [/ana.*natural/i, /maisie.*natural/i, /(neerja|aria|jenny|sonia|libby).*natural/i, /natural|neural/i, /google uk english female/i, /google (us )?english/i, /heera/i, /zira|samantha|karen|moira|tessa|fiona|veena|aditi|kajal|female|woman|girl/i]
const PREF_KEY = 'kv.novaVoice'
export const getPreferredVoice = () => { try { return localStorage.getItem(PREF_KEY) || '' } catch { return '' } }
export const setPreferredVoice = name => { try { name ? localStorage.setItem(PREF_KEY, name) : localStorage.removeItem(PREF_KEY) } catch {} window.dispatchEvent(new Event('kv:voice')) }

const score = v => { const i = RANK.findIndex(re => re.test(v.name)); return i < 0 ? RANK.length : i }
export function listVoices() {
  if (typeof speechSynthesis === 'undefined') return []
  return speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang)).sort((a, b) => score(a) - score(b)).map(v => ({ name: v.name, lang: v.lang, natural: /natural|neural|google/i.test(v.name) }))
}
function pickVoice() {
  if (typeof speechSynthesis === 'undefined') return null
  const all = speechSynthesis.getVoices(); const pref = getPreferredVoice()
  if (pref) { const v = all.find(v => v.name === pref); if (v) return v }
  const en = all.filter(v => /^en/i.test(v.lang))
  for (const re of RANK) { const hit = en.find(v => re.test(v.name)); if (hit) return hit }
  return en[0] ?? all[0] ?? null
}

let voiceEnabled = true
export const setVoiceEnabled = v => { voiceEnabled = v; if (!v && typeof speechSynthesis !== 'undefined') speechSynthesis.cancel() }

export function useNovaVoice() {
  const [speaking, setSpeakingRaw] = useState(false)
  const voiceRef = useRef(null)
  const setSpeaking = v => { setSpeakingRaw(v); window.dispatchEvent(new CustomEvent('kv:speaking', { detail: v })) }
  useEffect(() => {
    if (typeof speechSynthesis === 'undefined') return
    const load = () => { voiceRef.current = pickVoice() }
    load(); speechSynthesis.addEventListener('voiceschanged', load); window.addEventListener('kv:voice', load)
    return () => { speechSynthesis.removeEventListener('voiceschanged', load); window.removeEventListener('kv:voice', load) }
  }, [])
  const stop = useCallback(() => { if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel(); setSpeaking(false) }, [])
  const say = useCallback(line => {
    const text = typeof line === 'string' ? line : line?.text
    if (!voiceEnabled || !text || typeof speechSynthesis === 'undefined') return
    stop()
    const u = new SpeechSynthesisUtterance(text)
    if (voiceRef.current) u.voice = voiceRef.current
    u.rate = 0.94; u.pitch = 1.08
    u.onstart = () => setSpeaking(true); u.onend = u.onerror = () => setSpeaking(false)
    speechSynthesis.speak(u)
  }, [stop])
  return { say, stop, speaking }
}

/* One-off line outside a component (screens that just need "read this aloud"). */
export function speak(text) {
  if (!voiceEnabled || !text || typeof speechSynthesis === 'undefined') return
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text); const v = pickVoice(); if (v) u.voice = v
  u.rate = 0.95; u.pitch = 1.1; speechSynthesis.speak(u)
}
