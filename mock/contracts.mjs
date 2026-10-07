// Request contracts for the local app mock. Proposed extensions are labelled in
// docs/mock-demo/SENIOR-REVIEW.md; they are not claims about the live backend.
import {reject} from './contracts-error.mjs'
import {validateAssessmentRequest} from './assessment-contracts.mjs'
import {validateApiRequest} from './api-contracts.mjs'
export {MockError,reject} from './contracts-error.mjs'
const text = (min=1,max=120) => value => typeof value==='string' && value.trim().length>=min && value.length<=max
const ids = value => Array.isArray(value) && value.length<=50 && value.every(text(1,64)) && new Set(value).size===value.length
const optional = check => value => value===undefined || value===null || check(value)
const number = value => typeof value==='number' && Number.isFinite(value) && value>=0 && value<=100
const boolean = value => typeof value==='boolean'
const email = value => text(3,254)(value) && /^\S+@\S+\.\S+$/.test(value)
const specs = [
  ['POST', /^\/auth\/parent\/(signup|login)$/, {email,password:text(6,128),full_name:optional(text(0,120)),phone:optional(text(0,32))}],
  ['POST', /^\/auth\/parent\/forgot-password$/, {email}],
  ['POST', /^\/auth\/parent\/reset-password$/, {reset_token:text(64,64),password:text(6,128)}],
  ['PUT', /^\/parent\/pin$/, {pin:v=>typeof v==='string'&&/^\d{4}$/.test(v),current_password:optional(text(6,128)),current_pin:optional(v=>typeof v==='string'&&/^\d{4}$/.test(v))}],
  ['POST', /^\/parent\/pin\/verify$/, {pin:v=>typeof v==='string'&&/^\d{4}$/.test(v)}],
  ['POST', /^\/parent\/pin\/authorize$/, {proof_token:text(64,64)}],
  ['POST', /^\/students$/, {name:text(2,80)}],
  ['PATCH', /^\/students\/[^/]+\/grade-board$/, {grade:text(1,30),board:text(1,50)}],
  ['PUT', /^\/students\/[^/]+\/avatar$/, {character_id:text(1,64),outfit_item_id:optional(text(1,64)),hair_item_id:optional(text(1,64)),accessory_item_id:optional(text(1,64))}],
  ['PUT', /^\/students\/[^/]+\/interests$/, {interest_ids:ids}],
  ['PUT', /^\/students\/[^/]+\/goals$/, {goal_ids:ids}],
  ['POST', /^\/parent\/verification\/start$/, {student_id:text(1,64),full_name:text(2,120),phone:text(1,32),relationship:v=>['parent','guardian'].includes(v)}],
  ['POST', /^\/parent\/verification\/verify$/, {challenge_id:text(1,64),code:text(1,6)}],
  ['POST', /^\/students\/[^/]+\/missions\/[^/]+\/complete$/, {score:number}],
  ['POST', /^\/(tests\/attempts|challenge-battles)\/[^/]+\/answers$/, {question_id:text(1,64),selected_answer:text(1,500)}],
  ['POST', /^\/students\/[^/]+\/challenge-battles$/, {challenge_id:text(1,64),opponent_id:text(1,64)}],
  ['POST', /^\/challenge-battles\/[^/]+\/complete$/, {score:optional(number)}],
  ['POST', /^\/students\/[^/]+\/nova\/messages$/, {message:text(1,500),mission_id:optional(text(1,64))}],
  ['POST', /^\/students\/[^/]+\/break-passes$/, {date:optional(v=>/^\d{4}-\d{2}-\d{2}$/.test(v))}],
  ['PATCH', /^\/students\/[^/]+\/settings$/, {sound:optional(boolean),music:optional(boolean),voice:optional(boolean),motion:optional(boolean),readAloud:optional(boolean),theme:optional(v=>['light','dark'].includes(v)),lang:optional(v=>v==='en'),screenFit:optional(v=>['auto','stretch','fill'].includes(v)),zoom:optional(v=>typeof v==='number'&&v>=.5&&v<=2)}],
  ['POST', /^\/(demo\/login|auth\/parent\/logout|students\/[^/]+\/(nova\/greet|tests\/[^/]+\/attempts|missions\/[^/]+\/start|onboarding\/steps\/[^/]+\/complete|companion-activities\/[^/]+\/complete)|tests\/attempts\/[^/]+\/complete)$/, {}],
]
export function validateRequest(method,path,body) {
  validateApiRequest(method,path,body)
  validateAssessmentRequest(method,path,body)
  if(path==='/__mock/outbox'&&method!=='GET')reject(405,'Use GET for the local outbox')
  if(path==='/parent/pin'&&!['GET','PUT'].includes(method))reject(405,'Use GET or PUT for parent PIN')
  const methods=new Set(specs.filter(([,pattern])=>pattern.test(path)).map(([verb])=>verb))
  if(path==='/parent/pin')methods.add('GET')
  if(/^\/students\/[^/]+\/(attempts|companion-activities)$|^\/tests\/attempts\/[^/]+$|^\/challenge-battles\/[^/]+$/.test(path))methods.add('GET')
  if(publicRead(path)||/^\/parent\/(me|students|overview|evidence|plan)$/.test(path)||/^\/students\/[^/]+\/(home|subjects|journey|profile(?:\/(cards|our-journey))?|onboarding\/status|settings|break-passes|nova\/messages|extra-learning|topics\/[^/]+|missions\/[^/]+\/review)$/.test(path)||/^\/tests\/attempts\/[^/]+\/(questions\/[1-9]\d*|result)$/.test(path)||/^\/challenge-battles\/[^/]+\/result$/.test(path))methods.add('GET')
  if(methods.size&&!methods.has(method))reject(405,'Method not allowed for this route.')
  if(!body || typeof body!=='object' || Array.isArray(body))reject(400,'Request body must be a JSON object.','INVALID_BODY')
  const spec=specs.find(([verb,pattern])=>method===verb&&pattern.test(path))
  if(!spec)return
  const shape=spec[2]
  for(const key of Object.keys(body))if(!Object.hasOwn(shape,key))reject(400,`Unknown request field: ${key}`,'VALIDATION_ERROR')
  for(const [key,check]of Object.entries(shape))if(!check(body[key]))reject(400,`Invalid or missing ${key}`,'VALIDATION_ERROR')
  if(method==='PATCH'&&path.endsWith('/settings')&&!Object.keys(body).length)reject(400,'At least one setting is required.','VALIDATION_ERROR')
}
export function errorResponse(error) {
  const status=error.status||500
  const code=error.code||({400:'VALIDATION_ERROR',401:'UNAUTHORIZED',403:'FORBIDDEN',404:'NOT_FOUND',405:'METHOD_NOT_ALLOWED',409:'CONFLICT',410:'EXPIRED',413:'PAYLOAD_TOO_LARGE',415:'UNSUPPORTED_MEDIA_TYPE',429:'RATE_LIMITED'}[status]||'INTERNAL_ERROR')
  const message=status===500?'Unexpected mock server error.':error.message
  return {status,data:{error:{code,message,details:status===500?{}:error.details||{}},detail:message}}
}
export const publicRead = path => /^\/(openapi\.json|openapi\/assessments\.json|health(?:\/database)?|interests|goals|avatar\/(characters|items)|challenges(?:\/[^/]+\/(opponents|preview|leaderboard))?|subjects\/[^/]+\/topics|missions\/[^/]+|topics\/[^/]+\/tests|tests\/(?!attempts(?:\/|$))[^/]+|curriculums|themes|curriculum\/tree)$/.test(path)
