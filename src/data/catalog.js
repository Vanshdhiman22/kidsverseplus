/* Single source of truth for all on-screen content. */
/* Playschool to Grade 8 is the whole product. */
export const GRADES = [
  { id: 'playschool', short: 'PS', label: 'Playschool', abbr: true },
  { id: 'nursery', short: 'Nur', label: 'Nursery', abbr: true },
  { id: 'lkg', short: 'LKG', label: 'Lower KG', abbr: true },
  { id: 'ukg', short: 'UKG', label: 'Upper KG', abbr: true },
  ...Array.from({ length: 8 }, (_, i) => ({ id: String(i + 1), short: String(i + 1), label: `Grade ${i + 1}` })),
]
export const gradeLabel = id => GRADES.find(g => g.id === String(id))?.label ?? `Grade ${id}`

export const BOARDS = [
  { id: 'CBSE', label: 'CBSE', icon: 'book' },
  { id: 'ICSE', label: 'ICSE', icon: 'bank' },
  { id: 'IB', label: 'IB', icon: 'globe' },
  { id: 'Other', label: 'Other', icon: 'dots' },
]

export const LANGS = [
  { id: 'en', label: 'English' },
  { id: 'hi', label: 'हिंदी', soon: true },
  { id: 'mr', label: 'मराठी', soon: true },
]

/* One station path per subject world. The six map spots are shared; only the names change. */
export const WORLD_STATIONS = {
  maths: [
    { id: 'numbers', name: 'Number Forest', sub: 'Numbers' }, { id: 'addition', name: 'Addition City', sub: 'Addition' },
    { id: 'multiply', name: 'Multiplication Station', sub: 'Multiplication' }, { id: 'fractions', name: 'Fractions Galaxy', sub: 'Fractions' },
    { id: 'decimals', name: 'Decimal Dunes', sub: 'Decimals' }, { id: 'geometry', name: 'Geometry Heights', sub: 'Shapes' },
  ],
  literacy: [
    { id: 'letters', name: 'Alphabet Bay', sub: 'Letters and sounds' }, { id: 'words', name: 'Word Woods', sub: 'Vocabulary' },
    { id: 'sentences', name: 'Sentence Springs', sub: 'Sentences' }, { id: 'stories', name: 'Story Harbour', sub: 'Comprehension' },
    { id: 'grammar', name: 'Grammar Gorge', sub: 'Grammar' }, { id: 'poetry', name: 'Poetry Peaks', sub: 'Expression' },
  ],
  evs: [
    { id: 'plants', name: 'Plant Valley', sub: 'Plants' }, { id: 'animals', name: 'Animal Kingdom', sub: 'Animals' },
    { id: 'body', name: 'Body Basecamp', sub: 'Our body' }, { id: 'weather', name: 'Weather Watch', sub: 'Weather' },
    { id: 'water', name: 'Water Cycle Falls', sub: 'Water' }, { id: 'space', name: 'Space Station', sub: 'Earth and space' },
  ],
  computer: [
    { id: 'parts', name: 'Hardware Harbour', sub: 'Parts of a computer' }, { id: 'typing', name: 'Keyboard Cove', sub: 'Typing' },
    { id: 'files', name: 'Folder Falls', sub: 'Files and folders' }, { id: 'logic', name: 'Logic Lagoon', sub: 'Sequences' },
    { id: 'loops', name: 'Loop Lake', sub: 'Loops' }, { id: 'creating', name: 'Creator Cliffs', sub: 'Make your own' },
  ],
  general: [
    { id: 'india', name: 'My India', sub: 'Our country' }, { id: 'festivals', name: 'Festival Fields', sub: 'Festivals' },
    { id: 'safety', name: 'Safety Station', sub: 'Staying safe' }, { id: 'money', name: 'Market Meadow', sub: 'Money sense' },
    { id: 'news', name: 'News Nebula', sub: 'Current affairs' }, { id: 'community', name: 'Community Cove', sub: 'Citizenship' },
  ],
}
export const STATION_SPOTS = [{ x: 705, y: 100 }, { x: 1180, y: 140 }, { x: 660, y: 330 }, { x: 1290, y: 410 }, { x: 700, y: 560 }, { x: 790, y: 700 }]
/* Lessons per station: the same split deriveStations uses, exported so screens can
   advance the child by exactly one stop. */
