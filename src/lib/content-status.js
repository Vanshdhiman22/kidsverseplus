export function contentStatus(error, activity) {
  const message = String(error || '')
  if (/sign in first|not authenticated|authentication credentials|session expired/i.test(message)) return {
    message: `Please sign in again to load this ${activity}.`, retry: false, destination: '/parent/login', label: 'Sign in',
  }
  if (/Start a test from the test introduction first/i.test(message)) return {
    message: 'Choose a test and open its introduction before answering questions.', retry: false, destination: '/tests', label: 'Choose a test',
  }
  if (/Start a battle|No active battle|battle.*not started/i.test(message)) return {
    message: 'Choose a challenge and an opponent before starting a battle.', retry: false, destination: '/challenge', label: 'Back to Challenge',
  }
  if (/No opponents are published|Choose a concept from Challenge Home/i.test(message)) return {
    message: /No opponents/.test(message) ? 'No opponents are available for this concept yet. Choose another concept or try a test.' : 'Choose a concept on Challenge Home to see its available opponents.',
    retry: false, destination: '/challenge', label: 'Back to Challenge',
  }
  if (/reading\/speaking content yet|No published .* activity|Activity content is not available yet/i.test(message)) return {
    message: 'This activity is not available yet. Choose another activity for now.', retry: false, destination: '/extra', label: 'Back to activities',
  }
  return {
    message: `We could not load this ${activity}. Try again or choose another activity.`, retry: true,
    destination: /reading|speaking/.test(activity) ? '/extra' : activity === 'test' ? '/tests' : activity === 'battle' ? '/challenge' : '/learn', label: /reading|speaking/.test(activity) ? 'Back to activities' : activity === 'test' ? 'Back to Tests' : activity === 'battle' ? 'Back to Challenge' : 'Back to Learn',
  }
}
