import React from 'react'
/* AI opponents for the Battle Arena and their quick-fire questions. */
export const BOTS = [
  { id: 'robo', name: 'Robo', subject: 'Maths', level: 3, c: '#7c5cff', bg: 'linear-gradient(180deg,#ede9fe,#fff)', img: '/art/crops/bot-robo.webp', cut: '/art/chars/opponents-2.webp', spec: 'Numbers • Puzzles • Problem Solving', blurb: 'Loves numbers and brain-bending puzzles! Gets stronger with every challenge.', style: 'Quick Thinker', styleSub: 'Solves problems fast and loves a good challenge!', strengths: [['Maths', 4], ['Literacy', 2], ['Speed', 3]], likes: 'Number puzzles', tip: <>Robo is strong at <b className="text-primary-ink">multiplication</b>, but <b className="text-sky-500">fractions</b> are his weaker area.</> },
  { id: 'lexi', name: 'Lexi', subject: 'Literacy', level: 3, c: '#ec4899', bg: 'linear-gradient(180deg,#fce7f3,#fff)', img: '/art/crops/bot-lexi.webp', cut: '/art/chars/opponents-3.webp', spec: 'Reading • Vocabulary • Expression', blurb: 'A bookworm who knows every word. Loves stories and word games.', style: 'Storyteller', styleSub: 'Reads fast and spots tricky words instantly!', strengths: [['Maths', 2], ['Literacy', 4], ['Speed', 3]], likes: 'Word games', tip: <>Lexi is strong at <b className="text-primary-ink">vocabulary</b>, but <b className="text-sky-500">numbers</b> slow her down.</> },
  { id: 'cosmo', name: 'Cosmo', subject: 'Science', level: 3, c: '#22c55e', bg: 'linear-gradient(180deg,#dcfce7,#fff)', img: '/art/crops/bot-cosmo.webp', cut: '/art/chars/opponents-4.webp', spec: 'Experiments • Discovery • Curiosity', blurb: 'Curious about everything. Mixes potions and asks big questions.', style: 'Explorer', styleSub: 'Takes time to think, then answers with care.', strengths: [['Maths', 3], ['Literacy', 3], ['Speed', 2]], likes: 'Experiments', tip: <>Cosmo is strong at <b className="text-primary-ink">science facts</b>, but <b className="text-sky-500">speed</b> is not his thing.</> },
  { id: 'pixel', name: 'Pixel', subject: 'Logic', level: 3, c: '#f59e0b', bg: 'linear-gradient(180deg,#fef3c7,#fff)', img: '/art/crops/bot-pixel.webp', cut: '/art/chars/opponents-5.webp', spec: 'Patterns • Logic • Critical Thinking', blurb: 'Sees patterns everywhere. Loves riddles and puzzles.', style: 'Pattern Master', styleSub: 'Spots the rule before anyone else!', strengths: [['Maths', 3], ['Literacy', 2], ['Speed', 4]], likes: 'Pattern puzzles', tip: <>Pixel is strong at <b className="text-primary-ink">patterns</b>, but <b className="text-sky-500">word problems</b> trip him up.</> },
]

/* What a battle actually pays. The preview screen promised 75 XP for a win while the
 * result screen paid a flat 30 either way, so a child was told one number and credited
 * another. Both screens read this now, so they cannot drift apart again. */
export const BATTLE_XP = { win: 75, draw: 40, loss: 30 }

export const BATTLE_QS = [
  { q: 'What fraction is shown by the shaded part?', shaded: 3, total: 5, options: [[1, 5], [2, 5], [3, 5], [4, 5]], answer: 2 },
  { q: 'What fraction is shown by the shaded part?', shaded: 1, total: 4, options: [[1, 4], [2, 4], [3, 4], [1, 2]], answer: 0 },
  { q: 'What fraction is shown by the shaded part?', shaded: 5, total: 6, options: [[1, 6], [3, 6], [5, 6], [6, 5]], answer: 2 },
  { q: 'What fraction is shown by the shaded part?', shaded: 2, total: 3, options: [[1, 3], [2, 3], [3, 2], [2, 2]], answer: 1 },
]

export const LEAGUE = [
  ['StarMinD', 12450, 1], ['MathWizard', 11230, 2], ['BookBug', 9870, 3], ['QuizQueen', 8610, 4], ['CodeCraftr', 7420, 1], ['BrainyBee', 6310, 2], ['LogicLion', 5920, 3], ['PixelPilot', 5210, 4],
]
