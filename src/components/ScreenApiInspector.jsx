import React, { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { mockSnapshot, requestLog, API_MODE } from '../lib/api.js'
import { redactApi } from '../lib/redact-api.js'
import { requestsForScreen } from '../lib/screen-api-log.js'
import { comparisonPairs, comparisonPayload, operationKey } from '../lib/api-comparison.js'
import './ScreenApiInspector.css'
const live = API_MODE === 'live'
let deployedCaptures
const CAPTURE_CACHE_KEY='kv:mock-reference-captures:v2'
function loadDeployedCaptures() {
  if (deployedCaptures) return deployedCaptures
  // These are dated, redacted reference captures from this immutable deployment.
  // Same-origin frames share sessionStorage, so navigating 62 screens does not
  // download the same reference packet 62 times. Current traffic is separate.
  try {
    const saved=JSON.parse(sessionStorage.getItem(CAPTURE_CACHE_KEY)||'null')
    if(Array.isArray(saved?.mock?.screens)&&Array.isArray(saved?.mock?.captures)) {
      deployedCaptures=Promise.resolve(saved)
      return deployedCaptures
    }
  } catch { /* A corrupt or unavailable cache falls back to HTTP. */ }
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000)
  deployedCaptures=fetch('/api-review/captures.json',{signal:controller.signal,cache:'force-cache'}).then(async response=>{
    if(!response.ok||!response.headers.get('content-type')?.includes('json')) throw Error('Review captures are unavailable. Current screen traffic is still shown.')
    const saved=await response.json()
    if(!Array.isArray(saved?.mock?.screens)||!Array.isArray(saved?.mock?.captures)) throw Error('Invalid reference capture packet. Current screen traffic is still shown.')
    try {sessionStorage.setItem(CAPTURE_CACHE_KEY,JSON.stringify(saved))} catch { /* Storage quotas must not prevent inspection. */ }
    return saved
  }).catch(error=>{
    deployedCaptures=undefined
    throw Error(error.name==='AbortError'?'Reference captures timed out. Retry loading them; current screen traffic is still shown.':error.message)
  }).finally(()=>clearTimeout(timer))
  return deployedCaptures
}

function Json({ value, empty = 'No request body.' }) {
  return <pre>{value === undefined || value === null ? empty : typeof value === 'string' ? value : JSON.stringify(redactApi(value), null, 2)}</pre>
}
function ResponsePanel({ entry, observed }) {
  return <section className="screen-api-panel required" aria-label={live ? 'Live API' : 'Mock API'}>
    <div className="screen-api-panel-title"><div><small>{live ? 'LIVE BACKEND' : 'MOCK BACKEND'}</small><h3>{live ? 'Live API' : 'Mock API'}</h3></div><span className="screen-api-status">{entry?.status ?? 'Not captured'}</span></div>
    {!entry ? <p>No captured mock response for this operation.</p> : <>
      <p className="screen-api-provenance">{observed ? 'Current session' : 'Saved reference capture · not this session'} · {entry.at ? new Date(entry.at).toLocaleString() : 'Date unavailable'}<br/>{entry.transport === 'session-cache' ? 'Read from the session cache populated by the backend · no extra HTTP sent' : 'Actual HTTP response'}</p>
      <div className="screen-api-endpoint"><b>{entry.method}</b> <code>{entry.path}</code></div>
      <div className="screen-api-url"><code>{entry.url || `/api/v1${entry.path}`}</code></div>
      <details className="screen-api-headers"><summary>Request headers</summary><Json value={entry.headers} empty="Headers were not recorded in this saved capture." /></details>
      <h4>Request JSON</h4><Json value={entry.request} empty={['POST','PUT','PATCH'].includes(entry.method) ? 'Request body was not captured. It cannot be reconstructed from the response.' : 'No request body.'}/>
      {entry.method === 'POST' && entry.request && Object.keys(entry.request).length === 0 && /\/(?:missions\/attempts|tests\/attempts|challenge-battles)\/[^/]+\/complete(?:\?|$)/.test(entry.path) && <p className="screen-api-provenance">Empty JSON body is intentional. The attempt or battle ID is in the URL. Answers were submitted earlier, one question at a time; the server calculates the final score and rewards from those saved answers.</p>}
      {entry.method === 'POST' && entry.request && Object.keys(entry.request).length === 0 && !/\/(?:missions\/attempts|tests\/attempts|challenge-battles)\/[^/]+\/complete(?:\?|$)/.test(entry.path) && <p className="screen-api-provenance">This operation sends the JSON body shown above: {'{}'}. It uses the authenticated session and identifiers in the URL; no additional body fields are required by this contract.</p>}
      {entry.transport==='verification-rpc'&&<p className="screen-api-provenance">Verification transport: POST {entry.wireUrl}. The method/path above is the mock operation executed by the server; its status is returned in the transport envelope. Temporary encrypted sample state stays in this browser session.</p>}
      <h4>Response JSON</h4><Json value={entry.response} empty={entry.status === 204 ? 'HTTP 204 — no response body.' : entry.status === 'pending' ? 'Waiting for response…' : 'No response received.'}/>
      {entry.error && <p role="alert" className="screen-api-error">{entry.error}</p>}
    </>}
  </section>
}

