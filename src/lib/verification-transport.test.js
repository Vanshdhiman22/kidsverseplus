import test from 'node:test'
import assert from 'node:assert/strict'
import {verificationRequest} from './verification-transport.js'
const storage=()=>{const data=new Map();return {getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)}}
test('verification calls serialize the opaque state and reset it for a fresh demo',async()=>{
  const saved=storage(),seen=[]
  const fetcher=async(url,options)=>{
    const body=JSON.parse(options.body);seen.push(body)
    return {ok:true,json:async()=>({status:200,data:{order:seen.length},verification_state:`state-${seen.length}`})}
  }
  const base={baseUrl:'/api/v1',storage:saved,fetcher,token:'mock-token'}
  const result=await Promise.all([verificationRequest({...base,method:'GET',path:'/parent/me'}),verificationRequest({...base,method:'POST',path:'/students',body:{name:'Child'}})])
  assert.equal(result[1].data.order,2)
  assert.equal(seen[1].verification_state,'state-1')
  await verificationRequest({...base,method:'POST',path:'/demo/login'})
  assert.equal(seen[2].verification_state,undefined)
})
test('verification transport failure cannot poison subsequent requests and operation errors remain truthful',async()=>{
  const saved=storage(),base={baseUrl:'/api/v1',storage:saved,method:'GET',path:'/parent/me'}
  await assert.rejects(verificationRequest({...base,fetcher:async()=>{throw Error('Offline')}}),/Offline/)
  const response=await verificationRequest({...base,fetcher:async()=>({ok:true,json:async()=>({status:401,data:{error:{message:'Sign in first'}}})})})
  assert.equal(response.ok,false);assert.equal(response.status,401)
  assert.equal(response.data.error.message,'Sign in first')
})
