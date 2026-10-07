import fs from 'node:fs'
import { worlds, opponents } from './gameplay.mjs'
export const demoScreens = JSON.parse(fs.readFileSync(new URL('../docs/api-audit/screens.json', import.meta.url), 'utf8'))
export async function buildBootstrap(handle, token, parent, students,worldsOverride=worlds) {
  const worlds=worldsOverride
  const resources = {}
  const read = async path => { const response = await handle('GET', path, {}, token); if(response.status>=300)throw new Error(`Bootstrap dependency failed: ${path} (${response.status})`);resources[path]=response.data }
  for (const path of ['/parent/me','/parent/pin','/parent/students','/parent/overview','/parent/evidence','/parent/plan','/interests','/goals','/avatar/characters','/avatar/items','/challenges','/curriculums','/themes']) await read(path)
  for (const s of students) {
    for(const suffix of ['home','subjects','profile','profile/cards','profile/our-journey','onboarding/status','settings','break-passes','nova/messages','extra-learning','companion-activities']) await read(`/students/${s.id}/${suffix}`)
    for(const w of worlds.filter(w=>String(w.grade).replace(/^Grade\s+/i,'')===String(s.grade).replace(/^Grade\s+/i,'')&&w.board===s.board)) {
      await read(`/students/${s.id}/journey?subject=${w.slug}`)
      await read(`/students/${s.id}/topics/${w.topicId}`)
      await read(`/students/${s.id}/missions/${w.missionId}/review`)
    }
  }
  for(const w of worlds) {
    for(const path of [`/subjects/${w.id}/topics`,`/missions/${w.missionId}`,`/topics/${w.topicId}/tests`,`/tests/${w.testId}`,...(w.challengeTestId?[`/tests/${w.challengeTestId}`]:[]),`/challenges/${w.challengeId}/opponents`,`/challenges/${w.challengeId}/leaderboard?scope=global`]) await read(path)
    for(const o of opponents) await read(`/challenges/${w.challengeId}/preview?opponent_id=${o.id}`)
    await read(`/challenges/${w.challengeId}/preview`)
  }
  // Settings, messages and break passes are initialized by the resource reads.
  // Capture the family after those reads so cached and HTTP family data agree.
  await read('/parent/students')
  return { version:2, source:'local-mock', session_id:token, created_at:new Date().toISOString(),expires_at:new Date(Date.now()+8*60*60*1000).toISOString(), parent, students, resources, screens:demoScreens,
    demo:{pin:'2468',otp:'123456',worlds:worlds.map(w=>({slug:w.slug,missionId:w.missionId,testId:w.testId,challengeId:w.challengeId})),
      progress:{quizzesDone:0,readingSessions:0,speakingSessions:0,worldDone:{},lastTest:null},
      // Presentation-only reviews must never disclose the current DB test bank.
      result:{attemptId:'mock-preview-test',correct:4,total:5,seconds:92,subject:'maths',source:'test',local:true,review:Array.from({length:5},(_,i)=>({question:`Sample review item ${i+1} (presentation only)`,selectedLabel:'Sample choice',answerLabel:'Sample answer',correct:i!==1,explanation:'Display fixture. Play an assessment to see your actual result.'}))}} }
}
