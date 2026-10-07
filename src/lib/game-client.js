import { subjectKey } from './live-data.js'

export function createGameClient({ request, getToken, storage, mode = "mock" }) {


  const paths = new Map()
  const missions = new Map()
  const startedMissions = new Map()
  const deliveredQuestions = new Map()
  const questionRequests = new Map()
  const learningRequests = new Map()
  const learningCompletions = new Map()
  const learningKey = (studentId, missionId) => `kv:api-cfu:${getToken()}:${studentId}:${missionId}`
  const deliveryKey = (id, order) => `${getToken()}:${id}:${order}`
  const battleKey = studentId => `kv:api-battle:${studentId}:${getToken()}`
  function deliverQuestion(path, id, order) {
    const key=deliveryKey(id,order)
    // Coalesce only concurrent readers (including StrictMode's repeated effect).
    // A later screen load still performs HTTP; there is no bootstrap/cache bank.
    if(!questionRequests.has(key)) questionRequests.set(key,request(path).then(q=>{
      deliveredQuestions.set(key,q)
      return q
    }).finally(()=>questionRequests.delete(key)))
    return questionRequests.get(key)
  }
  const resourceKey = (studentId, subject) => `${getToken()}:${studentId}:${subject}`
  const attemptKey = (studentId, subject, mode = 'test') => `kv:api-test:${studentId}:${subject}${mode === 'challenge' ? ':challenge' : ''}:${getToken()}`
  function getTestAttempt(studentId, subject, mode = 'test') {
    const attempt = JSON.parse(storage.getItem(attemptKey(studentId, subject, mode)) || 'null')
    if (!attempt?.attempt_id) throw new Error('Start a test from the test introduction first.')
    return attempt
  }
  async function resolveTopic(studentId, subject = 'maths', requestedTopicId) {
    if (!studentId) throw new Error('Create or select a child first.')
    const key = `${resourceKey(studentId, subject)}:${requestedTopicId || ''}`
    if (!paths.has(key)) paths.set(key, (async () => {
      const { subjects } = await request(`/students/${studentId}/subjects`)
      const selected = subjects.find(s => subjectKey(s.slug || s.name) === subjectKey(subject))
      if (!selected) throw new Error(`No API subject available for ${subject}.`)
      const { topics } = await request(`/subjects/${selected.id || selected.subject_id}/topics`)
      const topic = requestedTopicId ? topics.find(t=>t.id===requestedTopicId && t.status!=='locked') : topics.find(t => t.student_status === 'current' && t.status !== 'locked') || topics.find(t => t.status !== 'locked')
      if (!topic) throw new Error('This subject has no API topics.')
      const detail = await request(`/students/${studentId}/topics/${topic.id}`)
      return { subject: selected, topics, topic, detail, topicId: topic.id }
    })().catch(error => { paths.delete(key); throw error }))
    return paths.get(key)
  }

  const loadLearningPath = resolveTopic
  async function resolveLearning(studentId, subject = 'maths', displayedMissionId) {
    const requestedMission=displayedMissionId?await request(`/missions/${displayedMissionId}`):null
    const path = await resolveTopic(studentId, subject, requestedMission?.topic_id)
    const nodes = path.detail.nodes || []
    const mission = displayedMissionId ? nodes.find(n => n.mission_id === displayedMissionId)
      : nodes.find(n => n.status === 'in_progress') || nodes.find(n => !['locked', 'completed'].includes(n.status)) || nodes.find(n => n.status === 'completed')
    if (!mission || mission.status === 'locked') throw new Error('This topic has no available missions yet.')
    return { ...path, missionId: mission.mission_id,requestedMission }
  }

  async function listTopicTests(studentId, subject) {
    const path = await resolveTopic(studentId, subject)
    const { tests } = await request(`/topics/${path.topicId}/tests`)
    return { ...path, tests }
  }

  async function loadMission(studentId, subject, displayedMissionId) {
    const key = `${resourceKey(studentId, subject)}:${displayedMissionId || ''}`
    if (!missions.has(key)) missions.set(key, (async () => {
      const path = await resolveLearning(studentId, subject, displayedMissionId)
      const mission = path.requestedMission || await request(`/missions/${path.missionId}`)
      return { ...mission, learningContext: { subject: path.subject.name, topic: path.topic.name, description: path.detail.description } }
    })().catch(error => { missions.delete(key); throw error }))
    return missions.get(key)
  }
  async function startMission(studentId, subject, displayedMissionId) {
    if (!studentId) throw new Error('Create or select a child first.')
    const missionId = displayedMissionId || (await resolveLearning(studentId, subject)).missionId
    const key = `${getToken()}:${studentId}:${missionId}`
    if (!startedMissions.has(key)) startedMissions.set(key,
      request(`/students/${studentId}/missions/${missionId}/start`, { method: 'POST', body: {} })
        .catch(error => { startedMissions.delete(key); throw error }))
    return startedMissions.get(key)
  }
  async function completeMission(studentId, subject, score, displayedMissionId) {
    const missionId = displayedMissionId || (await resolveLearning(studentId, subject)).missionId
    await startMission(studentId, subject, missionId)
    const result = await request(`/students/${studentId}/missions/${missionId}/complete`, { method: 'POST', body: { score } })
    // The next screen must resolve fresh progress, including the next unlocked mission.
    for(const key of paths.keys())if(key.startsWith(resourceKey(studentId,subject)+':'))paths.delete(key)
    missions.clear()
    return result
  }
  async function startLearningAttempt(studentId, missionId) {
    if (!studentId || !missionId) throw new Error('Select a child and published mission first.')
    const key = learningKey(studentId, missionId)
    if (!learningRequests.has(key)) learningRequests.set(key, (async () => {
      const saved = JSON.parse(storage.getItem(key) || 'null')
      if (saved?.attempt_id) {
        const status = await request(`/missions/attempts/${saved.attempt_id}`)
        if (status.status === 'in_progress') return status
      }
      const attempt = await request(`/students/${studentId}/missions/${missionId}/attempts`, {method:'POST', body:{}})
      storage.setItem(key, JSON.stringify(attempt))
      return {...attempt, answered_questions:0}
    })().finally(() => learningRequests.delete(key)))
    return learningRequests.get(key)
  }
  const getLearningQuestion = (attemptId, order) => deliverQuestion(`/missions/attempts/${attemptId}/questions/${order}`, attemptId, order)
  async function submitLearningAnswer(attemptId, order, selected, displayedQuestion) {
    const q = deliveredQuestions.get(deliveryKey(attemptId,order)) || await getLearningQuestion(attemptId,order)
    if (q.question_text !== displayedQuestion) throw new Error('CFU question differs from displayed content. Answer was not submitted.')
    return request(`/missions/attempts/${attemptId}/answers`, {method:'POST',body:{question_id:q.id,selected_answer:selected}})
  }
  async function completeLearningAttempt(attemptId) {
    const key=deliveryKey(attemptId,'complete')
    if(!learningCompletions.has(key))learningCompletions.set(key,(async()=>{
      const done=await request(`/missions/attempts/${attemptId}/complete`, {method:'POST',body:{}})
      paths.clear(); missions.clear()
      try{return await request(`/missions/attempts/${attemptId}/result`)}
      catch {return {...done,resultPending:true}}
    })().catch(error=>{learningCompletions.delete(key);throw error}))
    return learningCompletions.get(key)
  }
  function getAttemptReview(id, type = 'test') {
    const prefix = type === 'cfu' ? '/missions/attempts' : type === 'battle' ? '/challenge-battles' : '/tests/attempts'
    return request(`${prefix}/${id}/review`)
  }
  function getAttemptResult(id, type = 'test') {
    const prefix = type === 'cfu' ? '/missions/attempts' : type === 'battle' ? '/challenge-battles' : '/tests/attempts'
    return request(`${prefix}/${id}/result`)
  }
  async function startTest(studentId, subject, mode = 'test', missionId) {
    const detail = await getTestOverview(studentId, subject, mode,missionId)
    const total = Number(detail.questions_count ?? detail.question_count)
    const attempt = await request(`/students/${studentId}/tests/${detail.id}/attempts`, { method: 'POST', body: {} })
    if (!attempt.attempt_id) throw new Error('The test could not be started. Please try again.')
    const saved = { ...attempt, total: Number(attempt.total_questions ?? total), test: detail }
    storage.setItem(attemptKey(studentId, subject, mode), JSON.stringify(saved))
    return saved
  }
  async function getTestOverview(studentId, subject, mode = 'test',missionId) {
    const { topicId } = missionId?await resolveLearning(studentId,subject,missionId):await resolveTopic(studentId, subject)
    const { tests } = await request(`/topics/${topicId}/tests`)
    if (!tests.length) throw new Error('No test is available for this topic.')
    const candidates=tests.filter(t=>(t.assessment_type || 'test')===mode)
    // Older live contracts expose one topic test without a mission association.
    // Only that unambiguous case can fall back to the validated topic.
    const selected=candidates.find(t=>!missionId || t.mission_id===missionId)
      || (missionId && candidates.length===1 && !candidates[0].mission_id ? candidates[0] : null)
    if(!selected)throw new Error(`No ${mode} assessment is published for this topic.`)
    const detail = await request(`/tests/${selected.id}`)
    const total = Number(detail.questions_count ?? detail.question_count)
    if (!Number.isInteger(total) || total < 1) throw new Error('This test has no available questions yet.')
    return detail
  }
  async function getTestQuestion(studentId, subject, order, mode = 'test') {
    const attempt = getTestAttempt(studentId, subject, mode)
    return deliverQuestion(`/tests/attempts/${attempt.attempt_id}/questions/${order}`,attempt.attempt_id,order)
  }
  async function submitAnswer(studentId, subject, order, selected, displayedQuestion, mode = 'test') {
    const attempt = getTestAttempt(studentId, subject, mode)
    const q = deliveredQuestions.get(deliveryKey(attempt.attempt_id, order)) || await getTestQuestion(studentId, subject, order, mode)
    if (displayedQuestion && q.question_text !== displayedQuestion) throw new Error('API question and displayed content differ. Answer was not submitted; content mapping needs review.')
    return request(`/tests/attempts/${attempt.attempt_id}/answers`, { method: 'POST', body: { question_id: q.id, selected_answer: selected } })
  }
  async function completeTest(studentId, subject, mode = 'test') {
    const attempt = getTestAttempt(studentId, subject, mode)
    // Save the acknowledged completion before loading rewards. A failed result GET
    // must not resubmit completion or lose an already accepted score on refresh.
    const done = attempt.completion || await request(`/tests/attempts/${attempt.attempt_id}/complete`, { method: 'POST', body: {} })
    storage.setItem(attemptKey(studentId, subject, mode), JSON.stringify({ ...attempt, completion: done }))
    try {
      const result = await request(`/tests/attempts/${attempt.attempt_id}/result`)
      return { ...done, ...result, attemptId: attempt.attempt_id, resultPending: false }
    } catch (error) {
      if (!Number.isInteger(done.correct_count) || !Number.isInteger(done.total_questions)) throw error
      return { ...done, attemptId: attempt.attempt_id, resultPending: true, resultError: error.message }
    }
  }
  async function battlePreview(botIndex = 0, subject = 'maths', missionId) {
    const { challenges } = await request('/challenges')
    const challenge = challenges.find(c => subjectKey(c.slug) === subjectKey(subject) && (!missionId || c.mission_id === missionId)) || (mode === 'live' ? challenges.find(c => c.mission_id && c.mission_id === missionId) : null)
    if (!challenge) throw new Error('No challenges available.')
    const { opponents } = await request(`/challenges/${challenge.id}/opponents`)
    const opponent = opponents[botIndex] || opponents[0]
    if (!opponent) throw new Error('No opponent available.')
    const preview = await request(`/challenges/${challenge.id}/preview?opponent_id=${opponent.id}`)
    return { ...preview, challengeId: challenge.id, opponent }
  }
  async function startBattle(studentId, botIndex = 0, subject = 'maths', missionId) {
    if (!studentId) throw new Error('Create or select a child first.')
    const { challengeId, opponent } = await battlePreview(botIndex, subject, missionId)
    const battle = await request(`/students/${studentId}/challenge-battles`, { method: 'POST', body: { challenge_id: challengeId, opponent_id: opponent.id } })
    const saved = { ...battle, total_questions: Number(battle.total_questions ?? battle.questions?.length) }
    // Older live starts may include a bank; never use it instead of a per-round GET.
    delete saved.questions
    storage.setItem(battleKey(studentId), JSON.stringify(saved))
    storage.setItem(`kv:api-battle-data:${studentId}`, JSON.stringify(saved))
    storage.setItem(`kv:api-opponent:${studentId}`, JSON.stringify(opponent))
    storage.setItem(`kv:api-battle:${studentId}`, battle.battle_id)
    return saved
  }
  function getBattleAttempt(studentId) {
    const battle = JSON.parse(storage.getItem(battleKey(studentId)) || 'null')
    if (!battle?.battle_id || !Number.isInteger(battle.total_questions) || battle.total_questions < 1) throw new Error('Start a battle from the battle preview first.')
    return battle
  }
  async function getBattleQuestion(studentId, order) {
    const battle = getBattleAttempt(studentId)
    return deliverQuestion(`/challenge-battles/${battle.battle_id}/questions/${order}`,battle.battle_id,order)
  }
  async function submitBattleAnswer(studentId, order, selected, displayedQuestion) {
    const battle = getBattleAttempt(studentId)
    const q = deliveredQuestions.get(deliveryKey(battle.battle_id, order)) || await getBattleQuestion(studentId, order)
    if (displayedQuestion && q.question_text !== displayedQuestion) throw new Error('API question and displayed content differ. Battle answer was not submitted.')
    return request(`/challenge-battles/${battle.battle_id}/answers`, {method:'POST',body:{question_id:q.id,selected_answer:selected}})
  }
  async function completeBattle(studentId, score) {
    const id = getBattleAttempt(studentId).battle_id
    if (mode === 'live' && (!Number.isFinite(score) || score < 0 || score > 100)) throw new Error('The documented live battle completion requires a valid score (0–100). No completion was submitted.')
    await request(`/challenge-battles/${id}/complete`, { method: 'POST', body: { score } })
    return { ...await request(`/challenge-battles/${id}/result`), battleId: id }
  }

  async function completeCompanionActivity(studentId, keywords, subject = 'literacy') {
    if (!studentId) throw new Error('Create or select a child first.')
    const { companion_activities: activities = [] } = await request(`/students/${studentId}/journey?subject=${encodeURIComponent(subject)}`)
    const terms = (Array.isArray(keywords) ? keywords : [keywords]).map(value => String(value).toLowerCase())
    const activity = activities.find(item => terms.some(term => item.name.toLowerCase().includes(term)))
    if (!activity) throw new Error('This companion activity is not available from the live API yet.')
    return request(`/students/${studentId}/companion-activities/${activity.id}/complete`, { method: 'POST', body: {} })
  }

  return { resolveLearning, loadLearningPath, listTopicTests, loadMission, startMission, completeMission, startLearningAttempt, getLearningQuestion, submitLearningAnswer, completeLearningAttempt, getAttemptReview, getAttemptResult, startTest, getTestOverview, getTestAttempt, getTestQuestion, submitAnswer, completeTest, battlePreview, startBattle, getBattleAttempt, getBattleQuestion, submitBattleAnswer, completeBattle, completeCompanionActivity }
}
