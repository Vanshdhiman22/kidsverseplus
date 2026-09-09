import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { companionLayout } from './companionLayout.js'

const read = name => JSON.parse(fs.readFileSync(new URL(`../../public/art/chars/${name}.json`, import.meta.url)))
const manifest = read('manifest')
const boxes = read('pose-boxes')
const robots = read('nova-boxes')

test('replacement characters and Nova stay in separate lanes within every artwork region', () => {
  for (const [id, region] of Object.entries(manifest)) {
    if (!id.endsWith('-0')) continue
    for (const character of ['boy_02', 'girl_01', 'girl_02']) {
      const area = id === 'welcome-0' ? [290, 330, 390, 375]
        : id === 'nova-0' ? [135, 260, 680, 550] : region
      const child = boxes[`${id}--${character}`] ?? region
      const nova = robots[id] ?? [0, 0, region[2] * 0.42, region[3] * 0.82]
      const pair = companionLayout(area, child, nova)
      assert(pair.child[0] + pair.child[2] + 15 <= pair.nova[0], `${id}: overlap`)
      for (const box of Object.values(pair)) {
        assert(box.every(Number.isFinite))
        assert(box[0] >= area[0] && box[1] >= area[1])
        assert(box[0] + box[2] <= area[0] + area[2] + 0.001)
        assert(box[1] + box[3] <= area[1] + area[3] + 0.001)
      }
    }
  }
})
