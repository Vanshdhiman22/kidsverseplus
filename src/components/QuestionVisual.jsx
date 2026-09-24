import React from 'react'
import { motion } from 'motion/react'
import { countableGroups } from './question-visual-model.js'

const iconFor = text => {
  const value = String(text).toLowerCase()
  if (/ball/.test(value)) return '●'
  if (/toy/.test(value)) return '🧸'
  if (/block/.test(value)) return '🧱'
  if (/pencil/.test(value)) return '✏️'
  if (/flower/.test(value)) return '🌸'
  if (/cookie/.test(value)) return '🍪'
  if (/book/.test(value)) return '📘'
  if (/car/.test(value)) return '🚗'
  if (/apple|orange|fruit|basket/.test(value)) return '🍎'
  if (/sticker|star/.test(value)) return '⭐'
  return '●'
}

const conceptFor = text => {
  const value = String(text).toLowerCase()
  if (/story|read|sentence|maya|ravi|kite|sara|puppy/.test(value)) return { icons: ['📖', '👧', '🐦', '💧'], label: 'Read • Notice • Understand' }
  if (/living|plant|animal|water|sun|soil|root|surrounding/.test(value)) return { icons: ['🌱', '🪨', '🌳', '💧'], label: 'Explore our living world' }
  if (/computer|device|monitor|mouse|keyboard|speaker|sequence|robot/.test(value)) return { icons: ['🖥️', '⌨️', '🖱️', '🔊'], label: 'Look at the computer tools' }
  if (/community|doctor|teacher|fire|road|farmer|india|hands/.test(value)) return { icons: ['🧑‍⚕️', '🧑‍🏫', '🧑‍🚒', '🧑‍🌾'], label: 'People who help our community' }
  return { icons: ['👀', '🧠', '✨'], label: 'Look for the best clue' }
}

const VisualGroup = ({ count, icon, tone, label, compact }) => (
  <div className={`min-w-0 flex-1 max-w-[250px] rounded-[22px] border border-white/90 bg-white/95 text-center shadow-[0_14px_35px_-25px_rgba(44,32,110,.7)] ${compact ? 'px-1 py-2' : 'px-3 py-4'}`}>
    <div className={`flex flex-wrap items-center justify-center ${compact ? 'min-h-[32px] gap-1' : 'min-h-[58px] gap-2'}`}>
      {Array.from({ length: Math.min(Math.max(count, 0), 10) }, (_, index) => <motion.span key={index} initial={{ opacity: 0, scale: .35, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: index * .06 }} className={`grid place-items-center rounded-full ${compact ? 'h-5 w-5 text-[15px]' : 'h-9 w-9 text-[25px]'} ${tone}`} aria-hidden="true">{icon}</motion.span>)}
      {count === 0 && <span className={`${compact ? 'text-[24px]' : 'text-[42px]'} font-display font-extrabold text-ink-3`}>0</span>}
    </div>
    <p className={`${compact ? 'mt-1 text-[13px]' : 'mt-2 text-[20px]'} font-display font-extrabold text-ink`}>{count} {count === 1 ? label.replace(/s$/, '') : label}</p>
  </div>
)

/** Content Studio art wins. Until it arrives, the question draws its own countable model. */
export default function QuestionVisual({ question, model, compact = false }) {
  const hasQuestionImage = model?.image && model.image_source !== 'lesson_fallback'
  const groups = countableGroups(question)
  const icon = iconFor(question)
  const label = String(question).toLowerCase().match(/(blocks?|balls?|toys?|pencils?|flowers?|cookies?|books?|cars?|apples?|oranges?|stickers?|stars?)/)?.[1] || 'items'
  const concept = conceptFor(question)
  return <div className="relative w-full h-full rounded-[20px] border-2 border-[var(--primary)] bg-gradient-to-br from-white via-violet-50/80 to-sky-50 overflow-hidden shadow-[0_20px_55px_-34px_rgba(93,67,238,.75)]">
    <span className={`absolute z-10 rounded-full border border-[var(--line)] bg-white/95 font-extrabold tracking-[0.14em] text-primary-ink uppercase ${compact ? 'left-2 top-1 px-2 py-0.5 text-[8px]' : 'left-4 top-4 px-3 py-1 text-[11px]'}`}>Look closely</span>
    {hasQuestionImage ? <img src={model.image} alt={model.alt || question} className={`w-full h-full object-contain ${compact ? 'p-1' : 'p-2'}`} /> : <div className={`flex h-full items-center justify-center ${compact ? 'gap-1 px-2 pt-4' : 'gap-3 px-4 pt-7'}`} role="img" aria-label={`Picture showing ${question}`}>
      {groups ? <>{groups.map((count, index) => <React.Fragment key={`${count}-${index}`}>{index > 0 && <span className={`shrink-0 font-display font-extrabold text-violet-600 ${compact ? 'text-[22px]' : 'text-[38px]'}`}>+</span>}<VisualGroup count={count} icon={icon} tone={index % 2 ? 'bg-sky-100 text-sky-600' : 'bg-violet-100 text-violet-600'} label={label} compact={compact} /></React.Fragment>)}<span className={`shrink-0 font-display font-extrabold text-violet-600 ${compact ? 'text-[22px]' : 'text-[38px]'}`}>= ?</span></> : <div className="w-full text-center"><div className="flex items-center justify-center gap-3">{concept.icons.map((item, index) => <motion.span key={item} initial={{ opacity: 0, y: 16, scale: .7 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: index * .08 }} className="grid h-[76px] w-[76px] place-items-center rounded-[22px] border border-white bg-white text-[42px] shadow-sm">{item}</motion.span>)}</div><p className="mt-3 font-display text-[19px] font-extrabold text-primary-ink">{concept.label}</p></div>}
    </div>}
  </div>
}
