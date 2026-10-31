// Use the server topic association; never infer a subject from a concept slug.
export function topicChallenges(challenges=[],topicId,topicName) {
 return challenges.filter(c=>c.topic_id?c.topic_id===topicId:typeof c.topic==='object'&&c.topic?c.topic.id===topicId:typeof c.topic==='string'&&c.topic===topicName);
}

// Multiple concepts require a choice; an invalid link must never select another one.
export function selectedChallenge(challenges = [], requestedId = '') {
 if (requestedId) return challenges.find(c => c.id === requestedId) || null;
 return challenges.length === 1 ? challenges[0] : null;
}

export function battleAvailability(challenge, resource) {
 if (!challenge) return { disabled: true, label: 'Choose a concept', message: 'Choose a concept above to check for opponents.' };
 if (resource.loading) return { disabled: true, label: 'Checking opponents…', message: 'Looking for available game opponents.' };
 if (resource.error) return { disabled: true, label: 'Could not load', message: 'We could not check opponents. Use Retry to try again.' };
 if (!resource.data?.opponents?.length) return { disabled: true, label: 'Not available yet', message: 'No opponents are available for this concept yet. Try a test or explore lessons.' };
 return { disabled: false, label: 'Enter Battle', message: 'Practise against an available game opponent.' };
}
