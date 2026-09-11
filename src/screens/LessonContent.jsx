import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft, BookOpen, Check, Lightbulb, Play, Sparkles, Star } from 'lucide-react'
import Page from '../components/Page.jsx'
import { Panel, Card } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import { LessonVisual } from '../components/LessonModels.jsx'
import { visualSource } from '../content/visuals.js'
import { ACTIVE_CONTENT_ID, discoverContent, useContent } from '../content/index.js'
import { useGame } from '../state/GameProvider.jsx'
import { sfx } from '../lib/sound.js'

const sentence = value => String(value ?? '').trim()

const studioVideoList = learning => {
  const videos = learning?.video_urls ?? learning?.videos
  if (Array.isArray(videos)) return videos.map(item => typeof item === 'string' ? item : item?.url).filter(Boolean)
  return [learning?.video_url ?? learning?.ai_video_url].filter(Boolean)
}

function learningPages(pkg) {
  const content = discoverContent(pkg)
  const studio = pkg.studio?.learning_content
  const hints = content.hints ?? []
  return [
    {
      eyebrow: 'STEP 1 · UNDERSTAND',
      title: `What is ${pkg.mission.title}?`,
      body: sentence(studio?.explanation) || content.think_about.text,
      callout: content.think_about.text,
      nova: content.nova.speech,
      icon: BookOpen,
    },
    {
      eyebrow: 'STEP 2 · SEE AN EXAMPLE',
      title: 'Let’s see how it works',
      body: sentence(studio?.teaching_method) || content.prompt.statement,
      callout: content.prompt.statement,
      nova: hints[1] || hints[0] || 'Look at the picture and follow each small step.',
      icon: Play,
    },
    {
      eyebrow: 'STEP 3 · REMEMBER',
      title: 'Your quick learning rule',
      body: hints.join(' ') || content.think_about.text,
      callout: hints.at(-1) || content.think_about.text,
      nova: studio?.nova_feedback || 'You are ready! Use this rule in the quiz.',
      icon: Lightbulb,
    },
  ]
}

