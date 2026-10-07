import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {createMockApi} from './api.mjs'
import {createContentRepository} from './content-repository.mjs'
import {seedWorlds,opponents} from './content-seed.mjs'

function disk(){
 const directory=mkdtempSync(join(tmpdir(),'kidsverse-runtime-')),filename=join(directory,'state.sqlite')
 const handles=[];let time=Date.now()
 const open=()=>{const repo=createContentRepository({filename,clock:()=>time}),api=createMockApi({contentRepository:repo,contentAdminKey:'test-admin',clock:()=>time});handles.push(api);return {api,repo}}
 return {open,advance:ms=>{time+=ms},cleanup:()=>{for(const api of handles)try{api.close()}catch{};rmSync(directory,{recursive:true})}}
}
const content=()=>({...structuredClone(seedWorlds[0].pkg.studio),content_type:'concept_package',curriculum:{...seedWorlds[0].pkg.studio.curriculum,grade:'Grade 4'}})

test('accounts, shared verified parent, credentials, sessions and settings survive disk reopen',async()=>{
 const f=disk();let {api}=f.open()
 try{
  const signup=await api('POST','/auth/parent/signup',{email:'durable@example.test',password:'original-password'})
  const token=signup.data.token,sid=(await api('POST','/students',{name:'Explorer'},token)).data.id
  const verify=(await api('POST','/parent/verification/start',{student_id:sid,full_name:'Test Parent',phone:'+919876543210',relationship:'parent'},token)).data
  const verifiedAt=(await api('POST','/parent/verification/verify',{challenge_id:verify.challenge_id,code:verify.dev_code},token)).data.verified_at
  await api('PATCH',`/students/${sid}/grade-board`,{grade:'4',board:'CBSE'},token)
  await api('PATCH',`/students/${sid}/settings`,{sound:false},token)
  api.close();({api}=f.open())
  assert.equal((await api('GET','/parent/me',{},token)).data.phone_verified_at,verifiedAt)
  const login=(await api('POST','/auth/parent/login',{email:'durable@example.test',password:'original-password'})).data
  assert.ok(login.parent.phone_verified_at)
  assert.equal((await api('GET',`/students/${sid}/settings`,{},login.token)).data.sound,false)
  assert.equal((await api('POST','/auth/parent/login',{email:'durable@example.test',password:'bad-pass'})).status,401)
  await api('POST','/auth/parent/logout',{},token);api.close();({api}=f.open())
  assert.equal((await api('GET','/parent/me',{},token)).status,401)
  f.advance(8*60*60*1000+1)
  assert.equal((await api('GET','/parent/me',{},login.token)).status,401)
 }finally{f.cleanup()}
})

test('all four assessment snapshots, answers, reviews, rewards and idempotency survive restart',async()=>{
 const f=disk();let {api,repo}=f.open()
 try{
  const auth=(await api('POST','/demo/login')).data,token=auth.token,sid=auth.students[0].id,w=structuredClone(repo.worlds()[0]),rows=[]
  for(const [type,id,bank,prefix] of [['cfu',w.missionId,w.cfuQuestions,'missions'],['test',w.testId,w.questions,'tests'],['challenge',w.challengeTestId,w.challengeQuestions,'tests']]){
   const path=`/students/${sid}/${prefix}/${id}/attempts`,ctx={idempotencyKey:type+'-start'}
   const start=await api('POST',path,{},token,ctx),root=`/${prefix}/attempts/${start.data.attempt_id}`
   await api('POST',root+'/answers',{question_id:bank[0].id,selected_answer:bank[0].answer},token)
   rows.push({type,path,ctx,start,root,bank})
  }
  const start=(await api('POST',`/students/${sid}/challenge-battles`,{challenge_id:w.challengeId,opponent_id:opponents[0].id},token)).data
  const battleRoot=`/challenge-battles/${start.battle_id}`
  await api('POST',battleRoot+'/answers',{question_id:w.battleQuestions[0].id,selected_answer:w.battleQuestions[0].answer},token)
  api.close();({api,repo}=f.open())
  const changed=content();changed.test_questions.questions[0].answer=changed.test_questions.questions[0].options.find(o=>o!==changed.test_questions.questions[0].answer);repo.feed(changed)
  for(const row of rows){
   assert.deepEqual(await api('POST',row.path,{},token,row.ctx),row.start)
   const resumed=await api('GET',row.root,{},token);assert.equal(resumed.status,200);assert.equal(resumed.data.answered_questions,1);assert.equal(resumed.data.content_version,1)
   for(const q of row.bank.slice(1))await api('POST',row.root+'/answers',{question_id:q.id,selected_answer:q.answer},token)
   const result=await api('POST',row.root+'/complete',{},token);assert.equal(result.data.score,100);row.result=await api('GET',row.root+'/result',{},token)
  }
  assert.equal((await api('GET',battleRoot,{},token)).data.answered_questions,1)
  for(const q of w.battleQuestions.slice(1))await api('POST',battleRoot+'/answers',{question_id:q.id,selected_answer:q.answer},token)
  const battleResult=await api('POST',battleRoot+'/complete',{},token),before=(await api('GET',`/students/${sid}/home`,{},token)).data.stats.total_xp
  assert.equal(battleResult.data.score,100)
  api.close();({api}=f.open())
  for(const row of rows){assert.deepEqual(await api('GET',row.root+'/result',{},token),row.result);assert.equal((await api('GET',row.root+'/review',{},token)).data.items[0].is_correct,true);await api('POST',row.root+'/complete',{},token)}
  assert.deepEqual(await api('POST',battleRoot+'/complete',{},token),battleResult)
  assert.equal((await api('GET',`/students/${sid}/home`,{},token)).data.stats.total_xp,before)
  assert.equal((await api('GET','/parent/evidence',{},token)).data.students[0].evidence.length,4)
  assert.equal((await api('GET',`/students/${sid}/attempts`,{},token)).data.attempts.length,4)
 }finally{f.cleanup()}
})

