import test from 'node:test'
import assert from 'node:assert/strict'
import {createMockApi} from './api.mjs'
import {checkApiResponse} from './api-contracts.mjs'
import {MOCK_DEMO_CREDENTIALS as credentials} from '../src/data/mock-demo.js'

test('test credentials log in with the full 62-screen bootstrap and independent families',async()=>{
  const api=createMockApi()
  try {
    const first=await api('POST','/auth/parent/login',{...credentials,email:'DEMO@KIDSVERSE.LOCAL'})
    assert.equal(first.status,200)
    assert.equal(checkApiResponse('POST','/auth/parent/login',first).valid,true)
    assert.equal(first.data.bootstrap.screens.length,62)
    const second=await api('POST','/auth/parent/login',credentials)
    assert.equal(second.status,200)
    assert.notEqual(second.data.token,first.data.token)
    const sid=first.data.students[0].id
    assert.equal((await api('GET',`/students/${sid}/home`,{},first.data.token)).data.stats.total_xp,320)
    assert.equal((await api('GET',`/students/${sid}/home`,{},second.data.token)).status,403)
    await api('POST','/auth/parent/logout',{},first.data.token)
    assert.equal((await api('GET','/parent/me',{},first.data.token)).status,401)
    assert.equal((await api('GET','/parent/me',{},second.data.token)).status,200)
  } finally {api.close()}
})

test('mock demo login validates passwords, reserves its sample email, and leaves ordinary accounts intact',async()=>{
  const api=createMockApi()
  try {
    assert.equal((await api('POST','/auth/parent/login',{...credentials,password:'wrong-password'})).status,401)
    assert.equal((await api('POST','/auth/parent/signup',credentials)).status,409)
    const registered={email:'registered@example.test',password:'mock-password'}
    const signup=await api('POST','/auth/parent/signup',registered)
    assert.equal(signup.status,201)
    const login=await api('POST','/auth/parent/login',registered)
    assert.equal(login.status,200)
    assert.equal(login.data.parent.id,signup.data.parent.id)
    assert.equal(login.data.bootstrap,undefined)
    assert.equal((await api('POST','/auth/parent/login',{...registered,password:'wrong-password'})).status,401)
  } finally {api.close()}
})

test('sample credential sessions expire normally',async()=>{
  let clock=0
  const api=createMockApi({clock:()=>clock,sessionTtlMs:1000})
  try {
    const login=await api('POST','/auth/parent/login',credentials)
    clock=1001
    assert.equal((await api('GET','/parent/me',{},login.data.token)).status,401)
  } finally {api.close()}
})
