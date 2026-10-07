import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createServer} from 'node:http'
import {once} from 'node:events'
import {createMockApi} from './api.mjs'
import {createMockMiddleware} from './http.mjs'
import {seedWorlds} from './content-seed.mjs'

test('real HTTP boundary: malformed JSON, body limit, media type, errors, auth and idempotent writes',async t=>{
 const server=createServer(createMockMiddleware(createMockApi()));server.listen(0,'127.0.0.1');await once(server,'listening')
 t.after(()=>{server.closeAllConnections();server.close()})
 const base=`http://127.0.0.1:${server.address().port}`
 const request=(path,options={})=>fetch(base+path,{...options,signal:AbortSignal.timeout(5000)})
 let r=await request('/students',{method:'POST',headers:{'Content-Type':'application/json'},body:'{'})
 assert.equal(r.status,400);assert.equal((await r.json()).error.code,'INVALID_JSON');assert.ok(r.headers.get('X-Request-ID'))
 r=await request('/students',{method:'POST',headers:{'Content-Type':'text/plain'},body:'{}'});assert.equal(r.status,415)
 r=await request('/students',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'x'.repeat(66000)})});assert.equal(r.status,413)
 r=await request('/demo/login',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});assert.equal(r.status,200)
 assert.equal(r.headers.get('X-Kidsverse-Source'),'local-mock');assert.equal(r.headers.get('Cache-Control'),'no-store')
 const auth=await r.json(),headers={'Content-Type':'application/json',Authorization:`Bearer ${auth.token}`,'Idempotency-Key':'http-child'}
 const results=await Promise.all([request('/students',{method:'POST',headers,body:'{"name":"HTTP Child"}'}),request('/students',{method:'POST',headers,body:'{"name":"HTTP Child"}'})])
 assert.ok(results.every(r=>r.status===201));const children=await Promise.all(results.map(r=>r.json()));assert.equal(children[0].id,children[1].id)
 r=await request('/parent/me',{headers:{Authorization:`NotBearer ${auth.token}`}});assert.equal(r.status,401)
 r=await request('/students',{method:'POST',headers:{...headers,'X-Mock-Scenario':'500'},body:'{"name":"Not Saved"}'});assert.equal(r.status,500)
 r=await request('/parent/students',{headers});assert.equal((await r.json()).students.length,3)
 r=await request('/auth/parent/logout',{method:'POST',headers:{Authorization:`Bearer ${auth.token}`}});assert.equal(r.status,204);assert.equal(await r.text(),'')
 r=await request('/parent/me',{headers});assert.equal(r.status,401)
})

test('HTTP content feed forwards admin credentials, allows larger packages, and rejects oversize writes',async t=>{
 const api=createMockApi({contentAdminKey:'http-admin-test-key'})
 const server=createServer(createMockMiddleware(api));server.listen(0,'127.0.0.1');await once(server,'listening')
 t.after(()=>{server.closeAllConnections();server.close();api.close()})
 const base=`http://127.0.0.1:${server.address().port}`
 const body=structuredClone(seedWorlds[0].pkg.studio);body.content_type='concept_package';body.curriculum.grade='Grade 4'
 body.concept.name='HTTP feed concept';body.test_questions.questions=Array.from({length:25},(_,i)=>({...body.test_questions.questions[0],question:`Authored question ${i+1}`,explanation:'x'.repeat(3500)}))
 const send=(value,key='http-admin-test-key')=>fetch(base+'/admin/content/feed',{method:'POST',headers:{'Content-Type':'application/json','X-Mock-Content-Admin-Key':key,'Idempotency-Key':'http-content'},body:JSON.stringify(value),signal:AbortSignal.timeout(5000)})
 let r=await send(body,'wrong');assert.equal(r.status,403)
 r=await send(body);assert.equal(r.status,201);const saved=await r.json()
 r=await send(body);assert.equal(r.status,201);assert.deepEqual(await r.json(),saved)
 r=await fetch(base+'/admin/content/packages/'+saved.data.package_id,{headers:{'X-Mock-Content-Admin-Key':'http-admin-test-key'}})
 assert.equal(r.status,200);assert.equal((await r.json()).test_questions.questions.length,25)
 r=await send({...body,learning_content:{...body.learning_content,image_alt:'x'.repeat(1048576)}})
 assert.equal(r.status,413)
})
