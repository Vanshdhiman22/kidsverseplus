import React from 'react'

/** Artwork comes from Content Studio. An empty slot is safer than an unrelated image. */
export default function QuestionVisual({ question, model }) {
  const hasQuestionImage = model?.image && model.image_source !== 'lesson_fallback'
  return <div className="w-full h-full rounded-[24px] border border-[var(--line)] bg-white/70 overflow-hidden">
    {hasQuestionImage && <img src={model.image} alt={model.alt || question} className="w-full h-full object-contain" />}
  </div>
}
