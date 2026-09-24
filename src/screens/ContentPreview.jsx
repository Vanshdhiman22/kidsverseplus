import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, FileJson, Image as ImageIcon, Upload } from 'lucide-react'
import additionStudio from '../content/packages/addition-introduction.json'
import fallback from '../content/fractions-equal-parts.json'
import { normalizeContentPackage } from '../content/normalize.js'
import { clearPreviewStepImages, setPreviewStepImage } from '../content/index.js'

const KEY = 'kidsverse-content-preview'
const ACTIVE_KEY = 'kidsverse-content-preview-active'

function previewSubject(value) {
  const subject = String(value ?? '').toLowerCase()
  if (/english|literacy|language|reading/.test(subject)) return 'literacy'
  if (/environment|science|evs/.test(subject)) return 'evs'
  if (/computer|coding|technology/.test(subject)) return 'computer'
  if (/general/.test(subject)) return 'general'
  return 'maths'
}

function savedDraft() {
  try {
    const saved = sessionStorage.getItem(KEY)
    if (!saved) return null
    const content = JSON.parse(saved)
    return { content, normalized: normalizeContentPackage(content, 'addition-introduction', fallback), fileName: 'Current browser preview' }
  } catch { return null }
}

export default function ContentPreview() {
  const navigate = useNavigate()
  const [draft, setDraft] = useState(savedDraft)
  const [error, setError] = useState('')
  const [localImages, setLocalImages] = useState({})

  async function loadFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text())
      const content = parsed.data ?? parsed
      const normalized = normalizeContentPackage(content, 'addition-introduction', fallback)
      const steps = content.learn_before_test?.steps
      if (!Array.isArray(steps) || !['understand', 'example', 'remember'].every(key => steps.some(step => step.step_key === key))) {
        throw new Error('This package needs Understand, Example and Remember learning steps.')
      }
      sessionStorage.setItem(KEY, JSON.stringify(content))
      clearPreviewStepImages()
      setLocalImages({})
      setDraft({ content, normalized, fileName: file.name })
      setError('')
    } catch (cause) {
      setDraft(null)
      setError(cause instanceof SyntaxError ? 'This file is not valid JSON.' : cause.message)
    }
  }

  const openPreview = path => {
    sessionStorage.setItem(ACTIVE_KEY, '1')
    const url = new URL(path, window.location.origin)
    url.searchParams.set('subject', previewSubject(draft?.content?.curriculum?.subject))
    url.searchParams.set('contentPreview', '1')
    navigate(`${url.pathname}${url.search}`)
  }

  function loadStepImage(stepKey, event) {
    const file = event.target.files?.[0]
    if (!file) return
    setPreviewStepImage(stepKey, file)
    setLocalImages(images => ({ ...images, [stepKey]: file.name }))
  }

  return (
    <main className="min-h-screen bg-[#f5f5ff] px-6 py-10 text-ink">
      <div className="mx-auto max-w-[1100px]">
        <div className="flex items-center gap-4"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-violet-600 text-white"><BookOpen size={28} /></span><div><p className="label-caps text-primary-ink">Content Studio preview</p><h1 className="font-display text-[34px] font-extrabold">See your learning package in the game</h1></div></div>
        <p className="mt-4 max-w-[720px] text-[17px] text-ink-2">Download the JSON package from Content Studio, then select it here. Learning, Test, Challenge and Battle will use that package in this browser session.</p>
        <label className="mt-7 flex max-w-[720px] cursor-pointer items-center gap-4 rounded-[22px] border-2 border-dashed border-violet-300 bg-white p-6 transition hover:border-violet-600 focus-within:ring-4 focus-within:ring-violet-200"><Upload className="text-violet-600" size={30} /><span className="font-extrabold">Choose Content Studio JSON</span><input className="sr-only" type="file" accept=".json,application/json" onChange={loadFile} /></label>
        {error && <p role="alert" className="mt-3 max-w-[720px] rounded-xl bg-rose-50 px-4 py-3 font-semibold text-rose-700">{error}</p>}
        {draft && <>
          <div className="mt-7 flex flex-wrap items-center gap-3"><FileJson size={20} className="text-violet-600" /><span className="font-bold">{draft.fileName}</span><span className="text-ink-3">·</span><span>{draft.normalized.mission.title}</span><span className="text-ink-3">·</span><span>{draft.content.curriculum?.grade} {draft.content.curriculum?.subject}</span></div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">{draft.content.learn_before_test.steps.map((step, index) => <article key={step.step_key} className="rounded-[22px] border border-violet-100 bg-white p-5"><p className="label-caps text-primary-ink">Step {index + 1} · {step.step_key}</p><h2 className="mt-2 font-display text-[21px] font-extrabold">{step.title}</h2><p className="mt-2 text-[14px] text-ink-2">{step.teaching_text}</p><p className="mt-4 text-[13px] font-bold text-ink-3"><ImageIcon size={15} className="mr-1 inline" />{localImages[step.step_key] || (step.image_url ? 'Hosted step image included' : 'No image selected yet')}</p><label className="mt-2 block cursor-pointer rounded-xl border border-violet-200 px-3 py-2 text-[13px] font-bold text-primary-ink hover:bg-violet-50 focus-within:ring-4 focus-within:ring-violet-200">Choose downloaded step image<input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={event => loadStepImage(step.step_key, event)} /></label><p className="mt-3 border-t border-violet-100 pt-3 text-[13px] font-semibold">Tiny check: {step.mini_question?.question}</p></article>)}</div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={() => openPreview('/missions/fractions/learn')} className="rounded-2xl bg-violet-600 px-7 py-4 font-extrabold text-white transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-300">Open learning →</button>
            <button type="button" onClick={() => openPreview('/tests/mixed/intro')} className="rounded-2xl border border-violet-200 px-5 py-4 font-bold text-primary-ink">Open Test</button>
            <button type="button" onClick={() => openPreview('/tests/mixed/intro?source=challenge')} className="rounded-2xl border border-violet-200 px-5 py-4 font-bold text-primary-ink">Open Challenge</button>
            <button type="button" onClick={() => openPreview('/challenge/preview?bot=robo')} className="rounded-2xl border border-violet-200 px-5 py-4 font-bold text-primary-ink">Open Battle</button>
          </div>
          <button type="button" onClick={() => { sessionStorage.removeItem(ACTIVE_KEY); sessionStorage.removeItem(KEY); clearPreviewStepImages(); setDraft(null) }} className="ml-3 rounded-2xl border border-violet-200 px-5 py-4 font-bold text-primary-ink">Stop preview</button>
        </>}
        <p className="mt-7 max-w-[720px] text-[13px] leading-relaxed text-ink-3">Content Studio downloads generated images separately. Select each downloaded image above to preview it locally, or add a hosted image URL in Studio. Locally selected images stay available until this page is refreshed.</p>
        <p className="mt-3 text-[13px] text-ink-3">No package loaded? You can still <button type="button" className="font-bold text-primary-ink underline" onClick={() => { sessionStorage.setItem(KEY, JSON.stringify(additionStudio)); setDraft({ content: additionStudio, normalized: normalizeContentPackage(additionStudio, 'addition-introduction', fallback), fileName: 'Bundled sample' }) }}>preview the bundled sample</button>.</p>
      </div>
    </main>
  )
}
