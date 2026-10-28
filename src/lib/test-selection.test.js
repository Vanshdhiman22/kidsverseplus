import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameClient} from './game-client.js';
test('explicit test selection preserves ID across catalog, intro and start without guessing mission mapping',async()=>{
 const calls=[];
 const client=createGameClient({mode:'live',getToken:()=> 'fixture',storage:{getItem:()=>null,setItem(){}},request:async(path,options={})=>{
  calls.push({path,method:options.method||'GET'});
  if(path==='/students/child/subjects')return {subjects:[{id:'math',slug:'maths'}]};
  if(path==='/subjects/math/topics')return {topics:[{id:'topic'}]};
  if(path==='/students/child/topics/topic')return {nodes:[]};
  if(path==='/topics/topic/tests')return {tests:[{id:'spatial',name:'Spatial Test'},{id:'shapes',name:'Shapes Test'}]};
  if(path==='/tests/shapes')return {id:'shapes',question_count:5};
  if(path==='/students/child/tests/shapes/attempts')return {attempt_id:'attempt'};
  throw Error(path);
 }});
 assert.equal((await client.getTestOverview('child','maths','test',undefined,'shapes')).id,'shapes');
 await client.startTest('child','maths','test',undefined,'shapes');
 assert.ok(calls.some(c=>c.path==='/students/child/tests/shapes/attempts'&&c.method==='POST'));
 await assert.rejects(client.getTestOverview('child','maths','test',undefined,'outside-topic'),/No test assessment/);
 assert.ok(!calls.some(c=>c.path.includes('outside-topic')));
});
