import {worlds} from './gameplay.mjs'
import {reject} from './contracts.mjs'
import companionSeed from '../src/content/companion-fixtures.json' with {type:'json'}

export function createDemoFeatures({clock=Date.now,contentRepository,evidence=()=>[]}={}) {
  return function demoFeature(method,pathname,body,parent,students) {
    const available=contentRepository?.worlds()||worlds
    const url=new URL(pathname,'http://mock.local'),path=url.pathname
    const now=()=>new Date(clock()).toISOString(),ok=data=>({status:200,data})
    const owned=[...students.values()].filter(s=>s.parent_id===parent.id)
    if(method==='GET'&&path==='/parent/evidence')return ok({students:owned.map(s=>({student_id:s.id,evidence:evidence(s.id)}))})
    if(method==='GET'&&path==='/parent/plan')return ok({source:'mock_suggestion',days:owned.flatMap(s=>{const pool=available.filter(w=>String(w.grade).replace(/^Grade\s+/i,'')===String(s.grade).replace(/^Grade\s+/i,'')&&w.board===s.board);return ['Monday','Tuesday','Wednesday','Thursday','Friday'].flatMap((day,i)=>pool[i]?[{student_id:s.id,day,subject:pool[i].name,subject_slug:pool[i].slug,title:pool[i].pkg.mission.title,duration_minutes:10,mission_id:pool[i].missionId,reason:s.lastTest?.mission_id===pool[i].missionId&&s.lastTest.score<80?'Review after the latest assessment':'Practice published curriculum'}]:[])})})
    const m=path.match(/^\/students\/([^/]+)\/(.+)$/)
    if(!m)return null
    const s=students.get(m[1]);if(!s)reject(404,'Student not found')
    if(s.parent_id!==parent.id)reject(403,'Authenticated parent does not own this student')
    const action=m[2]
    s.settings??={sound:true,music:true,voice:true,motion:true,readAloud:true,theme:'light',lang:'en',screenFit:'auto',zoom:1}
    s.breakPasses??={available:5,used_dates:[]}
    s.messages??=[{role:'assistant',text:`Hi ${s.name}! Ready for a learning adventure?`}]
    if(action==='settings') {
      if(method==='GET')return ok(s.settings)
      if(method==='PATCH'){Object.assign(s.settings,body);return ok(s.settings)}
    }
    if(action==='break-passes') {
      if(method==='GET')return ok(s.breakPasses)
      if(method==='POST') {
        const day=now().slice(0,10)
        if(body.date&&body.date!==day)reject(400,'Break passes can only be used for the current UTC date.')
        if(!s.breakPasses.used_dates.includes(day)) {
          if(s.breakPasses.available<=0)reject(409,'No break passes remaining')
          s.breakPasses.available--;s.breakPasses.used_dates.push(day)
        }
        return ok(s.breakPasses)
      }
    }
    if(action==='nova/messages') {
      if(method==='GET')return ok({messages:s.messages})
      if(method==='POST') {
        const world=available.find(w=>(!s.grade||String(w.grade).replace(/^Grade\s+/i,'')===String(s.grade))&&(!s.board||w.board===s.board)&&(!body.mission_id||w.missionId===body.mission_id))
        if(body.mission_id&&!world)reject(404,'Published mission not available for this student')
        const reply={role:'assistant',text:world?.pkg.studio.learning_content.nova_script||'Tell me which lesson you are practising.',source:'scripted_mock'}
        s.messages.push({role:'user',text:body.message},reply);s.messages=s.messages.slice(-50)
        return ok(reply)
      }
    }
    if(method==='GET'&&action==='companion-activities')return ok({activities:(contentRepository?.companionActivities()||companionSeed).map(a=>({...a,completion:s.companions?.[a.id]||null}))})
    if(method==='GET'&&action==='extra-learning')return ok({recommendations:s.lastTest&&s.lastTest.score<80?[{mission_id:s.lastTest.mission_id,name:s.lastTest.title,reason:'Review after your latest test.'}]:[]})
    const review=action.match(/^missions\/([^/]+)\/review$/)
    if(method==='GET'&&review){const w=available.find(w=>w.missionId===review[1]);if(!w)reject(404,'Mission not found');return ok({review:w.pkg.studio.check_for_understanding.map(q=>({question:q.question,answer:q.answer,explanation:q.explanation})),source:'authored_content_review',content_version:w.contentVersion})}
    const companion=action.match(/^companion-activities\/([^/]+)\/complete$/)
    if(method==='POST'&&companion){if(!(contentRepository?.companionActivities()||companionSeed).some(a=>a.id===companion[1]))reject(404,'Companion activity not found');s.companions??={};s.companions[companion[1]]??={completed_at:now()};return ok(s.companions[companion[1]])}
    return null
  }
}
