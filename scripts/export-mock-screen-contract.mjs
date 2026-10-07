import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {worlds} from '../mock/gameplay.mjs'
const base='http://127.0.0.1:5180/api/v1'
const captures=[], screens=JSON.parse(await fs.readFile(new URL('../docs/api-audit/screens.json',import.meta.url),'utf8')).map(s=>({id:s.id,name:s.name,route:s.route,calls:[],note:''}))
const clean=v=>Array.isArray(v)?v.map(clean):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,/^(token|session_id|password|dev_code|otp|pin)$/.test(k)?'[redacted]':clean(x)])):v
async function call(method,path,body,token,expected=200){
 const headers={'Accept':'application/json',...(body!==undefined?{'Content-Type':'application/json'}:{}),...(token?{'Authorization':`Bearer ${token}`}:{})}
 const response=await fetch(base+path,{method,headers,...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(15000)})
 const data=response.status===204?null:await response.json()
 assert.equal(response.headers.get('X-Kidsverse-Source'),'local-mock')
 assert.equal(response.status,expected,`${method} ${path}: ${JSON.stringify(data)}`)
 const entry={id:captures.length+1,method,path,status:response.status,request:body===undefined?null:clean(body),headers:{...headers,...(token?{Authorization:'Bearer [redacted]'}:{})},response:clean(data)}
 captures.push(entry);return {entry,data}
}
function map(ids,entry,label=''){for(const id of Array.isArray(ids)?ids:[ids])screens[id-1].calls.push({capture:entry.id,label})}
async function mapped(ids,label,method,path,body,token,status=200){const result=await call(method,path,body,token,status);map(ids,result.entry,label);return result.data}
const demo=await call('POST','/demo/login',{});map(2,demo.entry,'One-call demo bootstrap (mock-only)')
const token=demo.data.token,sid=demo.data.students[0].id,root=`/students/${sid}`,math=worlds[0],lit=worlds[1]
screens[0].note='Local UI screen. Request: none. Response: none.'
const signup=await mapped(4,'Create parent','POST','/auth/parent/signup',{email:`pdf-review-${Date.now()}@kidsverse.local`,password:'MockReview123!',full_name:'Review Parent',phone:'+919999999999'},undefined,201)
await mapped(2,'Standard parent login','POST','/auth/parent/login',{email:signup.parent.email,password:'MockReview123!'},undefined)
await mapped(3,'Request mock reset link','POST','/auth/parent/forgot-password',{email:signup.parent.email})
const child=await mapped(5,'Create child','POST','/students',{name:'Aarav'},signup.token,201)
const childRoot=`/students/${child.id}`
const otp=await mapped(6,'Start parent verification','POST','/parent/verification/start',{student_id:child.id,full_name:'Review Parent',relationship:'parent',phone:'+919999999999'},signup.token,201)
await mapped(7,'Verify parent code','POST','/parent/verification/verify',{challenge_id:otp.challenge_id,code:otp.dev_code},signup.token)
// OTP is a credential: redact only this request field, not error.code fields.
captures.at(-1).request.code='[redacted]'
await mapped(8,'Save learning setup','PATCH',childRoot+'/grade-board',{grade:'Grade 4',board:'CBSE'},signup.token)
const characters=await mapped(9,'Avatar catalog','GET','/avatar/characters')
const outfits=await mapped(9,'Outfit catalog','GET','/avatar/items?category=outfit')
await mapped(9,'Save avatar','PUT',childRoot+'/avatar',{character_id:characters.characters[0].id,outfit_item_id:outfits.items[0].id,hair_item_id:null,accessory_item_id:null},signup.token)
const interests=await mapped(10,'Interest catalog','GET','/interests')
await mapped(10,'Save interests','PUT',childRoot+'/interests',{interest_ids:interests.interests.slice(0,3).map(i=>i.id)},signup.token)
const goals=await mapped(11,'Goal catalog','GET','/goals')
await mapped(11,'Save goals','PUT',childRoot+'/goals',{goal_ids:goals.goals.slice(0,2).map(g=>g.id)},signup.token)
await mapped(12,'Complete lobby step','POST',childRoot+'/onboarding/steps/lobby/complete',{},signup.token)
await mapped(12,'Nova greeting / finish onboarding','POST',childRoot+'/nova/greet',{},signup.token)
await mapped(13,'Onboarding state','GET',childRoot+'/onboarding/status',undefined,signup.token)
await mapped([13,14],'Home data (bootstrap/cache eligible)','GET',root+'/home',undefined,token)
await mapped(15,'Read settings','GET',root+'/settings',undefined,token)
await mapped(15,'Save settings','PATCH',root+'/settings',{sound:false},token)
await mapped(16,'Chat history','GET',root+'/nova/messages',undefined,token)
await mapped(16,'Send message','POST',root+'/nova/messages',{message:'Help me with addition.'},token)
await mapped([13,17],'Subjects (bootstrap/cache eligible)','GET',root+'/subjects',undefined,token)
for(let i=0;i<3;i++)await mapped(18+i,'Journey data (bootstrap/cache eligible)','GET',root+`/journey?subject=${worlds[i].slug}`,undefined,token)
for(let i=0;i<5;i++){
 const w=worlds[i]
 await mapped(21+i,'Subject topics','GET',`/subjects/${w.id}/topics?grade=Grade+4`,undefined,token)
 await mapped(21+i,'Student topic roadmap','GET',root+`/topics/${w.topicId}`,undefined,token)
}
const mathContent=await call('GET',`/missions/${math.missionId}`,undefined,token)
map([26,27,28,29,30,31,37],mathContent.entry,'Shared Maths lesson payload: selected step / CFU displayed locally')
await mapped(26,'Start mission','POST',root+`/missions/${math.missionId}/start`,{},token)
const litContent=await call('GET',`/missions/${lit.missionId}`,undefined,token)
map([32,33,34,35,36],litContent.entry,'Shared Literacy lesson payload: selected step displayed locally')
await mapped(32,'Start Literacy mission','POST',root+`/missions/${lit.missionId}/start`,{},token)
await mapped(38,'Complete mission','POST',root+`/missions/${math.missionId}/complete`,{score:100},token)
await mapped(39,'Authored mission answer review','GET',root+`/missions/${math.missionId}/review`,undefined,token)
screens[36].note='CFU selection is local UI state; the mission score is sent on completion (Screen 38).'
screens[38].note='This response is authored question/answer content, not saved individual child answers.'
await mapped(40,'Available tests','GET',`/topics/${math.topicId}/tests`,undefined,token)
await mapped([40,41],'Test metadata','GET',`/tests/${math.testId}`,undefined,token)
const attempt=await mapped([41,42],'Start randomized DB test; attempt metadata only','POST',root+`/tests/${math.testId}/attempts`,{},token,201)
const ar=`/tests/attempts/${attempt.attempt_id}`
for(let order=1;order<=attempt.total_questions;order++){
 const question=await mapped(order===1?[42,43]:42,'Fetch one random question from the persisted attempt','GET',ar+`/questions/${order}`,undefined,token)
 const q=math.questions.find(q=>q.id===question.id)
 await mapped(42,'Submit displayed answer; server scores it','POST',ar+'/answers',{question_id:q.id,selected_answer:q.answer},token)
}
await mapped(44,'Complete test','POST',ar+'/complete',{},token)
await mapped([44,45],'Test result','GET',ar+'/result',undefined,token)
screens[42].note='Hint uses the same question response; opening the hint needs no extra API.'
screens[44].note='Answer-review UI uses previously received question/answer data. This result endpoint contains aggregate scores only; there is no separate test-review endpoint.'
// A second, lower-score attempt produces real remediation data for Screen 46.
const low=await call('POST',root+`/tests/${math.testId}/attempts`,{},token,201)
await call('POST',`/tests/attempts/${low.data.attempt_id}/complete`,{},token)
await mapped(46,'Extra-learning recommendations','GET',root+'/extra-learning',undefined,token)
const journey=await call('GET',root+'/journey?subject=literacy',undefined,token)
map([47,48],journey.entry,'Companion activity catalog')
await mapped(47,'Complete reading activity','POST',root+'/companion-activities/read-together/complete',{},token)
await mapped(48,'Complete speaking companion activity','POST',root+'/companion-activities/talk-nova/complete',{},token)
await mapped(49,'Challenges','GET','/challenges',undefined,token)
const opponents=await mapped(50,'Opponents','GET',`/challenges/${math.challengeId}/opponents`,undefined,token)
await mapped(51,'Battle preview','GET',`/challenges/${math.challengeId}/preview?opponent_id=${opponents.opponents[0].id}`,undefined,token)
const battle=await mapped(52,'Start random DB battle; metadata only','POST',root+'/challenge-battles',{challenge_id:math.challengeId,opponent_id:opponents.opponents[0].id},token,201)
const br=`/challenge-battles/${battle.battle_id}`
for(let order=1;order<=battle.total_questions;order++){
 const question=await mapped(52,'Fetch the next random DB round','GET',br+`/questions/${order}`,undefined,token)
 const q=math.battleQuestions.find(q=>q.id===question.id)
 await mapped(52,'Submit battle answer (repeat for each question)','POST',br+'/answers',{question_id:q.id,selected_answer:q.answer},token)
}
await mapped(53,'Complete battle; server calculates score','POST',br+'/complete',{score:100},token)
await mapped(53,'Battle result','GET',br+'/result',undefined,token)
await mapped(54,'Leaderboard','GET',`/challenges/${math.challengeId}/leaderboard?scope=global`,undefined,token)
await mapped(55,'Student profile','GET',root+'/profile',undefined,token)
await mapped(55,'Collectible cards','GET',root+'/profile/cards',undefined,token)
await mapped(56,'Journey progress','GET',root+'/profile/our-journey',undefined,token)
await mapped(57,'Break-pass inventory','GET',root+'/break-passes',undefined,token)
await mapped(57,'Use break pass','POST',root+'/break-passes',{},token)
screens[57].note='Parent PIN gate is local UI state in this mock. Request: none. Response: none. No PIN-verification API exists in the current implementation.'
await mapped(59,'Children for switching','GET','/parent/students',undefined,token)
await mapped(60,'Parent overview','GET','/parent/overview',undefined,token)
await mapped(61,'Parent evidence','GET','/parent/evidence',undefined,token)
await mapped(62,'Weekly plan','GET','/parent/plan',undefined,token)
assert.equal(screens.length,62)
assert(screens.every(s=>s.calls.length||s.note))
const dir=new URL('../docs/mock-demo/pdf-source/',import.meta.url);await fs.mkdir(dir,{recursive:true})
const output={title:'Kidsverse+ - Proposed Mock APIs for All 62 Screens',base,capturedAt:new Date().toISOString(),screens,captures}
await fs.writeFile(new URL('screen-contract.json',dir),JSON.stringify(output,null,2))
console.log(JSON.stringify({screens:screens.length,capturedRequests:captures.length,usedCaptures:new Set(screens.flatMap(s=>s.calls.map(c=>c.capture))).size,bootstrapResources:Object.keys(demo.data.bootstrap.resources).length}))
