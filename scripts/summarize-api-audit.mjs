import fs from 'node:fs/promises'
const dir='docs/api-audit'
const report=JSON.parse(await fs.readFile(`${dir}/report.json`,'utf8'))
const screens=JSON.parse(await fs.readFile(`${dir}/screens.json`,'utf8'))
let scan={};try{scan=JSON.parse(await fs.readFile(`${dir}/browser-scan.json`,'utf8'))}catch{}
const notes=[
 [[3],'Frontend source confirms Send Reset Link only sets local sent=true and displays an email-sent message. It makes no API call.'],
 [[13],'Welcome uses local content and does not call a learning-path API.'],
 [[14,17],'Home and Learn Hub keep static subject choices, including subjects absent from the live catalog. XP/streak are API-backed, but displayed journey/activity counts use local state.'],
 [[18,19,20],'Journey reads selected subject from local progress, ignoring the URL subject query. Select the subject in the UI to verify Literacy/EVS. It combines API worlds with remaining local stations instead of showing only returned worlds.'],
 [[21,22,23,24,25],'Topic hides loadLearningPath errors and renders a bundled ready-to-start mission when API path resolution fails. A visible topic screen is not proof of available live content.'],
 [[46],'Extra Learning screen uses local app state and does not consume the live result.extra_learning recommendations.'],
 [[49],'Challenge Home uses local cards and mission content; imported challenges API is not called on mount.'],
 [[59],'Switch Student uses cached family data from login and a local ParentGate; it does not refresh /parent/students on entry.'],
 [[15,16,54,57,58,61,62],'Current frontend provides local settings/chat/gates, placeholders or local progress views for these features; no matching live feature API integration is established.'],
 [[60],'Parent Overview uses live total XP and streak; journey-stop and quiz totals still come from local state.'],
]
for(const [ids,text] of notes)if(!report.findings.some(f=>f.text===text))report.findings.push({screens:ids,text})
await fs.writeFile(`${dir}/report.json`,JSON.stringify(report,null,2))
const status=s=>{
 if(s.id===1)return'No API required'
 const rs=report.requests.filter(r=>r.screens.includes(s.id)),fs=report.findings.filter(f=>f.screens.includes(s.id))
 if(!rs.length)return'Blocked / no dependent request'
 if(rs.some(r=>!r.ok&&!r.expected))return rs.some(r=>r.ok)?'Mixed responses':'Failed'
 if(fs.length||s.documentStatus==='Partial')return'Partial / data or UI gap'
 return'API responded; not full UI certification'
}
const esc=v=>String(v).replaceAll('|','/').replaceAll('\n',' ')
const counts={};for(const s of screens)counts[status(s)]=(counts[status(s)]||0)+1
const lines=[
 '# Kidsverse+ live API and frontend audit',
 '',`Date: ${report.finished}. Base: ${report.base}`,'',
 '## Result','',
 '**The 62 screens are not all covered by working, integrated live APIs.**',
 '',`${report.requests.length} captured HTTP requests: ${report.requests.filter(r=>r.ok).length} successful 2xx, ${report.requests.filter(r=>!r.ok).length} non-2xx/network failures. ${report.requests.filter(r=>r.expected).length} failures are expected setup/auth checks. Repeated calls and retries count separately; these are not unique endpoint or screen counts.`,
 '',`${Object.keys(scan).length}/62 route observations saved. A route observation is a rendered screen and its captured network traffic, not an assertion that all buttons, modal states, validation cases or media recording work. Original PDF screenshots are references, not test evidence.`,
 '', '## Highest priority findings','',
 '1. Correct-answer test: answer accepted (is_correct=true), completion succeeds, then GET /tests/attempts/{id}/result returns HTML 500. Reproduced twice for the same owned audit attempt. Wrong-answer attempt result returned 200.',
 '2. Deployed Maths mission has only interactive_lesson/steps strings; no documented learn_before_test or CFU. The current lesson adapter rejects it.',
 '3. Literacy has an empty mission list; Computer has no topics; EVS and General Awareness are absent from the live subject catalog. journey?subject=evs incorrectly returns Computer.',
 '4. Frontend test renders an Addition title and 3 + 4 illustration for a fractions question. Topic/Journey still retain local fallback content.',
 '5. Proposed password reset, OTP, settings, Nova messages, reviews, leaderboard, break passes, PIN, parent evidence and plan URLs return 404.',
 '6. New content routes (curriculum tree, curriculums, themes, package listing, and empty-body feed probe) return 404 on this deployment. No authored content was uploaded.',
 '7. Forgot Password displays email-sent confirmation without making a request (confirmed by source inspection).',
 '', '## Scope and safety of test data','',
 'Created one synthetic parent at an example.com address and one API Audit Child (CBSE Grade 4). Exercised account onboarding, catalog saves, mission start/completion with score 0, test answers/completion, battle start/completion with score 0, companion completion, and profile/parent reads. No real user accounts were reset or deleted. No SMS/reset email was requested; those routes received empty validation-only bodies. Live API awarded XP even for zero-score synthetic completions. Credentials are kept outside the repository in the Windows temp directory and are redacted from reports.',
 '', '## All 62 original PDF entries','',
 '| Screen | Name | Live conclusion | HTTP evidence | Browser observation |',
 '|---|---|---|---|---|',
 ...screens.map(s=>{const rs=report.requests.filter(r=>r.screens.includes(s.id));return `| ${String(s.id).padStart(2,'0')} | ${s.name} | ${status(s)} | ${rs.length?rs.map(r=>`#${r.id} ${r.method} ${r.status}${r.expected?' (expected)':''}`).join('; '):'No real dependent ID/response available'} | ${scan[s.id]?(scan[s.id].timeout?'Timed out':`${scan[s.id].requests?.length||0} calls captured; see JSON`):'Not captured'} |`}),
 '', '## Details by screen','',
 ...screens.flatMap(s=>[`### ${String(s.id).padStart(2,'0')} - ${s.name}`,'',`Route: ${s.route}. ${s.viewNote}`,'',...report.findings.filter(f=>f.screens.includes(s.id)).map(f=>`- ${f.text}`),'',...report.requests.filter(r=>r.screens.includes(s.id)).map(r=>`- Request #${r.id}: ${r.method} ${r.path} -> ${r.status}, ${r.ms} ms. ${r.note||''}`),'']),
 '## Supplemental content routes','',...report.requests.filter(r=>!r.screens.length).map(r=>`- ${r.method} ${r.path}: ${r.status}. ${r.note}`),
 '', '## Files and viewer','',
 '- Local viewer: http://127.0.0.1:5180/api-audit',
 '- report.json: sanitized request and response bodies, timestamps, status codes and findings.',
 '- browser-scan.json: latest per-entry rendered text and browser traffic.',
 '- browser-interactions.json: saved login and actual test interaction before route scan.',
 '- screens/: all 62 embedded screenshots from the original PDF, clearly labeled as references in the viewer.',
 '', '## Remaining prerequisites','',
 '- Backend release exposing the content APIs and proposed missing features, or a revised API contract.',
 '- Populated authored content for the required subjects, with valid learning steps and questions.',
 '- Backend fix for successful test result 500, subject fallback and confirmed scoring/roll-up rules.',
 '- Frontend fixes for local fallback presentation, reset confirmation and live data alignment.',
 '- Test OTP recipient/provider and content-admin contract for the flows that cannot be validly exercised with current configuration.',
 '', 'No deployed changes or Git pushes were made. Existing integration tests and production build were checked separately; passing them does not certify the live backend.'
]
await fs.writeFile(`${dir}/summary.md`,lines.join('\n'))
console.log(JSON.stringify({screens:62,observed:Object.keys(scan).length,classification:counts}))
