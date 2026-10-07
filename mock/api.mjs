import { createHash, randomBytes, randomInt, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto'
import { INTERESTS, GOALS, FACES, OUTFITS } from '../src/data/catalog.js'
import { createGameplay } from './gameplay.mjs'
import { buildBootstrap } from './bootstrap.mjs'
import { createDemoFeatures } from './demo-features.mjs'
import {validateRequest, publicRead, errorResponse} from './contracts.mjs'
import {createMockMiddleware} from './http.mjs'
import {createContentRepository} from './content-repository.mjs'
import {createContentApi,localContentAdminKey} from './content-api.mjs'
import {fileURLToPath} from 'node:url'
import {buildAssessmentOpenApi} from './assessment-contracts.mjs'
import {buildOpenApi,validateApiQuery} from './api-contracts.mjs'
import {resolve} from 'node:path'
import {MOCK_DEMO_CREDENTIALS} from '../src/data/mock-demo.js'
const databaseQueues=new Map()

// Local test double. Runtime state is committed atomically with the content DB.
const uuid = (group, n) => `00000000-0000-4000-8000-${String(group * 1000 + n).padStart(12, '0')}`
const goalKeys = ['master_school_topics', 'build_confidence', 'prepare_competitions', 'read_fluently', 'explore_beyond_class']
export const catalogs = {
  interests: INTERESTS.map((v, i) => ({ id: uuid(1, i), key: v.id, name: v.name, thumbnail_url: v.img, order_index: i, is_active: true })),
  goals: GOALS.map((v, i) => ({ id: uuid(2, i), key: goalKeys[i], name: v.title, tagline: v.tag, icon_asset: v.icon, order_index: i, is_active: true })),
  characters: FACES.map((v, i) => ({ id: uuid(3, i), name: `Explorer ${v.id}`, slug: `explorer-${v.id}`, base_image_url: v.thumb, order_index: i })),
  items: OUTFITS.map((v, i) => ({ id: uuid(4, i), name: v.name, slug: v.id, category: 'outfit', description: v.blurb, thumbnail_url: v.thumb, render_asset_url: v.thumb, unlock_type: 'free', is_default: i === 0, order_index: i })),
}
const steps = ['child', 'grade_board', 'avatar', 'interests', 'goals', 'lobby', 'nova']
const fail = (status, detail) => { throw Object.assign(new Error(detail), { status }) }

export function createMockApi({clock=Date.now,sessionTtlMs=8*60*60*1000,allowDummy=false,contentRepository=createContentRepository({clock}),contentAdminKey=process.env.KIDSVERSE_MOCK_CONTENT_ADMIN_KEY,randomIndex}={}) {
  const now=()=>new Date(clock()).toISOString()
  const expires=new Map(),idempotency=new Map()
  const parents = new Map(), tokens = new Map(), students = new Map(), verifications = new Map()
  const passwordResets=new Map(),outbox=new Map(),pins=new Map(),pinProofs=new Map()
  const gameplay = createGameplay(students,{clock,contentRepository,randomIndex})
  const demoFeature=createDemoFeatures({clock,contentRepository,evidence:gameplay.evidence})
  const contentApi=createContentApi(contentRepository,{adminKey:contentAdminKey})
  const state=()=>({version:1,parents,tokens,students,verifications,expires,idempotency,passwordResets,outbox,pins,pinProofs,gameplay:gameplay.state()})
  const restore=value=>{for(const [name,map]of Object.entries({parents,tokens,students,verifications,expires,idempotency,passwordResets,outbox,pins,pinProofs})){map.clear();for(const [key,v]of value?.[name]||[])map.set(key,v)}gameplay.restore(value?.gameplay)}
  restore(contentRepository.loadRuntime())
  async function createDemoSession() {
    const parent = { id: randomUUID(), email:MOCK_DEMO_CREDENTIALS.email, full_name:'Demo Parent', phone:'+919999999999', phone_verified_at:now() }
    const access = `mock-demo-${randomUUID()}`
    tokens.set(access,parent);expires.set(access,clock()+sessionTtlMs)
    const salt=randomUUID();pins.set(parent.id,{salt,hash:scryptSync('2468',salt,32),failures:0,blockedUntil:0})
    const family = ['Aarav','Mira'].map((name,i)=>({id:randomUUID(),parent_id:parent.id,name,grade:'4',board:'CBSE',face:i?4:1,avatar:{character_id:catalogs.characters[i?3:0].id,thumbnail_url:catalogs.characters[i?3:0].base_image_url},xp:i?450:320,onboarding_completed:true,onboarding_completed_at:now(),completed_steps:[...steps],interest_ids:catalogs.interests.slice(0,3).map(v=>v.id),goal_ids:catalogs.goals.slice(0,2).map(v=>v.id)}))
    family.forEach(s=>students.set(s.id,s))
    const bootstrap=await buildBootstrap(dispatch,access,parent,family,contentRepository.worlds())
    bootstrap.created_at=now();bootstrap.expires_at=new Date(expires.get(access)).toISOString()
    return {token:access,parent,students:family,bootstrap}
  }
  async function dispatch(method, pathname, body = {}, token,context={}) {
    const path = pathname.split('?')[0].replace(/^\/api\/v1/, '')
    const result = (data, status = 200) => ({ status, data })
    try {
      validateApiQuery(method,pathname.replace(/^\/api\/v1/,''))
      const contentResponse=contentApi(method,pathname.replace(/^\/api\/v1/,''),body,context)
      if(contentResponse)return contentResponse
      validateRequest(method,path,body)
      if(method==='GET'&&path==='/__mock/outbox'){
        if(!contentAdminKey||typeof context.contentAdminKey!=='string'||!timingSafeEqual(createHash('sha256').update(contentAdminKey).digest(),createHash('sha256').update(context.contentAdminKey).digest()))fail(403,'Local admin key required')
        return result({delivery:'local_mock_only',messages:[...outbox.values()]})
      }
      if (method === 'POST' && path === '/demo/login') {
        return result(await createDemoSession())
      }
      if(method==='POST'&&path==='/auth/parent/forgot-password'){
        const email=body.email.trim().toLowerCase(),entry=parents.get(email)
        if(entry){
          const raw=randomBytes(32).toString('hex'),id=createHash('sha256').update(raw).digest('hex'),expires_at=new Date(clock()+900000).toISOString()
          passwordResets.set(id,{email,parentId:entry.parent.id,expiresAt:clock()+900000,used:false})
          const message_id=randomUUID();outbox.set(message_id,{message_id,type:'password_reset',to:email,reset_token:raw,expires_at,created_at:now(),delivery:'local_mock_only'})
        }
        return result({message:'If an account exists, password reset instructions are available.',delivery:'local_mock_only'})
      }
      if(method==='POST'&&path==='/auth/parent/reset-password'){
        const id=createHash('sha256').update(body.reset_token).digest('hex'),reset=passwordResets.get(id)
        if(!reset)fail(400,'Invalid reset token')
        if(reset.used||clock()>=reset.expiresAt)fail(410,'Reset token expired or already used')
        const entry=parents.get(reset.email);if(!entry||entry.parent.id!==reset.parentId)fail(400,'Reset account unavailable')
        const salt=randomUUID();entry.salt=salt;entry.hash=scryptSync(body.password,salt,32)
        for(const r of passwordResets.values())if(r.parentId===reset.parentId)r.used=true
        for(const [access,parent]of tokens)if(parent.id===reset.parentId){tokens.delete(access);expires.delete(access)}
        for(const [proof,v]of pinProofs)if(v.parentId===reset.parentId)pinProofs.delete(proof)
        return result({reset:true,message:'Password updated. Sign in with the new password.'})
      }
      if (method === 'POST' && path === '/__bootstrap' && allowDummy) {
        const parent = { id: randomUUID(), email: 'dummy@kidsverse.local', full_name: 'Local tester', phone: '+919999999999', phone_verified_at: now(), created_at: now() }
        const access = `dummy-${randomUUID()}`
        const student = { id: body.student_id || randomUUID(), parent_id: parent.id, name: String(body.name || 'Demo Explorer'), grade: String(body.grade || '1'), board: String(body.board || 'CBSE'), face: Number(body.face) || 1,
          avatar: null, onboarding_completed_at: now(), onboarding_completed: true, created_at: now(), completed_steps: [...steps], interest_ids: [], goal_ids: [] }
        tokens.set(access, parent);expires.set(access,clock()+sessionTtlMs)
        if(students.has(student.id))fail(409,'Student ID already exists')
        students.set(student.id, student)
        return result({ token: access, parent, students: [student], source: 'local-dummy' }, 201)
      }
      if (method === 'GET') {
        if(path==='/openapi.json')return result(buildOpenApi())
        if(path==='/openapi/assessments.json')return result(buildAssessmentOpenApi())
        if (path === '/health') return result({ status: 'ok', source: 'mock', persistence: 'Accounts, progress, attempts and content in local SQLite' })
        if (path === '/health/database') return result({ status: 'ok', database: 'local-sqlite-content', persistence:contentRepository.filename===':memory:'?'memory':'disk', source: 'mock', packages:contentRepository.list().length })
        const key = { '/interests': 'interests', '/goals': 'goals', '/avatar/characters': 'characters', '/avatar/items': 'items' }[path]
        if(key){
          let values=catalogs[key];const category=new URL(pathname,'http://mock.local').searchParams.get('category')
          if(key==='items'&&category){if(!['outfit','hair','accessory'].includes(category))fail(400,'Invalid avatar category');values=values.filter(v=>v.category===category)}
          return result({[key]:values})
        }
        if(publicRead(path)){const response=demoFeature(method,pathname,body,{},students)||gameplay(method,pathname,body,{});if(response)return response}
      }
      if (method === 'POST' && ['/auth/parent/signup', '/auth/parent/login'].includes(path)) {
        const email = String(body.email || '').trim().toLowerCase()
        if (!/^\S+@\S+\.\S+$/.test(email) || typeof body.password !== 'string' || body.password.length < 6) fail(400, 'Valid email and password of at least 6 characters required.')
        if (email === MOCK_DEMO_CREDENTIALS.email) {
          if (path.endsWith('signup')) fail(409, 'This email is reserved for the sample mock account. Use mock login.')
          const supplied=createHash('sha256').update(body.password).digest(),expected=createHash('sha256').update(MOCK_DEMO_CREDENTIALS.password).digest()
          if (!timingSafeEqual(supplied,expected)) fail(401, 'Invalid email or password')
          return result(await createDemoSession())
        }
        let entry = parents.get(email)
        if (path.endsWith('signup')) {
          if (entry) fail(400, 'Email already exists')
          const salt = randomUUID()
          entry = { parent: { id: randomUUID(), email, full_name: body.full_name || '', phone: body.phone || '', created_at: now(), last_login_at: null }, salt, hash: scryptSync(body.password, salt, 32) }
          parents.set(email, entry)
        } else {
          if (!entry || !timingSafeEqual(entry.hash, scryptSync(body.password, entry.salt, 32))) fail(401, 'Invalid email or password')
          entry.parent.last_login_at = now()
        }
        const access = `mock-${randomUUID()}`
        tokens.set(access, entry.parent);expires.set(access,clock()+sessionTtlMs)
        return result({ parent: entry.parent, token: access }, path.endsWith('signup') ? 201 : 200)
      }
      if(expires.has(token)&&clock()>=expires.get(token)){tokens.delete(token);expires.delete(token)}
      const parent = tokens.get(token)
      if (!parent) fail(401, 'Sign in first. Session is missing, expired or revoked.')
      if(path==='/parent/pin'&&method==='GET')return result({has_pin:pins.has(parent.id)})
      if(path==='/parent/pin'&&method==='PUT'){
        const prior=pins.get(parent.id),entry=[...parents.values()].find(v=>v.parent.id===parent.id)
        if(body.current_pin&&prior&&clock()<prior.blockedUntil)fail(429,'PIN temporarily locked; use the current password or try later')
        const verified=body.current_password&&entry&&timingSafeEqual(entry.hash,scryptSync(body.current_password,entry.salt,32))
        const oldVerified=body.current_pin&&prior&&timingSafeEqual(prior.hash,scryptSync(body.current_pin,prior.salt,32))
        if(!verified&&!oldVerified){if(body.current_pin&&prior){prior.failures++;if(prior.failures>=5){prior.blockedUntil=clock()+300000;prior.failures=0}}fail(403,'Current password or existing PIN required')}
        const salt=randomUUID();pins.set(parent.id,{salt,hash:scryptSync(body.pin,salt,32),failures:0,blockedUntil:0})
        for(const [proof,v]of pinProofs)if(v.parentId===parent.id)pinProofs.delete(proof)
        return result({has_pin:true,updated_at:now()})
      }
      if(path==='/parent/pin/verify'&&method==='POST'){
        const pin=pins.get(parent.id);if(!pin)fail(409,'Set a parent PIN first')
        if(clock()<pin.blockedUntil)fail(429,'PIN temporarily locked; try again later')
        if(!timingSafeEqual(pin.hash,scryptSync(body.pin,pin.salt,32))){pin.failures++;if(pin.failures>=5){pin.blockedUntil=clock()+300000;pin.failures=0}fail(403,'Incorrect PIN')}
        pin.failures=0;pin.blockedUntil=0
        const proof_token=randomBytes(32).toString('hex');pinProofs.set(createHash('sha256').update(proof_token).digest('hex'),{parentId:parent.id,expiresAt:clock()+300000})
        return result({pin_verified:true,proof_token,expires_in_seconds:300})
      }
      if(path==='/parent/pin/authorize'&&method==='POST'){
        const proof=pinProofs.get(createHash('sha256').update(body.proof_token).digest('hex'))
        if(!proof||proof.parentId!==parent.id)fail(403,'Invalid parent PIN proof')
        if(clock()>=proof.expiresAt)fail(410,'Parent PIN proof expired')
        return result({authorized:true,expires_at:new Date(proof.expiresAt).toISOString()})
      }
      if(/^\/parent\/(overview|evidence|plan)$/.test(path)&&context.parentPinProof){
        const proof=pinProofs.get(createHash('sha256').update(context.parentPinProof).digest('hex'))
        if(!proof||proof.parentId!==parent.id)fail(403,'Invalid parent PIN proof')
        if(clock()>=proof.expiresAt)fail(410,'Parent PIN proof expired')
      }
      const featureResponse = demoFeature(method,pathname,body,parent,students)
      if(featureResponse) return featureResponse
      const gameResponse = gameplay(method, pathname.replace(/^\/api\/v1/, ''), body, parent)
      if (gameResponse) return gameResponse
      if (path === '/auth/parent/logout' && method === 'POST') { tokens.delete(token); expires.delete(token); return result(null, 204) }
      if (path === '/parent/me' && method === 'GET') return result(parent)
      if (path === '/parent/verification/start' && method === 'POST') {
        const name = String(body.full_name || '').trim()
        const phone = String(body.phone || '')
        const relationship = String(body.relationship || '')
        const student = students.get(body.student_id)
        if (!student || student.parent_id !== parent.id) fail(404, 'Child not found in this parent account.')
        if (name.length < 2 || !/^\+91[6-9]\d{9}$/.test(phone) || !['parent', 'guardian'].includes(relationship)) fail(400, 'Valid parent name, relationship and Indian mobile number are required.')
        const existing = [...verifications.values()].find(entry => entry.parentId === parent.id && entry.phone === phone && !entry.used && clock() - entry.createdAt < 30000)
        if (existing) fail(429, 'Please wait 30 seconds before requesting another code.')
        const challengeId = randomUUID(), code = token.startsWith('mock-demo-')?'123456':String(randomInt(0, 1000000)).padStart(6, '0')
        verifications.set(challengeId, { parentId: parent.id, studentId: student.id, name, relationship, phone, code, createdAt: clock(), attempts: 0, used: false })
        return result({ challenge_id: challengeId, expires_in_seconds: 300, dev_code: code, delivery: 'local_mock_only' }, 201)
      }
      if (path === '/parent/verification/verify' && method === 'POST') {
        const challenge = verifications.get(body.challenge_id)
        if (!challenge || challenge.parentId !== parent.id || challenge.used) fail(400, 'Verification request is invalid. Request a new code.')
        if (clock() - challenge.createdAt > 300000) fail(410, 'Code expired. Request a new one.')
        if (challenge.attempts >= 5) fail(429, 'Too many attempts. Request a new code.')
        challenge.attempts += 1
        if (String(body.code || '') !== challenge.code) fail(400, 'Incorrect code. Please try again.')
        challenge.used = true
        Object.assign(parent, { full_name: challenge.name, relationship: challenge.relationship, phone: challenge.phone, phone_verified_at: now() })
        return result({ phone_verified: true, phone: challenge.phone, parent_id: parent.id, verified_at: parent.phone_verified_at })
      }
      if (path === '/parent/students' && method === 'GET') return result({ students: [...students.values()].filter(s => s.parent_id === parent.id).map(s => ({ ...s, onboarding_completed: !!s.onboarding_completed_at })) })
      if (path === '/students' && method === 'POST') {
        if (typeof body.name !== 'string' || body.name.trim().length < 2) fail(400, 'Child name must contain at least two characters.')
        const student = { id: randomUUID(), parent_id: parent.id, name: body.name.trim(), grade: '', board: '', avatar: null, onboarding_completed_at: null, created_at: now(), completed_steps: ['child'], interest_ids: [], goal_ids: [] }
        students.set(student.id, student)
        return result(student, 201)
      }
      const match = path.match(/^\/students\/([^/]+)\/(.+)$/)
      if (!match) fail(404, 'Mock route not implemented; no simulated success returned.')
      const student = students.get(match[1]), action = match[2]
      if (!student) fail(404, 'Student not found')
      if(student.parent_id!==parent.id)fail(403,'Authenticated parent does not own this student')
      const complete = key => { if (!student.completed_steps.includes(key)) student.completed_steps.push(key) }
      const selectIds = (field, catalog) => {
        const ids = body[field]
        if (!Array.isArray(ids) || ids.some(id => !catalog.some(v => v.id === id)) || new Set(ids).size !== ids.length) fail(400, `${field} must contain unique catalog UUIDs.`)
        student[field] = [...ids]
      }
      if (method === 'PATCH' && action === 'grade-board') {
        if (!parent.phone_verified_at) fail(403, 'Verify the parent phone before continuing child onboarding.')
        if (!body.grade || !body.board) fail(400, 'grade and board are required')
        Object.assign(student, { grade: String(body.grade), board: body.board }); complete('grade_board'); return result(student)
      }
      if (method === 'PUT' && action === 'avatar') {
        const character = catalogs.characters.find(c => c.id === body.character_id)
        if (!character) fail(400, 'Unknown character_id')
        if (body.outfit_item_id && !catalogs.items.some(i => i.id === body.outfit_item_id)) fail(400, 'Unknown outfit_item_id')
        for(const field of ['hair_item_id','accessory_item_id'])if(body[field])fail(400,`No ${field} fixture exists`)
        student.avatar = { character_id: character.id, thumbnail_url: character.base_image_url, outfit_item_id: body.outfit_item_id || null }
        complete('avatar'); return result({ ...student.avatar, hair_item_id: null, accessory_item_id: null, updated_at: now() })
      }
      if (method === 'PUT' && action === 'interests') { selectIds('interest_ids', catalogs.interests); complete('interests'); return result({ selected_count: student.interest_ids.length, interest_ids: student.interest_ids }) }
      if (method === 'PUT' && action === 'goals') { selectIds('goal_ids', catalogs.goals); complete('goals'); return result({ goal_ids: student.goal_ids }) }
      if (method === 'GET' && action === 'onboarding/status') return result({ completed_steps: student.completed_steps, next_step: steps.find(s => !student.completed_steps.includes(s)) || null, is_complete: !!student.onboarding_completed_at })
      const step = action.match(/^onboarding\/steps\/([^/]+)\/complete$/)
      if (method === 'POST' && step) { if (!steps.includes(step[1])) fail(400, 'Unknown step'); complete(step[1]); return result({ step_key: step[1], completed_at: now() }) }
      if (method === 'POST' && action === 'nova/greet') {
        if (steps.slice(0, 5).some(s => !student.completed_steps.includes(s))) fail(400, 'Complete the earlier onboarding screens first.')
        complete('nova'); student.onboarding_completed_at = now()
        return result({ message: `Hey ${student.name}! I'm Nova, your AI learning companion!`, onboarding_completed_at: student.onboarding_completed_at })
      }
      if (method === 'GET' && action === 'home') return result({ greeting: `Ready for today's adventure, ${student.name}?`, stats: { day_streak: 0, total_xp: 0, level: 1 }, recommended_mission: null, subjects: [] })
      if (method === 'GET' && action === 'profile') return result({ name: student.name, grade: student.grade, board: student.board, avatar_thumbnail_url: student.avatar?.thumbnail_url, level: 1, total_xp: 0, day_streak: 0 })
      fail(404, 'Mock route not implemented; no simulated success returned.')
    } catch (error) { return errorResponse(error) }
  }
  // Clone transport results so consumers cannot mutate authoritative in-memory state.
  async function execute(method,pathname,body={},token,context={}) {
    const key=context.idempotencyKey
    if(key&&(typeof key!=='string'||key.length>128||!key.trim()))return errorResponse({status:400,message:'Invalid Idempotency-Key'})
    const adminScope=createHash('sha256').update(context.contentAdminKey||'').digest('hex')
    const normalizedPath=pathname.split('?')[0].replace(/^\/api\/v1/,'')
    const cacheKey=key&&!['GET','HEAD'].includes(method)&&!/^\/parent\/pin\/(verify|authorize)$/.test(normalizedPath)?`${token||'public'}:${adminScope}:${method}:${pathname}:${key}`:null
    const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v
    const fingerprint=createHash('sha256').update(JSON.stringify(canonical(body))).digest('hex')
    if(cacheKey&&idempotency.has(cacheKey)){
      const saved=idempotency.get(cacheKey)
      // A revoked or expired session must not replay an earlier authenticated response.
      if(token&&(!tokens.has(token)||clock()>=expires.get(token)))return errorResponse({status:401,message:'Sign in first.'})
      const returnedToken=saved.response.data?.token
      if(returnedToken&&(!tokens.has(returnedToken)||clock()>=expires.get(returnedToken)))return errorResponse({status:401,message:'Cached authentication has expired or been revoked.'})
      if(saved.fingerprint!==fingerprint)return errorResponse({status:409,message:'Idempotency key reused with different payload.'})
      return structuredClone(saved.response)
    }
    const resolved=await dispatch(method,pathname,body,token,context)
    if(cacheKey&&resolved.status<400)idempotency.set(cacheKey,{fingerprint,response:structuredClone(resolved)})
    return structuredClone(resolved)
  }
  // Serialize this process's calls; SQLite's write transaction also protects
  // cross-process state. Each call reloads committed state before applying writes.
  let queue=Promise.resolve()
  const queueId=contentRepository.filename===':memory:'?null:resolve(contentRepository.filename).toLowerCase()
  function handle(...args){
    const job=(queueId?databaseQueues.get(queueId)||Promise.resolve():queue).then(async()=>{
      let baseline
      try{return await contentRepository.transaction(async()=>{
        restore(contentRepository.loadRuntime());baseline=structuredClone(state())
        for(const [access,until]of expires)if(clock()>=until){tokens.delete(access);expires.delete(access)}
        const result=await execute(...args);contentRepository.saveRuntime(state());return result
      })}catch(error){if(baseline)restore(baseline);return errorResponse(error)}
    })
    const queued=job.then(()=>undefined,()=>undefined);queue=queued
    if(queueId){databaseQueues.set(queueId,queued);queued.then(()=>{if(databaseQueues.get(queueId)===queued)databaseQueues.delete(queueId)})}
    return job
  }
  handle.close=()=>contentRepository.close()
  return handle

}

export function mockApiPlugin(base = '/api/v1') {
  const handle=createMockApi({allowDummy:base==='/__dummy/api/v1',contentAdminKey:base==='/api/v1'?localContentAdminKey():undefined,contentRepository:createContentRepository({filename:base==='/api/v1'?fileURLToPath(new URL('../.mock-data/content.sqlite',import.meta.url)):':memory:'})})
  return {name:'kidsverse-local-mock',configureServer(server){server.middlewares.use(base,createMockMiddleware(handle));server.httpServer?.once('close',()=>handle.close())}}
}
