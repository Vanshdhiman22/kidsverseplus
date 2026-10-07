import { randomUUID } from 'node:crypto'
import {reject} from './contracts.mjs'
import {subjectKey} from '../src/lib/live-data.js'
import {buildAnswerReview,gradeAnswers} from './assessment-review.mjs'
import { selectAttemptQuestions } from './question-selection.mjs'

import {seedWorlds,opponents} from './content-seed.mjs'
export const worlds=seedWorlds
export {opponents}
const now = () => new Date().toISOString()
const requireValue = (value, message) => { if (!value) throw Object.assign(new Error(message), { status: 400 }); return value }
const missing = () => { throw Object.assign(new Error('Resource not found'), { status: 404 }) }

export function createGameplay(students,{clock=Date.now,contentRepository,randomIndex}={}) {
  const now=()=>new Date(clock()).toISOString()
  const award=(s,xp)=>{s.xp=(s.xp||0)+xp;const day=now().slice(0,10);if(s.lastActivityDay!==day){const yesterday=new Date(clock()-86400000).toISOString().slice(0,10);s.dayStreak=s.lastActivityDay===yesterday?(s.dayStreak||0)+1:1;s.lastActivityDay=day}}
  const missions = new Map(), attempts = new Map(), battles = new Map(),learningAttempts=new Map()
  const stats = s => ({ day_streak: s.dayStreak || 0, total_xp: s.xp || 0, level: 1 + Math.floor((s.xp || 0) / 1000) })
  const owner = (studentId, parent) => { const s = students.get(studentId); if (!s) missing();if(s.parent_id!==parent.id)reject(403,'Authenticated parent does not own this student'); return s }
  const subject = (w, s) => ({ id: w.id, subject_id: w.id, slug: w.slug, name: w.name, icon_asset: '', progress_percent: missions.get(`${s.id}:${w.missionId}`)?.status === 'completed' ? 100 : 0, locked: false, is_unlocked:true, topics_count:1, badge: null })
  const subjects=(pool,s)=>[...new Map(pool.map(w=>[w.id,w])).values()].map(w=>{const entries=pool.filter(v=>v.id===w.id);return {...subject(w,s),topics_count:new Set(entries.map(v=>v.topicId)).size,progress_percent:entries.reduce((n,v)=>n+subject(v,s).progress_percent,0)/entries.length}})
  const eligible=(pool,s)=>pool.filter(w=>(!s.grade||String(s.grade).replace(/^Grade\s+/i,'')===String(w.grade||'Grade 4').replace(/^Grade\s+/i,''))&&(!s.board||s.board===(w.board||'CBSE')))
  const test = (w,mode='test') => ({ id: mode==='challenge'?w.challengeTestId:w.testId, name: `${w.pkg.mission.title} ${mode==='challenge'?'Challenge':'Test'}`, slug: w.slug, assessment_type:mode,one_time:!!(mode==='challenge'?w.pkg.studio.challenge:w.pkg.studio.test_questions).one_time, intro_text: 'Assessment from the published content package', questions_count: (mode==='challenge'?w.challengeQuestions:w.questions).length, estimated_minutes:(mode==='challenge'?w.rules?.challengeTest:w.rules?.test)?.estimated_minutes??8,mission_id:w.missionId,package_id:w.packageId,content_version:w.contentVersion })
  const question = q => ({ id: q.id, question_text: q.instruction, question_type: 'mcq', options: q.options, order_index: q.order_index, hints:q.hints || q.models?.[0]?.hints || [],image_url:q.models?.[0]?.image,image_alt:q.models?.[0]?.alt })
  const completeMissionRecord=(s,w,score,worlds,snapshot)=>{
    const key=`${s.id}:${w.missionId}`,old=missions.get(key)
    if(old?.status==='completed')return old
    const source=snapshot||old||{package_id:w.packageId,content_version:w.contentVersion,xp_reward:w.pkg.mission.xp}
    const topicMissions=eligible(worlds,s).filter(v=>v.topicId===w.topicId)
    const result={status:'completed',stars:score>=80?3:score>=50?2:1,xp_awarded:source.xp_reward,package_id:source.package_id,content_version:source.content_version,completed_at:now(),next_mission_id:topicMissions.find(v=>v.missionId!==w.missionId&&missions.get(`${s.id}:${v.missionId}`)?.status!=='completed')?.missionId||null,topic_progress_percent:topicMissions.filter(v=>v.missionId===w.missionId||missions.get(`${s.id}:${v.missionId}`)?.status==='completed').length/topicMissions.length*100}
    missions.set(key,result);award(s,result.xp_awarded);return result
  }
  const gameplay=function(method, path, body, parent) {
    const worlds=contentRepository ? contentRepository.worlds() : seedWorlds
    const query = new URL(path,'http://mock.local').searchParams
    path = path.split('?')[0]
    const ok = (data, status = 200) => ({ status, data })
    if (method === 'GET' && path === '/challenges') return ok({ challenges: worlds.map(w => ({ id: w.challengeId, name: `${w.name} Duel`, slug: w.slug, description: 'Local mock battle', topic: w.pkg.mission.title,mission_id:w.missionId,package_id:w.packageId,content_version:w.contentVersion,practice_test_id:w.challengeTestId })) })
    if (method === 'GET' && path === '/parent/overview') return ok({ students: [...students.values()].filter(s => s.parent_id === parent.id).map(s => ({ student_id: s.id, name: s.name, ...stats(s), subjects: subjects(eligible(worlds,s),s).map(w=>({subject:w.name,progress_percent:w.progress_percent})), recent_test_score: [...attempts.values()].filter(a => a.studentId === s.id && a.result).at(-1)?.result.score || 0 })) })
    let m = path.match(/^\/students\/([^/]+)\/(.+)$/)
    if (m) {
      const s = owner(m[1], parent), action = m[2]
      const available=eligible(worlds,s)
      if (method === 'GET' && action === 'home') return ok({ greeting: `Ready for today's adventure, ${s.name}?`, stats: stats(s), recommended_mission: available[0]?{ mission_id: available[0].missionId, title: available[0].pkg.mission.title, subject: available[0].name, topic: available[0].pkg.mission.title, xp_reward: available[0].pkg.mission.xp, duration_minutes: 8, progress_percent: subject(available[0], s).progress_percent }:null, subjects: subjects(available,s) })
      if (method === 'GET' && action === 'subjects') return ok({ subjects: subjects(available,s) })
      if (method === 'GET' && action === 'journey') {
        const w=available.find(w=>w.slug===subjectKey(query.get('subject')||'literacy'));if(!w)missing()
        const entries=[...new Map(available.filter(v=>v.slug===w.slug).map(v=>[v.topicId,v])).values()]
        return ok({subject:w.slug,worlds:entries.map((v,i)=>{const nodes=available.filter(n=>n.topicId===v.topicId);return {id:v.topicId,world_name:v.pkg.topic,map_x:45,map_y:65+i*20,name:v.pkg.topic,description:'Explore, learn and practise.',status:'current',progress_percent:nodes.reduce((n,node)=>n+subject(node,s).progress_percent,0)/nodes.length,topic_id:v.topicId}}),companion_activities:[{id:'read-together',name:'Read Together'},{id:'talk-nova',name:'Talk with Nova'},{id:'raise-flag',name:'Raise the Flag'}]})
      }
      if (method === 'GET' && action === 'profile') return ok({ name: s.name, grade: s.grade, board: s.board, avatar_thumbnail_url: s.avatar?.thumbnail_url, ...stats(s) })
      if (method === 'GET' && action === 'profile/cards') return ok({ cards:available.filter(w=>missions.get(`${s.id}:${w.missionId}`)?.status==='completed').map(w=>({id:w.missionId,title:w.pkg.mission.title,subject:w.name,stars:missions.get(`${s.id}:${w.missionId}`).stars,earned_at:missions.get(`${s.id}:${w.missionId}`).completed_at})) })
      if (method === 'GET' && action === 'profile/our-journey') return ok({ subjects_progress: subjects(available,s).map(w=>({subject:w.name,progress_percent:w.progress_percent})), milestones_completed:available.filter(w=>missions.get(`${s.id}:${w.missionId}`)?.status==='completed').length,total_milestones:available.length })
      if(method==='GET'&&action==='attempts')return ok({attempts:[...[...learningAttempts].filter(([,a])=>a.studentId===s.id).map(([id,a])=>({attempt_id:id,assessment_type:'cfu',mission_id:a.world.missionId,package_id:a.world.packageId,content_version:a.world.contentVersion,status:a.result?'completed':'in_progress',started_at:a.started_at,result_path:`/missions/attempts/${id}/result`,resume_path:`/missions/attempts/${id}`})),...[...attempts].filter(([,a])=>a.studentId===s.id).map(([id,a])=>({attempt_id:id,assessment_type:a.mode,mission_id:a.world.missionId,package_id:a.world.packageId,content_version:a.world.contentVersion,status:a.result?'completed':'in_progress',started_at:a.started_at,result_path:`/tests/attempts/${id}/result`,resume_path:`/tests/attempts/${id}`})),...[...battles].filter(([,a])=>a.studentId===s.id).map(([id,a])=>({attempt_id:id,assessment_type:'battle',package_id:a.package_id,content_version:a.content_version,status:a.status,started_at:a.started_at,result_path:`/challenge-battles/${id}/result`,resume_path:`/challenge-battles/${id}`}))].sort((a,b)=>b.started_at.localeCompare(a.started_at))})
      let actionMatch = action.match(/^topics\/([^/]+)$/)
      if (method === 'GET' && actionMatch) {
        const w = available.find(w => w.topicId === actionMatch[1]); if (!w) missing()
        return ok({ id: w.topicId, name: w.pkg.topic, grade_level: w.grade||s.grade, subject: w.name, description: 'Published content from local SQLite', tiers: [], nodes: available.filter(v=>v.topicId===w.topicId).map((v,i)=>({mission_id:v.missionId,name:v.pkg.mission.title,package_id:v.packageId,content_version:v.contentVersion,order_index:i+1,status:missions.get(`${s.id}:${v.missionId}`)?.status||'unlocked',stars:missions.get(`${s.id}:${v.missionId}`)?.stars||0})) })
      }
      actionMatch=action.match(/^missions\/([^/]+)\/attempts$/)
      if(method==='POST'&&actionMatch){
        const w=available.find(w=>w.missionId===actionMatch[1]);if(!w)missing()
        requireValue(w.cfuQuestions?.length,'No CFU bank is available for this mission')
        const attempt_id=randomUUID(),started_at=now(),questions=structuredClone(w.cfuQuestions)
        learningAttempts.set(attempt_id,{studentId:s.id,world:structuredClone(w),questions,answers:new Map(),started_at})
        return ok({attempt_id,student_id:s.id,mission_id:w.missionId,package_id:w.packageId,content_version:w.contentVersion,assessment_type:'cfu',status:'in_progress',started_at,total_questions:questions.length,first_question:question(questions[0])},201)
      }
      actionMatch = action.match(/^missions\/([^/]+)\/(start|complete)$/)
      if (method === 'POST' && actionMatch) {
        const w = available.find(w => w.missionId === actionMatch[1]); if (!w) missing()
        const key = `${s.id}:${w.missionId}`, old = missions.get(key)
        if (actionMatch[2] === 'start') { const value = old || { status: 'in_progress', started_at: now(),package_id:w.packageId,content_version:w.contentVersion,xp_reward:w.pkg.mission.xp }; missions.set(key, value); return ok(value) }
        requireValue(old, 'Start the mission first')
        if (old.status === 'completed') return ok(old)
        const score = body.score; requireValue(Number.isFinite(score) && score >= 0 && score <= 100, 'score must be 0–100')
        return ok(completeMissionRecord(s,w,score,worlds))
      }
      actionMatch = action.match(/^tests\/([^/]+)\/attempts$/)
      if (method === 'POST' && actionMatch) {
        const w = available.find(w => w.testId === actionMatch[1]||w.challengeTestId===actionMatch[1]); if (!w) missing()
        const mode=w.challengeTestId===actionMatch[1]?'challenge':'test',bank=mode==='challenge'?w.challengeQuestions:w.questions
        const questions=selectAttemptQuestions(bank,bank.length,randomIndex)
        if((mode==='challenge'?w.pkg.studio.challenge:w.pkg.studio.test_questions).one_time&&[...attempts.values()].some(a=>a.studentId===s.id&&a.mode===mode&&(mode==='challenge'?a.world.challengeTestId:a.world.testId)===actionMatch[1]))reject(409,'This assessment is one-time; resume or review the existing attempt')
        const attemptId = randomUUID(), started_at = now()
        attempts.set(attemptId, { studentId: s.id, world: structuredClone(w),questions:structuredClone(questions),mode,answers: new Map(), started_at })
        return ok({ attempt_id: attemptId, status: 'in_progress', assessment_type:mode,package_id:w.packageId,content_version:w.contentVersion,started_at, total_questions:questions.length }, 201)
      }
      if (method === 'POST' && action === 'challenge-battles') {
        requireValue(available.some(w => w.challengeId === body.challenge_id) && opponents.some(o => o.id === body.opponent_id), 'Valid challenge_id and opponent_id required')
        const battle_id = randomUUID(), started_at = now()
        const w=available.find(w=>w.challengeId===body.challenge_id)
        const questions=selectAttemptQuestions(w.battleQuestions,w.rules?.battle.round_limit??3,randomIndex);requireValue(questions.length,'No battle questions are authored for this challenge')
        battles.set(battle_id, { studentId: s.id, status: 'in_progress',content_version:w.contentVersion,package_id:w.packageId,rewardRules:structuredClone(w.rules?.battle||{win_xp:50,loss_xp:10,pass_percent:50}),started_at, questions:structuredClone(questions), answers:{} })
        return ok({ battle_id, status: 'in_progress', content_version:w.contentVersion,package_id:w.packageId,started_at, total_questions:questions.length }, 201)
      }
    }
    m=path.match(/^\/missions\/attempts\/([^/]+)(?:\/(.+))?$/)
    if(m){
      const a=learningAttempts.get(m[1]);if(!a)missing()
      const s=owner(a.studentId,parent),w=a.world,action=m[2],questions=a.questions
      if(method==='GET'&&!action){
        const next=questions.find(q=>!a.answers.has(q.id))
        return ok({attempt_id:m[1],student_id:s.id,mission_id:w.missionId,package_id:w.packageId,content_version:w.contentVersion,assessment_type:'cfu',status:a.result?'completed':'in_progress',started_at:a.started_at,total_questions:questions.length,answered_questions:a.answers.size,next_question:a.result||!next?null:question(next)})
      }
      if(method==='GET'&&/^questions\/[1-9]\d*$/.test(action)){const q=questions.find(q=>q.order_index===Number(action.split('/')[1]));if(!q)missing();return ok(question(q))}
      if(method==='POST'&&action==='answers'){
        if(a.result)reject(409,'CFU attempt already completed')
        const q=questions.find(q=>q.id===body.question_id);requireValue(q,'Question does not belong to this CFU attempt')
        requireValue(q.options.some(o=>o.key===body.selected_answer),'Unknown selected_answer')
        const prior=a.answers.get(q.id);if(prior&&prior.selected!==body.selected_answer)reject(409,'Answer already submitted; start a new attempt to change it.')
        a.answers.set(q.id,{selected:body.selected_answer,is_correct:q.answer===body.selected_answer})
        return ok({is_correct:q.answer===body.selected_answer,answered_questions:a.answers.size,next_question_id:questions.find(v=>!a.answers.has(v.id))?.id||null})
      }
      if(method==='POST'&&action==='complete'){
        if(!a.result){
          const grade=gradeAnswers(questions,a.answers),alreadyRewarded=missions.get(`${s.id}:${w.missionId}`)?.status==='completed'
          const mission=completeMissionRecord(s,w,grade.score,worlds,{package_id:w.packageId,content_version:w.contentVersion,xp_reward:w.pkg.mission.xp})
          a.result={attempt_id:m[1],mission_id:w.missionId,package_id:w.packageId,content_version:w.contentVersion,assessment_type:'cfu',status:'completed',...grade,stars:grade.score>=80?3:grade.score>=50?2:1,xp_awarded:alreadyRewarded?0:mission.xp_awarded,completed_at:now(),next_mission_id:mission.next_mission_id,topic_progress_percent:mission.topic_progress_percent}
        }
        return ok(a.result)
      }
      if(method==='GET'&&(action==='result'||action==='review')){
        if(!a.result)reject(409,'Complete the CFU attempt first')
        return ok(action==='result'?a.result:buildAnswerReview({attempt_id:m[1],assessment_type:'cfu',package_id:w.packageId,content_version:w.contentVersion,questions,answers:a.answers}))
      }
    }
    m = path.match(/^\/subjects\/([^/]+)\/topics$/)
    if (method === 'GET' && m) { let entries=worlds.filter(w=>w.id===m[1]);if(!entries.length)missing();if(query.has('grade'))entries=entries.filter(w=>String(w.grade||'Grade 4').replace(/^Grade\s+/i,'')===query.get('grade').replace(/^Grade\s+/i,''));entries=[...new Map(entries.map(w=>[w.topicId,w])).values()];return ok({topics:entries.map((w,i)=>({id:w.topicId,name:w.pkg.topic,slug:w.slug,grade_level:w.grade||'Grade 4',order_index:i+1,student_status:'current',world_name:w.name}))}) }
    m = path.match(/^\/missions\/([^/]+)$/)
    if (method === 'GET' && m) { const w = worlds.find(w => w.missionId === m[1]); if (!w) missing(); return ok({ id: w.missionId, topic_id: w.topicId, package_id:w.packageId,content_version:w.contentVersion,tier_key: 'school', name: w.pkg.mission.title, xp_reward: w.pkg.mission.xp, content: {
      type: 'concept_package', theme: w.pkg.studio.theme_interest,
      ...w.pkg.studio.learning_content,
      learn_before_test: w.pkg.studio.learn_before_test,
      check_for_understanding: w.pkg.studio.check_for_understanding,
    } }) }
    m = path.match(/^\/topics\/([^/]+)\/tests$/)
    if (method === 'GET' && m) { const entries=worlds.filter(w=>w.topicId===m[1]);if(!entries.length)missing();return ok({tests:entries.flatMap(w=>[test(w),...(w.challengeQuestions?.length?[test(w,'challenge')]:[])])}) }
    m = path.match(/^\/tests\/([^/]+)$/)
    if (method === 'GET' && m) { const w = worlds.find(w => w.testId === m[1]||w.challengeTestId===m[1]); if (!w) missing(); return ok(test(w,w.challengeTestId===m[1]?'challenge':'test')) }
    m = path.match(/^\/tests\/attempts\/([^/]+)(?:\/(.+))?$/)
    if (m) {
      const attempt = attempts.get(m[1]); if (!attempt) missing()
      const s = owner(attempt.studentId, parent), action = m[2], questions = attempt.questions
      if(method==='GET'&&!action)return ok({attempt_id:m[1],student_id:s.id,assessment_type:attempt.mode,status:attempt.result?'completed':'in_progress',package_id:attempt.world.packageId,content_version:attempt.world.contentVersion,started_at:attempt.started_at,total_questions:questions.length,answered_questions:attempt.answers.size,next_question:attempt.result?null:(questions.find(q=>!attempt.answers.has(q.id))?question(questions.find(q=>!attempt.answers.has(q.id))):null)})
      if (method === 'GET' && /^questions\/[1-9]\d*$/.test(action)) { const q = questions.find(q => q.order_index === Number(action.split('/')[1])); if (!q) missing(); return ok(question(q)) }
      if (method === 'POST' && action === 'answers') {
        requireValue(!attempt.result, 'Attempt already completed')
        const q = questions.find(q => q.id === body.question_id); requireValue(q, 'Question does not belong to this attempt')
        requireValue(q.options.some(o => o.key === body.selected_answer), 'Unknown selected_answer')
        const is_correct = q.answer === body.selected_answer
        const prior=attempt.answers.get(q.id)
        if(prior&&prior.selected!==body.selected_answer)reject(409,'Answer already submitted; start a new attempt to change it.')
        attempt.answers.set(q.id,{selected:body.selected_answer,is_correct})
        return ok({ is_correct, next_question_id:questions.find(v=>!attempt.answers.has(v.id))?.id||null })
      }
      if (method === 'POST' && action === 'complete') {
        if (!attempt.result) {
          const correct_count = [...attempt.answers.values()].filter(a=>a.is_correct).length,totalMarks=questions.reduce((n,q)=>n+(q.marks??1),0),earnedMarks=questions.reduce((n,q)=>n+(attempt.answers.get(q.id)?.is_correct?(q.marks??1):0),0),score=earnedMarks/totalMarks*100
          const maxXp=(attempt.mode==='challenge'?attempt.world.rules?.challengeTest?.max_xp:attempt.world.rules?.test?.max_xp)??50
          const target=attempt.mode==='challenge'?attempt.world.challengeTestId:attempt.world.testId
          const earnedBefore=Math.max(0,...[...attempts.values()].filter(a=>a!==attempt&&a.studentId===s.id&&a.result&&a.mode===attempt.mode&&(a.mode==='challenge'?a.world.challengeTestId:a.world.testId)===target).map(a=>Math.floor(a.result.score/100*((a.mode==='challenge'?a.world.rules?.challengeTest?.max_xp:a.world.rules?.test?.max_xp)??50))))
          attempt.xp_awarded=Math.max(0,Math.floor(score/100*maxXp)-earnedBefore)
          attempt.result = { status: 'completed', score, correct_count, total_questions: questions.length,assessment_type:attempt.mode,content_version:attempt.world.contentVersion,package_id:attempt.world.packageId,completed_at: now() }
          award(s,attempt.xp_awarded);s.lastTest={score,correct:correct_count,total:questions.length,completedAt:now(),mission_id:attempt.world.missionId,title:attempt.world.pkg.mission.title}
        }
        return ok(attempt.result)
      }
      if (method === 'GET' && action === 'result') { requireValue(attempt.result, 'Complete the attempt first'); return ok({ ...attempt.result, xp_awarded:attempt.xp_awarded??Math.floor(attempt.result.score/100*((attempt.mode==='challenge'?attempt.world.rules?.challengeTest?.max_xp:attempt.world.rules?.test?.max_xp)??50)), extra_learning: attempt.result.score<80?[{mission_id:attempt.world.missionId,title:attempt.world.pkg.mission.title,reason:'Review this concept before another attempt.'}]:[] }) }
      if(method==='GET'&&action==='review'){if(!attempt.result)reject(409,'Complete the attempt first');return ok(buildAnswerReview({attempt_id:m[1],assessment_type:attempt.mode,package_id:attempt.world.packageId,content_version:attempt.world.contentVersion,questions,answers:attempt.answers}))}
    }
    m = path.match(/^\/challenges\/([^/]+)\/(opponents|preview)$/)
    if (method === 'GET' && m) { const w = worlds.find(w => w.challengeId === m[1]); if (!w) missing(); const opponent=query.has('opponent_id')?opponents.find(o=>o.id===query.get('opponent_id')):opponents[0];if(!opponent)missing();return ok(m[2] === 'opponents' ? { opponents } : { challenge: w.name, opponent, rules: `Score at least ${w.rules?.battle.pass_percent??50}% to win.`, xp_reward:w.rules?.battle.win_xp??50 }) }
    m = path.match(/^\/challenges\/([^/]+)\/leaderboard$/)
    if(method==='GET'&&m) {if(!worlds.some(w=>w.challengeId===m[1]))missing();if(query.has('scope')&&!['global','school'].includes(query.get('scope')))reject(400,'Invalid leaderboard scope');return ok({scope:query.get('scope')||'global',entries:[{rank:1,name:'Star Explorer',xp:820},{rank:2,name:'Moon Learner',xp:640},{rank:3,name:'Rocket Reader',xp:520}],source:'mock'})}
    m = path.match(/^\/challenge-battles\/([^/]+)(?:\/(complete|result|answers|review|questions\/[1-9]\d*))?$/)
    if (m) {
      const battle = battles.get(m[1]); if (!battle) missing()
      const s = owner(battle.studentId, parent)
      if(method==='GET'&&!m[2])return ok({battle_id:m[1],student_id:s.id,status:battle.status,package_id:battle.package_id,content_version:battle.content_version,started_at:battle.started_at,total_questions:battle.questions.length,answered_questions:Object.keys(battle.answers).length})
      if(method==='GET'&&m[2]?.startsWith('questions/')) {
        const q=battle.questions.find(q=>q.order_index===Number(m[2].split('/')[1]))
        if(!q)missing()
        return ok(question(q))
      }
      if(method==='POST'&&m[2]==='answers') {
        requireValue(battle.status!=='completed','Battle already completed')
        const q=battle.questions.find(q=>q.id===body.question_id)
        requireValue(q && q.options.some(o=>o.key===body.selected_answer),'Valid question and answer required')
        const prior=battle.answers[q.id]
        if(prior&&prior.selected!==body.selected_answer)reject(409,'Answer already submitted; start a new battle to change it.')
        battle.answers[q.id]={selected:body.selected_answer,is_correct:body.selected_answer===q.answer}
        return ok({is_correct:battle.answers[q.id].is_correct,answered:Object.keys(battle.answers).length})
      }
      if (method === 'POST' && m[2] === 'complete') {
        if (battle.status !== 'completed') {
          const score = gradeAnswers(battle.questions,battle.answers).score
          Object.assign(battle, { status: 'completed', result: score >= battle.rewardRules.pass_percent ? 'win' : 'loss', score, xp_awarded: score >= battle.rewardRules.pass_percent ? battle.rewardRules.win_xp : battle.rewardRules.loss_xp, completed_at: now() })
          award(s,battle.xp_awarded)
        }
        const {questions,answers,rewardRules,...summary}=battle; return ok(summary)
      }
      if (method === 'GET' && m[2] === 'result') {if(battle.status!=='completed')reject(409,'Complete the battle first');const {questions,answers,rewardRules,...summary}=battle;return ok(summary)}
      if(method==='GET'&&m[2]==='review'){if(battle.status!=='completed')reject(409,'Complete the battle first');return ok(buildAnswerReview({attempt_id:m[1],assessment_type:'battle',package_id:battle.package_id,content_version:battle.content_version,questions:battle.questions,answers:battle.answers}))}
    }
    return null
  }
  gameplay.state=()=>({missions,attempts,battles,learningAttempts})
  gameplay.evidence=studentId=>[...[...learningAttempts].filter(([,a])=>a.studentId===studentId&&a.result).map(([id,a])=>({attempt_id:id,assessment_type:'cfu',mission_id:a.world.missionId,topic_id:a.world.topicId,subject:a.world.name,result:a.result,review:buildAnswerReview({attempt_id:id,assessment_type:'cfu',package_id:a.world.packageId,content_version:a.world.contentVersion,questions:a.questions,answers:a.answers})})),...[...attempts].filter(([,a])=>a.studentId===studentId&&a.result).map(([id,a])=>({attempt_id:id,assessment_type:a.mode,mission_id:a.world.missionId,topic_id:a.world.topicId,subject:a.world.name,result:a.result,review:buildAnswerReview({attempt_id:id,assessment_type:a.mode,package_id:a.world.packageId,content_version:a.world.contentVersion,questions:a.questions,answers:a.answers})})),...[...battles].filter(([,a])=>a.studentId===studentId&&a.status==='completed').map(([id,a])=>({attempt_id:id,assessment_type:'battle',result:{score:a.score,xp_awarded:a.xp_awarded,completed_at:a.completed_at},review:buildAnswerReview({attempt_id:id,assessment_type:'battle',package_id:a.package_id,content_version:a.content_version,questions:a.questions,answers:a.answers})}))]
  gameplay.restore=state=>{for(const [name,map]of Object.entries(gameplay.state())){map.clear();for(const [key,value]of state?.[name]||[])map.set(key,value)}}
  return gameplay
}
