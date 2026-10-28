// Use the server topic association; never infer a subject from a concept slug.
export function topicChallenges(challenges=[],topicId,topicName) {
 return challenges.filter(c=>c.topic_id?c.topic_id===topicId:typeof c.topic==='object'&&c.topic?c.topic.id===topicId:typeof c.topic==='string'&&c.topic===topicName);
}
