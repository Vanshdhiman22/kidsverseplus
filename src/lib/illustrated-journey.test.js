import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { ILLUSTRATED_WORLD_KEYS, illustratedWorld, illustratedRoadPoint } from './illustrated-journey.js'

for(const subject of ILLUSTRATED_WORLD_KEYS) {
  test(`${subject} car parks at all ten station road anchors in order and ends at its own gateway`,()=>{
    const world=illustratedWorld(subject),route=world.route
    assert.equal(world.signs.length,10)
    assert.equal(route.stops.length,10)
    route.stops.forEach((stop,index)=>{
      assert.ok(stop>0&&stop<100)
      if(index)assert.ok(stop>route.stops[index-1])
      const point=illustratedRoadPoint(route,stop)
      assert.ok(Math.hypot(point.x-world.parking[index][0],point.y-world.parking[index][1])<.00001)
    })
    const end=illustratedRoadPoint(route,100)
    assert.ok(Math.hypot(end.x-world.terminal[0],end.y-world.terminal[1])<.00001)
    for(const sample of route.samples){assert.ok(sample.x>=0&&sample.x<=1000);assert.ok(sample.y>=0&&sample.y<=600)}
    for(const asset of [world.art,world.thumb])assert.ok(existsSync(new URL(`../../public${asset}`,import.meta.url)))
  })
}

test('unknown subjects get a neutral discovery world without acquiring any topic data',()=>{
  const world=illustratedWorld('new-subject')
  assert.equal(world.key,'general')
  assert.equal(world,illustratedWorld('general'))
  assert.equal(world.stations,undefined)
  assert.equal(world.topics,undefined)
})
