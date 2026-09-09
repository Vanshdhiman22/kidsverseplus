/* Character substitution.
 *
 * The child picks one of four characters once, on the Avatar screen, and that
 * character has to be the one performing every action for the rest of the app.
 * The 36 approved designs are the source of truth for what the action IS: pose,
 * orientation, camera, scale and how the child touches Nova all come from the
 * design and never change. Only the child is swapped.
 *
 * The screens repeat themselves, so this is keyed by POSE, not by screen. The
 * master character stands relaxed on five different screens; that is one
 * drawing reused five times, not five drawings. SLOTS says which pose each
 * screen uses, and the resolver turns (character, screen) into a file. */

import produced from '../../public/art/chars/pose-manifest.json'
import boxes from '../../public/art/chars/pose-boxes.json'
import novaBoxes from '../../public/art/chars/nova-boxes.json'

/* The four children. `face` is what GameProvider already stores in profile.face. */
export const CHARACTERS = [
  { id: 'boy_01', face: 1, master: true, label: 'Boy 1', look: 'brown messy hair, light skin' },
  { id: 'boy_02', face: 2, label: 'Boy 2', look: 'dark skin, short curly hair' },
  { id: 'girl_01', face: 3, label: 'Girl 1', look: 'dark skin, two curly buns' },
  { id: 'girl_02', face: 4, label: 'Girl 2', look: 'short bob, headband' },
]

export const charById = id => CHARACTERS.find(c => c.id === id)
export const charByFace = face => CHARACTERS.find(c => c.face === Number(face)) ?? CHARACTERS[0]

/* Every distinct action the master performs across the 36 screens. `framing`
   and `nova` are the constraints a substitute render has to match. */
export const POSES = {
  P01: { name: 'Hand-hold with Nova', framing: 'full', nova: 'hand-hold', desc: "Standing front, full body, holding Nova's hand on the child's left." },
  P02: { name: 'Presenting hologram', framing: 'full', nova: 'beside', desc: 'Standing front, left arm open toward a floating orb at chest height, palm up.' },
  P03: { name: 'Standing relaxed', framing: 'full', nova: 'beside', desc: 'Full body front, weight even, hands loose at the sides. The workhorse pose.' },
  P04: { name: 'Avatar podium', framing: 'full', nova: 'none', desc: 'Neutral standing turnaround on the podium. Needs all six outfits.' },
  P05: { name: 'Pointing up', framing: 'full', nova: 'beside', desc: 'Right arm raised, index finger up, head tilted up, open grin.' },
  P06: { name: 'Back view, looking up', framing: 'full', nova: 'above', desc: 'Seen from behind over the left shoulder, backpack visible, head turned up.' },
  P07: { name: 'Arm extended', framing: 'full', nova: 'beside', desc: 'Standing front, right arm extended to the side at waist height, presenting.' },
  P08: { name: 'Seated on the ground', framing: 'full', nova: 'beside', desc: 'Sitting, one leg tucked, weight on one hand behind, looking up and to the right.' },
  P09: { name: 'Turned toward lesson', framing: 'full', nova: 'beside', desc: 'Standing, body angled inward, gaze on the teaching object to his side.' },
  P10: { name: 'Seated in hover car', framing: 'seated', nova: 'behind', desc: 'Seated three-quarter in the open vehicle, hands forward on the rail.' },
  P11: { name: 'High-five celebration', framing: 'full', nova: 'high-five', desc: "Mid-stride, both arms up, one hand meeting Nova's raised hand." },
  P12: { name: 'Waist-up beside Nova', framing: 'waist', nova: 'beside', desc: 'Cropped at the waist, shoulder to shoulder with Nova, both facing front.' },
  P13: { name: 'Fist raised, victory', framing: 'full', nova: 'beside', desc: 'One fist punched up, other arm bent, weight on the back foot, wide grin.' },
  P14: { name: 'Arms crossed', framing: 'full', nova: 'none', desc: 'Standing three-quarter facing right, arms folded, chin level. Battle stance.' },
  P15: { name: 'Portrait', framing: 'portrait', nova: 'none', desc: 'Head and shoulders, front, neutral smile. Circular frames and battle cards.' },
  P16: { name: 'Fist-bump with Nova', framing: 'full', nova: 'fist-bump', desc: "Three-quarter turned toward Nova, fist forward meeting Nova's." },
  P17: { name: 'Sitting, reading', framing: 'full', nova: 'beside', desc: 'Cross-legged on the ground, open book in both hands, head down to the page.' },
  P18: { name: 'Speaking into mic', framing: 'full', nova: 'none', desc: 'Standing three-quarter, one hand near a floating mic, mouth open mid-speech.' },
  P19: { name: 'At the equation board', framing: 'full', nova: 'none', desc: 'Standing beside a lit board, one arm gesturing toward it, facing the viewer.' },
}

