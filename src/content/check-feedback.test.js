import test from 'node:test';
import assert from 'node:assert/strict';
import {checkFeedback} from './check-feedback.js';
const base={picks:['inside'],answers:['inside'],answered:true,checked:false,remote:false,serverCorrect:false,modelHints:[],questionHints:['Think about within','Look at the box','Inside means within']};
test('selecting an answer does not reveal correctness and hints remain available before checking',()=>{const state=checkFeedback(base);assert.equal(state.selectionCorrect,true);assert.equal(state.correct,false);assert.equal(state.canRevealHints,true);});
test('empty visual hints fall back to authored hints; wrong checked answers enable them',()=>{const state=checkFeedback({...base,picks:['outside'],checked:true});assert.equal(state.correct,false);assert.equal(state.canRevealHints,true);assert.equal(state.hints.length,3);});
test('correct checked answers show result without hints, remote correctness comes from server',()=>{assert.equal(checkFeedback({...base,checked:true}).correct,true);assert.equal(checkFeedback({...base,checked:true}).canRevealHints,false);assert.equal(checkFeedback({...base,remote:true,checked:true}).correct,false);assert.equal(checkFeedback({...base,remote:true,checked:true,serverCorrect:true}).correct,true);});

test("hints are available before choosing any answer",()=>{const s=checkFeedback({...base,picks:[],answered:false});assert.equal(s.canRevealHints,true);assert.equal(s.correct,false);});
