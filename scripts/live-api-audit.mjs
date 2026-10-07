import fs from 'node:fs/promises'
import crypto from 'node:crypto'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('../', import.meta.url))
const dir = `${root}/docs/api-audit`
await fs.mkdir(dir, { recursive: true })
const base = 'https://kidsverse-apinew.vercel.app/api/v1'
const redact = x => Array.isArray(x) ? x.map(redact) : x && typeof x === 'object' ? Object.fromEntries(Object.entries(x).map(([k,v]) => [k, /password|token|authorization|^code$|otp|dev_code/i.test(k) ? '[redacted]' : redact(v)])) : x
let account
const credentialsPath=path.join(os.tmpdir(),'kidsverse-api-audit-credentials.private.json')
try { account = JSON.parse(await fs.readFile(credentialsPath, 'utf8')) } catch { account = { email: `kv-audit-${Date.now()}@example.com`, password: `KvAudit!${crypto.randomBytes(16).toString('hex')}`, full_name: 'Kidsverse API Audit' }; await fs.writeFile(credentialsPath, JSON.stringify(account)) }
let token = '', sid = ''
const report = { base, started: new Date().toISOString(), scope: 'Live HTTP integration audit using one synthetic parent and child. Successful requests do not certify full screen behavior.', requests: [], findings: [], complete: false }
async function save() { await fs.writeFile(`${dir}/report.json`, JSON.stringify(report, null, 2)) }
async function call(screens, method, path, body, note = '', auth = token) {
  const entry = { id: report.requests.length + 1, screens, method, path, request: redact(body) ?? null, note, at: new Date().toISOString() }
  report.requests.push(entry)
  const start = Date.now()
  let data
  try {
    const res = await fetch(base + path, { method, headers: { Accept: 'application/json', ...(auth ? { Authorization: `Bearer ${auth}` } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(20000) })
    const raw = await res.text()
    try { data = JSON.parse(raw) } catch { data = raw }
    Object.assign(entry, { status: res.status, contentType: res.headers.get('content-type'), response: redact(data), ok: res.ok, cors: res.headers.get('access-control-allow-origin') })
    if (!res.ok) data = null
  } catch (e) { Object.assign(entry, { status: 'network error', ok: false, response: null, error: e.message }) }
  entry.ms = Date.now() - start
  await save()
  console.log(`${entry.id} ${screens.join(',')} ${method} ${path} -> ${entry.status} (${entry.ms}ms)`)
  return data
}
const list = (v,k) => Array.isArray(v) ? v : v?.[k] || []
function finding(screens, text) { report.findings.push({ screens, text }) }
async function main() {
  let login = await call([2], 'POST', '/auth/parent/login', {email:account.email,password:account.password}, 'Synthetic audit account; first login may fail before signup.', '')
  if (!login?.token) throw new Error('Existing synthetic account login failed. Signup was not repeated.')
  else finding([4], 'Existing synthetic audit account reused; signup is not repeated on this run.')
  token = login?.token || ''
  if (token) {
    const logged = await call([2], 'POST', '/auth/parent/login', {email:account.email,password:account.password}, 'Valid credentials after signup.', '')
    token = logged?.token || token
    await call([2,60], 'GET', '/parent/me')
    const family = await call([59], 'GET', '/parent/students')
    sid = list(family,'students').find(s=>s.name==='API Audit Child')?.id
    if (!sid) sid = (await call([5], 'POST', '/students', {name:'API Audit Child'}))?.id
    else finding([5], 'Existing synthetic child reused; creation is not repeated.')
  }
  const catalogs = {}
  for (const [key,path,sc] of [['characters','/avatar/characters',9],['items','/avatar/items',9],['interests','/interests',10],['goals','/goals',11],['challenges','/challenges',49]]) catalogs[key] = list(await call([sc], 'GET', path),key)
  await call([3], 'POST', '/auth/parent/forgot-password', {}, 'Proposed route: validation-only probe with empty body; no reset email requested.')
  await call([6], 'POST', '/parent/verification/start', {}, 'Proposed route: validation-only probe; no SMS requested.')
  await call([7], 'POST', '/parent/verification/verify', {}, 'Proposed route: no real OTP/challenge available.')
  if (!sid) { finding(Array.from({length:58},(_,i)=>i+5), 'Authenticated student flow blocked: account or child creation failed.'); return }
  const sp = `/students/${sid}`
  report.studentId = sid
  await fs.writeFile(credentialsPath, JSON.stringify({...account,studentId:sid}))
  await call([8], 'PATCH', `${sp}/grade-board`, {grade:'Grade 4',board:'CBSE'})
  const char = catalogs.characters[0], outfit = catalogs.items.find(v=>v.category==='outfit')
  if(char&&outfit) await call([9],'PUT',`${sp}/avatar`,{character_id:char.id,outfit_item_id:outfit.id})
  if(catalogs.interests.length) await call([10],'PUT',`${sp}/interests`,{interest_ids:catalogs.interests.slice(0,3).map(v=>v.id)})
  if(catalogs.goals.length) await call([11],'PUT',`${sp}/goals`,{goal_ids:catalogs.goals.slice(0,2).map(v=>v.id)})
  await call([12],'POST',`${sp}/onboarding/steps/lobby/complete`,{})
  await call([12],'POST',`${sp}/nova/greet`,{})
  await call([12],'GET',`${sp}/onboarding/status`)
  await call([13,14],'GET',`${sp}/home`)
  const subjects = list(await call([17],'GET',`${sp}/subjects`),'subjects')
  const worlds = [ ['maths',['maths','mathematics','math'],18,21,[26,27,28,29,30,31,37]], ['literacy',['literacy','english'],19,22,[32,33,34,35,36]], ['evs',['evs','science'],20,23,[]], ['computer',['computer','computers','computer-science'],null,24,[]], ['general',['general','general-awareness','general_knowledge'],null,25,[]] ]
  const learning = []
  for (const [world,aliases,journeyScreen,topicScreen,lessonScreens] of worlds) {
    const sub = subjects.find(s=>aliases.includes(s.slug))
    if(journeyScreen) {
      const journey = await call([journeyScreen,...(world==='literacy'?[47,48]:[])],'GET',`${sp}/journey?subject=${world}`)
      if (journey?.subject && !aliases.includes(String(journey.subject).toLowerCase())) finding([journeyScreen], `Requested ${world}, but journey response identifies ${journey.subject}.`)
      for(const act of list(journey,'companion_activities')) {
        if(/read|fluency|speak|confidence/i.test(act.name||'')) await call([/read|fluency/i.test(act.name)?47:48],'POST',`${sp}/companion-activities/${act.id}/complete`,{},'Synthetic completion; audio/fluency assessment is not verified.')
      }
      if(sub && sub.slug!==world) await call([journeyScreen],'GET',`${sp}/journey?subject=${sub.slug}`,undefined,'Compare frontend alias with catalog slug.')
      if(!list(journey,'companion_activities').length && world==='literacy') finding([47,48],'No companion activities returned for literacy; reading/speaking content and completion could not be exercised.')
    }
    if(!sub) { finding([topicScreen,...lessonScreens],`No ${world} subject in the live student catalog. Cannot obtain real topic/mission IDs.`); continue }
    const topics = list(await call([topicScreen],'GET',`/subjects/${sub.id||sub.subject_id}/topics`),'topics')
    if(!topics.length) { finding([topicScreen,...lessonScreens],`The ${world} subject returned no topics.`); continue }
    const topic = topics.find(t=>t.status!=='locked') || topics[0]
    const detail = await call([topicScreen],'GET',`${sp}/topics/${topic.id}`)
    const node = detail?.nodes?.find(n=>n.status!=='locked') || detail?.nodes?.[0]
    if(!node) {finding(lessonScreens,`No mission nodes returned for ${world}.`);continue}
    const mission = await call(lessonScreens.length?lessonScreens:[topicScreen],'GET',`/missions/${node.mission_id}`)
    learning.push({world,topic,missionId:node.mission_id,mission})
    if(lessonScreens.length && !mission?.content?.learn_before_test?.steps?.length) finding(lessonScreens,'Live mission does not contain learn_before_test.steps; authored teaching steps are absent.')
    if(lessonScreens.length && !mission?.content?.check_for_understanding?.length) finding(world==='maths'?[37]:lessonScreens,'Live mission has no check_for_understanding questions.')
    if(['maths','literacy'].includes(world)) {
      const example = mission?.content?.learn_before_test?.steps?.find(s=>s.step_key==='example')
      if(!example?.explanation_ways?.length) finding(world==='maths'?[29,30]:[34,35], 'No authored explanation_ways array in the live example step; extra ways cannot be verified from API content.')
    }
  }
  const math = learning.find(l=>l.world==='maths')
  if(math) {
    await call([37],'POST',`${sp}/missions/${math.missionId}/start`,{})
    await call([38],'POST',`${sp}/missions/${math.missionId}/complete`,{score:0},'Synthetic zero-score completion exercises contract; not a child learning assessment.')
    await call([39],'GET',`${sp}/missions/${math.missionId}/review`,undefined,'Proposed review endpoint from original screen document.')
    const tests = list(await call([40,41],'GET',`/topics/${math.topic.id}/tests`),'tests')
    if(tests[0]) {
      const test = await call([41],'GET',`/tests/${tests[0].id}`)
      const attempt = await call([42],'POST',`${sp}/tests/${tests[0].id}/attempts`,{})
      if(attempt?.attempt_id) {
        const ap = `/tests/attempts/${attempt.attempt_id}`
        const total = Number(test?.questions_count??test?.question_count)
        if(!total) finding([42,44],'Test question count is absent/zero.')
        for(let n=1;n<=total && n<=100;n++) {
          const q = await call([42,43],'GET',`${ap}/questions/${n}`)
          if(!q?.id) break
          if(n===1 && !q.hint && !q.hints) finding([43],'Question response has no hint/hints field.')
          const option = q.options?.[0]
          const answer = typeof option==='object' ? (option.id??option.key??option.value??option.text??option.label) : option
          if(answer!==undefined) await call([42],'POST',`${ap}/answers`,{question_id:q.id,selected_answer:answer},'First option selected for repeatable test; correctness not assumed.')
        }
        await call([44],'POST',`${ap}/complete`,{})
        await call([44,46],'GET',`${ap}/result`)
        await call([45],'GET',`${ap}/review`,undefined,'Proposed review endpoint from original screen document.')
      }
    } else finding([40,41,42,43,44,45,46],'No test available for the live mathematics topic.')
  }
  const challenge = catalogs.challenges[0]
  if(challenge) {
    const opponents = list(await call([50],'GET',`/challenges/${challenge.id}/opponents`),'opponents')
    if(opponents[0]) {
      await call([51],'GET',`/challenges/${challenge.id}/preview?opponent_id=${opponents[0].id}`)
      const battle = await call([52],'POST',`${sp}/challenge-battles`,{challenge_id:challenge.id,opponent_id:opponents[0].id})
      if(!battle?.questions?.length) finding([52],'Battle start response does not deliver questions. No documented student battle-question endpoint exists in supplied PDFs.')
      if(battle?.battle_id) {
        await call([53],'POST',`/challenge-battles/${battle.battle_id}/complete`,{score:0},'Synthetic zero-score battle, no genuine gameplay asserted.')
        await call([53],'GET',`/challenge-battles/${battle.battle_id}/result`)
      }
    }
    await call([54],'GET',`/challenges/${challenge.id}/leaderboard?scope=global`,undefined,'Proposed route.')
  }
  for(const [sc,path] of [[13,`${sp}/learning-path`],[15,`${sp}/settings`],[16,`${sp}/nova/messages`],[46,`${sp}/extra-learning`],[57,`${sp}/break-passes`],[61,'/parent/evidence'],[62,'/parent/plan']]) await call([sc],'GET',path,undefined,'Proposed route from original 62-screen document; not in newer API contracts.')
  await call([15],'PATCH',`${sp}/settings`,{},'Proposed route; empty validation-only payload, no setting changes.')
  await call([16],'POST',`${sp}/nova/messages`,{},'Proposed route; empty validation-only payload, no chat sent.')
  await call([57],'POST',`${sp}/break-passes`,{},'Proposed route; empty validation-only payload, no pass consumed.')
  await call([58],'POST','/parent/pin/verify',{},'Proposed route; no real PIN submitted.')
  for(const [sc,path] of [[55,`${sp}/profile`],[56,`${sp}/profile/our-journey`],[56,`${sp}/profile/cards`],[59,'/parent/students'],[60,'/parent/overview'],[14,`${sp}/home`]]) await call([sc],'GET',path)
  for(const path of ['/curriculum/tree?grade=Grade+4&board=CBSE','/curriculums','/themes','/admin/content/packages']) await call([], 'GET',path,undefined,'Content reference document: discovery read only; content uploads are outside student screen flow.')
  await call([2],'POST','/auth/parent/logout',{},'Synthetic account session logout.')
  finding([1],'Landing has no required API.')
  finding([6,7],'OTP delivery/verification not fully tested: no test phone or OTP provider supplied; only empty-body route probes performed.')
  finding([47,48],'Audio recording, speech recognition and scoring are not validated by a generic activity-completion response.')
}
try { await main() } catch(e) { report.findings.push({screens:[],text:`Runner error: ${e.message}`}); console.error(e.message) }
report.complete = true
report.finished = new Date().toISOString()
report.counts = { requests:report.requests.length, success:report.requests.filter(r=>r.ok).length, failed:report.requests.filter(r=>!r.ok).length }
await save()
console.log(JSON.stringify(report.counts))