/* Where the child appears, screen by screen.
 *
 *   screen  the design sheet number
 *   cutout  the entry in public/art/chars/manifest.json this screen renders
 *   pose    which POSES entry the master is performing
 *   layer   'solo'  the cutout is the child alone, so it can be swapped today
 *           'fused' child and Nova (or a prop) are baked into one PNG, and must
 *                   be split before the child can be swapped without redrawing Nova
 *           'face'  only a head crop shows; kid{n}-face.webp already covers it
 *           'none'  no child on this screen
 */
export const SLOTS = {
  landing: { screen: '01', cutout: 'landing-0', pose: 'P01', layer: 'fused' },
  login: { screen: '02', cutout: 'login-0', pose: 'P01', layer: 'fused' },
  child: { screen: '03', cutout: 'child-0', pose: 'P02', layer: 'fused', props: ['orb'] },
  setup: { screen: '04', cutout: 'setup-0', pose: 'P03', layer: 'fused', props: ['city'] },
  avatar: { screen: '05', cutout: 'avatar-0', pose: 'P04', layer: 'solo', outfits: true },
  interests: { screen: '06', cutout: 'interests-0', pose: 'P05', layer: 'fused' },
  goals: { screen: '07', cutout: 'goals-0', pose: 'P05', layer: 'fused' },
  /* The one screen a head swap cannot do: the master is in 3/4 profile looking
     up at Nova, so a front-facing head would turn the child to face the camera.
     Needs one hand-made profile head per character; excluded from readiness so
     the other 28 screens are not held back by it. */
  nova: { screen: '08', cutout: 'nova-0', pose: 'P06', layer: 'fused', exception: 'needs a 3/4 profile head' },
  welcome: { screen: '09', cutout: 'welcome-0', pose: 'P08', layer: 'fused' },
  nhome: { screen: '10', cutout: 'nhome-0', pose: 'P07', layer: 'fused' },
  learn: { screen: '11', cutout: 'learn-0', pose: 'P05', layer: 'fused' },
  topic: { screen: '12', cutout: 'topic-0', pose: 'P09', layer: 'solo' },
  journey: { screen: '13', cutout: null, pose: 'P10', layer: 'none' },
  discover: { screen: '14', cutout: 'discover-0', pose: 'P09', layer: 'fused' },
  spot: { screen: '16', cutout: 'spot-0', pose: 'P09', layer: 'fused' },
  complete: { screen: '17', cutout: 'complete-0', pose: 'P11', layer: 'fused' },
  arena: { screen: '18', cutout: 'arena-0', pose: 'P07', layer: 'fused' },
  intro: { screen: '19', cutout: 'intro-0', pose: 'P03', layer: 'fused' },
  /* The design bakes Nova into question-0, but the screen draws her as her own
     element, so the child here is genuinely solo. `master` names the child-only art
     the screen already used; without it the master would fall back to the fused
     question-0 and Nova would appear twice. */
  question: { screen: '20', cutout: 'question-0', pose: 'P12', layer: 'solo', master: '/art/hd/q-boy.webp' },
  result: { screen: '21', cutout: 'result-0', pose: 'P13', layer: 'fused' },
  extra: { screen: '22', cutout: null, pose: 'P17', layer: 'none', cards: ['P17', 'P18', 'P19'] },
  reading: { screen: '23', cutout: 'reading-0', pose: 'P09', layer: 'fused' },
  confidence: { screen: '24', cutout: 'confidence-0', pose: 'P09', layer: 'fused' },
  challenge: { screen: '25', cutout: 'challenge-0', pose: 'P13', layer: 'fused' },
  opponents: { screen: '26', cutout: 'opponents-0', pose: 'P07', layer: 'fused' },
  preview: { screen: '27', cutout: 'preview-0', pose: 'P14', layer: 'solo' },
  battle: { screen: '28', cutout: null, pose: 'P15', layer: 'face' },
  bresult: { screen: '29', cutout: 'bresult-0', pose: 'P16', layer: 'fused' },
  league: { screen: '30', cutout: 'league-0', pose: 'P13', layer: 'fused' },
  profile: { screen: '31', cutout: 'profile-0', pose: 'P03', layer: 'fused' },
  ourjourney: { screen: '32', cutout: 'ourjourney-0', pose: 'P03', layer: 'fused' },
  switch: { screen: '33', cutout: null, pose: 'P03', layer: 'face' },
  parent: { screen: '34', cutout: null, pose: 'P15', layer: 'face' },
  evidence: { screen: '35', cutout: null, pose: 'P15', layer: 'face' },
  plan: { screen: '36', cutout: null, pose: 'P15', layer: 'face' },
}

