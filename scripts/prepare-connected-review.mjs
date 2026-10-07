import {mkdirSync,writeFileSync} from 'node:fs'
const url=new URL(process.env.KIDSVERSE_REVIEW_BACKEND_URL || 'http://invalid.local')
const key=process.env.KIDSVERSE_REVIEW_ACCESS_KEY
if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash||!/^[a-f0-9]{64}$/.test(key||''))throw Error('HTTPS backend origin and 32-byte review access key are required')
mkdirSync('.vercel',{recursive:true})
writeFileSync('.vercel/connected-mock.json',JSON.stringify({buildCommand:'node scripts/build-connected-review.mjs',outputDirectory:'dist',rewrites:[{source:'/api/v1/:path*',destination:`${url.origin}/review/${key}/api/v1/:path*`},{source:'/(.*)',destination:'/index.html'}]},null,2))
console.log('Connected preview config saved privately. Deploy with --local-config .vercel/connected-mock.json; do not use --prod.')
