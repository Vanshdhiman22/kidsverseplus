import {randomUUID} from 'node:crypto'
import {errorResponse,MockError} from './contracts.mjs'

export function createMockMiddleware(handle) {
 return async function middleware(req,res) {
  res.setHeader('Content-Type','application/json; charset=utf-8')
  res.setHeader('X-Kidsverse-Source','local-mock')
  res.setHeader('X-Request-ID',randomUUID())
  res.setHeader('Cache-Control','no-store')
  const send=response=>{res.statusCode=response.status;res.end(response.status===204?undefined:JSON.stringify(response.data))}
  try {
   const chunks=[];let bytes=0
   const contentFeed=/^\/(?:api\/v1\/)?admin\/content\/(feed|drafts|packages\/[^/?]+)(?:\?|$)/.test(req.url||''),limit=contentFeed?1048576:65536
   for await(const chunk of req){bytes+=chunk.length;if(bytes>limit){send(errorResponse(new MockError(413,`Body exceeds ${contentFeed?'1 MiB':'64 KiB'}`)));return}chunks.push(chunk)}
   const raw=Buffer.concat(chunks).toString('utf8')
   if(raw&&!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type']||'')){send(errorResponse(new MockError(415,'Content-Type must be application/json')));return}
   let body={}
   try{if(raw)body=JSON.parse(raw)}catch{send(errorResponse(new MockError(400,'Invalid JSON request','INVALID_JSON')));return}
   const scenario=req.headers['x-mock-scenario']
   if(scenario==='slow')await new Promise(resolve=>setTimeout(resolve,1600))
   if(['401','500'].includes(scenario)){send(errorResponse(new MockError(Number(scenario),`Simulated ${scenario}; request not saved.`)));return}
   const authorization=req.headers.authorization||''
   const token=/^Bearer ([^\s]+)$/i.exec(authorization)?.[1]
   send(await handle(req.method,req.url,body,token,{idempotencyKey:req.headers['idempotency-key'],contentAdminKey:req.headers['x-mock-content-admin-key'],parentPinProof:req.headers['x-parent-pin-proof']}))
  }catch(error){send(errorResponse(error))}
 }
}
