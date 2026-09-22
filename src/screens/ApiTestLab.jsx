import React, { useMemo, useState } from 'react'
import { CheckCircle2, CircleAlert, Clock3, Database, Play, RefreshCw, Server, Wifi } from 'lucide-react'
import Page from '../components/Page.jsx'
import { Panel, Card } from '../components/Panel.jsx'
import Button from '../components/Button.jsx'
import { API_BASE_URL, API_MODE, apiRequest } from '../lib/api.js'
import { browserTimeZone, formatBrowserDateTime } from '../lib/time.js'

const checks = [
  { label: 'API health', path: '/health' },
  { label: 'Database health', path: '/health/database' },
  { label: 'Interests catalog', path: '/interests' },
  { label: 'Goals catalog', path: '/goals' },
  { label: 'Avatar characters', path: '/avatar/characters' },
  { label: 'Challenges catalog', path: '/challenges' },
]

const mockInterestResponse = {
  id: 'mock-space',
  name: 'Space',
  icon: 'rocket',
}

function responsePreview(value) {
  const text = JSON.stringify(value, null, 2)
  return text.length > 440 ? `${text.slice(0, 440)}\n…` : text
}

export default function ApiTestLab() {
  const [results, setResults] = useState([])
  const [running, setRunning] = useState(false)
  const [showMock, setShowMock] = useState(false)
  const referenceTime = useMemo(() => '2026-09-18T10:30:00Z', [])

  async function runLiveChecks() {
    setRunning(true)
    setShowMock(false)
    setResults(checks.map(check => ({ ...check, state: 'running' })))
    for (let index = 0; index < checks.length; index += 1) {
      const check = checks[index]
      const started = performance.now()
      try {
        const data = await apiRequest(check.path)
        const result = { ...check, state: data.status === 'not_tested' ? 'not tested' : 'passed', status: data.status === 'not_tested' ? 'DB NOT TESTED' : 200, ms: Math.round(performance.now() - started), data }
        setResults(current => current.map((item, i) => i === index ? result : item))
      } catch (error) {
        const result = {
          ...check,
          state: 'failed',
          status: error.status ?? 'Network error',
          ms: Math.round(performance.now() - started),
          data: error.data ?? { message: error.message },
        }
        setResults(current => current.map((item, i) => i === index ? result : item))
      }
    }
    setRunning(false)
  }

  return (
    <Page>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_8%,rgba(124,92,255,.28),transparent_30%),linear-gradient(135deg,#0b1038,#17165d_54%,#1d0d47)]" />
      <div className="absolute left-[116px] top-[84px] w-[1440px] z-10">
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2 text-[15px] font-extrabold tracking-[.18em] text-sky-200 uppercase"><Wifi size={18} /> Developer verification</div>
            <h1 className="mt-3 font-display font-extrabold text-[58px] leading-none text-white">API Test Lab</h1>
            <p className="mt-3 max-w-[710px] text-[19px] font-semibold text-indigo-100">{API_MODE === 'mock' ? 'Local mock HTTP checks. These do not verify the production API or database.' : 'Configured API checks and browser-timezone conversion.'}</p>
          </div>
          <Button size="lg" icon={running ? <RefreshCw className="animate-spin" size={24} /> : <Play size={24} />} onClick={runLiveChecks} disabled={running} className="h-[68px] px-8 uppercase text-[18px]">{running ? 'Running checks…' : `Run ${API_MODE} checks`}</Button>
        </div>

        <div className="mt-7 grid grid-cols-[1.25fr_.75fr] gap-6">
          <Panel className="p-6" initial="hidden" animate="show">
            <div className="flex items-center justify-between"><div><div className="font-display font-extrabold text-[25px] text-ink">{API_MODE === 'mock' ? 'Mock' : 'Live'} API results</div><div className="mt-1 text-[14px] font-bold text-ink-3 break-all">{API_BASE_URL || 'No VITE_API_BASE_URL configured'}</div></div><Server className="text-primary-ink" size={30} /></div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {results.length === 0 && <div className="col-span-2 rounded-[18px] border border-dashed border-[var(--glass-border)] p-8 text-center text-[16px] font-bold text-ink-3">Press “Run live checks” to test the configured backend.</div>}
              {results.map(result => {
                const passed = result.state === 'passed'
                const runningCheck = result.state === 'running'
                return <Card key={result.path} className="min-h-[142px] p-4">
                  <div className="flex items-start justify-between gap-3"><div><div className="font-extrabold text-[17px] text-ink">{result.label}</div><div className="mt-1 font-mono text-[12px] text-ink-3">GET {result.path}</div></div>{runningCheck ? <RefreshCw className="animate-spin text-primary-ink" size={22} /> : passed ? <CheckCircle2 className="text-green-600" size={24} /> : <CircleAlert className="text-red-500" size={24} />}</div>
                  {!runningCheck && <><div className={`mt-3 text-[15px] font-extrabold ${passed ? 'text-green-700' : 'text-red-600'}`}>{result.status} · {result.ms} ms</div><pre className="mt-2 max-h-[56px] overflow-auto whitespace-pre-wrap text-[11px] leading-snug text-ink-3">{responsePreview(result.data)}</pre></>}
                </Card>
              })}
            </div>
          </Panel>

          <div className="flex flex-col gap-6">
            <Panel className="p-6" initial="hidden" animate="show"><div className="flex items-center gap-3"><Clock3 className="text-primary-ink" size={27} /><div className="font-display font-extrabold text-[24px] text-ink">Timezone check</div></div><div className="mt-4 rounded-[16px] bg-[var(--lavender-2)] p-4"><div className="text-[13px] font-extrabold uppercase tracking-wide text-ink-3">Browser timezone</div><div className="mt-1 font-mono text-[18px] font-bold text-primary-ink">{browserTimeZone()}</div><div className="mt-4 text-[13px] font-extrabold uppercase tracking-wide text-ink-3">UTC API timestamp</div><div className="mt-1 font-mono text-[14px] text-ink-2">{referenceTime}</div><div className="mt-4 text-[13px] font-extrabold uppercase tracking-wide text-ink-3">Displayed to this browser</div><div className="mt-1 text-[20px] font-extrabold text-ink">{formatBrowserDateTime(referenceTime)}</div></div></Panel>
            <Panel className="p-6" initial="hidden" animate="show"><div className="flex items-center gap-3"><Database className="text-primary-ink" size={27} /><div className="font-display font-extrabold text-[24px] text-ink">Mock contract preview</div></div><p className="mt-3 text-[14px] font-semibold leading-snug text-ink-2">This is sample UI data only—not a live API response. Use it while the backend returns errors.</p><button onClick={() => setShowMock(value => !value)} className="mt-4 text-[14px] font-extrabold text-primary-ink">{showMock ? 'Hide mock response' : 'Show mock response'}</button>{showMock && <pre className="mt-3 max-h-[115px] overflow-auto rounded-[14px] bg-[#10134a] p-3 text-[12px] leading-snug text-indigo-100">{JSON.stringify(mockInterestResponse, null, 2)}</pre>}</Panel>
          </div>
        </div>
        <div className="mt-5 text-center text-[13px] font-semibold text-indigo-200">
          {API_MODE === 'mock'
            ? 'These checks only read data. Mock mode uses server memory, not a database.'
            : 'These checks call the configured live API. Browser responses alone do not prove direct database connectivity.'}
        </div>
      </div>
    </Page>
  )
}
