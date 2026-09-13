import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { BookOpen, Check, ChevronLeft, Lightbulb, Play, Star, Volume2 } from 'lucide-react'
import Page from '../components/Page.jsx'
import Scene from '../components/Scene.jsx'
import Button from '../components/Button.jsx'
import { discoverContent, routeSubject, useRouteContent, withSubject } from '../content/index.js'
import { sfx } from '../lib/sound.js'
import { speak } from '../lib/voice.js'
import { cn } from '../lib/utils.js'
import QuestionVisual from '../components/QuestionVisual.jsx'

export default function GuidedLearning() {
  const nav = useNavigate()
  const pkg = useRouteContent()
  const content = discoverContent(pkg)
  const learning = pkg.studio?.learning_content ?? {}
  const subject = routeSubject()
  const hints = Array.isArray(learning.hints) ? learning.hints : []
  const [step, setStep] = useState(0)
  const [quickPick, setQuickPick] = useState(null)
  const liveConceptImage = /^https?:\/\//i.test(content.model.image ?? '') ? content.model.image : null
  const steps = [
    {
      label: 'Understand', icon: BookOpen,
      kicker: 'Step 1 · Understand',
      title: `Let’s understand ${pkg.mission.title}`,
      body: learning.teaching_method || content.model.caption,
      key: pkg.learning_objective,
      speech: content.nova.speech,
    },
    {
      label: 'See an example', icon: Play,
      kicker: 'Step 2 · See an example',
      title: 'Let’s see how it works',
      body: learning.explanation || content.prompt.statement,
      key: learning.explanation || content.prompt.statement,
      speech: hints[1] || learning.explanation || content.hints?.[1] || 'Look closely at the example.',
    },
    {
      label: 'Remember', icon: Lightbulb,
      kicker: 'Step 3 · Remember',
      title: 'Your quick learning rule',
      body: hints.join(' ') || content.think_about.text,
      key: hints[2] || content.think_about.text,
      speech: learning.nova_feedback || 'Great job! You are ready to try the quiz.',
    },
  ]
  const current = steps[step]
  const Icon = current.icon
  const equation = String(learning.explanation ?? '').match(/(\d+)\s*\+\s*(\d+)\s*=\s*(\d+)/)
  const example = equation ? equation.slice(1).map(Number) : [3, 2, 5]
  const mathsDemo = /math/i.test(pkg.subject)
  const quickQuestion = pkg.check.questions[0]
  const goNext = () => {
    sfx.whoosh()
    if (step === 2) nav(withSubject('/missions/fractions/spot-mistake'))
    else setStep(value => value + 1)
  }
  const quickCorrect = mathsDemo ? quickPick === example[2] : quickPick === quickQuestion.answer

  return (
    <Page>
      <Scene name="discover" />
      <div className="absolute inset-x-[70px] top-[42px] bottom-[42px] rounded-[36px] border border-white/90 bg-white/92 shadow-[0_30px_90px_rgba(52,45,130,.18)] backdrop-blur-xl overflow-hidden">
        <header className="h-[112px] px-10 flex items-center border-b border-[var(--line)] bg-white/75">
          <span className="w-[58px] h-[58px] rounded-[18px] grid place-items-center text-white bg-gradient-to-br from-violet-600 to-blue-500 shadow-lg"><BookOpen size={31} /></span>
          <div className="ml-4"><p className="label-caps text-primary-ink">Learn before you quiz</p><h1 className="font-display font-extrabold text-[29px] text-ink leading-tight">{pkg.mission.title} {pkg.mission.emoji}</h1></div>
          <div className="ml-auto w-[480px]"><div className="flex justify-between text-[14px] font-extrabold text-ink mb-2"><span>Learning progress</span><span>{step + 1} of 3</span></div><div className="h-[10px] rounded-full bg-[var(--lavender-2)] overflow-hidden"><motion.div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-blue-500" animate={{ width: `${((step + 1) / 3) * 100}%` }} /></div></div>
          <span className="pill h-[52px] px-5 ml-7 gap-2 font-display font-extrabold text-[19px]"><Star size={20} fill="currentColor" className="text-gold" /> {pkg.mission.xp} XP</span>
        </header>

        <motion.div key={step} initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} className="absolute left-[44px] top-[145px] right-[510px] bottom-[112px]">
          <div className="flex items-center gap-3 text-primary-ink"><span className="w-[44px] h-[44px] rounded-full grid place-items-center bg-[var(--lavender)]"><Icon size={23} /></span><span className="label-caps text-[14px]">{current.kicker}</span></div>
          <h2 className="mt-5 font-display font-extrabold text-[43px] leading-tight text-ink">{current.title}</h2>
          {step === 1 ? <WorkedExample values={example} subject={subject} learning={learning} question={quickQuestion} /> : step === 2 ? <RememberRule learning={learning} fallback={content.think_about.text} values={example} subject={subject} /> : <>
            <p className="mt-5 text-[21px] font-semibold leading-[1.55] text-ink-2 max-w-[900px]">{current.body}</p>
            <div className="mt-7 rounded-[22px] border-2 border-violet-400 bg-white px-6 py-5 flex gap-4 shadow-[0_12px_28px_rgba(102,74,220,.09)]"><span className="w-11 h-11 shrink-0 rounded-full grid place-items-center bg-violet-50 text-violet-600"><Lightbulb size={23} /></span><div><p className="label-caps text-primary-ink">Key idea</p><p className="mt-1 text-[18px] font-extrabold leading-snug text-ink">{current.key}</p></div></div>
            <div className="mt-4 flex items-center gap-4 rounded-[20px] bg-violet-50 px-5 py-3"><div className="flex-1"><p className="label-caps text-primary-ink">Quick picture check</p><p className="text-[16px] font-extrabold text-ink">{mathsDemo ? `${example[0]} dots and ${example[1]} dots make how many?` : quickQuestion.instruction}</p></div><div className="flex gap-2">{(mathsDemo ? [example[2] - 1, example[2], example[2] + 1] : quickQuestion.options).map(option => { const value = mathsDemo ? option : option.key; const label = mathsDemo ? option : option.label; const right = mathsDemo ? value === example[2] : value === quickQuestion.answer; return <button key={value} className={cn('min-h-12 rounded-xl border-2 bg-white px-3 font-display text-[16px] font-extrabold transition', mathsDemo && 'w-14 text-[20px]', quickPick === value && (quickCorrect ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-rose-400 bg-rose-50 text-rose-700'))} onClick={() => { setQuickPick(value); right ? sfx.success() : sfx.wrong() }} aria-label={`${label}`}>{label}</button> })}</div><span className={cn('w-[105px] text-[14px] font-extrabold', quickPick == null ? 'text-ink-3' : quickCorrect ? 'text-emerald-700' : 'text-rose-600')}>{quickPick == null ? 'Choose one' : quickCorrect ? 'Yes, correct!' : 'Look again'}</span></div>
          </>}
          <div className={cn('grid grid-cols-3 gap-3', step === 1 ? 'mt-5' : 'mt-6')}>
            {steps.map((item, index) => <div key={item.label} className={cn('h-[58px] rounded-[17px] border-2 px-4 flex items-center gap-3 font-extrabold', index === step ? 'border-violet-500 bg-violet-50' : index < step ? 'border-emerald-300 bg-emerald-50' : 'border-[var(--line)] bg-white')}><span className={cn('w-8 h-8 rounded-full grid place-items-center', index < step ? 'bg-emerald-500 text-white' : index === step ? 'bg-violet-600 text-white' : 'bg-[var(--lavender)] text-ink-3')}>{index < step ? <Check size={18} strokeWidth={3} /> : index + 1}</span>{item.label}</div>)}
          </div>
        </motion.div>

        <aside className="absolute right-[34px] top-[140px] bottom-[112px] w-[430px] rounded-[28px] border border-[var(--line)] bg-white overflow-hidden shadow-[0_18px_45px_rgba(55,48,130,.12)]">
          <div className="absolute left-4 top-4 z-10 rounded-full bg-[#57507f] px-5 py-2 text-[13px] font-extrabold tracking-wider text-white uppercase">Nova teaches · Step {step + 1}</div>
          {liveConceptImage ? <img src={liveConceptImage} alt={content.model.alt} className="absolute inset-0 w-full h-full object-cover opacity-70" /> : <div className="absolute inset-x-5 top-[70px] h-[300px]"><QuestionVisual question={current.body} model={null} /></div>}
          <button onClick={() => speak(current.speech)} className={cn('absolute rounded-[20px] border border-white bg-white/95 p-4 text-left shadow-xl backdrop-blur', liveConceptImage ? 'right-4 top-[170px] w-[230px]' : 'inset-x-4 bottom-4')}><div className="flex items-center justify-between"><p className="label-caps text-primary-ink">Nova says</p><Volume2 size={18} className="text-primary-ink" /></div><p className="mt-2 text-[14px] font-bold leading-snug text-ink-2">{current.speech}</p><span className="mt-3 block text-[12px] font-extrabold text-primary-ink">Tap to listen</span></button>
        </aside>

        <footer className="absolute inset-x-0 bottom-0 h-[88px] px-10 border-t border-[var(--line)] bg-white/85 flex items-center justify-between">
          <button className="h-[54px] px-6 rounded-[17px] border-2 border-violet-500 text-primary-ink font-extrabold flex items-center gap-2" onClick={() => step === 0 ? nav(withSubject('/missions/fractions')) : setStep(value => value - 1)}><ChevronLeft size={20} />{step === 0 ? 'Back to introduction' : 'Previous'}</button>
          <p className="text-[14px] font-bold text-ink-3">Learn each step. The quiz starts after Step 3.</p>
          <Button arrow className="w-[260px] h-[56px] uppercase text-[18px]" disabled={step === 0 && !quickCorrect} onClick={goNext}>{step === 2 ? 'Start Quiz' : 'Continue Learning'}</Button>
        </footer>
      </div>
    </Page>
  )
}

const SUBJECT_EXAMPLES = {
  literacy: { eyebrow: 'Read the mini story', text: 'Maya sees a thirsty bird. She gives it water.', parts: [['👧', 'Who?', 'Maya'], ['💧', 'What happened?', 'Gave water'], ['🐦', 'Big idea', 'Maya helped']], answer: 'Maya is the helpful character.' },
  evs: { eyebrow: 'Look and compare', text: 'A seed drinks water and grows into a plant. A stone stays the same.', parts: [['🌱', 'Needs water', 'Yes'], ['📈', 'Can grow', 'Yes'], ['🪨', 'Stone grows?', 'No']], answer: 'The plant is living because it needs water and grows.' },
  computer: { eyebrow: 'Follow the order', text: 'To start using a computer, follow each step in sequence.', parts: [['1️⃣', 'First', 'Power on'], ['2️⃣', 'Next', 'Open program'], ['3️⃣', 'Then', 'Start work']], answer: 'A computer follows instructions in the order we give them.' },
  general: { eyebrow: 'Match the helper', text: 'Different people help our community in different ways.', parts: [['🩺', 'Feeling sick?', 'Doctor'], ['🔥', 'There is a fire?', 'Firefighter'], ['📚', 'Want to learn?', 'Teacher']], answer: 'Look at the job, then choose the right community helper.' },
}

function WorkedExample({ values, subject, learning }) {
  const [first, second, total] = values
  const demo = SUBJECT_EXAMPLES[subject]
  if (demo) return (
    <div className="mt-5">
      <p className="label-caps text-primary-ink">{demo.eyebrow}</p>
      <p className="mt-2 text-[20px] font-semibold leading-relaxed text-ink-2">{learning.explanation || demo.text}</p>
      <div className="mt-5 grid grid-cols-3 gap-4">
        {demo.parts.map(([emoji, label, value], index) => <motion.div key={label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .1 }} className="min-h-[150px] rounded-[22px] border-2 border-[var(--line)] bg-white p-4 text-center shadow-sm"><span className="text-[44px]">{emoji}</span><p className="mt-2 label-caps text-primary-ink">{label}</p><p className="mt-1 font-display text-[20px] font-extrabold text-ink">{value}</p></motion.div>)}
      </div>
      <div className="mt-4 rounded-[20px] border-2 border-violet-400 bg-violet-50/60 px-6 py-4 text-center font-display text-[20px] font-extrabold text-ink">{demo.answer}</div>
    </div>
  )
  return (
    <div className="mt-5">
      <p className="text-[18px] font-semibold text-ink-2">Count both groups, then put them together.</p>
      <div className="mt-4 grid grid-cols-[1fr_54px_1fr_54px_1fr] items-stretch gap-2">
        <CountCard number={first} label="First group" color="bg-violet-500" />
        <span className="grid place-items-center font-display font-extrabold text-[38px] text-primary-ink">+</span>
        <CountCard number={second} label="Second group" color="bg-sky-500" />
        <span className="grid place-items-center font-display font-extrabold text-[38px] text-primary-ink">=</span>
        <CountCard number={total} label="Total" color="bg-emerald-500" highlight />
      </div>
      <div className="mt-4 rounded-[20px] border-2 border-violet-400 bg-violet-50/60 px-6 py-4 flex items-center justify-center gap-4">
        <span className="font-display font-extrabold text-[30px] text-ink">{first} + {second} = {total}</span>
        <span className="text-[17px] font-extrabold text-primary-ink">We have {total} altogether!</span>
      </div>
    </div>
  )
}

function CountCard({ number, label, color, highlight }) {
  const count = Math.min(Math.max(number, 0), 10)
  return (
    <div className={cn('min-h-[150px] rounded-[22px] border-2 bg-white p-4 text-center shadow-sm', highlight ? 'border-emerald-400' : 'border-[var(--line)]')}>
      <p className="label-caps">{label}</p>
      <div className="mt-3 min-h-[54px] flex flex-wrap items-center justify-center gap-2">
        {Array.from({ length: count }, (_, index) => <motion.span key={index} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: index * .05 }} className={cn('w-5 h-5 rounded-full border-2 border-white shadow', color)} />)}
      </div>
      <p className="mt-2 font-display font-extrabold text-[30px] leading-none text-ink">{number}</p>
    </div>
  )
}

function RememberRule({ learning, fallback, values, subject }) {
  const [first, second, total] = values
  const rules = [
    learning.hints?.[0] || 'Look at the two groups.',
    learning.hints?.[1] || 'Count the first group, then count on.',
    learning.hints?.[2] || fallback || 'The final number is the total.',
  ]
  const subjectRule = SUBJECT_EXAMPLES[subject]?.answer
  return (
    <div className="mt-5">
      <p className="text-[18px] font-semibold text-ink-2">Remember these three little actions:</p>
      <div className="mt-4 grid grid-cols-3 gap-4">
        {rules.map((rule, index) => (
          <motion.div key={index} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .1 }} className="min-h-[142px] rounded-[22px] border-2 border-[var(--line)] bg-white p-5 shadow-sm">
            <span className={cn('w-10 h-10 rounded-full grid place-items-center text-white font-display font-extrabold text-[20px]', index === 0 ? 'bg-violet-500' : index === 1 ? 'bg-sky-500' : 'bg-emerald-500')}>{index + 1}</span>
            <p className="mt-3 text-[16px] font-extrabold leading-snug text-ink">{rule}</p>
          </motion.div>
        ))}
      </div>
      <div className="mt-4 rounded-[22px] border-2 border-emerald-400 bg-emerald-50/70 px-6 py-4 flex items-center gap-5">
        <span className="w-12 h-12 rounded-full grid place-items-center bg-emerald-500 text-white"><Check size={27} strokeWidth={3} /></span>
        <div className="flex-1"><p className="label-caps text-emerald-700">Say it with Nova</p><p className="mt-1 text-[17px] font-extrabold text-ink">“{subjectRule || 'Put the groups together and count the total.'}”</p></div>
        {subject === 'maths' && <span className="rounded-[15px] bg-white px-5 py-3 font-display font-extrabold text-[27px] text-primary-ink shadow-sm">{first} + {second} = {total}</span>}
      </div>
    </div>
  )
}
