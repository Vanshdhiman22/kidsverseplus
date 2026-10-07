// UI review records selections only in the provider's isolated review state.
// It never fabricates an HTTP success or forwards a live account mutation.
export async function saveOnboardingStep({ review, step, profile, liveSave }) {
  if (!review) return liveSave()
  if (!['grade-board', 'avatar', 'interests', 'goals', 'nova'].includes(step)) throw Error('Unsupported UI review step.')
  if (step === 'grade-board' && (!profile.grade || !profile.board)) throw Error('Select a grade and school board.')
  if (step === 'interests' && new Set(profile.interests || []).size < 3) throw Error('Choose three or more interests.')
  return { local: true, source: 'ui-review', step }
}
