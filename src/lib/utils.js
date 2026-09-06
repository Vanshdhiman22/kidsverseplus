import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
export const cn = (...a) => twMerge(clsx(a))
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
export const rand = (a, b) => a + Math.random() * (b - a)
export const range = n => Array.from({ length: n }, (_, i) => i)
export const art = p => `/art/${p}`
