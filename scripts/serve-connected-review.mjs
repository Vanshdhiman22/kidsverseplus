import {readFileSync} from 'node:fs'
import {spawn} from 'node:child_process'
import {createReviewGateway} from '../mock/review-gateway.mjs'
import {fileURLToPath} from 'node:url'
const {accessKey}=JSON.parse(readFileSync(new URL('../.vercel/connected-review-runtime.private.json',import.meta.url),'utf8'))
const gateway=createReviewGateway({database:fileURLToPath(new URL('../.mock-data/senior-review.sqlite',import.meta.url)),accessKey})
gateway.server.listen(5183,'127.0.0.1',()=>console.log('Isolated mock backend listening on 5183'))
const preview=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--outDir','dist-connected','--port','5184','--strictPort','--host','127.0.0.1','--configLoader','runner'],{stdio:'inherit',env:{...process.env,KIDSVERSE_REVIEW_PROXY_BASE:`http://127.0.0.1:5183/review/${accessKey}`}})
preview.on('error',error=>{console.error(error.message);gateway.close().then(()=>process.exit(1))})
preview.on('exit',code=>gateway.close().then(()=>process.exit(code||0)))
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{preview.kill();gateway.close().then(()=>process.exit(0))})
