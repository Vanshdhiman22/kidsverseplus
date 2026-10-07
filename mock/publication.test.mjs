import test from 'node:test'
import assert from 'node:assert/strict'
import {createMockApi} from './api.mjs'
import {createContentRepository} from './content-repository.mjs'
import {seedWorlds} from './content-seed.mjs'
const payload=()=>({...structuredClone(seedWorlds[0].pkg.studio),content_type:'concept_package',curriculum:{...seedWorlds[0].pkg.studio.curriculum,grade:'Grade 4'}})
test('draft, optimistic update, publish, unpublish and archive preserve versions and in-flight attempts',async()=>{
 const repo=createContentRepository(),api=createMockApi({contentRepository:repo,contentAdminKey:'admin'}),ctx={contentAdminKey:'admin'}
 try{
  const auth=(await api('POST','/demo/login')).data,token=auth.token,sid=auth.students[0].id,body=payload();body.concept.name='Draft lesson'
  const draft=await api('POST','/admin/content/drafts',body,token,ctx);assert.equal(draft.status,201)
  const id=draft.data.data.package_id,mission=draft.data.data.mission_id,root=`/admin/content/packages/${id}`
  assert.equal((await api('GET',`/missions/${mission}`)).status,404)
  assert.equal((await api('POST',root+'/publish',{expected_version:2},token,ctx)).status,409)
  assert.equal((await api('POST',root+'/publish',{expected_version:1},token,ctx)).status,200)
  assert.equal((await api('GET',`/missions/${mission}`)).data.content_version,1)
  const attempt=(await api('POST',`/students/${sid}/missions/${mission}/attempts`,{},token)).data
  body.learning_content.explanation='New authored draft explanation'
  assert.equal((await api('PUT',root,{expected_version:1,content:body},token,ctx)).status,200)
  assert.notEqual((await api('GET',`/missions/${mission}`)).data.content.explanation,body.learning_content.explanation)
  assert.equal((await api('PUT',root,{expected_version:1,content:body},token,ctx)).status,409)
  const wrong=structuredClone(body);wrong.concept.name='Identity change'
  assert.equal((await api('PUT',root,{expected_version:2,content:wrong},token,ctx)).status,409)
  assert.equal((await api('POST',root+'/publish',{expected_version:2},token,ctx)).status,200)
  assert.equal((await api('GET',`/missions/${mission}`)).data.content.explanation,body.learning_content.explanation)
  assert.equal((await api('GET',root+'?version=1',{},token,ctx)).data.content_version,1)
  assert.equal((await api('POST',root+'/unpublish',{expected_version:2},token,ctx)).status,200)
  assert.equal((await api('GET',`/missions/${mission}`)).status,404)
  assert.equal((await api('POST',`/missions/attempts/${attempt.attempt_id}/complete`,{},token)).status,200)
  assert.equal((await api('DELETE',root,{},token,ctx)).data.archived,true)
  assert.equal((await api('POST',root+'/publish',{expected_version:2},token,ctx)).status,409)
  assert.equal((await api('GET',`/missions/attempts/${attempt.attempt_id}/review`,{},token)).data.content_version,1)
 }finally{api.close()}
})
test('senior catalogue creation routes enforce admin auth, uniqueness and referenced-entry deletion',async()=>{
 const repo=createContentRepository(),api=createMockApi({contentRepository:repo,contentAdminKey:'admin'}),ctx={contentAdminKey:'admin'}
 const call=(m,p,b={})=>api(m,p,b,undefined,ctx)
 try{
  const body={board:'ICSE',grade:'Grade 5',name:'ICSE - Grade 5',description:'Grade five curriculum'}
  assert.equal((await api('POST','/curriculums',body)).status,403)
  const curriculum=(await call('POST','/curriculums',body)).data
  assert.equal((await call('POST','/curriculums',body)).status,409)
  const subject=(await call('POST',`/curriculums/${curriculum.id}/subjects`,{name:'Science'})).data
  const topic=(await call('POST',`/subjects/${subject.id}/topics`,{name:'Plants'})).data
  const concept=(await call('POST',`/topics/${topic.id}/concepts`,{name:'Roots',learning_objective:'Identify roots'})).data
  assert.equal((await api('GET',`/curriculums/${curriculum.id}`)).data.subjects[0].topics[0].concepts[0].id,concept.id)
  assert.equal((await call('DELETE',`/curriculums/${curriculum.id}`)).status,409)
  assert.equal((await call('PATCH',`/concepts/${concept.id}`,{learning_objective:'Describe roots'})).data.learning_objective,'Describe roots')
  for(const [table,id]of [['concepts',concept.id],['topics',topic.id],['subjects',subject.id],['curriculums',curriculum.id]])assert.equal((await call('DELETE',`/${table}/${id}`)).status,204)
  const theme=(await call('POST','/themes',{name:'Robots',description:'Friendly robots',icon_asset:'/art/robot.svg'})).data
  assert.equal((await call('PATCH',`/themes/${theme.id}`,{description:'Updated'})).data.description,'Updated')
  assert.equal((await call('DELETE',`/themes/${theme.id}`)).status,204)
  const next=payload();next.curriculum.grade='Grade 5';next.concept.name='Grade five content';repo.feed(next)
  assert.equal((await api('POST','/demo/login')).status,200)
 }finally{api.close()}
})
