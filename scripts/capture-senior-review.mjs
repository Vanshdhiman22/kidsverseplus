// Supplemental HTTP evidence for the senior PDF. Uses an isolated temporary DB.
import assert from 'node:assert/strict'
import {createServer} from 'node:http'
import {once} from 'node:events'
import {mkdtempSync,rmSync,readFileSync,writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {createContentRepository} from '../mock/content-repository.mjs'
import {createMockApi} from '../mock/api.mjs'
import {createMockMiddleware} from '../mock/http.mjs'
import {findOperation,checkApiResponse,operations} from '../mock/api-contracts.mjs'
import {redactApi} from '../src/lib/redact-api.js'
import {opponents} from '../mock/content-seed.mjs'

const report=JSON.parse(readFileSync(new URL('../docs/verification/all-62-mock-api-responses.json',import.meta.url),'utf8'))
const directory=mkdtempSync(join(tmpdir(),'kidsverse-senior-pdf-'))
let time=Date.now(),token=''
const adminKey='isolated-pdf-admin',repo=createContentRepository({filename:join(directory,'content.sqlite'),clock:()=>time})
const api=createMockApi({contentRepository:repo,contentAdminKey:adminKey,clock:()=>time})
const server=createServer(createMockMiddleware(api));server.listen(0,'127.0.0.1');await once(server,'listening')
const base=`http://127.0.0.1:${server.address().port}`,examples={},newCaptures=[]
let next=Math.max(...report.captures.map(c=>c.id))
async function call(label,method,path,body={},options={}){
 const operation=findOperation(method,path);assert.ok(operation,`${method} ${path}`)
 const headers={Accept:'application/json',...(method==='GET'?{}:{'Content-Type':'application/json'}),...(options.public?{}:{Authorization:`Bearer ${options.token||token}`}),...(options.proof?{'X-Parent-PIN-Proof':options.proof}:{}),...(options.key?{'Idempotency-Key':options.key}:{}),...(options.admin?{'X-Mock-Content-Admin-Key':adminKey}:{})}
 const response=await fetch(base+path,{method,headers,...(method==='GET'?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(10000)})
 const data=response.status===204?null:await response.json()
 assert.equal(response.status,options.status||operation.status,`${label}: ${JSON.stringify(data)}`)
 const checked=checkApiResponse(method,path,{status:response.status,data});assert.ok(checked.valid,`${label}: ${JSON.stringify(checked.errors)}`)
 const safeHeaders=Object.fromEntries(Object.entries(headers).map(([key,value])=>[key,key==='Authorization'?'Bearer [redacted]':['X-Mock-Content-Admin-Key','X-Parent-PIN-Proof'].includes(key)?'[redacted]':value]))
 const capture={id:++next,label,method,path,request:method==='GET'?null:redactApi(body),request_headers:safeHeaders,status:response.status,response:redactApi(data),operation:operation.path,role:operation.role,origin:operation.origin,captured_at:new Date(time).toISOString()}
 newCaptures.push(capture);return {id:capture.id,data}
}
const group=(key,result)=>(examples[key]??=[]).push(result.id)
try{
 const auth=await call('Create isolated review parent','POST','/auth/parent/signup',{email:'senior-review@example.test',password:'review-password',full_name:'Review Parent'},{public:true});token=auth.data.token
 const child=await call('Create child with idempotency key','POST','/students',{name:'Aarav'},{key:'review-child-1'}),sid=child.data.id,root=`/students/${sid}`,world=repo.worlds()[0]
 group('idempotency',child)
 group('idempotency',await call('Retry identical child request','POST','/students',{name:'Aarav'},{key:'review-child-1'}))
 group('errors',await call('Same idempotency key with conflicting payload','POST','/students',{name:'Another name'},{key:'review-child-1',status:409}))
 const verification=await call('Start parent verification','POST','/parent/verification/start',{student_id:sid,full_name:'Review Parent',relationship:'parent',phone:'+919876543210'})
 await call('Verify parent before child setup','POST','/parent/verification/verify',{challenge_id:verification.data.challenge_id,code:verification.data.dev_code})
 await call('Assign published curriculum','PATCH',root+'/grade-board',{grade:'4',board:'CBSE'})
 group('pin',await call('PIN status before setup','GET','/parent/pin'))
 group('pin',await call('Create PIN using current password','PUT','/parent/pin',{pin:'1357',current_password:'review-password'}))
 group('pin',await call('Change PIN using current PIN','PUT','/parent/pin',{pin:'2468',current_pin:'1357'}))
 const proof=await call('Verify PIN and issue parent proof','POST','/parent/pin/verify',{pin:'2468'});group('pin',proof)
 group('pin',await call('Authorize parent proof','POST','/parent/pin/authorize',{proof_token:proof.data.proof_token}))
 const flows={}
 for(const [mode,id,questions,prefix]of [['cfu',world.missionId,world.cfuQuestions,'missions'],['test',world.testId,world.questions,'tests'],['challenge',world.challengeTestId,world.challengeQuestions,'tests']]){
  const rows=[]
  if(prefix==='tests')rows.push((await call(`${mode}: metadata`,'GET',`/tests/${id}`)).id)
  const start=await call(`${mode}: start attempt`,'POST',`${root}/${prefix}/${id}/attempts`,{},{key:`review-${mode}-start`});rows.push(start.id)
  const attempt=`/${prefix}/attempts/${start.data.attempt_id}`
  rows.push((await call(`${mode}: resume active attempt`,'GET',attempt)).id)
  for(const [index,q]of questions.entries()){
   const question=await call(`${mode}: get question ${q.order_index}`,'GET',attempt+`/questions/${q.order_index}`)
   const answer=mode==='test'&&index>0?q.options.find(o=>o.key!==q.answer).key:q.answer
   const submitted=await call(`${mode}: submit answer ${q.order_index}`,'POST',attempt+'/answers',{question_id:q.id,selected_answer:answer},{key:`review-${mode}-answer-${index}`})
   if(index===0)rows.push(question.id,submitted.id)
  }
  rows.push((await call(`${mode}: complete with server score`,'POST',attempt+'/complete',{},{key:`review-${mode}-complete`})).id)
  const result=await call(`${mode}: result`,'GET',attempt+'/result');rows.push(result.id)
  rows.push((await call(`${mode}: actual answer review`,'GET',attempt+'/review')).id)
  if(mode==='test'){
   assert.ok(result.data.score<80)
   examples.remediation=(await call('Recommendations after a low Test score','GET',root+'/extra-learning')).id
  }
  if(mode==='challenge')assert.equal(result.data.assessment_type,'challenge')
  flows[mode]={rows,attempt}
 }
 const battle=await call('Battle: start attempt','POST',root+'/challenge-battles',{challenge_id:world.challengeId,opponent_id:opponents[0].id},{key:'review-battle-start'})
 const br=`/challenge-battles/${battle.data.battle_id}`
 const resume=await call('Battle: resume active attempt','GET',br)
 for(const [index,q]of world.battleQuestions.slice(0,world.rules.battle.round_limit).entries())await call(`Battle: answer ${index+1}`,'POST',br+'/answers',{question_id:q.id,selected_answer:q.answer},{key:`review-battle-answer-${index}`})
 await call('Battle: complete','POST',br+'/complete',{},{key:'review-battle-complete'})
 const battleReview=await call('Battle: actual answer review','GET',br+'/review')
 examples.challenge=flows.challenge.rows
 examples.resume=[flows.cfu.rows[1],flows.test.rows[2],resume.id,battleReview.id]
 const history=await call('Combined completed attempt history','GET',root+'/attempts');group('resume',history)
 const populated={'extra-learning':examples.remediation}
 for(const suffix of ['profile','profile/cards','profile/our-journey','home'])populated[suffix]=(await call('Populated '+suffix,'GET',root+'/'+suffix)).id
 for(const suffix of ['overview','evidence','plan'])populated['parent/'+suffix]=(await call('Populated parent '+suffix,'GET','/parent/'+suffix,{}, {proof:proof.data.proof_token})).id
 const find=id=>newCaptures.find(c=>c.id===id)
 assert.equal(find(populated['parent/evidence']).response.students[0].evidence.length,4)
 assert.ok(find(populated['profile/cards']).response.cards.length)
 assert.ok(find(populated['extra-learning']).response.recommendations.length)
 examples.populated=populated
 group('errors',await call('Missing parent authentication','GET','/parent/me',{}, {public:true,status:401}))
 group('errors',await call('Invalid settings field','PATCH',root+'/settings',{unknown:true},{status:400}))
 group('errors',await call('Unknown assessment attempt','GET','/tests/attempts/not-found',{}, {status:404}))
 group('errors',await call('Content authoring rejects parent bearer','POST','/admin/content/drafts',{}, {status:403}))
 for(let i=0;i<5;i++){
  const bad=await call('Incorrect PIN','POST','/parent/pin/verify',{pin:'0000'},{status:403});if(i===0)group('errors',bad)
 }
 group('errors',await call('PIN locked after five failures','POST','/parent/pin/verify',{pin:'2468'},{status:429}))
 time+=300001
 group('errors',await call('Parent proof expired after five minutes','POST','/parent/pin/authorize',{proof_token:proof.data.proof_token},{status:410}))
 // Attach both existing and supplemental evidence without changing the complete
 // verification report or the user's local running database.
 report.captures.push(...newCaptures)
 const byId=new Map(report.captures.map(c=>[c.id,c]))
 const first=(method,path)=>report.captures.find(c=>c.method===method&&c.operation===path&&c.status<400).id
 report.screens.find(s=>s.id===12).capture_ids.unshift(first('POST','/students/{student_id}/onboarding/steps/{step}/complete'))
 report.screens.find(s=>s.id===58).capture_ids=examples.pin
 for(const [sid,key]of [[55,'profile'],[56,'profile/our-journey'],[46,'extra-learning'],[60,'parent/overview'],[61,'parent/evidence'],[62,'parent/plan']]){
  report.screens.find(s=>s.id===sid).capture_ids=[populated[key]]
  if(sid===55)report.screens.find(s=>s.id===sid).capture_ids.push(populated['profile/cards'])
 }
 const assigned=new Set(report.screens.flatMap(s=>s.capture_ids).filter(id=>byId.get(id).origin!=='mock'))
 examples.bootstrap=[first('POST','/demo/login')]
 for(const key of ['challenge','resume','pin','idempotency','errors'])for(const id of examples[key])assigned.add(id)
 examples.supporting=[]
 for(const operation of operations.filter(o=>o.origin!=='mock')){
  if([...assigned].some(id=>{const c=byId.get(id);return c.method===operation.method&&c.operation===operation.path&&c.status<400}))continue
  const id=first(operation.method,operation.path);examples.supporting.push(id);assigned.add(id)
 }
 report.senior_review={generated_at:new Date().toISOString(),examples,non_mock_operations:operations.filter(o=>o.origin!=='mock').length,transport:'Actual HTTP; isolated temporary database',supplemental_captures:newCaptures.length}
 assert.equal(new Set([...assigned].filter(id=>byId.get(id).status<400).map(id=>byId.get(id).method+' '+byId.get(id).operation)).size,report.senior_review.non_mock_operations)
 writeFileSync(new URL('../docs/verification/senior-review-api-responses.json',import.meta.url),JSON.stringify(report,null,2)+'\n')
 console.log(JSON.stringify({supplemental_captures:newCaptures.length,non_mock_operations:report.senior_review.non_mock_operations,populated_evidence:4,bootstrap_resources:report.bootstrap.cached_resource_reads}))
}finally{
 server.closeAllConnections();await new Promise(resolve=>server.close(resolve));api.close();rmSync(directory,{recursive:true})
}