export const STATION_TOTAL = 20
export const STATION_PER = STATION_TOTAL / 6

/** Turn a world's lesson count into station states: done → here → next → locked. */
export function deriveStations(worldId, done = 0, total = 20) {
  const path = WORLD_STATIONS[worldId] ?? WORLD_STATIONS.maths
  const per = total / path.length
  const at = Math.min(path.length - 1, Math.floor(done / per))
  return path.map((st, i) => ({ ...st, ...STATION_SPOTS[i], state: i < at ? 'done' : i === at ? 'here' : i === at + 1 ? 'next' : 'locked' }))
}
export const WORLD_DONE = { literacy: 14, maths: 12, evs: 9, computer: 6, general: 4 }

/* Lessons finished across every world, against everything there is to finish.
   Home's progress panel used to hardcode 65% / 12-of-20 and never read state at all, so
   a child could finish a mission, watch their Level go up in the same panel header, and
   see the progress ring sit exactly where it was. */
export const lessonProgress = (worldDone = {}) => {
  const done = WORLDS.reduce((n, w) => n + (worldDone[w.id] ?? WORLD_DONE[w.id] ?? 0), 0)
  const total = WORLDS.length * STATION_TOTAL
  return { done: Math.round(done), total, pct: Math.round((done / total) * 100) }
}

export const FACES = [1, 2, 3, 4].map(n => ({ id: n, thumb: `/art/kid${n}-face.webp`, sm: `/art/kid${n}-face-sm.webp` }))
export const OUTFITS = [
  { id: 'explorer', name: "Explorer's Jacket", blurb: 'Ready for every adventure, near or far.', thumb: '/art/avatar/body-explorer.webp', colors: ['#7c5cff', '#fbbf24', '#e5e7eb'] },
  { id: 'astro', name: 'Orbit Suit', blurb: 'Built for zero gravity and big ideas.', thumb: '/art/avatar/body-astro.webp', colors: ['#f97316', '#e5e7eb', '#3b82f6'] },
  { id: 'moonwalk', name: 'Moonwalk Armour', blurb: 'One small step, one giant lesson.', thumb: '/art/avatar/body-moonwalk.webp', colors: ['#e5e7eb', '#38bdf8', '#94a3b8'] },
  { id: 'ranger', name: 'Field Ranger', blurb: 'For expeditions that get a little muddy.', thumb: '/art/avatar/body-ranger.webp', colors: ['#84a13a', '#a06a3a', '#e5e7eb'] },
  { id: 'sprint', name: 'Sprint Hoodie', blurb: 'Comfy enough to think fast in.', thumb: '/art/avatar/body-sprint.webp', colors: ['#ef4444', '#1e3a8a', '#e5e7eb'] },
  { id: 'neon', name: 'Neon Circuit', blurb: 'Glows brighter the more you learn.', thumb: '/art/avatar/body-neon.webp', colors: ['#8b5cf6', '#22d3ee', '#e5e7eb'] },
]
/* Every face now has every outfit (face 3's were built by tools/avatar.py from the
   kid1 template). Any pair still missing falls back to the Explorer's Jacket so the
   preview never lies silently. */
const FACE_ART = { 1: OUTFITS.map(o => o.id), 2: OUTFITS.map(o => o.id), 3: OUTFITS.map(o => o.id), 4: OUTFITS.map(o => o.id) }
export const hasFaceArt = (outfit, face) => (FACE_ART[face] ?? []).includes(outfit)
export const spriteFor = (outfit = 'explorer', face = 1) => `/art/avatar/full-kid${face}-${hasFaceArt(outfit, face) ? outfit : 'explorer'}.webp`

