/* Nova's local brain: small, scripted, honest. It only says lines already written for the lesson.
   Real answers come from the backend later (/nova/think); this is what Nova says until then. */
const INTENTS = [
  ['repeat', /\b(again|repeat|say that|what did you say|pardon)\b/i],
  ['confused', /\b(don'?t (get|understand)|confus|hard|difficult|stuck|no idea|help me|i can'?t)\b/i],
  ['hint', /\b(hint|clue|tip|help)\b/i],
  ['another', /\b(another way|different way|other way|show me (another|differently)|explain (it )?differently)\b/i],
  ['whatis', /\b(what('?s| is) (a|an)?\s*(fraction|half|whole|quarter|equal part))/i],
  ['answer', /\b(what('?s| is) the answer|tell me the answer|just tell me|give me the answer)\b/i],
  ['greeting', /^\s*(hi|hello|hey|nova)\b/i],
  ['thanks', /\b(thank|thanks|thank you)\b/i],
  ['navigate', /\b(go (to )?(home|journey|test|challenge|profile)|take me (home|to))\b/i],
]
const FACTS = {
  fraction: 'A fraction is a part of something whole. If you cut one whole into equal parts, each part is a fraction of it.',
  half: 'A half is one of two equal parts. Cut something down the middle so both pieces are the same, and each piece is one half.',
  whole: 'One whole is the complete thing, before it is cut. All the parts together make one whole again.',
  quarter: 'A quarter is one of four equal parts. Cut a whole into four pieces that are all the same, and each one is a quarter.',
  'equal part': 'Equal parts are pieces that are exactly the same size. Sharing is only fair when the parts are equal.',
}
const HINTS = {
  '/missions/fractions': ['Look at the pizza. How many astronauts are sharing it?', 'Equal sharing means every slice is the same size.'],
  '/missions/fractions/explain': ['Count the shaded parts, then count all the parts.', 'Three shaded out of four equal parts is three quarters.'],
  '/missions/fractions/spot-mistake': ['Check the size of each part.', 'Look at the crust lengths. Are they all the same?'],
}
export const detectIntent = t => { for (const [n, re] of INTENTS) if (re.test(t)) return n; return 'unknown' }

export function think(text, ctx = {}) {
  const intent = detectIntent(text || '')
  const hints = HINTS[ctx.screen] ?? []
  const onBoard = hints.length > 0
  const model = ctx.model ?? 'pizza'
  switch (intent) {
    case 'greeting': return { state: 'HAPPY', text: `Hi ${ctx.name || 'Explorer'}! I'm right here. Ask me anything about what's on the screen.` }
    case 'thanks': return { state: 'HAPPY', text: 'Any time! Keep going, you are doing great.' }
    case 'repeat': return { state: 'NEUTRAL', text: onBoard ? hints[0] : 'Tap Listen and I will read the screen again.' }
    case 'hint': case 'confused': {
      if (!onBoard) return { state: 'HINT', text: 'Open a lesson and I can give you a hint for the exact question you are on.' }
      const n = Math.min(ctx.hints ?? 0, hints.length - 1)
      return { state: 'HINT', text: hints[n], action: { type: 'hint', index: n + 1 } }
    }
    case 'another': return onBoard
      ? { state: 'NEUTRAL', text: `Let me show you the same idea as a ${model === 'pizza' ? 'chocolate bar' : model === 'choco' ? 'number line' : 'pizza'}.`, action: { type: 'model' } }
      : { state: 'NEUTRAL', text: 'On the lesson board, tap "Show me another" and I will swap the picture.' }
    case 'whatis': { const key = Object.keys(FACTS).find(k => new RegExp(k, 'i').test(text)) ?? 'fraction'; return { state: 'TEACH', text: FACTS[key] } }
    case 'answer': return { state: 'HINT', text: onBoard ? `I won't tell you the answer, but here's a clue: ${hints[0]}` : 'I give clues, not answers. That way it stays yours.' }
    case 'navigate': return { state: 'NEUTRAL', text: 'Use the dock at the bottom to move around: Home, Learn, Test, Challenge, Profile.' }
    default: return { state: 'NEUTRAL', text: onBoard ? 'I can help with this step. Try asking for a hint, or say "I don\'t get it".' : 'I\'m Nova, your learning buddy. Ask me for a hint, what a fraction is, or say "explain another way".' }
  }
}
