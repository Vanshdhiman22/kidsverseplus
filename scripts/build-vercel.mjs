import { spawnSync } from 'node:child_process'
// Vercel Preview keeps review tools. Production uses the regular live build.
const review = process.env.VERCEL_ENV === 'preview'
if(process.env.KIDSVERSE_CONNECTED_MOCK==='true' && !review) throw Error('Connected mock deployment is restricted to Vercel previews')
const connectedMock = review && process.env.KIDSVERSE_CONNECTED_MOCK === 'true'
const env = connectedMock ? {...process.env,VITE_API_MODE:'mock',VITE_API_BASE_URL:'/api/v1',VITE_ENABLE_API_REVIEW:'true'} : process.env
const result = spawnSync(process.execPath, ['node_modules/vite/bin/vite.js','build','--configLoader','runner',...['--mode',connectedMock?'mock':'live']],{stdio:'inherit',env})
process.exit(result.status ?? 1)
