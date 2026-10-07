import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { requestLog, API_MODE } from '../lib/api.js'

// Developer-only telemetry between the embedded app and the local audit viewer.
export default function AuditBridge() {
  const {pathname,search}=useLocation()
  useEffect(()=>{
    if(!(import.meta.env.DEV || import.meta.env.VITE_ENABLE_API_REVIEW==='true' && API_MODE==='mock') || window.parent===window) return
    let timer
    const send=()=>{
      const root=document.querySelector('.stage')
      const text=root?.innerText || ''
      const body={route:pathname+search,text:text.slice(0,18000),headings:[...document.querySelectorAll('h1,h2')].map(n=>n.textContent),requests:requestLog,at:new Date().toISOString()}
      window.parent.postMessage({type:'kidsverse-audit-screen',body},window.location.origin)
    }
    const schedule=()=>{clearTimeout(timer);timer=setTimeout(send,1600)}
    window.addEventListener('kidsverse-api-request',schedule)
    const heartbeat=setInterval(send,2500)
    schedule()
    return()=>{clearInterval(heartbeat);clearTimeout(timer);window.removeEventListener('kidsverse-api-request',schedule)}
  },[pathname,search])
  return null
}