export const INTERESTS = [
  { id: 'space', name: 'Space' }, { id: 'animals', name: 'Animals' }, { id: 'art', name: 'Art' }, { id: 'sports', name: 'Sports' },
  { id: 'dinosaurs', name: 'Dinosaurs' }, { id: 'music', name: 'Music' }, { id: 'nature', name: 'Nature' }, { id: 'inventions', name: 'Inventions' },
].map(i => ({ ...i, img: ['animals', 'art', 'space'].includes(i.id) ? `/art/new/interest-${i.id}.webp` : `/art/interests-hd/${i.id}.webp` }))

export const GOALS = [
  { id: 'school', title: 'Master school topics', desc: 'Build strong concepts and excel in school.', tag: 'Better grades, strong foundation', icon: '/art/goal-school.webp' },
  { id: 'confidence', title: 'Build confidence', desc: 'Improve self-belief and never give up.', tag: 'Growth mindset, fearless learning', icon: '/art/goal-confidence.webp' },
  { id: 'competition', title: 'Prepare for competitions', desc: 'Challenge yourself and achieve big.', tag: 'Sharpen skills, stand out', icon: '/art/goal-competition.webp' },
  { id: 'reading', title: 'Read more fluently', desc: 'Read better, faster and understand deeply.', tag: 'Stronger reading, better expression', icon: '/art/goal-reading.webp' },
  { id: 'explore', title: 'Explore beyond class', desc: 'Discover new things and follow your curiosity.', tag: 'Wider world, endless curiosity', icon: '/art/goal-explore.webp' },
]

export const WORLDS = [
  { id: 'literacy', name: 'Literacy', desc: 'Stories, reading and language', img: '/art/world-literacy.webp', pct: 70, done: 14, total: 20 },
  { id: 'maths', name: 'Maths', desc: 'Numbers, logic and problem solving', img: '/art/world-maths.webp', pct: 60, done: 12, total: 20 },
  { id: 'evs', name: 'EVS / Science', desc: 'Explore nature and our world', img: '/art/world-evs.webp', pct: 45, done: 9, total: 20 },
  { id: 'computer', name: 'Computer', desc: 'Tech, coding and creativity', img: '/art/world-computer.webp', pct: 30, done: 6, total: 20, locked: true },
  { id: 'general', name: 'General Awareness', desc: 'Current affairs and life skills', img: '/art/world-general.webp', pct: 20, done: 4, total: 20, locked: true },
]

export const JOURNEY = [
  { id: 'numbers', name: 'Number Forest', sub: 'Numbers', state: 'done', x: 705, y: 100 },
  { id: 'addition', name: 'Addition City', sub: 'Addition', state: 'done', x: 1180, y: 140 },
  { id: 'multiplication', name: 'Multiplication Station', sub: 'Multiplication', state: 'done', x: 660, y: 330 },
  { id: 'fractions', name: 'Fractions Galaxy', sub: 'Fractions', state: 'here', x: 1290, y: 410 },
  { id: 'decimals', name: 'Decimals', sub: 'Decimals', state: 'next', x: 700, y: 560 },
  { id: 'geometry', name: 'Geometry', sub: 'Geometry', state: 'locked', x: 790, y: 700 },
]

/* The syllabus a subject opens on: its current topic, what that topic covers across
   the three tracks, and the five lessons inside it. Keyed by world id so tapping any
   subject on the Learn Hub opens that subject's own page rather than everyone landing
   on Fractions. Five steps each, because the Topic screen's path art has five stops. */
