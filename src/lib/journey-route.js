// Road, station pins and car stops share the same coordinates.
export function journeyRoute(count) {
  const anchors = Array.from({ length: count }, (_, index) => {
    if (count === 1) return { x: 430, y: 310 }
    if (count === 2) return { x: 220 + index * 510, y: 220 + index * 210 }
    const row = Math.floor(index / 2)
    const column = row % 2 ? 1 - index % 2 : index % 2
    return { x: 160 + column * 500, y: 160 + row * 190 }
  })
  if (!anchors.length) return { anchors, path: '', stops: [], height: 620 }
  const first = anchors[0], last = anchors.at(-1)
  const points = [{ x: 55, y: first.y }, ...anchors, { x: last.x + 200, y: last.y }]
  const at = index => points[Math.max(0, Math.min(points.length - 1, index))]
  let path = `M ${points[0].x} ${points[0].y}`, length = 0
  const distances = []
  for (let index = 0; index < points.length - 1; index++) {
    const [p0, p1, p2, p3] = [at(index - 1), at(index), at(index + 1), at(index + 2)]
    const a = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 }
    const b = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 }
    path += ` C ${a.x} ${a.y}, ${b.x} ${b.y}, ${p2.x} ${p2.y}`
    let previous = p1
    for (let sample = 1; sample <= 80; sample++) {
      const t = sample / 80, u = 1 - t
      const point = {
        x: u ** 3 * p1.x + 3 * u ** 2 * t * a.x + 3 * u * t ** 2 * b.x + t ** 3 * p2.x,
        y: u ** 3 * p1.y + 3 * u ** 2 * t * a.y + 3 * u * t ** 2 * b.y + t ** 3 * p2.y,
      }
      length += Math.hypot(point.x - previous.x, point.y - previous.y)
      previous = point
    }
    if (index < anchors.length) distances.push(length)
  }
  return { anchors, path, stops: distances.map(distance => distance / length * 100), height: Math.max(620, last.y + 100) }
}

export function currentJourneyStation(stations) {
  const active = stations.findIndex(station => station.state === 'here')
  if (active >= 0) return active
  const ready = stations.findIndex(station => station.state === 'next')
  if (ready >= 0) return ready
  const unfinished = stations.findIndex(station => station.state !== 'done')
  return unfinished >= 0 ? unfinished : Math.max(0, stations.length - 1)
}

export function journeyStationUrl(subject, station) {
  if (!subject || !station?.id) return null
  return `/learn/topics/${encodeURIComponent(subject)}?topic=${encodeURIComponent(station.id)}`
}
