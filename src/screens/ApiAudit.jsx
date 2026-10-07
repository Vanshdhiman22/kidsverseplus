import React, {useEffect,useRef,useState} from 'react'
import './ApiAudit.css'
const pad=n=>String(n).padStart(2,'0')
const statusOf=(screen,report)=>{
  if(screen.id===1) return 'No API'
  const req=report.requests.filter(r=>r.screens.includes(screen.id))
  const findings=report.findings.filter(f=>f.screens.includes(screen.id))
  if(!req.length) return 'Blocked'
  if(req.some(r=>!r.ok && !r.expected && r.status!==undefined)) return req.some(r=>r.ok)?'Mixed':'Failed'
  if(findings.length || screen.documentStatus==='Partial')return 'Partial'
  return req.length?'Responded':'Blocked'
}
export default function ApiAudit(){
  const [screens,setScreens]=useState([]),[report,setReport]=useState({requests:[],findings:[]})
  const [selected,setSelected]=useState(14),[mode,setMode]=useState('live'),[filter,setFilter]=useState('All')
  const [observed,setObserved]=useState({}),[scan,setScan]=useState(false),[live,setLive]=useState(null),[error,setError]=useState(''),[tick,setTick]=useState(0)
  const frame=useRef(),scanRef=useRef(false),selectedRef=useRef(selected),observedRef=useRef({})
  const scanQueue=useRef(null)
  selectedRef.current=selected;scanRef.current=scan;observedRef.current=observed
  function advance(id){
    const next=scanQueue.current?scanQueue.current.shift():(id<62?id+1:null)
    if(next){setSelected(next);setLive(null)}else{setScan(false);scanQueue.current=null;saveScan()}
  }
  function rescanUnsettled(){
    const ids=screens.filter(s=>!observed[s.id]||observed[s.id].timeout||observed[s.id].requests?.some(r=>r.status==='pending')||/Loading your/.test(observed[s.id].text)).map(s=>s.id)
    if(!ids.length){setError('All captured routes have settled.');return}
    setMode('live');setSelected(ids.shift());scanQueue.current=ids;setLive(null);setTick(t=>t+1);setScan(true)
  }
  const refresh=()=>fetch('/__audit/report.json').then(r=>r.json()).then(r=>r.requests&&setReport(r)).catch(()=>setError('Report is not ready.'))
  useEffect(()=>{fetch('/__audit/screens.json').then(r=>r.json()).then(setScreens);fetch('/__audit/browser-scan.json').then(r=>r.ok?r.json():{}).then(setObserved);refresh();const t=setInterval(refresh,5000);return()=>clearInterval(t)},[])
  useEffect(()=>{
    let settledTimer
    const receive=e=>{
      if(e.origin!==window.location.origin||e.source!==frame.current?.contentWindow||e.data?.type!=='kidsverse-audit-screen')return
      setLive(e.data.body)
      setObserved(prev=>{
        const next={...prev,[selectedRef.current]:{...e.data.body,screen:selectedRef.current}}
        fetch('/__audit/browser-scan',{method:'POST',headers:{'Content-Type':'application/json','X-KV-Audit':'1'},body:JSON.stringify(next)}).catch(()=>{})
        return next
      })
      clearTimeout(settledTimer)
      const body=e.data.body
      const id=selectedRef.current
      if(scanRef.current && body.text && !body.requests?.some(r=>r.status==='pending') && !/Loading your|Getting ready|SIGNING IN|SAVING…/i.test(body.text)) {
        settledTimer=setTimeout(()=>{
          if(!scanRef.current || selectedRef.current!==id)return
          advance(id)
        },900)
      }
    }
    window.addEventListener('message',receive);return()=>{clearTimeout(settledTimer);window.removeEventListener('message',receive)}
  },[])
  useEffect(()=>{
    if(!scan)return
    const t=setTimeout(()=>{
      if(!observedRef.current[selected])setObserved(prev=>({...prev,[selected]:{screen:selected,at:new Date().toISOString(),text:'No browser observation within 22 seconds.',requests:[],timeout:true}}))
      advance(selected)
    },22000)
    return()=>clearTimeout(t)
  },[scan,selected])
  async function saveScan(){try{await fetch('/__audit/browser-scan',{method:'POST',headers:{'Content-Type':'application/json','X-KV-Audit':'1'},body:JSON.stringify(observedRef.current)});setError('Browser observations saved.')}catch{setError('Could not save browser observations.')}}
  const screen=screens.find(s=>s.id===selected)
  const requests=report.requests.filter(r=>r.screens.includes(selected))
  const findings=report.findings.filter(f=>f.screens.includes(selected))
  const choose=id=>{setScan(false);setSelected(id);setLive(null)}
  return <main className="api-audit">
    <header><div><span className="audit-eyebrow">KIDSVERSE+ / LIVE API AUDIT</span><h1>62 screens. Every response visible.</h1><p>{report.base} · {report.finished?new Date(report.finished).toLocaleString():'Audit running'}</p></div><a href="/home" target="_blank" rel="noreferrer">Open app ↗</a></header>
    <div className="audit-summary"><span><b>{report.requests.length}</b> HTTP requests</span><span className="good"><b>{report.requests.filter(r=>r.ok).length}</b> 2xx responses</span><span className="bad"><b>{report.requests.filter(r=>r.ok===false).length}</b> failed requests</span><span><b>{Object.keys(observed).length}/62</b> route observations</span><small>2xx ≠ full screen pass. CLI API tests and browser traffic are shown separately.</small></div>
    <div className="audit-workspace"><nav aria-label="PDF screen list"><label>Show<select value={filter} onChange={e=>setFilter(e.target.value)}>{['All','Failed','Mixed','Partial','Responded','Blocked','No API'].map(v=><option key={v}>{v}</option>)}</select></label>
      {screens.filter(s=>filter==='All'||statusOf(s,report)===filter).map(s=><button key={s.id} aria-current={s.id===selected?'page':undefined} onClick={()=>choose(s.id)}><span>{pad(s.id)} {s.name}</span><small className={statusOf(s,report).toLowerCase()}>{statusOf(s,report)}</small></button>)}
    </nav><section className="audit-detail"><div className="audit-toolbar"><h2>{pad(selected)} · {screen?.name}</h2><button onClick={()=>choose(Math.max(1,selected-1))}>Previous</button><button onClick={()=>choose(Math.min(62,selected+1))}>Next</button><button onClick={()=>{scanQueue.current=null;setMode('live');setSelected(1);setLive(null);setScan(true);setTick(t=>t+1)}} disabled={scan}>Scan 62 routes</button>{scan?<button onClick={()=>setScan(false)}>Stop scan</button>:<><button onClick={rescanUnsettled}>Recheck unsettled</button><button onClick={saveScan}>Save observations</button></>}</div>
      <div className="audit-columns" data-screen={selected} data-ready={Boolean(live?.text && !live.requests?.some(r=>r.status==='pending') && !/Loading your|Getting ready|SIGNING IN|SAVING…/i.test(live.text))}><div className="audit-screen"><div className="audit-tabs"><button aria-pressed={mode==='live'} onClick={()=>setMode('live')}>Live frontend</button><button aria-pressed={mode==='capture'} onClick={()=>setMode('capture')}>Fresh test screenshot</button><button aria-pressed={mode==='reference'} onClick={()=>setMode('reference')}>Original PDF screenshot</button><button onClick={()=>{setTick(t=>t+1);setLive(null)}}>Reload screen</button></div>
      {mode==='live'?<iframe ref={frame} key={`${selected}-${tick}`} src={screen?`${screen.route}${screen.route.includes('?')?'&':'?'}auditFrame=1`:'about:blank'} title="Live Kidsverse screen"/>:<img src={`/__audit/${mode==='capture'?'retest-screen':'screen'}-${pad(selected)}.png`} alt={`${mode==='capture'?'Fresh test':'Original PDF'} screen ${selected}: ${screen?.name}`}/>}
      <div className="audit-note"><strong>{mode==='live'?'Actual running app':mode==='capture'?'Fresh browser test capture':'Reference only — not a test screenshot'}</strong><p>{screen?.viewNote}</p><code>{screen?.route}</code><p>{scan?`Route scan in progress: ${selected}/62. No buttons are auto-submitted.`:error||'Use the screen normally; captured API calls appear on the right.'}</p></div>
      <details><summary>Browser observation for this entry</summary><pre>{JSON.stringify(observed[selected]||{status:'Not observed yet'},null,2)}</pre></details>
      </div><aside className="audit-responses"><div className="audit-verdict"><strong>{screen?statusOf(screen,report):'Loading'}</strong><p>{findings.map(f=>f.text).join('\n')||'See captured responses below. UI interaction success must be checked separately.'}</p><small>PDF coverage: {screen?.documentStatus} · {screen?.evidence}</small></div>
      <h3>Live browser traffic <small>{live?.requests?.length||0} captured</small></h3>{live?.requests?.length?live.requests.map((r,i)=><Response key={i} r={r} open/>):<p className="audit-empty">No API response captured for this route yet. It may need an action, login, or use local data.</p>}
      <h3>Saved live HTTP tests <small>{requests.length} calls</small></h3>{requests.length?requests.map(r=><Response key={r.id} r={r} open/>):<p className="audit-empty">No request completed for this entry. Read the dependency/coverage note above.</p>}
      </aside></div>
    </section></div>
    <footer>Dedicated synthetic account · Credentials redacted · Proposed routes are labeled · Content uploads are not part of this student screen audit. <a href="/__audit/report.json" target="_blank" rel="noreferrer">Full JSON report ↗</a> <a href="/__audit/summary.md" target="_blank" rel="noreferrer">62-screen summary ↗</a></footer>
  </main>
}
function Response({r,open=false}){return <details className="audit-response" open={open}><summary><b className={Number(r.status)<400?'good':'bad'}>{r.status??'Pending'}</b> {r.method} <span>{r.path}</span> <small>{r.ms} ms</small></summary>{r.note&&<p>{r.note}</p>}<small>{r.at} {r.source?`· ${r.source}`:'· CLI live HTTP'}</small><h4>Request body</h4><pre>{JSON.stringify(r.request??null,null,2)}</pre><h4>Response body</h4><pre>{typeof r.response==='string'?r.response:JSON.stringify(r.response??{error:r.error||'No response body'},null,2)}</pre></details>}
