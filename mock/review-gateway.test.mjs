import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {createReviewGateway} from './review-gateway.mjs'

test('review HTTP gateway rejects private routes, authenticates sessions and persists the same Home after restart',async()=>{
  const directory=mkdtempSync(join(tmpdir(),'kv-review-')),database=join(directory,'review.sqlite'),accessKey='a'.repeat(64)
  let gateway,base
  const open=async()=>{gateway=createReviewGateway({database,accessKey});await new Promise(resolve=>gateway.server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${gateway.server.address().port}/review/${accessKey}/api/v1`}
  try{
    await open()
    const wrong=await fetch(base.replace(accessKey,'b'.repeat(64))+'/health');assert.equal(wrong.status,404)
    for(const path of ['/admin/content/feed','/__mock/outbox','/__bootstrap'])assert.equal((await fetch(base+path)).status,404)
    const login=await fetch(base+'/demo/login',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})
    assert.equal(login.status,200);const data=await login.json(),student=data.students[0]
    assert.equal((await fetch(base+`/students/${student.id}/home`)).status,401)
    const headers={Authorization:`Bearer ${data.token}`},path=`/students/${student.id}/home`
    const home=await (await fetch(base+path,{headers})).json()
    assert.deepEqual(home,data.bootstrap.resources[path]);assert.equal(home.stats.total_xp,student.xp);assert.ok(home.greeting.includes(student.name))
    await gateway.close();await open()
    assert.deepEqual(await (await fetch(base+path,{headers})).json(),home)
  }finally{if(gateway?.server.listening)await gateway.close();rmSync(directory,{recursive:true,force:true})}
})
test('gateway rejects missing access config and limits demo creation without changing existing sessions',async()=>{
  assert.throws(()=>createReviewGateway(),/required/)
  const directory=mkdtempSync(join(tmpdir(),'kv-rate-')),accessKey='c'.repeat(64)
  const gateway=createReviewGateway({database:join(directory,'review.sqlite'),accessKey,limit:1})
  await new Promise(resolve=>gateway.server.listen(0,'127.0.0.1',resolve))
  const base=`http://127.0.0.1:${gateway.server.address().port}/review/${accessKey}/api/v1`
  try{assert.equal((await fetch(base+'/health')).status,200);const limited=await fetch(base+'/health');assert.equal(limited.status,429);assert.ok(limited.headers.get('retry-after'))}
  finally{await gateway.close();rmSync(directory,{recursive:true,force:true})}
})
