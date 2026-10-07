import fs from 'node:fs/promises'
import path from 'node:path'
import { redactApi } from '../src/lib/redact-api.js'

// Only review builds ship verification fixtures. The normal build excludes them.
export function reviewAssetsPlugin(enabled) {
  return { name: 'kidsverse-review-assets', async generateBundle() {
    if (!enabled) return
    const mock = JSON.parse(await fs.readFile(path.resolve('docs/verification/all-62-mock-api-responses.json'),'utf8'))
    const ids = new Set(mock.screens.flatMap(screen => screen.capture_ids))
    const clean = entry => ({id:entry.id,method:entry.method,path:entry.path,operation:entry.operation,screens:entry.screens,request:entry.request,status:entry.status,response:entry.response,at:entry.at,ms:entry.ms,error:entry.error})
    const data = redactApi({
      mock:{generated_at:mock.generated_at,screens:mock.screens,captures:mock.captures.filter(c=>ids.has(c.id)).map(clean)},
    })
    this.emitFile({type:'asset',fileName:'api-review/captures.json',source:JSON.stringify(data)})
  }}
}