export const outfitPath = (charId, outfit) => `/art/avatar/full-kid${charById(charId)?.face ?? 1}-${outfit}.webp`

/* The cutouts a character needs before they can carry the whole journey.
   Screens that only show a head crop are excluded (the face art already exists
   for all four), as is the avatar podium (the outfit sprites cover it). */
export const REQUIRED = Object.entries(SLOTS)
  .filter(([, s]) => (s.layer === 'solo' || s.layer === 'fused') && !s.outfits && !s.exception)
  .map(([screenKey, s]) => ({ screenKey, cutout: s.cutout, pose: s.pose, layer: s.layer }))

/* One render per (pose, character): the same standing girl serves every screen that
   uses the standing pose. This was keyed per screen as well, which would have meant 28
   near-identical files per child instead of 12 -- the per-screen difference is where the
   figure sits, not what it is, and that lives in pose-boxes.json. */
const key = (slot, charId) => `${slot.pose}/${charId}`
const has = (slot, charId) => produced.includes(key(slot, charId))

/* Which cutouts each character still owes. */
export function coverage() {
  return CHARACTERS.map(c => {
    const missing = c.master ? [] : REQUIRED.filter(s => !has(s, c.id)).map(s => s.cutout)
    return { ...c, done: REQUIRED.length - missing.length, total: REQUIRED.length, missing, ready: missing.length === 0 }
  })
}

/* A character is only shown once EVERY pose they need exists.
 *
 * Half a set is worse than none: the child would be a girl on the Learn Hub and
 * the master boy two taps later, which is exactly the flicker this system is
 * meant to prevent. So the swap is all-or-nothing per character — until the set
 * is complete the app stays on the approved master art the whole way through,
 * and the moment it completes there is no fallback left to see.
 *
 * `?poses=partial` in the URL relaxes this for previewing work in progress. */
const PARTIAL = typeof location !== 'undefined' && /(\?|&)poses=partial\b/.test(location.search)

/* Nova is baked into the child's own cutout on most screens. Drawing a child-only render
   there takes her with the boy she was fused to -- which is exactly what happened the
   first time the swap went live, and she vanished from the app.
 *
 * tools/novasplit.py lifts her back out where the art allows it, writing her own sprite
 * and her own box per screen. A screen is safe to swap on when either no Nova is baked
 * into it, or she has been lifted out of it. That replaced a hand-set hold flag: the gate
 * is now the thing it was standing in for, so it opens by itself as screens are covered
 * and can never be flipped while she would still disappear. */
