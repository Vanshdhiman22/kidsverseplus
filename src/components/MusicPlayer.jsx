/* Soft background loop. Starts after the first tap (browsers require it), remembers on/off. */
import { useEffect } from 'react'
const KEY = 'kv.music'
export const getMusicOn = () => { try { return localStorage.getItem(KEY) !== '0' } catch { return true } }
export const setMusicOn = v => { try { localStorage.setItem(KEY, v ? '1' : '0') } catch {} window.dispatchEvent(new Event('kv:music')) }

export default function MusicPlayer() {
  useEffect(() => {
    /* preload none: the loop only ever starts after a tap, so there is no reason
       to pull a megabyte of audio during first paint. */
    const a = new Audio('/audio/theme.wav'); a.loop = true; a.volume = 0.12; a.preload = 'none'
    let dead = false; a.onerror = () => { dead = true }
    const start = () => { if (!dead && getMusicOn()) a.play().catch(() => {}); window.removeEventListener('pointerdown', start) }
    window.addEventListener('pointerdown', start)
    const sync = () => { getMusicOn() ? a.play().catch(() => {}) : a.pause() }
    window.addEventListener('kv:music', sync)
    return () => { a.pause(); window.removeEventListener('pointerdown', start); window.removeEventListener('kv:music', sync) }
  }, [])
  return null
}
