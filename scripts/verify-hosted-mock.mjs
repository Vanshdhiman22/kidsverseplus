import assert from 'node:assert/strict'
import {readFileSync,writeFileSync} from 'node:fs'
import {MOCK_DEMO_CREDENTIALS} from '../src/data/mock-demo.js'
import {checkApiResponse,findOperation} from '../mock/api-contracts.mjs'
import {redactApi} from '../src/lib/redact-api.js'

const shared=new URL(readFileSync(new URL('../.vercel/mock-login-share-url.txt',import.meta.url),'utf8').trim())
assert.match(shared.hostname,/^kidsverseplus-[a-z0-9]+-vanshdhiman22s-projects\.vercel\.app$/)
const gate=await fetch(shared,{redirect:'manual',signal:AbortSignal.timeout(20000)})
const cookie=gate.headers.getSetCookie().map(value=>value.split(';')[0]).join('; ')
const captures=[];let token=''
const call=async(method,path,body,expected)=>{
  const started=Date.now()
  const response=await fetch(shared.origin+'/api/v1'+path,{method,headers:{Accept:'application/json',Cookie:cookie,...(token?{Authorization:`Bearer ${token}`} : {}),...(body===undefined?{}:{'Content-Type':'application/json'})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(20000)})
  const data=response.status===204?null:await response.json()
  captures.push({method,path,request:redactApi(body??null),status:response.status,response:redactApi(data),ms:Date.now()-started})
  assert.equal(response.status,expected??findOperation(method,path)?.status??200,`${method} ${path}: ${JSON.stringify(data)}`)
  assert.equal(checkApiResponse(method,path,{status:response.status,data}).valid,true,`${method} ${path}: response contract`)
  return data
}
let success=false
try {
  assert.equal((await call('GET','/health')).source,'mock')
  await call('POST','/auth/parent/login',{...MOCK_DEMO_CREDENTIALS,password:'incorrect-password'},401)
  const auth=await call('POST','/auth/parent/login',MOCK_DEMO_CREDENTIALS)
  token=auth.token
  assert.equal(auth.bootstrap.screens.length,62)
  for(const [path,data] of Object.entries(auth.bootstrap.resources))assert.deepEqual(await call('GET',path),data)
  console.log(`Hosted bootstrap: ${auth.bootstrap.screens.length} screens, ${Object.keys(auth.bootstrap.resources).length} resources verified.`)
  const sid=auth.students[0].id,w=auth.bootstrap.demo.worlds[0]
  const challenge=auth.bootstrap.resources['/challenges'].challenges.find(row=>row.id===w.challengeId)
  for(const [label,prefix,id] of [['CFU','missions',w.missionId],['Test','tests',w.testId],['Challenge','tests',challenge.practice_test_id]]){
    const start=await call('POST',`/students/${sid}/${prefix}/${id}/attempts`,{})
    const root=`/${prefix}/attempts/${start.attempt_id}`
    for(let order=1;order<=start.total_questions;order++){
      const q=await call('GET',root+`/questions/${order}`)
      assert.equal(q.answer,undefined)
      await call('POST',root+'/answers',{question_id:q.id,selected_answer:q.options[0].key})
    }
    const result=await call('POST',root+'/complete',{})
    const detail=await call('GET',root+'/result')
    for(const [key,value]of Object.entries(result))assert.deepEqual(detail[key],value)
    assert.deepEqual(await call('POST',root+'/complete',{}),result)
    await call('GET',root+'/review')
    console.log(`Hosted ${label}: questions, answers, completion, replay and review passed.`)
  }
  const opponents=auth.bootstrap.resources[`/challenges/${w.challengeId}/opponents`].opponents
  const battle=await call('POST',`/students/${sid}/challenge-battles`,{challenge_id:w.challengeId,opponent_id:opponents[0].id})
  const root=`/challenge-battles/${battle.battle_id}`
  for(let order=1;order<=battle.total_questions;order++){
    const q=await call('GET',root+`/questions/${order}`)
    assert.equal(q.answer,undefined)
    await call('POST',root+'/answers',{question_id:q.id,selected_answer:q.options[0].key})
  }
  const result=await call('POST',root+'/complete',{})
  const detail=await call('GET',root+'/result')
  for(const [key,value]of Object.entries(result))assert.deepEqual(detail[key],value)
  assert.deepEqual(await call('POST',root+'/complete',{}),result)
  await call('GET',root+'/review')
  const home=await call('GET',`/students/${sid}/home`),profile=await call('GET',`/students/${sid}/profile`)
  assert.equal(profile.total_xp,home.stats.total_xp)
  await call('POST','/auth/parent/logout',{})
  await call('GET','/parent/me',undefined,401)
  success=true
  console.log(JSON.stringify({success,checks:captures.length,screens:62,resources:Object.keys(auth.bootstrap.resources).length,flows:['CFU','Test','Challenge','Battle'],xp_consistent:true}))
} finally {
  writeFileSync(new URL('../docs/verification/hosted-mock-api-check.json',import.meta.url),JSON.stringify({verified_at:new Date().toISOString(),origin:shared.origin,success,checks:captures.length,captures},null,2)+'\n')
}
