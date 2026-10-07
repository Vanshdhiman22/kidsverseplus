import {createReviewGateway} from './review-gateway.mjs'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
const database=process.env.KIDSVERSE_REVIEW_DB || fileURLToPath(new URL('../.mock-data/senior-review.sqlite',import.meta.url))
const ordinary=fileURLToPath(new URL('../.mock-data/content.sqlite',import.meta.url))
if(resolve(database).toLowerCase()===resolve(ordinary).toLowerCase())throw Error('Use a separate review database')
const gateway=createReviewGateway({database,accessKey:process.env.KIDSVERSE_REVIEW_ACCESS_KEY})
const port=Number(process.env.MOCK_REVIEW_PORT||5183)
const host=process.env.MOCK_REVIEW_HOST||'127.0.0.1'
gateway.server.listen(port,host,()=>console.log(`Review gateway on ${host}:${port}; isolated SQLite; administration disabled`))
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>gateway.close().then(()=>process.exit(0)))
