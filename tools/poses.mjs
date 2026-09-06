/* Rebuild public/art/chars/pose-manifest.json from what is on disk.
   Run after dropping new character renders into public/art/chars/pose/<POSE>/.
   Usage: node tools/poses.mjs */
import { readdirSync, existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = 'public/art/chars/pose'
const OUT = 'public/art/chars/pose-manifest.json'
const found = []

if (existsSync(ROOT)) {
  for (const pose of readdirSync(ROOT, { withFileTypes: true })) {
    if (!pose.isDirectory()) continue
    for (const f of readdirSync(join(ROOT, pose.name))) {
      if (f.endsWith('.webp')) found.push(`${pose.name}/${f.replace(/\.webp$/, '')}`)
    }
  }
}

found.sort()
writeFileSync(OUT, JSON.stringify(found, null, 2) + '\n')
console.log(`${OUT}: ${found.length} render${found.length === 1 ? '' : 's'}`)
for (const f of found) console.log('  ' + f)
