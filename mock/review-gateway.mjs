import {createServer} from 'node:http'
import {createMockApi} from './api.mjs'
import {createMockMiddleware} from './http.mjs'
import {createContentRepository} from './content-repository.mjs'
import {randomBytes} from 'node:crypto'

// A separate, disposable database and an unguessable server-to-server prefix.
// Expose only the API; content administration, outbox and dummy injection stay private.
export function createReviewGateway({database,accessKey,clock=Date.now,limit=240}={}) {
  if(!database || !/^[a-f0-9]{64}$/.test(accessKey||'')) throw Error('Review database and 32-byte access key are required')
  const handle=createMockApi({clock,contentAdminKey:randomBytes(32).toString('hex'),contentRepository:createContentRepository({filename:database,clock})})
  const middleware=createMockMiddleware(handle),windows=new Map()
  const prefix=`/review/${accessKey}/api/v1`
  const server=createServer((req,res)=>{
    const fail=(status,message)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Kidsverse-Source':'mock'});res.end(JSON.stringify({error:{code:`HTTP_${status}`,message,details:{}}}))}
    // Match boundaries before parsing. Encoded separators/dot segments are not routes.
    if(!req.url?.startsWith(prefix+'/') || /%(?:2f|5c|2e)|\\/i.test(req.url)) return fail(404,'Not found')
    const path=req.url.slice(prefix.length)
    if(/^\/(?:admin|__mock|__bootstrap)(?:\/|\?|$)/.test(path)) return fail(404,'Not found')
    if(!['GET','POST','PATCH','PUT','DELETE'].includes(req.method)) return fail(405,'Method not allowed')
    const now=clock(),key=req.socket.remoteAddress||'unknown'
    for(const [k,v] of windows) if(now>=v.until) windows.delete(k)
    const record=windows.get(key)||{count:0,until:now+60000,logins:0}
    record.count++;if(req.method==='POST'&&['/demo/login','/auth/parent/login'].includes(path.split('?')[0]))record.logins++
    windows.set(key,record)
    if(record.count>limit||record.logins>12){res.setHeader('Retry-After',Math.ceil((record.until-now)/1000));return fail(429,'Review rate limit reached; retry shortly')}
    req.url=path
    void middleware(req,res)
  })
  return {server,close:()=>new Promise(resolve=>server.close(()=>{handle.close();resolve()}))}
}
