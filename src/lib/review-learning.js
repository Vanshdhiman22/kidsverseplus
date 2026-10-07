import { getContent, DEFAULT_CONTENT_ID } from '../content/bundled.js'
import { WORLDS } from '../data/catalog.js'
import companions from '../content/companion-fixtures.json' with { type: 'json' }

// Explicit UI review fixtures. These are never API responses or a live error fallback.
export function reviewLearning(subject = 'maths', { contentId = DEFAULT_CONTENT_ID, grade = '4', board = 'CBSE' } = {}) {
  if (!WORLDS.some(world => world.id === subject)) throw Error(`No UI review subject: ${subject}`)
  const pkg = getContent(subject === 'maths' ? contentId : `demo-${subject}`)
  const topicId = `review-topic-${subject}`, missionId = `review-mission-${subject}`
  const mission = { mission_id: missionId, name: pkg.mission.title, status: 'unlocked' }
  return {
    source: 'ui-review',
    path: { detail: { id: topicId, name: pkg.topic || pkg.mission.title, subject: pkg.subject, description: pkg.mission.rail.blurb, grade_level: grade, nodes: [mission] } },
    journey: { subject: pkg.subject, worlds: [{ topic_id: topicId, world_name: pkg.mission.title, tagline: 'Sample lesson', status: 'current' }], companion_activities: ['celebration','reading','speaking'].map(type => {const activity=companions.find(item=>item.type===type);return {...activity,name:activity.title}}) },
    recommended: { mission_id: missionId, title: pkg.mission.title, subject: pkg.subject, reason: 'Explore this sample lesson with Nova.', duration_minutes: 8 },
    tests: [{ id: `review-test-${subject}`, name: `${pkg.mission.title} Test`, questions_count: pkg.assessments?.test_questions?.length || 0, estimated_minutes: 8 }],
    curriculum: { grade, board },
  }
}

export function reviewSubjects() {
  return WORLDS.map(world => ({ id:`review-subject-${world.id}`, slug:world.id, name:world.name, description:world.desc, progress_percent:0, completed_missions:0, total_missions:1, locked:false }))
}

export function reviewHome(profile = {}, stats = {}, contentId = DEFAULT_CONTENT_ID) {
  return { source:'ui-review', greeting:`Ready for a sample adventure, ${profile.name || 'Reviewer'}?`, subjects:reviewSubjects(), stats:{total_xp:stats.xp || 0,day_streak:stats.streak || 0}, recommended_mission:reviewLearning('maths',{...profile,contentId}).recommended }
}
