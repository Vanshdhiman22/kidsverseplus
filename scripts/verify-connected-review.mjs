import fs from 'node:fs'
import assert from 'node:assert/strict'
import {prepareMockResult} from '../src/lib/mock-walkthrough.js'
import {redactApi} from '../src/lib/redact-api.js'

// Use the scoped preview share link; keep its cookie and bearer token private.
const share=new URL(fs.readFileSync('.vercel/connected-review-url.txt','utf8').trim())
const entry=await fetch(share,{redirect:'manual',signal:AbortSignal.timeout(20000)})
assert.ok([200,307,308].includes(entry.status),'Preview entry is unavailable')
const cookie=entry.headers.getSetCookie().map(value=>value.split(';')[0]).join('; ')
let token
const calls=[]
async function request(path,{method='GET',body}={}) {
  const started=Date.now()
  const response=await fetch(`${share.origin}/api/v1${path}`,{
    method,headers:{Cookie:cookie,Accept:'application/json',
      ...(token?{Authorization:`Bearer ${token}`} : {}),
      ...(body!==undefined?{'Content-Type':'application/json'}:{}),
    },...(body!==undefined?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000),
  })
  assert.match(response.headers.get('content-type')||'',/application\/json/,'API returned non-JSON')
  const data=await response.json()
  const call={method,path,status:response.status,ms:Date.now()-started,request:body,response:redactApi(data)}
  calls.push(call)
  assert.ok(response.ok,`${method} ${path}: HTTP ${response.status}`)
  assert.equal(response.headers.get('x-kidsverse-source'),'local-mock','Wrong backend source')
  console.log(`${method} ${path.replace(/[a-f0-9]{8}-[a-f0-9-]{27,}/g,':id')} ${response.status}`)
  return data
}
const login=await request('/demo/login',{method:'POST',body:{}})
token=login.token
assert.ok(token,'Missing mock session')
assert.equal(login.bootstrap.screens.length,62)
const student=login.students[0],world=login.bootstrap.demo.worlds.find(w=>w.slug==='maths')
const initialHome=await request(`/students/${student.id}/home`)
assert.deepEqual(initialHome,login.bootstrap.resources[`/students/${student.id}/home`])
const results=[]
for(const kind of ['cfu','test','battle']){
  const start=calls.length
  const result=await prepareMockResult({kind,studentId:student.id,world,request})
  assert.equal(result.local,false)
  const run=calls.slice(start),answers=run.filter(c=>c.path.endsWith('/answers'))
  assert.ok(answers.length>0)
  for(const answer of answers){
    assert.ok(answer.request.question_id)
    assert.ok(answer.request.selected_answer)
    const question=run.find(c=>c.method==='GET'&&c.response.id===answer.request.question_id)
    assert.ok(question,'Answer must reference a delivered question')
    assert.ok(question.response.options.some(o=>o.key===answer.request.selected_answer))
  }
  const complete=run.find(c=>c.path.endsWith('/complete'))
  assert.deepEqual(complete.request,{})
  assert.equal(run.at(-1).response.status,'completed')
  results.push({kind,questions:answers.length,serverResult:run.at(-1).response})
}
const finalHome=await request(`/students/${student.id}/home`)
assert.ok(finalHome.stats.total_xp>=initialHome.stats.total_xp)
const report={at:new Date().toISOString(),origin:share.origin,scope:'Hosted HTTP mock: login, bootstrap/Home consistency, CFU/test/battle questions, answers, completion and server results',results,calls}
fs.writeFileSync('docs/verification/hosted-connected-recheck.json',JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({passed:true,calls:calls.length,screenDefinitions:62,results:results.map(r=>({kind:r.kind,questions:r.questions}))}))
