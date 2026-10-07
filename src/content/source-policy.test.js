import test from 'node:test'
import assert from 'node:assert/strict'
import { contentSource } from './source-policy.js'
import { assertReviewRequestAllowed } from '../lib/reviewMode.js'
import { saveOnboardingStep } from '../lib/onboarding-save.js'
import { reviewLearning, reviewSubjects, reviewHome } from '../lib/review-learning.js'
import { getContent } from './bundled.js'
import { subjectKey } from '../lib/live-data.js'
import { cmsQuestions, finishCmsAssessment } from './assessment.js'
import { normalizeContentPackage } from './normalize.js'
import addition from './packages/addition-introduction.json' with { type: 'json' }
import fractions from './fractions-equal-parts.json' with { type: 'json' }

test('review fixtures win even when a real child, session and mission remain selected', () => {
  assert.equal(contentSource({ review: true, studentId: 'live-child', token: 'live-token' }), 'review-fixture')
  assert.equal(contentSource({ review: true }), 'review-fixture')
})
test('authenticated live lessons retain the API source; unauthenticated previews use bundled content', () => {
  assert.equal(contentSource({ review: false, studentId: 'live-child', token: 'live-token' }), 'api')
  assert.equal(contentSource({ review: false, studentId: 'live-child', token: '' }), 'bundled')
})
test('every live mutation is blocked in UI review, while GET comparisons and normal writes work', () => {
  for (const method of ['POST', 'PATCH', 'PUT', 'DELETE', 'post']) {
    assert.throws(() => assertReviewRequestAllowed(true, method), /Exit review/)
    assert.doesNotThrow(() => assertReviewRequestAllowed(false, method))
  }
  assert.doesNotThrow(() => assertReviewRequestAllowed(true, 'GET'))
})

test('review onboarding advances without invoking live reads or writes, even with a retained account', async () => {
  let calls = 0
  const profile = {grade:'4',board:'CBSE',face:null,interests:['nature','space','sports'],goals:['school']}
  for (const step of ['grade-board','avatar','interests','goals','nova']) {
    assert.deepEqual(await saveOnboardingStep({review:true,step,profile,liveSave:async()=>{calls++;throw Error('Live session must not be used')}}),{local:true,source:'ui-review',step})
  }
  assert.equal(calls,0)
})

test('review onboarding rejects incomplete selections instead of pretending to save', async () => {
  await assert.rejects(saveOnboardingStep({review:true,step:'grade-board',profile:{grade:'4'}}),/school board/)
  await assert.rejects(saveOnboardingStep({review:true,step:'interests',profile:{interests:['space','space','space']}}),/three or more/)
  await assert.rejects(saveOnboardingStep({review:true,step:'unknown',profile:{}}),/Unsupported/)
})

test('normal onboarding preserves the real server result and propagates save failure', async () => {
  const response = {grade:'4',board:'CBSE'}
  let calls = 0
  assert.equal(await saveOnboardingStep({review:false,step:'grade-board',profile:{},liveSave:async()=>{calls++;return response}}),response)
  await assert.rejects(saveOnboardingStep({review:false,step:'avatar',profile:{},liveSave:async()=>{calls++;throw Error('Server unavailable')}}),/Server unavailable/)
  assert.equal(calls,2)
})

test('review subjects link to their matching sample topic, journey, lesson and test', () => {
  const subjects = reviewSubjects()
  assert.equal(subjects.length,5)
  for(const subject of subjects) {
    assert.equal(subject.locked,false)
    assert.equal(subject.progress_percent,0)
    const sample=reviewLearning(subject.slug)
    const pkg=getContent(subject.slug==='maths'?'addition-introduction':`demo-${subject.slug}`)
    assert.equal(sample.source,'ui-review')
    assert.equal(subjectKey(sample.path.detail.subject),subject.slug)
    assert.equal(subjectKey(sample.journey.subject),subject.slug)
    assert.equal(sample.path.detail.nodes[0].name,pkg.mission.title)
    assert.equal(sample.journey.worlds[0].world_name,pkg.mission.title)
    assert.equal(sample.recommended.mission_id,sample.path.detail.nodes[0].mission_id)
    assert.equal(sample.tests[0].questions_count,pkg.assessments.test_questions.length)
  }
  assert.throws(()=>reviewLearning('unknown'),/No UI review subject/)
})

test('review home supports a local or retained child without changing its profile, progress or fixture data', () => {
  const profile={name:'Reviewer',grade:'4',board:'CBSE'},stats={xp:0,streak:0}
  const before=JSON.stringify({profile,stats})
  const home=reviewHome(profile,stats)
  assert.equal(home.source,'ui-review');assert.equal(home.subjects.length,5)
  assert.equal(home.recommended_mission.title,'Introduction to Addition')
  assert.equal(JSON.stringify({profile,stats}),before)
  assert.equal(reviewLearning('maths',{contentId:'fractions-equal-parts'}).recommended.title,getContent('fractions-equal-parts').mission.title)
  assert.deepEqual(reviewLearning('maths').journey.companion_activities.map(activity=>activity.type),['celebration','reading','speaking'])
})
test('bundled review assessments have usable questions and award no live XP', () => {
  const pkg = { ...normalizeContentPackage(addition, 'addition-introduction', fractions), contentSource: 'review-fixture' }
  assert.equal(pkg.learn_before_test.steps.length, 3)
  for (const mode of ['test', 'challenge']) {
    const questions = cmsQuestions(pkg, mode)
    assert.ok(questions?.length)
    const run = finishCmsAssessment({ questions, review: [], seconds: 10, subject: 'maths', mode })
    assert.equal(run.local, true)
    assert.equal(run.xpAwarded, 0)
    assert.equal(run.total, questions.length)
  }
  assert.ok(pkg.assessments.battle_questions.length)
  assert.equal(cmsQuestions({ ...pkg, contentSource: 'api' }, 'test'), null)
})
