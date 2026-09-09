/* Reserve separate lanes inside the artwork area. Layer order cannot fix two
   independently positioned sprites occupying the same space. */
export function companionLayout(region, child, nova) {
  const [x, y, width, height] = region
  const gap = Math.max(16, width * 0.045)
  const inset = 12
  const available = width - inset * 2 - gap
  const childWidth = available * 0.56
  const robotWidth = available - childWidth
  const fit = (box, left, laneWidth) => {
    const ratio = Math.min(laneWidth / box[2], (height - inset * 2) / box[3])
    const w = box[2] * ratio
    const h = box[3] * ratio
    return [left + (laneWidth - w) / 2, y + height - inset - h, w, h]
  }
  return {
    child: fit(child, x + inset, childWidth),
    nova: fit(nova, x + inset + childWidth + gap, robotWidth),
  }
}
