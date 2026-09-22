import React, { useEffect, useState } from 'react'
import { API_MODE, API_BASE_URL, requestLog } from '../lib/api.js'

export default function MockInspector() {
  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState([...requestLog])
  const [scenario, setScenario] = useState(() => sessionStorage.getItem('kidsverse-mock-scenario') || 'success')
  useEffect(() => {
    const update = () => setEntries([...requestLog])
    window.addEventListener('kidsverse-api-request', update)
    return () => window.removeEventListener('kidsverse-api-request', update)
  }, [])
  if (!import.meta.env.DEV || API_MODE !== 'mock') return null
  const style = { position: 'fixed', zIndex: 100000, font: '13px/1.5 system-ui', color: '#fff', background: '#15152d', border: '1px solid #8b80bf', borderRadius: 10, padding: 10 }
  return <>
    <button style={{ ...style, bottom: 8, left: 8 }} onClick={() => setOpen(!open)}>MOCK API · {entries.length} requests {open ? '— Close' : '— Inspect'}</button>
    {open && <aside aria-label="Mock API inspector" style={{ ...style, right: 8, bottom: 8, width: 'min(490px, 90vw)', maxHeight: '80vh', overflow: 'auto' }}>
      <strong>Local mock request / response</strong>
      <p>{API_BASE_URL} · No production DB. Data resets on server restart.</p>
      <p>Connected: account, onboarding, mission content/completion, test answers/results, battle start/completion and home stats. Fixtures are sample data, not production content. Journey maps, leaderboard and parent reports still include demo UI.</p>
      <label>Next requests: <select aria-label="Mock scenario" value={scenario} style={{ color: '#111', padding: 5 }} onChange={e => { setScenario(e.target.value); sessionStorage.setItem('kidsverse-mock-scenario', e.target.value) }}>
        <option value="success">Success</option><option value="slow">Slow (1.6s)</option><option value="401">Unauthorized (401)</option><option value="500">Server error (500)</option>
      </select></label>
      <button style={{ marginLeft: 12 }} onClick={() => { requestLog.length = 0; setEntries([]) }}>Clear log</button>
      <p>Browser timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
      {entries.map((entry, i) => <details key={`${entry.at}-${i}`} style={{ borderTop: '1px solid #555', padding: '8px 0' }}>
        <summary style={{ cursor: 'pointer', overflowWrap: 'anywhere' }}>{entry.status} · {entry.method} {entry.path} · {entry.ms}ms</summary>
        <p>{new Date(entry.at).toLocaleString()} (browser local time)</p>
        <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: 12 }}>{JSON.stringify(entry, null, 2)}</pre>
      </details>)}
    </aside>}
  </>
}
