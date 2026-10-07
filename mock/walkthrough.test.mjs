import test from 'node:test'
import assert from 'node:assert/strict'
import {createServer} from 'node:http'
import {createMockApi} from './api.mjs'
import {createMockMiddleware} from './http.mjs'
import {prepareMockResult,nextMockScreen,prepareMockScreen} from '../src/lib/mock-walkthrough.js'
import {demoScreens} from './bootstrap.mjs'

test('dummy next traverses all 62 screen variants and wraps after the final screen',()=>{
  assert.equal(demoScreens.length,62)
  for(let i=0;i<demoScreens.length;i++){
    const url=new URL(demoScreens[i].route,'http://mock.local');url.searchParams.set('mockScreen',demoScreens[i].id)
    assert.equal(nextMockScreen(demoScreens,url.pathname+url.search).id,demoScreens[(i+1)%62].id)
  }
  assert.equal(nextMockScreen(demoScreens,'/parent/login').id,3)
  assert.equal(nextMockScreen(demoScreens,'/home').id,15)
  assert.equal(nextMockScreen(demoScreens,'/parent').id,61)
  assert.equal(nextMockScreen(demoScreens,'/journey?subject=literacy').id,20)
  assert.equal(nextMockScreen(demoScreens,'/missions/fractions/learn?subject=maths&auditStep=1&auditWay=1').id,30)
  assert.equal(nextMockScreen(demoScreens,'/not-a-screen'),null)
})

test('screen preparation starts dynamic test/battle flows and reuses only the same student server result',async()=>{
  const values=new Map(),storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)}
  const calls=[],args={studentId:'student',snapshot:{demo:{worlds:[]}},storage,request:async()=>{throw Error('Unexpected request')},startTest:async(...a)=>calls.push(['test',...a]),startBattle:async(...a)=>calls.push(['battle',...a]),refreshStats:async()=>{}}
  values.set('kv:test-progress','old')
  await prepareMockScreen({...args,screen:demoScreens.find(s=>s.id===43)})
  assert.deepEqual(calls[0],['test','student','maths']);assert.equal(values.has('kv:test-progress'),false)
  await prepareMockScreen({...args,screen:demoScreens.find(s=>s.id===52)})
  assert.deepEqual(calls[1],['battle','student',0])
  values.set('kv:last-mission-score',JSON.stringify({studentId:'student',local:false,attemptId:'server-attempt'}))
  assert.match(await prepareMockScreen({...args,screen:demoScreens.find(s=>s.id===39)}),/mockScreen=39/)
  assert.equal(await prepareMockScreen({...args,screen:demoScreens.find(s=>s.id===58)}),'/mock/parent-pin?mockScreen=58')
})

test('all walkthrough results are completed HTTP attempts with delivered question IDs and server rewards',async()=>{
  const api=createMockApi(),server=createServer(createMockMiddleware(api)),calls=[]
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve))
  let token
  const request=async(path,{method='GET',body}={})=>{
    const response=await fetch(`http://127.0.0.1:${server.address().port}${path}`,{method,headers:{...(token?{Authorization:`Bearer ${token}`} : {}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})})
    const data=await response.json();assert.ok(response.ok,`${method} ${path}: ${JSON.stringify(data)}`);calls.push({path,method,body,data});return data
  }
  try{
    const login=await request('/demo/login',{method:'POST',body:{}});token=login.token
    const studentId=login.students[0].id,world=login.bootstrap.demo.worlds[0]
    for(const kind of ['cfu','test','battle']){
      const start=calls.length,result=await prepareMockResult({kind,studentId,world,request}),run=calls.slice(start)
      assert.equal(result.local,false);assert.ok(result.attemptId||result.battleId)
      const complete=run.find(c=>c.path.endsWith('/complete'));assert.deepEqual(complete.body,{})
      for(const answer of run.filter(c=>c.path.endsWith('/answers'))){const q=run.find(c=>c.data.id===answer.body.question_id);assert.ok(q);assert.equal(answer.body.selected_answer,q.data.options[0].key)}
      const authoritative=run.at(-1).data;assert.equal(kind==='battle'?result.xp_awarded:result.xpAwarded,authoritative.xp_awarded)
      assert.ok(run.filter(c=>c.path.endsWith('/answers')).length>0)
    }
  }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));api.close()}
})
