import fs from 'node:fs/promises'
import {createMockApi} from './api.mjs'
const root=new URL('../docs/mock-demo/',import.meta.url)
const {data}=await createMockApi()('POST','/demo/login',{})
data.token='[redacted]';data.bootstrap.session_id='[redacted]'
await fs.writeFile(new URL('bootstrap-example.json',root),JSON.stringify(data,null,2))
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;')
await fs.writeFile(new URL('gallery.html',root),`<!doctype html><html lang="en"><meta charset="utf-8"><title>Kidsverse+ — 62 local mock screens</title><style>body{font:16px system-ui;background:#eef2f8;color:#152340;margin:30px}main{max-width:1280px;margin:auto}img{width:100%;border-radius:10px}section{background:white;padding:16px;margin:24px 0;border-radius:16px}nav{display:flex;flex-wrap:wrap;gap:8px}a{color:#315bc3}</style><main><h1>Kidsverse+ · 62 local mock screens</h1><p>Synthetic demo data · Screen and response captures. <a href="http://127.0.0.1:5180/mock-demo">Open interactive demo</a></p><nav>${data.bootstrap.screens.map(s=>`<a href="#screen-${s.id}">${s.id}</a>`).join(' ')}</nav>${data.bootstrap.screens.map(s=>`<section id="screen-${s.id}"><h2>${s.id} · ${escape(s.name)}</h2><img loading="lazy" src="screens/screen-${String(s.id).padStart(2,'0')}.png" alt="${escape(s.name)} and mock response"></section>`).join('')}</main></html>`)
console.log(`Exported ${data.bootstrap.screens.length} screens and ${Object.keys(data.bootstrap.resources).length} bootstrap resources.`)
