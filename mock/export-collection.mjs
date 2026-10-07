import fs from 'node:fs/promises'
import {fileURLToPath} from 'node:url'
import {opponents} from './gameplay.mjs'
import {createContentRepository} from './content-repository.mjs'
// Export the published DB snapshot, including current question IDs/option keys.
// A later publication requires regeneration of this review collection.
const repository=createContentRepository({filename:fileURLToPath(new URL('../.mock-data/content.sqlite',import.meta.url))})
const worlds=repository.worlds().filter(w=>w.grade==='Grade 4'&&w.board==='CBSE');repository.close()
const item=[]
// Keys belong only in this local engineering collection. Match the server ID,
// never the authored array index after random selection.
const rememberQuestion=bank=>[
 `const expected=${JSON.stringify(Object.fromEntries(bank.map(q=>[q.id,q.answer])))};`,
 'const q=pm.response.json(); if(!Object.prototype.hasOwnProperty.call(expected,q.id))throw Error("Published bank changed; regenerate collection");',
 'pm.collectionVariables.set("questionId",q.id); pm.collectionVariables.set("selectedAnswer",expected[q.id]);',
 'pm.test("No answer key delivered",()=>pm.expect(q.answer===undefined).to.equal(true));',
]
function add(name,method,path,body,status=200,checks=[],headers={}) {
 item.push({name,request:{method,header:Object.entries({'Content-Type':'application/json',...headers}).map(([key,value])=>({key,value})),url:`{{baseUrl}}${path}`,...(body===undefined?{}:{body:{mode:'raw',raw:JSON.stringify(body,null,2),options:{raw:{language:'json'}}}})},event:[{listen:'test',script:{type:'text/javascript',exec:[`pm.test("HTTP ${status}",()=>pm.response.to.have.status(${status}));`,...checks]}}]})
}
add('01 Health','GET','/health')
add('02 One-request demo login (mock-only)','POST','/demo/login',{},200,[
 'pm.collectionVariables.set("token",pm.response.json().token);',
 'pm.collectionVariables.set("studentId",pm.response.json().students[0].id);',
 'pm.test("62 screens",()=>pm.expect(pm.response.json().bootstrap.screens.length).to.equal(62));'
])
add('03 Parent profile','GET','/parent/me')
add('04 Reject injected XP','POST','/students',{name:'Test Child',xp:999999},400)
add('05 Settings save','PATCH','/students/{{studentId}}/settings',{sound:false})
add('06 Settings persisted','GET','/students/{{studentId}}/settings',undefined,200,['pm.test("Saved sound",()=>pm.expect(pm.response.json().sound).to.equal(false));'])
for(const w of worlds){
 add(`${w.slug}: public mission`,'GET',`/missions/${w.missionId}`)
 add(`${w.slug}: start mission`,'POST',`/students/{{studentId}}/missions/${w.missionId}/start`,{})
 add(`${w.slug}: start server-scored CFU`,'POST',`/students/{{studentId}}/missions/${w.missionId}/attempts`,{},201,['pm.collectionVariables.set("learningAttemptId",pm.response.json().attempt_id);'])
 add(`${w.slug}: CFU review locked until completion`,'GET','/missions/attempts/{{learningAttemptId}}/review',undefined,409)
 for(const q of w.cfuQuestions){
  add(`${w.slug}: CFU question ${q.order_index}`,'GET',`/missions/attempts/{{learningAttemptId}}/questions/${q.order_index}`)
  add(`${w.slug}: CFU answer ${q.order_index}`,'POST','/missions/attempts/{{learningAttemptId}}/answers',{question_id:q.id,selected_answer:q.answer},200,['pm.test("CFU correct",()=>pm.expect(pm.response.json().is_correct).to.equal(true));'])
 }
 add(`${w.slug}: complete CFU`,'POST','/missions/attempts/{{learningAttemptId}}/complete',{},200,['pm.test("CFU score",()=>pm.expect(pm.response.json().score).to.equal(100));'])
 add(`${w.slug}: saved CFU review`,'GET','/missions/attempts/{{learningAttemptId}}/review')
 add(`${w.slug}: complete mission`,'POST',`/students/{{studentId}}/missions/${w.missionId}/complete`,{score:80})
 add(`${w.slug}: start test`,'POST',`/students/{{studentId}}/tests/${w.testId}/attempts`,{},201,['pm.collectionVariables.set("attemptId",pm.response.json().attempt_id);'])
 for(const q of w.questions){
  add(`${w.slug}: question ${q.order_index}`,'GET',`/tests/attempts/{{attemptId}}/questions/${q.order_index}`,undefined,200,rememberQuestion(w.questions))
  add(`${w.slug}: answer ${q.order_index}`,'POST','/tests/attempts/{{attemptId}}/answers',{question_id:'{{questionId}}',selected_answer:'{{selectedAnswer}}'},200,['pm.test("Correct",()=>pm.expect(pm.response.json().is_correct).to.equal(true));'])
 }
 add(`${w.slug}: complete test`,'POST','/tests/attempts/{{attemptId}}/complete',{},200,['pm.test("Score",()=>pm.expect(pm.response.json().score).to.equal(100));'])
 add(`${w.slug}: test result`,'GET','/tests/attempts/{{attemptId}}/result')
 add(`${w.slug}: saved test review`,'GET','/tests/attempts/{{attemptId}}/review')
 add(`${w.slug}: find DB challenge practice`,'GET',`/topics/${w.topicId}/tests`,undefined,200,[`pm.collectionVariables.set("challengeTestId",pm.response.json().tests.find(t=>t.assessment_type==="challenge"&&t.mission_id==="${w.missionId}").id);`])
 add(`${w.slug}: start challenge practice`,'POST','/students/{{studentId}}/tests/{{challengeTestId}}/attempts',{},201,['pm.collectionVariables.set("attemptId",pm.response.json().attempt_id);'])
 for(const [i,q] of w.challengeQuestions.entries()){
  add(`${w.slug}: challenge question ${i+1}`,'GET',`/tests/attempts/{{attemptId}}/questions/${i+1}`,undefined,200,rememberQuestion(w.challengeQuestions))
  add(`${w.slug}: challenge answer ${i+1}`,'POST','/tests/attempts/{{attemptId}}/answers',{question_id:'{{questionId}}',selected_answer:'{{selectedAnswer}}'},200,['pm.test("Challenge correct",()=>pm.expect(pm.response.json().is_correct).to.equal(true));'])
 }
 add(`${w.slug}: complete challenge practice`,'POST','/tests/attempts/{{attemptId}}/complete',{},200,['pm.test("Challenge score",()=>pm.expect(pm.response.json().score).to.equal(100));'])
 add(`${w.slug}: challenge practice result`,'GET','/tests/attempts/{{attemptId}}/result')
 add(`${w.slug}: saved challenge review`,'GET','/tests/attempts/{{attemptId}}/review')
 add(`${w.slug}: start battle`,'POST','/students/{{studentId}}/challenge-battles',{challenge_id:w.challengeId,opponent_id:opponents[0].id},201,['pm.collectionVariables.set("battleId",pm.response.json().battle_id);'])
 add(`${w.slug}: unfinished result is rejected`,'GET','/challenge-battles/{{battleId}}/result',undefined,409)
 for(let order=1;order<=Math.min(w.battleQuestions.length,w.rules?.battle.round_limit??3);order++){
  add(`${w.slug}: battle question ${order}`,'GET',`/challenge-battles/{{battleId}}/questions/${order}`,undefined,200,rememberQuestion(w.battleQuestions))
  add(`${w.slug}: battle answer ${order}`,'POST','/challenge-battles/{{battleId}}/answers',{question_id:'{{questionId}}',selected_answer:'{{selectedAnswer}}'},200,['pm.test("Battle correct",()=>pm.expect(pm.response.json().is_correct).to.equal(true));'])
 }
 add(`${w.slug}: score comes from server answers`,'POST','/challenge-battles/{{battleId}}/complete',{score:0},200,['pm.test("Ignores client score",()=>pm.expect(pm.response.json().score).to.equal(100));'])
 add(`${w.slug}: duplicate completion`,'POST','/challenge-battles/{{battleId}}/complete',{})
 add(`${w.slug}: battle result`,'GET','/challenge-battles/{{battleId}}/result')
 add(`${w.slug}: saved battle review`,'GET','/challenge-battles/{{battleId}}/review')
}
add('Parent overview','GET','/parent/overview')
add('Logout','POST','/auth/parent/logout',{},204)
add('Revoked token','GET','/parent/me',undefined,401)
const collection={info:{name:'Kidsverse local mock — senior review',description:'Local DB content mock: Learn/CFU, Test, Challenge practice and Battle, including completed answer reviews. Generated from the current local published database; regenerate with node mock/export-collection.mjs after publishing changes. Content and runtime state persist in SQLite. This collection focuses on assessments; the full 110-operation contract and isolated HTTP verification are docs/mock-demo/openapi.json and npm run mock:verify:all. Use Collection Runner in order. Sample authors must keep demo child Grade 4 CBSE content available.',schema:'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'},auth:{type:'bearer',bearer:[{key:'token',value:'{{token}}',type:'string'}]},variable:[{key:'baseUrl',value:'http://127.0.0.1:5180/api/v1'},...['token','studentId','attemptId','battleId','challengeTestId','questionId','selectedAnswer','learningAttemptId'].map(key=>({key,value:''}))],item}
await fs.writeFile(new URL('../postman/Kidsverse-local-mock.postman_collection.json',import.meta.url),JSON.stringify(collection,null,2))
console.log(`Exported ${item.length} runnable Postman requests.`)
