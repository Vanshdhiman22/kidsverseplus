// Result screens in the walkthrough are prepared by the real mock HTTP API.
// Select the first delivered option; the server alone determines correctness/XP.
export async function prepareMockResult({kind,studentId,world,request}) {
  let attempt,root
  if(kind==='cfu'){
    attempt=await request(`/students/${studentId}/missions/${world.missionId}/attempts`,{method:'POST',body:{}})
    root=`/missions/attempts/${attempt.attempt_id}`
  }else if(kind==='test'){
    attempt=await request(`/students/${studentId}/tests/${world.testId}/attempts`,{method:'POST',body:{}})
    root=`/tests/attempts/${attempt.attempt_id}`
  }else if(kind==='battle'){
    const {opponents}=await request(`/challenges/${world.challengeId}/opponents`)
    if(!opponents?.length)throw Error('No mock opponent is available')
    attempt=await request(`/students/${studentId}/challenge-battles`,{method:'POST',body:{challenge_id:world.challengeId,opponent_id:opponents[0].id}})
    root=`/challenge-battles/${attempt.battle_id}`
  }else throw Error('Unsupported result kind')
  if(!Number.isInteger(attempt.total_questions)||attempt.total_questions<1)throw Error('No questions returned by the mock backend')
  for(let order=1;order<=attempt.total_questions;order++){
    const q=await request(`${root}/questions/${order}`)
    if(!q.id||!q.options?.[0]?.key)throw Error('Invalid delivered mock question')
    await request(`${root}/answers`,{method:'POST',body:{question_id:q.id,selected_answer:q.options[0].key}})
  }
  await request(`${root}/complete`,{method:'POST',body:{}})
  const result=await request(`${root}/result`)
  if(kind==='battle')return {...result,battleId:attempt.battle_id,local:false}
  return {attemptId:attempt.attempt_id,studentId,subject:world.slug,source:kind==='cfu'?'cfu':'test',correct:result.correct_count,score:result.correct_count,gradeScore:result.score,total:result.total_questions,xpAwarded:result.xp_awarded,extraLearning:result.extra_learning,completedAt:result.completed_at,seconds:0,apiSaved:true,local:false}
}

export function nextMockScreen(screens, route) {
  const url=new URL(route,'http://mock.local'), id=Number(url.searchParams.get('mockScreen'))
  let current=screens.find(s=>s.id===id)
  if(!current) {
    const path=url.pathname==='/mock/parent-pin'?'/parent':url.pathname
    const candidates=screens.filter(s=>new URL(s.route,url.origin).pathname===path)
    current=candidates.find(s=>![7,15,16,39,43,45,58].includes(s.id) && ['subject','auditStep','auditWay'].every(key=>{
      const expected=new URL(s.route,url.origin).searchParams.get(key)
      return !url.searchParams.has(key)||expected===url.searchParams.get(key)
    })) || candidates[0]
  }
  if(!current)return null
  const index=screens.indexOf(current)
  return screens[(index+1)%screens.length]
}

// Shared by the full-screen skip control and the 62-screen viewer. Results
// are completed by HTTP; no browser-generated score or success is inserted.
export async function prepareMockScreen({screen,studentId,snapshot,storage,request,startTest,startBattle,refreshStats}) {
  if(screen.id===7){
    const key=`kv:mock-otp:${studentId}`
    if(!storage.getItem(key)){
      const otp=await request('/parent/verification/start',{method:'POST',body:{student_id:studentId,full_name:'Demo Parent',relationship:'parent',phone:'+919999999999'}})
      storage.setItem(key,otp.challenge_id)
    }
  }
  if([42,43].includes(screen.id)){await startTest(studentId,'maths');storage.removeItem('kv:test-progress')}
  if(screen.id===52)await startBattle(studentId,0)
  if([38,39,44,45,53].includes(screen.id)){
    const kind=[38,39].includes(screen.id)?'cfu':screen.id===53?'battle':'test'
    const key=kind==='cfu'?'kv:last-mission-score':kind==='battle'?'kv:last-battle-result':'kv:last-test-run'
    let existing;try{existing=JSON.parse(storage.getItem(key)||'null')}catch{}
    if(!existing||existing.local||existing.studentId!==studentId){
      const result=await prepareMockResult({kind,studentId,world:snapshot.demo.worlds.find(w=>w.slug==='maths'),request})
      storage.setItem(key,JSON.stringify({...result,studentId}));await refreshStats()
    }
  }
  const url=new URL(screen.id===58?'/mock/parent-pin':screen.route,'http://mock.local')
  url.searchParams.set('mockScreen',screen.id)
  return url.pathname+url.search
}
