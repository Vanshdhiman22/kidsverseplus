import React from 'react'

/** Artwork comes from Content Studio. An empty slot is safer than an unrelated image. */
export default function QuestionVisual({ question, model }) {
  const hasQuestionImage = model?.image && model.image_source !== 'lesson_fallback'
  return <div className="relative w-full h-full rounded-[20px] border-2 border-[var(--primary)] bg-white/80 overflow-hidden shadow-[0_20px_55px_-34px_rgba(93,67,238,.75)]">
    <span className="absolute left-4 top-4 z-10 rounded-full border border-[var(--line)] bg-white/90 px-3 py-1 text-[11px] font-extrabold tracking-[0.14em] text-primary-ink uppercase">Look closely</span>
    {hasQuestionImage && <img src={model.image} alt={model.alt || question} className="w-full h-full object-contain p-2" />}
  </div>
}