export const novaLifted = cutout => Object.prototype.hasOwnProperty.call(novaBoxes, cutout)
export const novaSafe = slot => slot.layer !== 'fused' || novaLifted(slot.cutout)

/* Her sprite and where to draw it, for a screen that has been covered. */
export function novaLayer(screenKey) {
  const slot = SLOTS[screenKey]
  const box = slot && slot.cutout ? novaBoxes[slot.cutout] : null
  return box ? { src: `/art/chars/nova/${slot.cutout}.webp`, box } : null
}

export function characterReady(face) {
  const c = charByFace(face)
  if (c.master) return true
  if (PARTIAL) return true
  return REQUIRED.every(s => has(s, c.id) && novaSafe(s))
}

/* What still stands between a character and going live, screen by screen. */
export function blockers(face) {
  const c = charByFace(face)
  if (c.master) return []
  return REQUIRED.filter(s => !has(s, c.id) || !novaSafe(s)).map(s => ({
    screen: s.screenKey, cutout: s.cutout, pose: s.pose,
    missingPose: !has(s, c.id), missingNova: !novaSafe(s),
  }))
}

/* (character, screen) -> the image to draw. The character comes from
   profile.face, which is set once on the Avatar screen and persisted; it is
   never re-derived per screen, so it cannot drift between navigations. */
export function childSrc(face, screenKey, { outfit } = {}) {
  const slot = SLOTS[screenKey]
  if (!slot || !slot.cutout) return null
  const c = charByFace(face)
  /* A few screens draw a different file than the design's cutout -- see `master` on the
     slot. Both the master branch and the not-ready fallback have to honour it, or the
     screen silently swaps art the moment a character is picked. */
  const approved = slot.master ?? `/art/chars/${slot.cutout}.webp`
  if (c.master) return approved
  if (screenKey === 'nova' && c.id === 'girl_02') return '/art/chars/pose/P09/girl_02.webp'
  if (slot.outfits && outfit) return outfitPath(c.id, outfit)
  /* Resolve one screen at a time. A complete character set is useful for release
     reporting, but it must not force an already-produced girl pose back to the
     master boy just because an unrelated pose is still missing. */
  if (has(slot, c.id)) return `/art/chars/pose/${key(slot, c.id)}.webp`
  return approved
}

/* Hair that sits taller or wider than the master's needs a bigger canvas, so
   those renders carry their own stage box. The body still lands on the design's
   own pixel; only the frame around it grows. */
export function childBox(face, screenKey) {
  const slot = SLOTS[screenKey]
  const c = charByFace(face)
  if (!slot || c.master || !has(slot, c.id)) return null
  return boxes[`${slot.cutout}--${c.id}`] ?? null
}

/* True once the selected character is actually the one being drawn here. */
export function hasSubstitute(face, screenKey) {
  const slot = SLOTS[screenKey]
  const c = charByFace(face)
  if (!slot) return false
  if (c.master || slot.layer === 'face' || slot.outfits) return true
  return has(slot, c.id)
}

/* The production shopping list: one row per render still owed. */
export function outstanding() {
  const rows = []
  for (const slot of REQUIRED) {
    for (const c of CHARACTERS) {
      if (c.master || has(slot, c.id)) continue
      rows.push({ ...slot, character: c.id, file: `art/chars/pose/${key(slot, c.id)}.webp` })
    }
  }
  return rows
}

/* Screens whose cutout still has Nova baked into the same PNG. Until these are
   split, substituting the child on them would mean redrawing Nova too. */
export const fusedScreens = () =>
  Object.entries(SLOTS).filter(([, s]) => s.layer === 'fused').map(([k, s]) => ({ key: k, ...s }))