export default function ScreenApiInspector() {
  const { pathname, search } = useLocation(), route = pathname + search
  const [entries, setEntries] = useState(() => [...requestLog])
  const [scope, setScope] = useState('screen'), [selectedKey, setSelectedKey] = useState(null)
  const [data, setData] = useState(null), [screenId, setScreenId] = useState(null)
  const [loadError, setLoadError] = useState(''), [loading, setLoading] = useState(false)
  const dialog = useRef(null), trigger = useRef(null), artifactController = useRef(null)
  const mockEntries = entries.filter(entry => live ? entry.source === 'live' : entry.source !== 'live')
  const screenEntries = requestsForScreen(mockEntries, route)
  const observed = scope === 'session' ? mockEntries : screenEntries
  const pairs = live ? [...new Map(observed.map(entry => [operationKey(entry), {key:operationKey(entry),required:entry,requiredObserved:true}])).values()] : comparisonPairs(data, screenId, observed).filter(pair => pair.required)
  const selected = pairs.find(p => p.key === selectedKey) || pairs[0]
  const snapshot = live ? null : mockSnapshot.value
  useEffect(() => {
    const update = () => setEntries([...requestLog])
    window.addEventListener('kidsverse-api-request', update); update()
    return () => window.removeEventListener('kidsverse-api-request', update)
  }, [])
  useEffect(() => {
    setSelectedKey(null); setScope('screen'); setData(null); setLoadError(''); setLoading(false)
    dialog.current?.close(); artifactController.current?.abort()
    return () => { artifactController.current?.abort() }
  }, [route])
  function close() { dialog.current?.close(); trigger.current?.focus() }
  async function open() {
    setEntries([...requestLog]); dialog.current?.showModal()
    if (live || data || loading) return
    const controller = new AbortController(); artifactController.current = controller
    setLoading(true); setLoadError('')
    try {
      let result
      if (import.meta.env.DEV) {
        const response = await fetch(`/__audit/mock-comparison.json?route=${encodeURIComponent(route)}`, {signal:controller.signal})
        if (!response.ok) throw Error('Saved comparison captures are unavailable. Current screen traffic is still shown.')
        result = await response.json()
      } else {
        const captures = await loadDeployedCaptures()
        result = comparisonPayload(captures.mock,{requests:[]},route)
      }
      if (!controller.signal.aborted) { setData(result); setScreenId(result.selected) }
    } catch (error) { if (!controller.signal.aborted) setLoadError(error.message) }
    finally { if (!controller.signal.aborted) setLoading(false) }
  }
  return <div className="screen-api-dev">
    <button ref={trigger} type="button" className="screen-api-link" onClick={open} aria-haspopup="dialog" aria-controls="screen-api-popup">API request / response <span>{screenEntries.length}</span></button>
    <dialog ref={dialog} id="screen-api-popup" aria-labelledby="screen-api-title" onCancel={event => {event.preventDefault();close()}} onClick={event => {if(event.target===dialog.current){const box=dialog.current.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)close()}}}>
      <header><div><span className="screen-api-eyebrow">DEVELOPER API INSPECTOR</span><h2 id="screen-api-title">{live ? 'Live' : 'Mock'} API request / response</h2><code>{route}</code></div><button type="button" className="screen-api-close" onClick={close} aria-label="Close API request / response">×</button></header>
      <p className="screen-api-note">{live ? 'Actual live requests and responses from this session. Credentials are hidden. Failed requests are included.' : 'Current-session mock responses are shown first. Saved references are dated. Cached reads come from the login bootstrap. Credentials are hidden.'}</p>
      <nav aria-label="API request scope"><button type="button" aria-pressed={scope==='screen'} onClick={()=>{setScope('screen');setSelectedKey(null)}}>This screen</button><button type="button" aria-pressed={scope==='session'} onClick={()=>{setScope('session');setSelectedKey(null)}}>Session requests</button>{snapshot&&<button type="button" aria-pressed={scope==='bootstrap'} onClick={()=>setScope('bootstrap')}>Login bootstrap</button>}
        {data?.screens.length>1&&<label className="screen-api-screen-select">Screen / panel <select value={screenId || ''} onChange={event=>{setScreenId(Number(event.target.value));setSelectedKey(null)}}>{data.screens.map(s=><option value={s.id} key={s.id}>{s.id} · {s.name}</option>)}</select></label>}
      </nav>
      {loading&&<p className="screen-api-note" role="status">Loading saved mock captures…</p>}{loadError&&<p className="screen-api-note screen-api-error" role="alert">{loadError} <button type="button" onClick={open}>Retry reference captures</button></p>}
      {scope==='bootstrap'?<section className="screen-api-bootstrap"><h3>Mock login bootstrap</h3><p>Stored mock backend snapshot.</p><Json value={snapshot}/></section>:!pairs.length?<section className="screen-api-empty"><h3>No API capture for this screen yet.</h3><p>Perform a screen action, or choose Session requests to inspect earlier calls. Local UI screens may not need an API.</p></section>:<div className="screen-api-content"><aside aria-label="API operations">{pairs.map(pair=><button type="button" key={pair.key} aria-pressed={pair===selected} onClick={()=>setSelectedKey(pair.key)}><code>{pair.key}</code><small>Status: {pair.required.status}</small></button>)}</aside>
        <div className="screen-api-comparison"><ResponsePanel entry={selected.required} observed={selected.requiredObserved}/></div>
      </div>}
    </dialog>
  </div>
}