export const TOPICS = {
  maths: {
    title: 'Fractions', subject: 'Maths',
    desc: 'Understand parts of a whole, equivalent fractions, compare and order, and solve real-world problems.',
    nova: 'Equivalent fractions show the same value even though the numerator and denominator change! ✨',
    tracks: [
      ['School Syllabus', ['Equivalent fractions', 'Compare and order'], 'Completed', 'done'],
      ['Kidsverse Plus', ['Visual models', 'Applications', 'Word problems'], 'In progress', 'progress'],
      ['Competition Edge', ['Higher-order reasoning'], 'Locked', 'locked'],
    ],
    steps: [
      { n: 1, name: 'What is a Fraction?', stars: 3, state: 'done' },
      { n: 2, name: 'Equivalent Fractions', stars: 3, state: 'done' },
      { n: 3, name: 'Compare & Order', stars: 2, state: 'current' },
      { n: 4, name: 'Add & Subtract', stars: 0, state: 'locked' },
      { n: 5, name: 'Word Problems', stars: 0, state: 'locked' },
    ],
  },
  literacy: {
    title: 'Comprehension', subject: 'Literacy',
    desc: 'Read closely, find the main idea, work out new words from context, and say what you think about a story.',
    nova: 'The main idea is what the whole passage is about — not just the bit you liked best! ✨',
    tracks: [
      ['School Syllabus', ['Main idea and detail', 'New words in context'], 'Completed', 'done'],
      ['Kidsverse Plus', ['Story mapping', 'Inference', 'Retelling'], 'In progress', 'progress'],
      ['Competition Edge', ['Author’s purpose'], 'Locked', 'locked'],
    ],
    steps: [
      { n: 1, name: 'Read for Meaning', stars: 3, state: 'done' },
      { n: 2, name: 'Main Idea', stars: 3, state: 'done' },
      { n: 3, name: 'New Words', stars: 2, state: 'current' },
      { n: 4, name: 'Reading Between Lines', stars: 0, state: 'locked' },
      { n: 5, name: 'Tell It Again', stars: 0, state: 'locked' },
    ],
  },
  evs: {
    title: 'Living Things', subject: 'EVS / Science',
    desc: 'Sort living from non-living, see what plants and animals need, and follow how they depend on each other.',
    nova: 'Every living thing needs food, water and air — that is how we tell it is alive! ✨',
    tracks: [
      ['School Syllabus', ['Living and non-living', 'Plant parts'], 'Completed', 'done'],
      ['Kidsverse Plus', ['Habitats', 'Food chains', 'Life cycles'], 'In progress', 'progress'],
      ['Competition Edge', ['Adaptation and survival'], 'Locked', 'locked'],
    ],
    steps: [
      { n: 1, name: 'Living or Not?', stars: 3, state: 'done' },
      { n: 2, name: 'Parts of a Plant', stars: 3, state: 'done' },
      { n: 3, name: 'Habitats', stars: 2, state: 'current' },
      { n: 4, name: 'Food Chains', stars: 0, state: 'locked' },
      { n: 5, name: 'Life Cycles', stars: 0, state: 'locked' },
    ],
  },
  computer: {
    title: 'Sequences', subject: 'Computer',
    desc: 'Put steps in the right order, spot a pattern that repeats, and tell a machine exactly what to do.',
    nova: 'A computer does exactly what you say — so the order of your steps is everything! ✨',
    tracks: [
      ['School Syllabus', ['Parts of a computer', 'Using a keyboard'], 'Completed', 'done'],
      ['Kidsverse Plus', ['Step by step', 'Patterns', 'Repeating a step'], 'In progress', 'progress'],
      ['Competition Edge', ['Debugging a sequence'], 'Locked', 'locked'],
    ],
    steps: [
      { n: 1, name: 'What is a Step?', stars: 3, state: 'done' },
      { n: 2, name: 'Right Order', stars: 3, state: 'done' },
      { n: 3, name: 'Spot the Pattern', stars: 2, state: 'current' },
      { n: 4, name: 'Repeat It', stars: 0, state: 'locked' },
      { n: 5, name: 'Fix the Mistake', stars: 0, state: 'locked' },
    ],
  },
  general: {
    title: 'Our Community', subject: 'General Awareness',
    desc: 'Meet the people who keep a place running, learn how to stay safe, and see what it means to help.',
    nova: 'A community works because everybody does their bit — including you! ✨',
    tracks: [
      ['School Syllabus', ['People who help us', 'Our country'], 'Completed', 'done'],
      ['Kidsverse Plus', ['Staying safe', 'Money sense', 'Being a good neighbour'], 'In progress', 'progress'],
      ['Competition Edge', ['Current affairs'], 'Locked', 'locked'],
    ],
    steps: [
      { n: 1, name: 'People Who Help', stars: 3, state: 'done' },
      { n: 2, name: 'My Neighbourhood', stars: 3, state: 'done' },
      { n: 3, name: 'Staying Safe', stars: 2, state: 'current' },
      { n: 4, name: 'Money Sense', stars: 0, state: 'locked' },
      { n: 5, name: 'Helping Out', stars: 0, state: 'locked' },
    ],
  },
}

