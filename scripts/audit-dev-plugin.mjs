import fs from 'node:fs/promises'
import path from 'node:path'
import { comparisonPayload } from '../src/lib/api-comparison.js'
export function auditDevPlugin() {
  return { name:'kidsverse-local-audit', configureServer(server) {
    server.middlewares.use('/__audit', async(req,res,next)=>{
      const host = req.headers.host || ''
      if(!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host)) { res.statusCode=403; res.end('Local development only'); return }
      if(req.headers.origin && req.headers.origin!==`http://${host}`) {res.statusCode=403;res.end('Same origin required');return}
      const file = req.url.split('?')[0]
      const root = path.resolve(server.config.root,'docs/api-audit')
      res.setHeader('Cache-Control','no-store')
      try {
        if(req.method==='GET' && file==='/mock-comparison.json') {
          const route = new URL(req.url, 'http://localhost').searchParams.get('route') || '/'
          const mock=JSON.parse(await fs.readFile(path.resolve(server.config.root,'docs/verification/all-62-mock-api-responses.json'),'utf8'))
          res.setHeader('Content-Type','application/json');res.end(JSON.stringify(comparisonPayload(mock,{requests:[]},route)));return
        }
        if(req.method==='GET' && file==='/comparison.json') {
          const route = new URL(req.url, 'http://localhost').searchParams.get('route') || '/'
          const [mock,live] = await Promise.all([
            fs.readFile(path.resolve(server.config.root,'docs/verification/all-62-mock-api-responses.json'),'utf8'),
            fs.readFile(path.join(root,'report.json'),'utf8'),
          ])
          res.setHeader('Content-Type','application/json');res.end(JSON.stringify(comparisonPayload(JSON.parse(mock),JSON.parse(live),route)));return
        }
        if(req.method==='GET'&&file==='/mock-contract.json'){
          const data=await fs.readFile(path.resolve(server.config.root,'docs/verification/all-62-mock-api-responses.json'))
          res.setHeader('Content-Type','application/json');res.end(data);return
        }
        if(req.method==='POST' && file==='/browser-scan' && req.headers['x-kv-audit']==='1') {
          let body=''; for await(const chunk of req) {body+=chunk;if(body.length>5_000_000) throw new Error('Too large')}
          const data=JSON.parse(body)
          await fs.writeFile(path.join(root,'browser-scan.json'),JSON.stringify(data,null,2))
          res.setHeader('Content-Type','application/json');res.end('{"saved":true}');return
        }
        const allowed = {'/report.json':'report.json','/screens.json':'screens.json','/browser-scan.json':'browser-scan.json','/summary.md':'summary.md'}
        let target=allowed[file]
        if(/^\/screen-\d{2}\.png$/.test(file)) target=`screens${file}`
        if(/^\/retest-screen-\d{2}\.png$/.test(file)) target=`retest-screens/${file.slice(8)}`
        if(!target || req.method!=='GET') {res.statusCode=404;res.end('Not found');return}
        const data=await fs.readFile(path.join(root,target))
        res.setHeader('Content-Type',target.endsWith('.png')?'image/png':target.endsWith('.json')?'application/json':'text/plain; charset=utf-8')
        res.end(data)
      } catch(e) {res.statusCode=404;res.end(JSON.stringify({error:'Audit artifact not available yet'}))}
    })
  }}
}