export default function LessonContent() {
  const nav = useNavigate()
  const game = useGame()
  const pkg = useContent(ACTIVE_CONTENT_ID)
  const content = discoverContent(pkg)
  const pages = useMemo(() => learningPages(pkg), [pkg])
  const [page, setPage] = useState(0)
  const [videoFailed, setVideoFailed] = useState(false)
  const current = pages[page]
  const Icon = current.icon
  const last = page === pages.length - 1
  const progress = ((page + 1) / pages.length) * 100
  const lessonVideos = studioVideoList(pkg.studio?.learning_content)
  const videoUrl = lessonVideos[page] ?? lessonVideos[0] ?? content.model.video_url ?? content.model.video
  const poster = pkg.studio?.learning_content?.video_poster_url ?? visualSource(content.model)

  useEffect(() => setVideoFailed(false), [videoUrl])

  const previous = () => {
    sfx.tap()
    if (page === 0) nav('/missions/fractions')
    else setPage(value => value - 1)
  }
  const next = () => {
    sfx.whoosh()
    if (last) nav('/missions/fractions/spot-mistake')
    else setPage(value => value + 1)
  }

  return (
    <Page>
      <Panel className="absolute left-[28px] top-[24px] w-[1624px] h-[812px] p-0 overflow-hidden">
        <header className="h-[112px] px-10 flex items-center border-b border-[var(--line)] bg-[var(--glass)]">
          <div className="w-[54px] h-[54px] rounded-[18px] grid place-items-center text-white" style={{ background: 'var(--grad-primary)', boxShadow: 'var(--glow-primary)' }}>
            <BookOpen size={28} strokeWidth={2.5} />
          </div>
          <div className="ml-4">
            <div className="text-[12px] font-extrabold tracking-[0.16em] text-primary-ink">LEARN BEFORE YOU QUIZ</div>
            <h1 className="font-display font-extrabold text-[30px] leading-tight text-ink">{pkg.mission.title} <span className="text-gold">{pkg.mission.emoji}</span></h1>
          </div>
          <div className="ml-auto w-[480px]">
            <div className="mb-2 flex justify-between text-[14px] font-extrabold text-ink-2">
              <span>Learning progress</span><span>{page + 1} of {pages.length}</span>
            </div>
            <div className="h-[10px] rounded-full bg-[var(--lavender-2)] overflow-hidden">
              <motion.div className="h-full rounded-full" style={{ background: 'var(--grad-primary)' }} animate={{ width: `${progress}%` }} transition={{ type: 'spring', stiffness: 180, damping: 24 }} />
            </div>
          </div>
          <span className="ml-7 pill h-[48px] px-4 gap-2 text-[16px] font-extrabold text-ink"><Star size={19} fill="currentColor" className="text-gold" /> {game.state.stats.xp.toLocaleString()} XP</span>
        </header>

        <div className="absolute left-[42px] top-[138px] w-[1050px] h-[585px]">
          <AnimatePresence mode="wait">
            <motion.div key={page} className="absolute inset-0" initial={{ opacity: 0, x: 34 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.24 }}>
              <div className="flex items-center gap-3">
                <span className="icon-orb w-[46px] h-[46px]"><Icon size={23} /></span>
                <span className="text-[13px] font-extrabold tracking-[0.14em] text-primary-ink">{current.eyebrow}</span>
              </div>
              <h2 className="mt-4 font-display font-extrabold text-[48px] leading-[1.06] text-ink">{current.title}</h2>
              <p className="mt-5 max-w-[965px] text-[22px] font-semibold leading-[1.55] text-ink-2">{current.body}</p>

              <Card className="mt-7 p-5 flex items-start gap-4 border-[var(--primary)] bg-[var(--tint-primary)]">
                <span className="w-[42px] h-[42px] rounded-full grid place-items-center shrink-0 bg-white text-primary-ink shadow-sm"><Sparkles size={21} /></span>
                <div><div className="text-[13px] font-extrabold tracking-[0.12em] text-primary-ink">KEY IDEA</div><p className="mt-1 text-[19px] font-extrabold leading-snug text-ink">{current.callout}</p></div>
              </Card>

              <div className="mt-6 flex gap-3">
                {pages.map((item, index) => (
                  <div key={item.eyebrow} className={`h-[58px] flex-1 rounded-[17px] border px-4 flex items-center gap-3 ${index <= page ? 'border-[var(--primary)] bg-[var(--tint-primary)]' : 'border-[var(--line)] bg-[var(--glass)]'}`}>
                    <span className={`w-[28px] h-[28px] rounded-full grid place-items-center text-[13px] font-extrabold ${index < page ? 'bg-green-500 text-white' : index === page ? 'text-white' : 'bg-[var(--lavender-2)] text-ink-3'}`} style={index === page ? { background: 'var(--grad-primary)' } : undefined}>{index < page ? <Check size={16} strokeWidth={3} /> : index + 1}</span>
                    <span className="text-[14px] font-extrabold text-ink">{['Understand', 'See an example', 'Remember'][index]}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <aside className="absolute right-[35px] top-[138px] w-[470px] h-[585px]">
          <Card className="relative h-full p-0 overflow-hidden bg-[#11152f]">
            {videoUrl && !videoFailed ? (
              <video
                key={`${page}:${videoUrl}`}
                className="absolute inset-0 w-full h-full object-cover"
                src={videoUrl}
                poster={poster || undefined}
                controls
                playsInline
                preload="metadata"
                aria-label={`AI video lesson: ${current.title}`}
                onError={() => setVideoFailed(true)}
              />
            ) : (
              <div className="absolute inset-0 bg-white">
                <LessonVisual model={content.model} fill />
                <div className="absolute inset-0 grid place-items-center bg-[rgba(17,21,47,.2)]">
                  <div className="rounded-full w-[76px] h-[76px] grid place-items-center text-white backdrop-blur-md border border-white/70 shadow-xl bg-[rgba(88,66,220,.78)]" aria-label="AI lesson video poster">
                    <Play size={34} fill="currentColor" className="ml-1" />
                  </div>
                </div>
              </div>
            )}
            <div className="absolute top-4 left-4 z-10 rounded-full px-4 py-2 text-[12px] font-extrabold tracking-[0.12em] text-white bg-[rgba(17,21,47,.68)] backdrop-blur-md pointer-events-none">
              AI VIDEO LESSON · STEP {page + 1}
            </div>
          </Card>
        </aside>

        <footer className="absolute left-0 right-0 bottom-0 h-[88px] px-10 flex items-center justify-between border-t border-[var(--line)] bg-[var(--glass)]">
          <Button variant="outline" size="sm" icon={<ArrowLeft size={20} />} className="h-[54px] px-7 text-[18px]" onClick={previous}>{page === 0 ? 'Back to Introduction' : 'Previous'}</Button>
          <p className="text-[15px] font-bold text-ink-3">Read each step carefully. The quiz starts after Step 3.</p>
          <Button size="md" arrow className="h-[58px] min-w-[230px] text-[19px] uppercase" onClick={next}>{last ? 'Start Quiz' : 'Continue Learning'}</Button>
        </footer>
      </Panel>
    </Page>
  )
}
