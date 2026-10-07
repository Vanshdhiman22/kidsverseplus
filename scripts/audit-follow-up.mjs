import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
const dir='docs/api-audit'
const report=JSON.parse(await fs.readFile(`${dir}/report.json`,'utf8'))
const scan=JSON.parse(await fs.readFile(`${dir}/browser-scan.json`,'utf8'))
await fs.writeFile(`${dir}/browser-interactions.json`,JSON.stringify(scan,null,2))
const all=Object.values(scan).flatMap(s=>s.requests||[])
const seen=new Set()
function screensFor(r){
 if(r.path.includes('/answers')||r.path.includes('/questions/')||r.path.endsWith('/attempts'))return[42,43]
 if(r.path.includes('/tests/attempts/')&&/complete|result/.test(r.path))return[44,45,46]
 if(r.path.startsWith('/tests/'))return[41]
 if(r.path.includes('/topics/')&&r.path.endsWith('/tests'))return[40,41]
 if(r.path.endsWith('/subjects'))return[17]
 if(r.path.includes('/subjects/'))return[21]
 if(r.path.startsWith('/missions/'))return[26,27,28,29,30,31,37]
 if(r.path.includes('/topics/'))return[21]
 if(r.path.includes('/login'))return[2]
 if(r.path==='/parent/students')return[59]
 if(r.path.includes('/home'))return[14]
 if(r.path.includes('avatar'))return[9]
 if(r.path==='/goals')return[11]
 if(r.path==='/interests')return[10]
 return[2]
}
for(const r of all.reverse()) {
 const key=`${r.at}:${r.method}:${r.path}`
 if(seen.has(key)||report.requests.some(x=>`${x.at}:${x.method}:${x.path}`===key))continue
 seen.add(key)
 report.requests.push({...r,id:report.requests.length+1,screens:screensFor(r),ok:Number(r.status)>=200&&Number(r.status)<300,note:'Observed actual frontend interaction in the local browser.',source:'live browser'})
}
const creds=JSON.parse(await fs.readFile(path.join(os.tmpdir(),'kidsverse-api-audit-credentials.private.json'),'utf8'))
const login=await fetch(report.base+'/auth/parent/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:creds.email,password:creds.password}),signal:AbortSignal.timeout(20000)}).then(r=>r.json())
const failed=all.find(r=>r.path.includes('/tests/attempts/')&&r.path.endsWith('/result')&&r.status===500)
const probes=[...failed?[[[44],'GET',failed.path,undefined,'Retry the browser-reproduced result failure with the same attempt.']]:[],[[],'POST','/admin/content/feed',{},'Validation-only availability probe for the content upload route; no content uploaded.'],[[14],'GET',`/students/${creds.studentId}/home`,undefined,'Unauthenticated own test-student request; expect 401 or 403.',false]]
for(const [screens,method,url,body,note,auth=true] of probes){
 const at=new Date().toISOString(),start=Date.now();let entry={id:report.requests.length+1,screens,method,path:url,request:body??null,note,at}
 try{
  const r=await fetch(report.base+url,{method,headers:{Accept:'application/json',...(auth?{Authorization:`Bearer ${login.token}`}:{ }),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000)})
  let response=await r.text();try{response=JSON.parse(response)}catch{}
  Object.assign(entry,{status:r.status,ok:r.ok,response,expected:!auth&&[401,403].includes(r.status)})
 }catch(e){Object.assign(entry,{status:'network error',ok:false,error:e.message})}
 entry.ms=Date.now()-start;report.requests.push(entry)
 console.log(`${method} ${url} -> ${entry.status}`)
}
report.requests[0].expected=true
const findings=[
 [[20],'EVS journey request returns HTTP 200 with subject "Computer" and empty worlds. Wrong subject fallback is a backend data/validation defect.'],
 [[22],'Literacy topic exists but nodes and tiers are empty, so the lesson cannot start.'],
 [[38,55,56,60],'Mission completion reports 25% topic progress, but subsequent profile/parent subject summaries remain 0%. Confirm roll-up rules. Synthetic score 0 still awarded 30 mission XP.'],
 [[41,42,43],'Frontend test question title shows Introduction to Addition while live API question is fractions; automatic visual displays 3 + 4 for the question "3/4 is the same as?". Actual browser screenshot captured.'],
 [[42],'Deployed answer contract uses option IDs: selected_answer "a" was correct; displayed text "6/8" was marked incorrect. Newer PDF string-option example differs from deployed object-option schema.'],
 [[44],'Correct-answer attempt completed but GET result returned HTML 500 in the frontend. Incorrect-answer result previously returned 200. This blocks finishing the successful test flow.'],
 [[45],'Browser review cannot load after result 500; persisted review endpoint independently returns 404.'],
 [[52],'Battle UI currently falls back to bundled questions because no battle-question API response is delivered; start/result 2xx does not verify server-backed gameplay.'],
 [[3,6,7,15,16,39,45,54,57,58,61,62],'Matching proposed feature route returned 404 on this deployment. This proves the tested URL is unavailable here; it does not establish whether unreleased backend code exists.'],
 [[], 'New content deployment endpoints /curriculum/tree, /curriculums, /themes, /admin/content/packages and /admin/content/feed returned 404. Valid content ingestion and package detail were not tested because discovery/route availability failed.'],
 [[47,48],'Generic activity completion was tested for Read Together; there is no documented passage/audio assessment payload. Talk with Nova is not equivalent to a scored speaking task.'],
]
for(const [screens,text] of findings) if(!report.findings.some(f=>f.text===text))report.findings.push({screens,text})
report.finished=new Date().toISOString()
report.counts={requests:report.requests.length,success:report.requests.filter(r=>r.ok).length,failed:report.requests.filter(r=>!r.ok).length,expectedFailures:report.requests.filter(r=>r.expected).length}
await fs.writeFile(`${dir}/report.json`,JSON.stringify(report,null,2))
console.log(report.counts)
