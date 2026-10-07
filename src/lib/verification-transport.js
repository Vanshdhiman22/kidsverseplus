// DB-free review transport. Synthetic state is opaque, encrypted by the server.
// Serialize requests so each operation receives the previous committed snapshot.
const key='kv:verification-state:v1'
let queue=Promise.resolve()
export function verificationRequest({baseUrl,method,path,body,token,context,signal,storage=sessionStorage,fetcher=fetch}) {
  const work=queue.then(async()=>{
    const fresh=method==='POST'&&(path==='/demo/login'||path==='/auth/parent/login'&&body?.email?.toLowerCase()==='demo@kidsverse.local')
    const envelope={method,path,body:body??{},token:token||undefined,context,verification_state:fresh?undefined:storage.getItem(key)||undefined}
    const response=await fetcher(baseUrl+'/verification',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(envelope),signal})
    const result=await response.json()
    if(!response.ok)throw Error(result.error?.message||'Verification transport failed')
    if(result.verification_state)storage.setItem(key,result.verification_state)
    if(!Number.isInteger(result.status))throw Error('Invalid mock operation response')
    return {ok:result.status>=200&&result.status<300,status:result.status,data:result.data}
  })
  queue=work.then(()=>undefined,()=>undefined)
  return work
}
