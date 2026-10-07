import {createServer} from 'node:http'
import {createMockApi} from './api.mjs'
import {createMockMiddleware} from './http.mjs'
import {createContentRepository} from './content-repository.mjs'
import {fileURLToPath} from 'node:url'
import {localContentAdminKey} from './content-api.mjs'
const port=Number(process.env.MOCK_PORT||5181)
const api=createMockApi({contentAdminKey:localContentAdminKey(),contentRepository:createContentRepository({filename:process.env.KIDSVERSE_MOCK_CONTENT_DB||fileURLToPath(new URL('../.mock-data/content.sqlite',import.meta.url))})})
const middleware=createMockMiddleware(api)
const server=createServer((req,res)=>{
 if(!req.url.startsWith('/api/v1/')){res.writeHead(404,{'Content-Type':'application/json'});res.end(JSON.stringify({error:{code:'NOT_FOUND',message:'Use /api/v1/',details:{}}}));return}
 req.url=req.url.slice('/api/v1'.length);void middleware(req,res)
})
server.listen(port,'127.0.0.1',()=>console.log(`Local mock backend: http://127.0.0.1:${port}/api/v1 (SQLite content and runtime state, loopback only)`))
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>{api.close();process.exit(0)}))
