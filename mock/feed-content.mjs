import {readFile} from 'node:fs/promises'
import {randomUUID} from 'node:crypto'
const filename=process.argv[2]
if(!filename)throw Error('Usage: node mock/feed-content.mjs <studio-package.json> [http://127.0.0.1:5180/api/v1]')
const base=new URL(process.argv[3]||'http://127.0.0.1:5180/api/v1')
if(base.protocol!=='http:'||base.hostname!=='127.0.0.1'||!['5180','5181'].includes(base.port)||base.pathname!=='/api/v1')throw Error('This helper only feeds the local mock on 127.0.0.1:5180 or 5181')
const body=JSON.parse(await readFile(filename,'utf8'))
const key=process.env.KIDSVERSE_MOCK_CONTENT_ADMIN_KEY||(await readFile(new URL('../.mock-data/content-admin.key',import.meta.url),'utf8')).trim()
const response=await fetch(base.href+'/admin/content/feed',{method:'POST',headers:{'Content-Type':'application/json','X-Mock-Content-Admin-Key':key,'Idempotency-Key':randomUUID()},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)})
const result=await response.json()
console.log(JSON.stringify({http:response.status,...result},null,2))
if(!response.ok)process.exitCode=1
