import { normalizeContentPackage } from './normalize.js'

/** Adapt the public GET /missions/{id} contract to the lesson templates. */
export function normalizeMissionContent(mission, id, fallback, context = {}) {
  if (!mission?.id || !mission.content) throw new Error('This lesson is not available yet. Please try another mission.')
  const content = mission.content
  let pkg
  if (content.discover?.contents?.length && content.check?.questions?.length) {
    pkg = content
  } else {
    // The app API flattens learning_content inside content; Studio exports nest it.
    const learning = content.learning_content ?? content
    const objective = content.concept?.learning_objective ?? content.learn_before_test?.steps?.find(step => step.step_key === 'remember')?.key_idea ?? learning.explanation ?? context.description ?? mission.name
    pkg = normalizeContentPackage({
      ...content,
      content_version: content.content_version ?? mission.updated_at ?? `mission:${mission.id}`,
      curriculum: {
        grade: context.grade ?? fallback.grade,
        board: context.board ?? fallback.board,
        subject: context.subject ?? fallback.subject,
        topic: context.topic ?? mission.name,
        ...content.curriculum,
      },
      concept: { name: mission.name, learning_objective: objective, ...content.concept },
      learning_content: learning,
    }, id, fallback)
  }
  return {
    ...pkg,
    content_id: id,
    contentSource: 'api',
    apiMissionId: mission.id,
    apiXpReward: mission.xp_reward,
    mission: { ...pkg.mission, title: mission.name ?? pkg.mission.title, xp: mission.xp_reward ?? pkg.mission.xp },
  }
}
