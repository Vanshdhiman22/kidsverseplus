import {spawnSync} from 'node:child_process'
if(process.env.VERCEL_ENV && process.env.VERCEL_ENV!=='preview')throw Error('Connected mock build is restricted to previews')
const env={...process.env,VITE_API_MODE:'mock',VITE_API_BASE_URL:'/api/v1',VITE_ENABLE_API_REVIEW:'true'}
const result=spawnSync(process.execPath,['node_modules/vite/bin/vite.js','build','--configLoader','runner','--mode','mock',...(process.env.KIDSVERSE_LOCAL_REVIEW?['--outDir','dist-connected']:[])],{stdio:'inherit',env})
process.exit(result.status??1)
