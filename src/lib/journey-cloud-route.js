// Coordinates are in the approved 1672 x 941 illustrated world's space.
// A station's display platform and its parking position on the road are distinct.
export const CLOUD_PLATFORMS = [
  { x: 634, y: 752 }, { x: 893, y: 727 }, { x: 1160, y: 706 }, { x: 1450, y: 700 },
  { x: 1435, y: 480 }, { x: 1125, y: 475 }, { x: 845, y: 450 }, { x: 565, y: 407 },
  { x: 711, y: 210 }, { x: 990, y: 220 },
]

const START = { x: 435, y: 773 }
const SEGMENTS = [
  [450, 780, 475, 778, 495, 770, 0],
  [590, 778, 710, 752, 800, 741, 1],
  [885, 737, 980, 725, 1050, 713, 2],
  [1140, 705, 1250, 695, 1320, 680, 3],
  [1510, 652, 1650, 610, 1552, 492, 4],
  [1530, 480, 1370, 501, 1230, 501, 5],
  [1140, 497, 1040, 487, 950, 481, 6],
  [850, 475, 750, 464, 660, 456, 7],
  [545, 452, 440, 454, 465, 407],
  [480, 381, 556, 379, 584, 341],
  [606, 312, 527, 298, 554, 260],
  [561, 249, 574, 241, 588, 236, 8],
  [670, 209, 791, 219, 876, 229, 9],
  [1015, 236, 1225, 289, 1374, 259],
  [1434, 251, 1462, 226, 1476, 211],
]

export function cloudJourneyRoute() {
  const anchors = [], distances = [], samples = [{ ...START, distance: 0 }]
  let previousEnd = START, length = 0, path = `M ${START.x} ${START.y}`
  for (const [ax, ay, bx, by, x, y, station] of SEGMENTS) {
    path += ` C ${ax} ${ay}, ${bx} ${by}, ${x} ${y}`
    let previous = previousEnd
    for (let step = 1; step <= 80; step++) {
      const t = step / 80, u = 1 - t
      const point = { x: u ** 3 * previousEnd.x + 3 * u ** 2 * t * ax + 3 * u * t ** 2 * bx + t ** 3 * x,
        y: u ** 3 * previousEnd.y + 3 * u ** 2 * t * ay + 3 * u * t ** 2 * by + t ** 3 * y }
      length += Math.hypot(point.x - previous.x, point.y - previous.y)
      samples.push({ ...point, distance: length })
      previous = point
    }
    previousEnd = { x, y }
    if (station !== undefined) { anchors[station] = { x, y }; distances[station] = length }
  }
  return { path, anchors, stops: distances.map(distance => distance / length * 100), length,
    samples: samples.map(sample => ({ ...sample, percent: sample.distance / length * 100 })) }
}