export const topicFor = world => TOPICS[world] ?? TOPICS.maths

/* Kept for anything still importing the old flat list. */
export const TOPIC_STEPS = TOPICS.maths.steps

export const TESTS = [
  { id: 'quick', name: 'Quick Test', desc: '10 quick questions to warm up your brain.', time: '5 min', icon: 'ico-rocket' },
  { id: 'topic', name: 'Topic Test', desc: "Test any topic you're learning.", time: '10–15 min', icon: 'ico-book2' },
  { id: 'mixed', name: 'Mixed Concepts', desc: 'Mix of topics and concepts to level up your thinking.', time: 'About 8 min', q: '10 Questions', icon: 'ico-puzzle', recommended: true },
  { id: 'subject', name: 'Subject Test', desc: 'Test by subject and strengthen what you know.', time: '15–20 min', icon: 'ico-cap' },
  { id: 'higher', name: 'Higher Order', desc: 'Challenge your thinking with high-level questions.', time: '15 min', icon: 'ico-brain' },
  { id: 'competition', name: 'Competition Practice', desc: 'Practice like a champion with timed tests.', time: '20 min', icon: 'ico-trophy' },
  { id: 'long', name: 'Long Test', desc: 'Long test, big challenge. Are you ready?', time: '30–45 min', icon: 'ico-star2' },
  { id: 'best', name: 'Personal Best', desc: 'Beat your own score and set new records.', time: 'Anytime', icon: 'ico-medal' },
]

export const QUESTIONS = [
  { q: 'Which fraction is equivalent to', frac: [3, 4], options: [[6, 8], [2, 3], [9, 12], [5, 8]], answer: 0, hint1: 'Multiply top and bottom by the same number.', hint2: '3 × 2 = 6 and 4 × 2 = 8.' },
  { q: 'Which fraction is equivalent to', frac: [1, 2], options: [[2, 3], [3, 6], [1, 4], [4, 6]], answer: 1, hint1: 'Half of something.', hint2: '3 is half of 6.' },
  { q: 'Which fraction is equivalent to', frac: [2, 5], options: [[3, 5], [4, 10], [2, 10], [5, 2]], answer: 1, hint1: 'Double both numbers.', hint2: '2 × 2 = 4, 5 × 2 = 10.' },  { q: 'Which fraction is equivalent to', frac: [1, 3], options: [[2, 6], [1, 6], [3, 4], [2, 5]], answer: 0, hint1: 'Double the top and the bottom.', hint2: '1 × 2 = 2 and 3 × 2 = 6.' },
  { q: 'Which fraction is equivalent to', frac: [3, 5], options: [[5, 3], [6, 8], [6, 10], [3, 10]], answer: 2, hint1: 'Multiply both numbers by 2.', hint2: '3 × 2 = 6 and 5 × 2 = 10.' },
]
