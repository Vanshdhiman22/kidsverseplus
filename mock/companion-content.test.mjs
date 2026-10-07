import test from 'node:test'
import assert from 'node:assert/strict'
import {DatabaseSync} from 'node:sqlite'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {createContentRepository} from './content-repository.mjs'
import {createMockApi} from './api.mjs'

test('companion API reads persisted DB content, retains edits on restart and saves completion once',async()=>{
  const directory=mkdtempSync(join(tmpdir(),'kv-companion-')),filename=join(directory,'content.sqlite')
  let api
  try{
    const repo=createContentRepository({filename});api=createMockApi({contentRepository:repo})
    const {data:auth}=await api('POST','/demo/login',{}),id=auth.students[0].id
    const db=new DatabaseSync(filename),row=repo.companionActivities().find(a=>a.type==='reading')
    db.prepare('UPDATE companion_contents SET content=? WHERE id=?').run(JSON.stringify({...row,passage:'A new DB-authored passage.'}),row.id);db.close()
    const path=`/students/${id}/companion-activities`
    assert.equal((await api('GET',path,{},auth.token)).data.activities.find(a=>a.id===row.id).passage,'A new DB-authored passage.')
    const completed=await api('POST',`${path}/${row.id}/complete`,{},auth.token)
    assert.deepEqual(await api('POST',`${path}/${row.id}/complete`,{},auth.token),completed)
    api.close();api=createMockApi({contentRepository:createContentRepository({filename})})
    const activities=(await api('GET',path,{},auth.token)).data.activities
    assert.equal(activities.find(a=>a.id===row.id).passage,'A new DB-authored passage.')
    assert.deepEqual(activities.find(a=>a.id===row.id).completion,completed.data)
  }finally{api?.close();rmSync(directory,{recursive:true,force:true})}
})
