import test from 'node:test';
import assert from 'node:assert/strict';
import {learningPathDisplay,nextLearningNode} from './learning-path-display.js';
test('API locks and unlocks are preserved without prerequisite or tier inference',()=>{
 const source=[{name:'First',status:'locked'},{name:'Second',status:'unlocked'}];
 const shown=learningPathDisplay(source,[{status:'unlocked'}]);
 assert.equal(shown[0].startable,false);assert.equal(shown[0].displayLabel,'Locked');
 assert.equal(shown[1].startable,true);assert.equal(nextLearningNode(shown).name,'Second');
 assert.equal(source[0].status,'locked');
});
test('stars do not invent mastery and unknown statuses remain unavailable',()=>{
 const shown=learningPathDisplay([{status:'completed',stars:3},{status:'unknown'}]);
 assert.equal(shown[0].displayLabel,'Completed');assert.equal(shown[1].startable,false);
});
