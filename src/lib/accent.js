import { useGame } from '../state/GameProvider.jsx'

/* The accent hexes in the screens' data tables were picked to read on a white
   page. On the dark theme the same hex sits on a dark card and drops under the
   3:1 line, so lift its lightness (and take a little saturation off, or the
   lifted colour glows). Backgrounds derived from the same hex (`${c}1f`) get
   lifted too, which is what you want: a slightly brighter tint on a dark card. */
const hex2hsl = h => {
  const n = parseInt(h.slice(1), 16)
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn
  const l = (mx + mn) / 2
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))
  let hue = 0
  if (d) hue = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [hue * 60, s, l]
}
const hsl2hex = (h, s, l) => {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]
  const to = v => Math.round((v + m) * 255).toString(16).padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}

export const lift = hex => {
  if (typeof hex !== 'string' || !/^#[0-9a-f]{6}$/i.test(hex)) return hex
  const [h, s, l] = hex2hsl(hex)
  if (l >= 0.66) return hex
  return hsl2hex(h, Math.min(s, 0.8), 0.75)
}

/* The mirror problem: amber and green are too light to read as text on a white
   card, so bring them down. Deep colours are left alone. */
export const sink = hex => {
  if (typeof hex !== 'string' || !/^#[0-9a-f]{6}$/i.test(hex)) return hex
  const [h, s, l] = hex2hsl(hex)
  if (l <= 0.46) return hex
  return hsl2hex(h, Math.min(s + 0.05, 1), 0.36)
}

/* `const c = useAccent()` then `c('#7c3aed')` wherever a data-table colour is
   used. Re-runs on theme change because it reads game state. */
/* White on a light accent (amber, lime) fails contrast in both themes. Pick the
   ink from the fill's own luminance instead of assuming white. */
const DARK_INK = '#1b1a5e'
export const onColor = hex => {
  if (typeof hex !== 'string' || !/^#[0-9a-f]{6}$/i.test(hex)) return '#fff'
  const lum = h => {
    const n = parseInt(h.slice(1), 16)
    const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }
    return 0.2126 * f((n >> 16) & 255) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255)
  }
  const bg = lum(hex)
  const against = l => (Math.max(l, bg) + 0.05) / (Math.min(l, bg) + 0.05)
  // no threshold to tune: take whichever ink actually wins on this fill
  return against(1) >= against(lum(DARK_INK)) ? '#fff' : DARK_INK
}

export const useDark = () => useGame().state.settings.theme === 'dark'

/* Soft pastel card fills are light-mode art. On dark they keep near-white ink on
   a pale surface, so derive the fill from the card's own accent instead. */
export const useTint = () => {
  const dark = useDark()
  return (lightGradient, accentHex) => dark ? `linear-gradient(180deg, ${accentHex}3d, ${accentHex}1a)` : lightGradient
}

export function useAccent() {
  const dark = useGame().state.settings.theme === 'dark'
  return dark ? lift : sink
}
