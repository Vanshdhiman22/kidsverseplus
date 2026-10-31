import { api, apiRequest, getToken, API_MODE } from './api.js'
import { createGameClient } from './game-client.js'

const client = createGameClient({ request: apiRequest, getToken, API_MODE, storage: sessionStorage, mode: API_MODE, getLearningPath: studentId => api.studentLearningPath(studentId) })
export const { peekTestQuestion, prepareTestQuestion, queueTestAnswer, finishBufferedTest } = client
export const { resolveLearning, loadLearningPath, listTopicTests, listTopicChallenges, resolveMissionSubject, loadMission, startMission, completeMission, startLearningAttempt, getLearningQuestion, submitLearningAnswer, completeLearningAttempt, getAttemptReview, getAttemptResult, startTest, getTestOverview, getTestAttempt, getTestQuestion, submitAnswer, battlePreview, startBattle, getBattleAttempt, getBattleQuestion, submitBattleAnswer, completeCompanionActivity, completeTest, completeBattle } = client
