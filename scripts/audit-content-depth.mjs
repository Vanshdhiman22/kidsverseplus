import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
const dir='docs/api-audit',report=JSON.parse(await fs.readFile(`${dir}/report.json`,'utf8'))
const creds=JSON.parse(await fs.readFile(path.join(os.tmpdir(),'kidsverse-api-audit-credentials.private.json'),'utf8'))
const login=await fetch(report.base+'/auth/parent/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:creds.email,password:creds.password}),signal:AbortSignal.timeout(20000)}).then(r=>r.json())
async function request(screens,method,url,body,note){
 const entry={id:report.requests.length+1,screens,method,path:url,request:body??null,note,at:new Date().toISOString()},start=Date.now()
 try{const res=await fetch(report.base+url,{method,headers:{Accept:'application/json',Authorization:`Bearer ${login.token}`,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000)});let data=await res.text();try{data=JSON.parse(data)}catch{};Object.assign(entry,{status:res.status,ok:res.ok,response:data})}catch(e){Object.assign(entry,{status:'network error',ok:false,error:e.message})}
 entry.ms=Date.now()-start;report.requests.push(entry);console.log(`${method} ${url} -> ${entry.status}`);return entry.response
}
const topic=report.requests.find(r=>r.screens.includes(21)&&r.response?.nodes)?.response
for(const node of topic?.nodes||[]){
 if(report.requests.some(r=>r.path===`/missions/${node.mission_id}`))continue
 const data=await request([26,27,28,29,30,31,37],'GET',`/missions/${node.mission_id}`,undefined,'Inspect other available mathematics missions, including locked metadata; no mission started.')
 if(!data?.content?.check_for_understanding?.length)report.findings.push({screens:[26,27,28,29,30,31,37],text:`Additional live mission "${data?.name||node.name}" also has no CFU questions. Response is captured.`})
}
const journey=report.requests.find(r=>r.path.includes('journey?subject=literacy'))?.response
const talk=journey?.companion_activities?.find(a=>/talk/i.test(a.name))
if(talk)await request([48],'POST',`/students/${creds.studentId}/companion-activities/${talk.id}/complete`,{},'Exercise the same Talk with Nova completion route used by speaking frontend; no audio recorded or scored.')
const more=[
 [[2,15],'Settings Sign out only navigates to Landing; source inspection shows no logout API call and no token/session clearing. Local browser reset is separate and does clear account data.'],
 [[47],'Reading passage is bundled in ReadingFluency.jsx; API only records completion.'],
 [[48],'Speaking screen is explicitly self-guided and has no voice scoring; completion uses the generic Talk with Nova activity.'],
 [[51],'Battle preview receives API opponent/rules, while card art and strengths are local.'],
]
for(const [screens,text]of more)report.findings.push({screens,text})
report.counts={requests:report.requests.length,success:report.requests.filter(r=>r.ok).length,failed:report.requests.filter(r=>!r.ok).length,expectedFailures:report.requests.filter(r=>r.expected).length}
report.finished=new Date().toISOString();await fs.writeFile(`${dir}/report.json`,JSON.stringify(report,null,2));console.log(report.counts)
