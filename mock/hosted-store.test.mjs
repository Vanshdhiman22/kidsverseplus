import test from 'node:test'
import assert from 'node:assert/strict'
import {createHostedMock} from './hosted-store.mjs'
import {MOCK_DEMO_CREDENTIALS} from '../src/data/mock-demo.js'

// Storage protocol double only; the real SQLite and full API engine run here.
// Live PostgreSQL verification is a separate deployment gate.
function storage() {
  let payload=null,tail=Promise.resolve(),failCommit=false
  const queries=[]
  return {queries,failNextCommit:()=>{failCommit=true},pool:{connect:async()=>{
    let stage,unlock,prior
    return {query:async(sql,args=[])=>{
      queries.push(sql)
      if(sql.startsWith('SELECT pg_advisory')){
        prior=tail;tail=new Promise(resolve=>{unlock=resolve});await prior
      }
      if(sql.startsWith('SELECT payload'))return {rows:[{payload}]}
      if(sql.startsWith('UPDATE'))stage=Buffer.from(args[1])
      if(sql==='COMMIT'){
        if(failCommit){failCommit=false;throw Error('Storage unavailable')}
        payload=stage;unlock?.();unlock=null
      }
      if(sql==='ROLLBACK'){stage=null;unlock?.();unlock=null}
      return {rows:[]}
    },release:()=>{unlock?.()}}
  }}}
}

test('hosted adapter restores login, content, attempts and writes across fresh instances',async()=>{
  const db=storage(),first=createHostedMock({pool:db.pool})
  const auth=(await first('POST','/auth/parent/login',MOCK_DEMO_CREDENTIALS)).data
  assert.equal(auth.bootstrap.screens.length,62)
  const sid=auth.students[0].id,w=auth.bootstrap.demo.worlds[0]
  await first('PATCH',`/students/${sid}/settings`,{sound:false},auth.token)
  const start=(await first('POST',`/students/${sid}/tests/${w.testId}/attempts`,{},auth.token)).data
  const root=`/tests/attempts/${start.attempt_id}`
  const q=(await first('GET',root+'/questions/1',{},auth.token)).data
  await first('POST',root+'/answers',{question_id:q.id,selected_answer:q.options[0].key},auth.token)
  const cold=createHostedMock({pool:db.pool})
  assert.equal((await cold('GET',`/students/${sid}/settings`,{},auth.token)).data.sound,false)
  assert.equal((await cold('GET',root,{},auth.token)).data.answered_questions,1)
  assert.equal((await cold('GET',root+'/questions/1',{},auth.token)).data.id,q.id)
  await cold('POST','/auth/parent/logout',{},auth.token)
  assert.equal((await first('GET','/parent/me',{},auth.token)).status,401)
})

test('concurrent hosted writes do not lose data and failed commits roll back',async()=>{
  const db=storage(),a=createHostedMock({pool:db.pool}),b=createHostedMock({pool:db.pool})
  const auth=(await a('POST','/auth/parent/login',MOCK_DEMO_CREDENTIALS)).data
  const path=`/students/${auth.students[0].id}/settings`
  await Promise.all([a('PATCH',path,{sound:false},auth.token),b('PATCH',path,{music:false},auth.token)])
  const settings=(await b('GET',path,{},auth.token)).data
  assert.equal(settings.sound,false);assert.equal(settings.music,false)
  db.failNextCommit()
  await assert.rejects(a('PATCH',path,{sound:true},auth.token),/Storage unavailable/)
  assert.equal((await b('GET',path,{},auth.token)).data.sound,false)
  assert.ok(db.queries.includes('ROLLBACK'))
})

test('hosted storage rejects invalid namespaces and oversized snapshots without committing',async()=>{
  assert.throws(()=>createHostedMock({pool:{},namespace:'live'}),/Isolated/)
  const db=storage(),api=createHostedMock({pool:db.pool,maxBytes:10})
  await assert.rejects(api('POST','/demo/login',{}),/size limit/)
  assert.ok(db.queries.includes('ROLLBACK'))
})