test('two API instances share committed state without lost writes or stale published content',async()=>{
 const f=disk(),a=f.open(),b=f.open()
 try{
  const auth=(await a.api('POST','/demo/login')).data,token=auth.token,sid=auth.students[0].id
  const saves=await Promise.all([a.api('PATCH',`/students/${sid}/settings`,{sound:false},token),b.api('PATCH',`/students/${sid}/settings`,{music:false},token)])
  assert.ok(saves.every(r=>r.status===200));const state=(await a.api('GET',`/students/${sid}/settings`,{},token)).data;assert.equal(state.sound,false);assert.equal(state.music,false)
  b.repo.worlds();const payload=content();payload.concept.name='Cross connection content';a.repo.feed(payload)
  assert.ok(b.repo.worlds().some(w=>w.pkg.mission.title==='Cross connection content'))
 }finally{f.cleanup()}
})

test('persistence failure rolls back runtime writes and content authoring in one transaction',async()=>{
 const f=disk(),{api,repo}=f.open()
 try{
  const auth=(await api('POST','/demo/login')).data,token=auth.token,sid=auth.students[0].id,save=repo.saveRuntime
  repo.saveRuntime=()=>{throw Error('Injected disk failure')}
  assert.equal((await api('PATCH',`/students/${sid}/settings`,{sound:false},token)).status,500)
  const payload=content();payload.concept.name='Never committed'
  assert.equal((await api('POST','/admin/content/feed',payload,token,{contentAdminKey:'test-admin'})).status,500)
  repo.saveRuntime=save
  assert.equal((await api('GET',`/students/${sid}/settings`,{},token)).data.sound,true)
  assert.equal(repo.list().length,5)
 }finally{f.cleanup()}
})

test('password reset has private local delivery, one-use expiry and revokes every existing session',async()=>{
 const f=disk();let {api}=f.open()
 try{
  const body={email:'reset@example.test',password:'original-password'},auth=(await api('POST','/auth/parent/signup',body)).data
  const second=(await api('POST','/auth/parent/login',body)).data
  assert.deepEqual(await api('POST','/auth/parent/forgot-password',{email:body.email}),await api('POST','/auth/parent/forgot-password',{email:'missing@example.test'}))
  assert.equal((await api('GET','/__mock/outbox',{},auth.token)).status,403)
  const ctx={contentAdminKey:'test-admin'},messages=(await api('GET','/__mock/outbox',{},undefined,ctx)).data.messages,reset_token=messages.at(-1).reset_token
  api.close();({api}=f.open())
  assert.equal((await api('POST','/auth/parent/reset-password',{reset_token:'a'.repeat(64),password:'replacement-password'})).status,400)
  assert.equal((await api('POST','/auth/parent/reset-password',{reset_token,password:'replacement-password'})).status,200)
  assert.equal((await api('POST','/auth/parent/reset-password',{reset_token,password:'replacement-password'})).status,410)
  for(const token of [auth.token,second.token])assert.equal((await api('GET','/parent/me',{},token)).status,401)
  assert.equal((await api('POST','/auth/parent/login',body)).status,401)
  assert.equal((await api('POST','/auth/parent/login',{...body,password:'replacement-password'})).status,200)
  await api('POST','/auth/parent/forgot-password',{email:body.email});const expired=(await api('GET','/__mock/outbox',{},undefined,ctx)).data.messages.at(-1).reset_token;f.advance(900001)
  assert.equal((await api('POST','/auth/parent/reset-password',{reset_token:expired,password:'another-password'})).status,410)
 }finally{f.cleanup()}
})

test('PIN setup, failed-attempt lock, scoped proof and expiry persist without leaking credentials',async()=>{
 const f=disk();let {api}=f.open()
 try{
  const auth=(await api('POST','/auth/parent/signup',{email:'pin@example.test',password:'test-password'})).data,token=auth.token
  assert.equal((await api('GET','/parent/pin',{},token)).data.has_pin,false)
  assert.equal((await api('PUT','/parent/pin',{pin:'1357'},token)).status,403)
  assert.equal((await api('PUT','/parent/pin',{pin:'1357',current_password:'test-password'},token)).status,200)
  for(let i=0;i<5;i++)assert.equal((await api('POST','/parent/pin/verify',{pin:'0000'},token)).status,403)
  api.close();({api}=f.open())
  assert.equal((await api('POST','/parent/pin/verify',{pin:'1357'},token)).status,429)
  assert.equal((await api('PUT','/parent/pin',{pin:'0000',current_pin:'1357'},token)).status,429)
  f.advance(300001)
  const proof=(await api('POST','/parent/pin/verify',{pin:'1357'},token)).data.proof_token
  assert.equal((await api('POST','/parent/pin/authorize',{proof_token:proof},token)).status,200)
  const other=(await api('POST','/demo/login')).data
  assert.equal((await api('POST','/parent/pin/authorize',{proof_token:proof},other.token)).status,403)
  assert.equal((await api('GET','/parent/evidence',{},token,{parentPinProof:'invalid'})).status,403)
  f.advance(300001);assert.equal((await api('POST','/parent/pin/authorize',{proof_token:proof},token)).status,410)
  assert.equal((await api('GET','/parent/me',{},token)).data.hash,undefined)
 }finally{f.cleanup()}
})
