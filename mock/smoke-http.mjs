import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {opponents} from './gameplay.mjs'
import {fileURLToPath} from 'node:url'
import {createContentRepository} from './content-repository.mjs'
const repository=createContentRepository({filename:fileURLToPath(new URL('../.mock-data/content.sqlite',import.meta.url))})
const worlds=repository.worlds().filter(w=>w.grade==='Grade 4'&&w.board==='CBSE');repository.close()
const base=process.env.MOCK_BASE_URL||'http://127.0.0.1:5180/api/v1'
const target=new URL(base);assert.equal(target.hostname,'127.0.0.1','This runner only permits loopback mock APIs.')
const transcript=[];let token=''
const redact=value=>Array.isArray(value)?value.map(redact):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).map(([key,v])=>[key,/token|session_id|password|code/i.test(key)?'[redacted]':redact(v)])):value
async function call(method,path,body,status=200,headers={}){
 const started=performance.now(),r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{ }),...headers},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(10000)})
 const data=r.status===204?null:await r.json()
 transcript.push({method,path,expected:status,status:r.status,request:redact(body),response:redact(data),ms:Math.round(performance.now()-started)})
 assert.equal(r.headers.get('X-Kidsverse-Source'),'local-mock');assert.equal(r.status,status,`${method} ${path}: ${JSON.stringify(data)}`)
 return data
}
try {
 await call('GET','/health');await call('GET','/parent/me',undefined,401)
 const login=await call('POST','/demo/login',{});token=login.token;const sid=login.students[0].id,root=`/students/${sid}`
 assert.equal(login.bootstrap.screens.length,62)
 for(const path of Object.keys(login.bootstrap.resources))await call('GET',path)
 await call('PATCH',`${root}/settings`,{sound:false});assert.equal((await call('GET',`${root}/settings`)).sound,false)
 await call('PATCH',`${root}/settings`,{sound:'false'},400)
 await call('POST','/students',{name:'Child',xp:1000000},400)
 for(const w of worlds){
  await call('POST',`${root}/missions/${w.missionId}/start`,{})
  await call('POST',`${root}/missions/${w.missionId}/complete`,{score:80})
  const attempt=await call('POST',`${root}/tests/${w.testId}/attempts`,{},201),ar=`/tests/attempts/${attempt.attempt_id}`
  for(let order=1;order<=attempt.total_questions;order++){const returned=await call('GET',`${ar}/questions/${order}`),q=w.questions.find(q=>q.id===returned.id);await call('POST',`${ar}/answers`,{question_id:q.id,selected_answer:q.answer})}
  assert.equal((await call('POST',`${ar}/complete`,{})).score,100)
  await call('POST',`${ar}/complete`,{})
  assert.equal((await call('GET',`${ar}/result`)).xp_awarded,50)
  const battle=await call('POST',`${root}/challenge-battles`,{challenge_id:w.challengeId,opponent_id:opponents[1].id},201),br=`/challenge-battles/${battle.battle_id}`
  await call('GET',`${br}/result`,undefined,409)
  for(let order=1;order<=battle.total_questions;order++){const returned=await call('GET',`${br}/questions/${order}`),q=w.battleQuestions.find(q=>q.id===returned.id);await call('POST',`${br}/answers`,{question_id:q.id,selected_answer:q.answer})}
  assert.equal((await call('POST',`${br}/complete`,{score:0})).score,100)
  await call('POST',`${br}/complete`,{score:0})
  assert.equal((await call('GET',`${br}/result`)).xp_awarded,50)
 }
 const home=await call('GET',`${root}/home`),profile=await call('GET',`${root}/profile`),overview=await call('GET','/parent/overview')
 assert.equal(home.stats.total_xp,320+worlds.reduce((sum,w)=>sum+w.pkg.mission.xp+100,0));assert.equal(profile.total_xp,home.stats.total_xp);assert.equal(overview.students[0].total_xp,home.stats.total_xp)
 await call('POST','/auth/parent/logout',{},204);await call('GET','/parent/me',undefined,401)
 console.log(`${transcript.length} actual HTTP checks passed; 5 subjects, 62 bootstrap entries, auth and write validation.`)
} finally {
 await fs.writeFile(new URL('../docs/mock-demo/http-verification.json',import.meta.url),JSON.stringify({base,verifiedAt:new Date().toISOString(),checks:transcript.length,allExpectedStatuses:transcript.every(r=>r.status===r.expected),requests:transcript},null,2))
}
