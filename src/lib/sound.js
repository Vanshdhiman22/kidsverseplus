/* Tiny WebAudio synth for game-feel UI sounds. No files, no latency. */
let ctx
const ac = () => (ctx ||= new (window.AudioContext || window.webkitAudioContext)())
let enabled = true
export const setSoundEnabled = v => { enabled = v }

function tone({ f = 600, t = 0.08, type = 'sine', gain = 0.06, slide, delay = 0 }) {
  if (!enabled) return
  try {
    const c = ac(); const o = c.createOscillator(); const g = c.createGain()
    const now = c.currentTime + delay
    o.type = type; o.frequency.setValueAtTime(f, now)
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, now + t)
    g.gain.setValueAtTime(0.0001, now)
    g.gain.exponentialRampToValueAtTime(gain, now + 0.012)
    g.gain.exponentialRampToValueAtTime(0.0001, now + t)
    o.connect(g).connect(c.destination); o.start(now); o.stop(now + t + 0.02)
  } catch {}
}
export const sfx = {
  tap: () => tone({ f: 520, slide: 780, t: 0.07, gain: 0.05 }),
  hover: () => tone({ f: 900, t: 0.03, gain: 0.015, type: 'triangle' }),
  select: () => { tone({ f: 620, t: 0.08 }); tone({ f: 930, t: 0.1, delay: 0.06 }) },
  success: () => [523, 659, 784, 1046].forEach((f, i) => tone({ f, t: 0.16, delay: i * 0.07, gain: 0.06, type: 'triangle' })),
  wrong: () => { tone({ f: 220, slide: 160, t: 0.18, type: 'square', gain: 0.035 }) },
  whoosh: () => tone({ f: 180, slide: 1400, t: 0.35, type: 'sawtooth', gain: 0.02 }),
  xp: () => [880, 1175, 1480].forEach((f, i) => tone({ f, t: 0.09, delay: i * 0.05, gain: 0.045 })),
  unlock: () => [392, 523, 659, 784, 1046].forEach((f, i) => tone({ f, t: 0.14, delay: i * 0.06, gain: 0.05, type: 'triangle' })),
}
