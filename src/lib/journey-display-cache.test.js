import test from 'node:test'
import assert from 'node:assert/strict'
import { journeyDisplaySnapshot, journeyDisplayData } from './journey-display-cache.js'
import { journeyCloud } from './journey-clouds.js'

test('unpublishing a subject hides old topics even when an in-memory display exists',()=>{
  const cached={worlds:[{topic_id:'real-topic',topic_name:'Previously published'}]}
  assert.equal(journeyDisplayData({previewOnly:true,cached}),null)
  assert.equal(journeyDisplayData({previewOnly:true,live:cached,cached}),null)
  assert.equal(journeyDisplayData({previewOnly:false,cached}),cached)
  const fresh={worlds:[]}
  assert.equal(journeyDisplayData({previewOnly:false,live:fresh,cached}),fresh)
})

test('cached real topic identities cannot verify completion or unlock the next cloud',()=>{
  const journey={worlds:Array.from({length:10},(_,i)=>({topic_id:`real-${i}`,topic_name:`Published ${i}`,total_missions:2,completed_missions:2,progress_verified:true}))}
  const before=structuredClone(journey),cached=journeyDisplaySnapshot(journey)
  assert.deepEqual(journey,before)
  assert.deepEqual(cached.worlds.map(x=>x.topic_id),journey.worlds.map(x=>x.topic_id))
  assert.equal(journeyCloud(cached.worlds,2).phase,1)
  assert.equal(journeyCloud(cached.worlds).canGoNext,false)
  assert.equal(journeyCloud(journey.worlds,2).phase,2)
})
