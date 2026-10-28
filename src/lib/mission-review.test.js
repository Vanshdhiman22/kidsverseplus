import test from 'node:test';
import assert from 'node:assert/strict';
import {missionReviewSource} from './mission-review.js';
test('documented live mission uses actual answered questions, not a fake server attempt',()=>{const review=[{question:'Where is the pencil?',selectedLabel:'Inside',answerLabel:'Inside',correct:true}];assert.deepEqual(missionReviewSource({attemptId:'client-run',studentId:'child',documentedMission:true,review},'child'),{items:review,attemptId:null});});
test('real learning attempts fetch server review while local practice stays local',()=>{assert.equal(missionReviewSource({attemptId:'server-id',studentId:'child'},'child').attemptId,'server-id');assert.equal(missionReviewSource({attemptId:'practice',local:true}).attemptId,null);});
test('review never exposes another child attempt',()=>{assert.deepEqual(missionReviewSource({attemptId:'other',studentId:'other-child',review:[{}]},'active-child'),{items:[],attemptId:null});});
