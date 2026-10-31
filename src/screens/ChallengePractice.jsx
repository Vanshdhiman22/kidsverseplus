import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Volume2, Lightbulb, Check } from 'lucide-react'
import Page from '../components/Page.jsx'
import { useGame } from '../state/GameProvider.jsx'
import { apiRequest } from '../lib/api.js'
import { loadLearningPath } from '../lib/gameApi.js'
import { useLiveResource } from '../lib/useLiveResource.js'
import { createChallengePractice, practiceCorrect } from '../lib/challenge-practice.js'
import { speak } from '../lib/voice.js'
import './ChallengePractice.css'

const practice = createChallengePractice({ request: apiRequest, resolveTopic: loadLearningPath })

function PracticeRun({ data, onChoose }) {
  const [index, setIndex] = useState(0)
  const [picks, setPicks] = useState([])
  const [checked, setChecked] = useState(false)
  const [hints, setHints] = useState(0)
  const [results, setResults] = useState([])
  const [finished, setFinished] = useState(false)
  const title = useRef(null)
  const question = data.questions[index]
  const correct = practiceCorrect(question, picks)
  const model = question.models[0]
  const answers = Array.isArray(question.answer) ? question.answer : [question.answer]
  const answerLabel = question.options.filter(option => answers.includes(option.key)).map(option => option.label).join(', ')
  useEffect(() => {
    title.current?.focus({ preventScroll: true })
    title.current?.closest('.stage-root')?.scrollTo({ top: 0 })
  }, [index, finished])
  const select = key => {
    if (checked) return
    setPicks(previous => Array.isArray(question.answer) ? previous.includes(key) ? previous.filter(value => value !== key) : [...previous, key] : [key])
  }
  const check = () => {
    if (!picks.length || checked) return
    setChecked(true)
    setResults(previous => [...previous, { question: question.instruction, correct, answerLabel,
      selected: question.options.filter(option => picks.includes(option.key)).map(option => option.label).join(', '), explanation: question.explanation }])
  }
  if (finished) return <section className="practice-panel">
    <h1 ref={title} tabIndex={-1}>Practice complete</h1>
    <p>{results.filter(result => result.correct).length} of {data.questions.length} correct in this practice.</p>
    <p className="practice-note">This practice is not saved to your profile and does not award XP.</p>
    <ol className="practice-review">{results.map((result, i) => <li key={i}>
      <h2>{result.question}</h2><p>Your answer: {result.selected}</p>
      <p>{result.correct ? 'Correct.' : `Correct answer: ${result.answerLabel}.`}</p>
      {result.explanation && <p>{result.explanation}</p>}
    </li>)}</ol>
    <button className="practice-primary" onClick={onChoose}>Choose another concept</button>
  </section>
  return <section className="practice-panel">
    <div className="practice-question-heading"><span>Question {index + 1} of {data.questions.length}</span><button aria-label="Hear question" onClick={() => speak(`${question.instruction}. ${question.options.map(option => option.label).join('. ')}`)}><Volume2 size={22} /></button></div>
    <h1 ref={title} tabIndex={-1}>{question.instruction}</h1>
    {Array.isArray(question.answer) && <p>Choose {answers.length} answers.</p>}
    <div className={`practice-question-body ${model.image ? 'has-image' : ''}`}>
      {model.image && <figure><img key={model.image} src={model.image} alt={model.alt || 'Challenge illustration'} onError={event => { event.currentTarget.hidden = true; event.currentTarget.nextElementSibling.hidden = false }} /><figcaption hidden>Illustration unavailable. You can choose another concept or reload this page.</figcaption></figure>}
      <div className="practice-options" role="group" aria-label="Answer choices">{question.options.map((option, i) => <button key={option.key} aria-pressed={picks.includes(option.key)} disabled={checked} className={checked && answers.includes(option.key) ? 'is-correct' : checked && picks.includes(option.key) ? 'is-wrong' : ''} onClick={() => select(option.key)}><span>{String.fromCharCode(65 + i)}</span>{option.label}{picks.includes(option.key) && <Check size={22} aria-label="Selected" className="shrink-0 ml-auto" />}</button>)}</div>
    </div>
    {model.hints.length > 0 && <div className="practice-hints"><button disabled={hints >= model.hints.length} onClick={() => setHints(value => value + 1)}><Lightbulb size={20} />{hints ? 'Another hint' : 'Need a hint?'}</button><ul aria-live="polite">{model.hints.slice(0, hints).map((hint, i) => <li key={i}>{hint}</li>)}</ul></div>}
    {checked && <div className="practice-feedback" role="status"><strong>{correct ? 'Correct!' : `The correct answer is ${answerLabel}.`}</strong>{question.explanation && <p>{question.explanation}</p>}</div>}
    <footer className="practice-actions"><button onClick={onChoose}>Change concept</button><button className="practice-primary" disabled={!picks.length} onClick={checked ? () => {
      if (index + 1 === data.questions.length) setFinished(true)
      else { setIndex(value => value + 1); setPicks([]); setChecked(false); setHints(0) }
    } : check}>{checked ? index + 1 === data.questions.length ? 'Finish practice' : 'Next question' : 'Check answer'}</button></footer>
  </section>
}

export default function ChallengePractice() {
  const game = useGame()
  const nav = useNavigate()
  const [query] = useSearchParams()
  const subject = query.get('subject') || game.state.progress.world || 'maths'
  const [retry, setRetry] = useState(0)
  const [packageId, setPackageId] = useState(() => query.get('package') || '')
  const child = game.state.activeChildId
  const catalog = useLiveResource(() => practice.list(child, subject), [child, subject, retry], { enabled: Boolean(child) })
  const selected = catalog.data?.packages.find(item => item.id === packageId)
  const content = useLiveResource(() => practice.load(catalog.data, packageId), [child, subject, packageId, catalog.data, retry], { enabled: Boolean(selected) })
  // Keep concept changes on this screen; a router navigation would remount it
  // and reload the entire catalog before every question bank.
  const choose = setPackageId
  const error = !child ? 'Choose a child first.' : catalog.error || content.error || (packageId && catalog.data && !selected ? 'This concept is not available for the selected child.' : '')
  return <Page className="kv-practice-screen"><main className="practice-shell">
    <header className="practice-header"><button onClick={() => nav(`/challenge?subject=${encodeURIComponent(subject)}`)}><ArrowLeft size={20} />Back to challenges</button><span>Challenge practice</span></header>
    <p className="practice-note">Practise with your lesson’s challenge questions. Scores and XP are not saved.</p>
    {error ? <section className="practice-panel" role="alert"><h1>Could not open this practice</h1><p>{error}</p><div className="practice-actions"><button onClick={() => choose('')}>Choose a concept</button><button onClick={() => setRetry(value => value + 1)}>Try again</button></div></section>
      : catalog.loading || content.loading ? <section className="practice-panel" role="status"><h1>{catalog.loading ? 'Finding your concepts…' : 'Loading challenge questions…'}</h1><p>You can go back while these load.</p></section>
        : content.data ? <PracticeRun key={`${child}:${subject}:${packageId}:${retry}`} data={content.data} onChoose={() => choose('')} />
          : <section className="practice-panel"><h1>Choose a concept</h1><p>Open a concept to practise its published challenge questions.</p><div className="practice-concepts">{catalog.data?.packages.map(item => <button key={item.id} onClick={() => choose(item.id)}>{item.concept_name}<span>{item.theme}</span></button>)}</div>{!catalog.data?.packages.length && <p>No published concepts are available for your grade and topic yet.</p>}</section>}
  </main></Page>
}
