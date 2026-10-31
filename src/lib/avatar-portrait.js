// Display fallback only; never changes the child's saved avatar or API mapping.
export function avatarPortrait(face, small = false) {
  const number = Number(face)
  const safeFace = [1, 2, 3, 4].includes(number) ? number : 1
  return `/art/kid${safeFace}-face${small ? '-sm' : ''}.webp`
}
