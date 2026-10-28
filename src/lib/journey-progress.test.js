import test from 'node:test';import assert from 'node:assert/strict';import {loadJourneyProgress} from './journey-progress.js';
test('journey reads actual student mission progress instead of stale topic locks',async()=>{const journey={subject:'Mathematics',worlds:[{topic_id:'a',status:'locked'},{topic_id:'b',status:'locked'}]};const result=await loadJourneyProgress({journey,studentId:'child',readTopic:async(id,topic)=>{assert.equal(id,'child');return {nodes:topic==='a'?[{status:'completed'},{status:'locked'}]:[{status:'completed'}]};}});assert.equal(result.worlds[0].status,'in_progress');assert.equal(result.worlds[0].completed_missions,1);assert.equal(result.worlds[1].status,'completed');assert.equal(journey.worlds[0].status,'locked');});
test('unavailable details never invent progress or unlock content',async()=>{const world={topic_id:'a',status:'locked'};const r=await loadJourneyProgress({journey:{worlds:[world]},studentId:'s',readTopic:async()=>{throw Error('No access');}});assert.deepEqual(r.worlds,[world]);const empty=await loadJourneyProgress({journey:{worlds:[world]},studentId:'s',readTopic:async()=>({nodes:[]})});assert.equal(empty.worlds[0].status,'locked');});

test('locked and finished topics cannot become current merely because they contain nodes',async()=>{
 for(const status of ['locked','completed']){
  const r=await loadJourneyProgress({journey:{worlds:[{topic_id:'a',status}]},studentId:'s',readTopic:async()=>({nodes:[{status}],tiers:[{status:'locked'}]})});
  assert.equal(r.worlds[0].exploring,false);
 }
});
