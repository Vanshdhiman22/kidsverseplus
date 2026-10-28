import {createGameClient} from './game-client.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewItems} from './review-items.js';
import {questionMedia} from './question-media.js';
import {topicChallenges} from './challenge-selection.js';
import {validMissionResult} from './mission-result.js';
test('live review answers with string options do not crash or lose labels',()=>{
 const rows=reviewItems({answers:[{question:'Where?',options:['Inside','Outside'],selected_answer:'Outside',correct_answer:'Inside',is_correct:false}]});
 assert.equal(rows[0].question,'Where?');assert.equal(rows[0].selectedLabel,'Outside');assert.equal(rows[0].answerLabel,'Inside');assert.equal(rows[0].correct,false);
 assert.deepEqual(reviewItems({}),[]);
});
test('question media joins exact wording and options without replacing server IDs or grading fields',()=>{
 const q={id:'server-id',question_text:'Which?',options:['Triangle','Square']};
 const bank=[{question:'Which?',options:['Square','Triangle'],answer:'Triangle',image_url:'/triangle.png',explanation:'Three sides'}];
 const joined=questionMedia(q,bank);
 assert.equal(joined.id,'server-id');assert.equal(joined.image_url,'/triangle.png');assert.equal(joined.answer,undefined);assert.equal(joined.correct_answer,undefined);
 assert.equal(questionMedia({...q,options:['Circle','Square']},bank).image_url,undefined);
 assert.equal(questionMedia(q,[...bank,...bank]).image_url,undefined);
 assert.equal(q.image_url,undefined);
});
test('challenge selection uses the API topic association rather than the first global challenge or slug',()=>{
 const rows=[{id:'fractions',topic:'Fractions'},{id:'spatial',topic:'Shapes',slug:'concept-not-maths'},{id:'other',topic_id:'other'}];
 assert.deepEqual(topicChallenges(rows,'shape-id','Shapes').map(c=>c.id),['spatial']);
 assert.deepEqual(topicChallenges(rows,'none','Absent'),[]);
});
test('saved mission result cannot be reused for another child, subject or mission',()=>{
 const r={attemptId:'run',studentId:'child',subject:'maths',missionId:'spatial',score:2,total:3};
 assert.equal(validMissionResult(r,'child','spatial','maths'),true);
 assert.equal(validMissionResult(r,'other','spatial','maths'),false);
 assert.equal(validMissionResult(r,'child','shapes','maths'),false);
 assert.equal(validMissionResult(r,'child','spatial','literacy'),false);
});

test('live Test image is read from existing same-grade same-board package while original server answer submission is preserved',async()=>{
 const store=new Map(),calls=[];
 const q={id:'server-question',question_text:'Which shape?',options:['Circle','Triangle']};
 const client=createGameClient({mode:'live',getToken:()=> 'test-token',storage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},request:async(path,{method='GET',body}={})=>{
  calls.push({path,method,body});
  if(path==='/students/child/subjects')return {subjects:[{id:'math',slug:'maths'}]};
  if(path==='/subjects/math/topics')return {topics:[{id:'topic'}]};
  if(path==='/students/child/topics/topic')return {name:'Shapes',grade_level:1,nodes:[]};
  if(path==='/students/child/profile')return {grade:'Grade 1',board:'CBSE'};
  if(path==='/topics/topic/tests')return {tests:[{id:'test'}]};
  if(path==='/tests/test')return {id:'test',question_count:1};
  if(path==='/students/child/tests/test/attempts')return {attempt_id:'attempt'};
  if(path==='/tests/attempts/attempt/questions/1')return q;
  if(path==='/admin/content/packages')return {packages:[{id:'cbse',topic_name:'Shapes',grade:'Grade 1',board:'CBSE'},{id:'other',topic_name:'Shapes',grade:'Grade 1',board:'ICSE'}]};
  if(path==='/admin/content/packages/cbse')return {test_questions:{questions:[{question:'Which shape?',options:['Circle','Triangle'],answer:'Circle',image_url:'/api-picture.jpg'}]}};
  if(path==='/tests/attempts/attempt/answers')return {is_correct:true};
  throw Error(path);
 }});
 await client.startTest('child','maths','test');
 const loaded=await client.getTestQuestion('child','maths',1);
 assert.equal(loaded.image_url,'/api-picture.jpg');assert.equal(loaded.id,'server-question');assert.equal(loaded.correct_answer,undefined);
 await client.submitAnswer('child','maths',1,'Circle','Which shape?');
 assert.deepEqual(calls.find(c=>c.path.endsWith('/answers')).body,{question_id:'server-question',selected_answer:'Circle'});
 assert.ok(!calls.some(c=>c.path==='/admin/content/packages/other'));
});
test('live Battle uses selected topic challenge and never starts a wrong-topic or empty-opponent battle',async()=>{
 const calls=[];
 const client=createGameClient({mode:'live',getToken:()=> 'fixture',storage:{getItem:()=>null,setItem(){}},request:async(path,options={})=>{
  calls.push({path,method:options.method||'GET'});
  if(path==='/challenges')return {challenges:[{id:'fractions',topic:'Fractions'},{id:'shapes',topic:'Shapes'}]};
  if(path==='/students/child/subjects')return {subjects:[{id:'math',slug:'maths'}]};
  if(path==='/subjects/math/topics')return {topics:[{id:'topic'}]};
  if(path==='/students/child/topics/topic')return {name:'Shapes',nodes:[]};
  if(path==='/challenges/shapes/opponents')return {opponents:[]};
  throw Error(path);
 }});
 assert.deepEqual((await client.listTopicChallenges('child','maths')).challenges.map(c=>c.id),['shapes']);
 await assert.rejects(client.startBattle('child',0,'maths',undefined,'shapes'),/No opponent is published/);
 await assert.rejects(client.startBattle('child',0,'maths',undefined,'fractions'),/Choose an available challenge/);
 assert.ok(!calls.some(c=>c.method==='POST'));
 assert.ok(!calls.some(c=>c.path.includes('/fractions/')));
});
