import test from 'node:test'
import assert from 'node:assert/strict'
import {createMockApi,catalogs} from '../../mock/api.mjs'
import {selectApiAvatar} from './avatar-selection.js'
import {verifyParentPin,parentProof} from './parent-pin.js'
import {reviewItems} from './review-items.js'
import {operationKey} from './api-comparison.js'
import {createSessionSnapshot,isDynamic} from './session-snapshot.js'

test('displayed default avatar and legacy live outfit map to real catalogue IDs',()=>{
  const selected=selectApiAvatar({face:null,outfit:'explorer'},catalogs.characters,catalogs.items)
  assert.equal(selected.character_id,catalogs.characters[0].id)
  assert.equal(selected.outfit_item_id,catalogs.items[0].id)
  assert.equal(selectApiAvatar({face:4,outfit:'explorer'},catalogs.characters,[{id:'legacy',slug:'explorers-jacket',category:'outfit'}]).outfit_item_id,'legacy')
  assert.throws(()=>selectApiAvatar({face:8},catalogs.characters,catalogs.items),/not available/)
})
test('PIN client requires server proof, scopes it to login and refuses expiry/cache bypass',async()=>{
  const mock=createMockApi(),auth=(await mock('POST','/demo/login',{})).data
  const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)}
  const calls=[]
  const request=async(path,{method='GET',body={}}={})=>{
    calls.push(path);const res=await mock(method,path,body,auth.token)
    if(res.status>=400)throw Error(res.data.detail)
    return res.data
  }
  await assert.rejects(verifyParentPin(request,storage,auth.token,'0000'),/Incorrect/)
  assert.equal(parentProof(storage,auth.token),null)
  const authorized=await verifyParentPin(request,storage,auth.token,'2468')
  assert.ok(parentProof(storage,auth.token))
  assert.equal(parentProof(storage,'another-login'),null)
  assert.equal(parentProof(storage,auth.token,Date.parse(authorized.expires_at)),null)
  assert.ok(calls.includes('/parent/pin/authorize'))
  const snapshot=createSessionSnapshot(storage);snapshot.seed(auth.bootstrap)
  for(const path of ['/parent/pin','/parent/overview','/parent/evidence','/parent/plan']){
    assert.equal(isDynamic(path),true);assert.equal(snapshot.request('GET',path,{},auth.token),null)
  }
})
test('review renders server choice labels, unanswered items, explanation and matching image',()=>{
  const items=reviewItems({items:[{question_text:'Count',options:[{key:'a',label:'One'},{key:'b',label:'Two'}],selected_answer:null,correct_answer:'b',is_correct:false,explanation:'Two objects',image_url:'/image.webp',image_alt:'Two'}]})
  assert.equal(items[0].answerLabel,'Two');assert.equal(items[0].selectedLabel,'No answer')
  assert.equal(items[0].explanation,'Two objects');assert.equal(items[0].model.image,'/image.webp')
})
test('companion response popup pairs a named DB activity with its documented operation',()=>{
  assert.equal(operationKey({method:'POST',path:'/students/00000000-0000-4000-8000-000000003000/companion-activities/read-together/complete'}),
    operationKey({method:'POST',path:'/students/00000000-0000-4000-8000-000000003000/companion-activities/read-together/complete',operation:'/students/{student_id}/companion-activities/{activity_id}/complete'}))
})
