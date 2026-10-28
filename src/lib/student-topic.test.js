import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameClient} from './game-client.js';
test('skips other-curriculum topics and opens the student topic',async()=>{
 const calls=[];
 const client=createGameClient({getToken:()=>'',storage:{getItem:()=>null,setItem(){}},request:async path=>{
 calls.push(path);if(path.endsWith('/subjects'))return {subjects:[{id:'m',name:'Mathematics'}]};
 if(path==='/subjects/m/topics')return {topics:[{id:'grade-four'},{id:'grade-one'}]};
 if(path.endsWith('/grade-four'))throw Object.assign(new Error('Wrong curriculum'),{status:404});
 return {id:'grade-one',nodes:[]};
 }});
 const result=await client.loadLearningPath('student','maths');assert.equal(result.topicId,'grade-one');assert.equal(calls.length,4);
});
test('does not hide server and authentication errors',async()=>{
 for(const status of [401,403,500]){let details=0;
 const client=createGameClient({getToken:()=>'',storage:{getItem:()=>null,setItem(){}},request:async path=>{
 if(path.endsWith('/subjects'))return {subjects:[{id:'m',name:'Mathematics'}]};
 if(path==='/subjects/m/topics')return {topics:[{id:'first'},{id:'second'}]};
 details++;throw Object.assign(new Error('Failed'),{status});
 }});
 await assert.rejects(client.loadLearningPath('s','maths'),e=>e.status===status);assert.equal(details,1);
 }
});
