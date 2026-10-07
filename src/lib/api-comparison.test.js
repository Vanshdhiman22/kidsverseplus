import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {comparisonPayload, comparisonPairs, comparisonScreens, fetchLiveRead, operationKey} from './api-comparison.js'

const mock = JSON.parse(fs.readFileSync(new URL('../../docs/verification/all-62-mock-api-responses.json',import.meta.url)))
const live = JSON.parse(fs.readFileSync(new URL('../../docs/api-audit/report.json',import.meta.url)))

test('question captures pair their template with the actual order and keep separate question responses',()=>{
  const path='/challenge-battles/11111111-1111-4111-8111-000000001000/questions/2'
  const actual={method:'GET',path},saved={...actual,operation:'/challenge-battles/{battle_id}/questions/{order}'}
  assert.equal(operationKey(actual),operationKey(saved))
  assert.notEqual(operationKey(actual),operationKey({...actual,path:path.replace('/2','/1')}))
})
test('opponent query IDs pair live and mock previews while distinct filters remain separate',()=>{
  const mockEntry={method:'GET',path:'/challenges/11111111-1111-4111-8111-000000005000/preview?opponent_id=11111111-1111-4111-8111-000000006000'}
  const liveEntry={...mockEntry,path:'/challenges/d53e6f6f-a233-4fe2-bac8-a775ecafa438/preview?opponent_id=aacfeeae-45ba-4eb6-a176-ef0470bbac52'}
  assert.equal(operationKey(mockEntry),operationKey(liveEntry))
  assert.notEqual(operationKey({...mockEntry,path:mockEntry.path+'&scope=global'}),operationKey({...liveEntry,path:liveEntry.path+'&scope=friends'}))
  const pairs=comparisonPairs({required:[{...mockEntry,screens:[51]}],live:[{...liveEntry,screens:[51]}]},51)
  assert.equal(pairs.length,1);assert.ok(pairs[0].live&&pairs[0].required)
})
test('every reference screen is mapped, preserving Maths/Literacy and Challenge identity',()=>{
  for(const s of mock.screens) assert.ok(comparisonScreens(mock.screens,s.route+`${s.route.includes('?')?'&':'?'}mockScreen=${s.id}`).screens.some(m=>m.id===s.id),s.name)
  assert.ok(comparisonScreens(mock.screens,'/missions/fractions/learn?subject=literacy').screens.every(s=>s.route.includes('literacy')))
  assert.equal(comparisonScreens(mock.screens,'/mock/parent-pin?mockScreen=58').selected,58)
  assert.equal(comparisonScreens(mock.screens,'/missions/fractions/learn?mockScreen=26').selected,26)
})
test('Home pairs separate backend IDs and newest observed mock traffic without inventing live responses',()=>{
  const data=comparisonPayload(mock,live,'/home')
  const observed={method:'GET',path:'/students/00000000-0000-4000-8000-000000000001/home',source:'mock',response:{observed:true}}
  const pair=comparisonPairs(data,14,[observed]).find(p=>p.required?.response?.observed)
  assert.equal(comparisonPairs(data,14,[observed]).length,1)
  assert.equal(pair.live.status,200)
  assert.notEqual(pair.live.path,pair.required.path)
  const settings=comparisonPairs(data,15)
  assert.ok(settings.some(p=>p.required))
  assert.ok(comparisonPairs({...data,live:[]},15).every(p=>p.required && !p.live))
  assert.equal(JSON.stringify(data).includes('"token":"[redacted]"'),false) // Home has no authentication payload.
})
test('live refresh restricts writes and uses only explicit live token; errors and 204 remain truthful',async()=>{
  let count=0
  const fetcher=async(url,options)=>{count++;assert.ok(url.startsWith('https://kidsverse-apinew.vercel.app/api/v1/'));assert.equal(options.headers.Authorization,undefined);return {status:401,text:async()=>'{"detail":"Not authenticated"}'}}
  const result=await fetchLiveRead({method:'GET',path:'/parent/me'},{fetcher})
  assert.equal(result.status,401);assert.deepEqual(result.response,{detail:'Not authenticated'})
  await assert.rejects(fetchLiveRead({method:'POST',path:'/auth/parent/signup'},{fetcher}));assert.equal(count,1)
  await assert.rejects(fetchLiveRead({method:'GET',path:'//evil.invalid'},{fetcher}))
  const empty=await fetchLiveRead({method:'GET',path:'/parent/me'},{fetcher:async()=>({status:204})});assert.equal(empty.response,undefined)
  const failed=await fetchLiveRead({method:'GET',path:'/parent/me'},{fetcher:async()=>{throw Error('failed')}});assert.equal(failed.status,'No response');assert.equal(failed.response,undefined)
})
