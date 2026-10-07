import test from 'node:test'
import assert from 'node:assert/strict'
import {verifyContract,redact} from './verify-contract.mjs'
import {schemas,operations,validatePackageShape} from './api-contracts.mjs'
import {seedWorlds} from './content-seed.mjs'
import {createMockApi} from './api.mjs'
test('report redacts credentials while retaining PIN status fields',()=>{
 assert.deepEqual(redact({has_pin:true,pin_verified:true,pin:'1234',current_pin:'2468',proof_token:'secret',children:[{has_pin:false,password:'secret'}]}),{has_pin:true,pin_verified:true,pin:'[redacted]',current_pin:'[redacted]',proof_token:'[redacted]',children:[{has_pin:false,password:'[redacted]'}]})
 assert.deepEqual(redact({code:'123456',error:{code:'FORBIDDEN'},paths:{'/auth/parent/reset-password':{post:{}}},properties:{password:{type:'string'}}}),{code:'[redacted]',error:{code:'FORBIDDEN'},paths:{'/auth/parent/reset-password':{post:{}}},properties:{password:{type:'string'}}})
})
test('every documented local operation and all 62 screen mappings pass actual HTTP request/response contracts',async()=>{
 const report=await verifyContract();assert.equal(report.verified_operations,operations.length);assert.equal(report.screens.length,62);assert.equal(report.restart_verified,true)
 assert.equal(new Set(operations.map(o=>o.method+' '+o.path)).size,operations.length)
 for(const op of operations){if(op.request)assert.ok(schemas[op.request]);if(op.response)assert.ok(schemas[op.response])}
 const speaking=report.screens.find(s=>s.id===48)
 assert.ok(speaking.capture_ids.some(id=>report.captures.find(c=>c.id===id).path.endsWith('/talk-nova/complete')))
})
test('query validation rejects ignored filters and duplicate parameters; metadata conflicts do not partially save',async()=>{
 const api=createMockApi({contentAdminKey:'admin'}),ctx={contentAdminKey:'admin'}
 try{
  const auth=(await api('POST','/demo/login')).data
  for(const path of ['/curriculums?unknown=ignored','/curriculums?board=CBSE&board=ICSE',`/students/${auth.students[0].id}/journey?subject=`,'/admin/content/packages/id?version=abc'])assert.equal((await api('GET',path,{},auth.token,ctx)).status,400)
  const first=(await api('POST','/themes',{name:'Atomic One',description:'original'},undefined,ctx)).data
  await api('POST','/themes',{name:'Atomic Two'},undefined,ctx)
  assert.equal((await api('PATCH',`/themes/${first.id}`,{name:'Atomic Two',description:'must not save'},undefined,ctx)).status,409)
  assert.equal((await api('GET','/themes')).data.themes.find(t=>t.id===first.id).description,'original')
 }finally{api.close()}
})
test('nested content types, unknown fields and additional explanation answers are validated',()=>{
 const valid={...structuredClone(seedWorlds[0].pkg.studio),content_type:'concept_package'}
 for(const mutate of [b=>{b.learning_content.hints=[12]},b=>{b.test_questions.one_time='true'},b=>{b.learn_before_test.steps[1].explanation_ways[0].unknown=true},b=>{b.concept.unknown=true},b=>{b.learning_content.image_url={url:'x'}}]){const body=structuredClone(valid);mutate(body);assert.throws(()=>validatePackageShape(body),/package schema/)}
})
