import React from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, X } from 'lucide-react'
import Button from './Button.jsx'
import QuestionVisual from './QuestionVisual.jsx'

export default function AttemptReview({ open, title = 'Review your answers', items = [], onClose }) {
  return <AnimatePresence>{open && <motion.div className="absolute inset-0 z-[110] grid place-items-center bg-indigo-950/40 p-8 backdrop-blur-[7px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label={title}>
    <motion.section className="relative flex max-h-[820px] w-[1040px] flex-col overflow-hidden rounded-[34px] border-2 border-white/80 bg-white shadow-[0_32px_100px_rgba(44,35,110,.38)]" initial={{ y: 60, scale: .94 }} animate={{ y: 0, scale: 1 }} exit={{ y: 40, opacity: 0 }}>
      <header className="flex items-center border-b border-[var(--line)] px-8 py-6"><div><p className="label-caps text-primary-ink">Learn from every try</p><h2 className="font-display text-[34px] font-extrabold text-ink">{title}</h2></div><button className="ml-auto grid h-12 w-12 place-items-center rounded-full bg-violet-50 text-ink hover:bg-violet-100" onClick={onClose} aria-label="Close answer review"><X /></button></header>
      <div className="grid gap-5 overflow-y-auto p-7">
        {items.map((item, index) => <article key={`${item.question}-${index}`} className="grid grid-cols-[250px_1fr] gap-6 rounded-[24px] border-2 border-[var(--line)] bg-[#fbfaff] p-5">
          <div className="h-[170px] overflow-hidden rounded-[18px] bg-white"><QuestionVisual question={item.question} model={item.model} /></div>
          <div><p className="label-caps">Question {index + 1}</p><h3 className="mt-1 text-[20px] font-extrabold text-ink">{item.question}</h3><div className="mt-3 flex flex-wrap gap-3"><span className={`rounded-xl px-4 py-2 text-[15px] font-extrabold ${item.correct ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'}`}>{item.correct ? <Check className="mr-1 inline" size={17} /> : <X className="mr-1 inline" size={17} />}Your answer: {item.selectedLabel || 'No answer'}</span>{!item.correct && <span className="rounded-xl bg-emerald-100 px-4 py-2 text-[15px] font-extrabold text-emerald-800">Correct answer: {item.answerLabel}</span>}{item.hintsUsed > 0 && <span className="rounded-xl bg-amber-100 px-4 py-2 text-[15px] font-extrabold text-amber-800">Hints used: {item.hintsUsed}</span>}</div><p className="mt-3 text-[16px] font-semibold leading-relaxed text-ink-2">{item.explanation}</p></div>
        </article>)}
        {!items.length && <p className="py-12 text-center text-[19px] font-bold text-ink-3">Complete a quiz to review your answers.</p>}
      </div>
      <footer className="border-t border-[var(--line)] bg-white px-8 py-5"><Button className="ml-auto h-[54px] w-[220px]" onClick={onClose}>Done Reviewing</Button></footer>
    </motion.section>
  </motion.div>}</AnimatePresence>
}
