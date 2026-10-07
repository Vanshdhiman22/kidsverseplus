// Shared JSON Schemas for runtime requests, response tests and OpenAPI export.
import Ajv2020 from 'ajv/dist/2020.js'
import {reject} from './contracts-error.mjs'

const object=(properties,required=Object.keys(properties))=>({type:'object',properties,required,additionalProperties:false})
const id={type:'string',minLength:1,maxLength:64}
const ref=name=>({$ref:`#/$defs/${name}`})
const nullableId={anyOf:[id,{type:'null'}]}
const integer={type:'integer',minimum:0}
const score={type:'number',minimum:0,maximum:100}
export const assessmentSchemas={
 EmptyRequest:object({}),
 AnswerRequest:object({question_id:id,selected_answer:{type:'string',minLength:1,maxLength:500}}),
 BattleStartRequest:object({challenge_id:id,opponent_id:id}),
 LegacyBattleCompleteRequest:object({score},[]),
 Option:object({key:id,label:{type:'string'},sub:{type:'string'}},['key','label']),
 Question:object({id,question_text:{type:'string',minLength:1},question_type:{const:'mcq'},options:{type:'array',minItems:2,items:ref('Option')},order_index:{type:'integer',minimum:1},hints:{type:'array',items:{type:'string'}},image_url:{type:['string','null']},image_alt:{type:['string','null']}},['id','question_text','question_type','options','order_index','hints']),
 Error:object({error:object({code:{type:'string'},message:{type:'string'},details:{type:'object'}}),detail:{type:'string'}}),
 LearningStart:object({attempt_id:id,student_id:id,mission_id:id,package_id:id,content_version:{type:'integer',minimum:1},assessment_type:{const:'cfu'},status:{const:'in_progress'},started_at:{type:'string'},total_questions:{type:'integer',minimum:1},first_question:ref('Question')}),
 LearningStatus:object({attempt_id:id,student_id:id,mission_id:id,package_id:id,content_version:{type:'integer',minimum:1},assessment_type:{const:'cfu'},status:{enum:['in_progress','completed']},started_at:{type:'string'},total_questions:{type:'integer',minimum:1},answered_questions:integer,next_question:{anyOf:[ref('Question'),{type:'null'}]}}),
 LearningAnswer:object({is_correct:{type:'boolean'},answered_questions:integer,next_question_id:nullableId}),
 LearningResult:object({attempt_id:id,mission_id:id,package_id:id,content_version:{type:'integer',minimum:1},assessment_type:{const:'cfu'},status:{const:'completed'},score,correct_count:integer,total_questions:{type:'integer',minimum:1},earned_marks:{type:'number',minimum:0},total_marks:{type:'number',exclusiveMinimum:0},stars:{type:'integer',minimum:1,maximum:3},xp_awarded:integer,completed_at:{type:'string'},next_mission_id:nullableId,topic_progress_percent:score}),
 ReviewItem:object({question_id:id,question_text:{type:'string'},options:{type:'array',items:ref('Option')},selected_answer:nullableId,correct_answer:id,is_correct:{type:'boolean'},explanation:{type:'string'},image_url:{type:['string','null']},image_alt:{type:['string','null']},marks:{type:'number',exclusiveMinimum:0},earned_marks:{type:'number',minimum:0}}),
 Review:object({attempt_id:id,assessment_type:{enum:['cfu','test','challenge','battle']},package_id:id,content_version:{type:'integer',minimum:1},status:{const:'completed'},items:{type:'array',minItems:1,items:ref('ReviewItem')}}),
 TestStart:object({attempt_id:id,status:{const:'in_progress'},assessment_type:{enum:['test','challenge']},package_id:id,content_version:{type:'integer',minimum:1},started_at:{type:'string'},total_questions:{type:'integer',minimum:1}}),
 TestAnswer:object({is_correct:{type:'boolean'},next_question_id:nullableId}),
 TestComplete:object({status:{const:'completed'},score,correct_count:integer,total_questions:{type:'integer',minimum:1},assessment_type:{enum:['test','challenge']},content_version:{type:'integer',minimum:1},package_id:id,completed_at:{type:'string'}}),
 BattleStart:object({battle_id:id,status:{const:'in_progress'},content_version:{type:'integer',minimum:1},package_id:id,started_at:{type:'string'},total_questions:{type:'integer',minimum:1}}),
 BattleAnswer:object({is_correct:{type:'boolean'},answered:integer}),
 BattleResult:object({studentId:id,status:{const:'completed'},content_version:{type:'integer',minimum:1},package_id:id,started_at:{type:'string'},result:{enum:['win','loss']},score,xp_awarded:integer,completed_at:{type:'string'}}),
}
// TestResult adds result-only fields to the same completion payload.
assessmentSchemas.TestResult=object({...assessmentSchemas.TestComplete.properties,xp_awarded:integer,extra_learning:{type:'array',items:object({mission_id:id,title:{type:'string'},reason:{type:'string'}})}})
const op=(method,path,request,response,status=200,summary='')=>({method,path,request,response,status,summary})
export const assessmentOperations=[
 op('POST','/students/{student_id}/missions/{mission_id}/attempts','EmptyRequest','LearningStart',201,'Proposed: start a server-scored CFU attempt'),
 op('GET','/missions/attempts/{attempt_id}',null,'LearningStatus',200,'Proposed: resume current CFU state'),
 op('GET','/missions/attempts/{attempt_id}/questions/{order}',null,'Question',200,'Proposed: get a CFU question without its answer'),
 op('POST','/missions/attempts/{attempt_id}/answers','AnswerRequest','LearningAnswer',200,'Proposed: submit a CFU answer'),
 op('POST','/missions/attempts/{attempt_id}/complete','EmptyRequest','LearningResult',200,'Proposed: grade and complete a CFU attempt'),
 op('GET','/missions/attempts/{attempt_id}/result',null,'LearningResult',200,'Proposed: get a completed CFU result'),
 op('GET','/missions/attempts/{attempt_id}/review',null,'Review',200,'Proposed: get completed CFU answer review'),
 op('POST','/students/{student_id}/tests/{test_id}/attempts','EmptyRequest','TestStart',201,'Start Test or Challenge practice'),
 op('GET','/tests/attempts/{attempt_id}/questions/{order}',null,'Question'),
 op('POST','/tests/attempts/{attempt_id}/answers','AnswerRequest','TestAnswer'),
 op('POST','/tests/attempts/{attempt_id}/complete','EmptyRequest','TestComplete'),
 op('GET','/tests/attempts/{attempt_id}/result',null,'TestResult'),
 op('GET','/tests/attempts/{attempt_id}/review',null,'Review',200,'Proposed: get completed Test/Challenge answer review'),
 op('POST','/students/{student_id}/challenge-battles','BattleStartRequest','BattleStart',201,'Start Battle'),
 op('GET','/challenge-battles/{battle_id}/questions/{order}',null,'Question',200,'Proposed: fetch one persisted random Battle question'),
 op('POST','/challenge-battles/{battle_id}/answers','AnswerRequest','BattleAnswer',200,'Proposed: submit Battle answer'),
 op('POST','/challenge-battles/{battle_id}/complete','LegacyBattleCompleteRequest','BattleResult',200,'Complete Battle; submitted score is ignored'),
 op('GET','/challenge-battles/{battle_id}/result',null,'BattleResult'),
 op('GET','/challenge-battles/{battle_id}/review',null,'Review',200,'Proposed: get completed Battle answer review'),
]
const ajv=new Ajv2020({allErrors:true,strict:true})
const validators=new Map(Object.keys(assessmentSchemas).map(name=>[name,ajv.compile({$defs:assessmentSchemas,...ref(name)})]))
const pattern=path=>new RegExp('^'+path.replace(/\{order\}/g,'[1-9]\\d*').replace(/\{[^}]+\}/g,'[^/]+')+'$')
const routes=assessmentOperations.map(op=>({...op,pattern:pattern(op.path)}))
export function validateAssessmentRequest(method,path,body){
 const matches=routes.filter(r=>r.pattern.test(path))
 if(!matches.length)return
 const selected=matches.find(r=>r.method===method)
 if(!selected)reject(405,'Method not allowed for this assessment route.')
 if(selected.request){
  const validate=validators.get(selected.request)
  if(!validate(body))reject(400,'Request does not match the assessment schema.','VALIDATION_ERROR',{violations:validate.errors.map(e=>({path:e.instancePath,rule:e.keyword,message:e.message,field:e.params.missingProperty??e.params.additionalProperty??null}))})
 }
}
export function checkAssessmentResponse(method,path,response){
 const selected=routes.find(r=>r.method===method&&r.pattern.test(path))
 if(!selected)throw Error('No assessment contract for '+method+' '+path)
 const name=response.status>=400?'Error':selected.response,validate=validators.get(name)
 const valid=validate(JSON.parse(JSON.stringify(response.data)))
 return {valid,errors:validate.errors,schema:name}
}
export function buildAssessmentOpenApi(){
 const convert=value=>Array.isArray(value)?value.map(convert):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).map(([k,v])=>[k,k==='$ref'?v.replace('#/$defs/','#/components/schemas/'):convert(v)])):value
 const paths={}
 for(const operation of assessmentOperations){
  const {path,method,request,response,status,summary}=operation
  const parameters=[...path.matchAll(/\{([^}]+)\}/g)].map(([,name])=>({name,in:'path',required:true,schema:name==='order'?{type:'integer',minimum:1}:id}))
  paths[path]??={}
  paths[path][method.toLowerCase()]={operationId:`${method.toLowerCase()}_${path.replace(/[^a-zA-Z0-9]+/g,'_').replace(/^_|_$/g,'')}`,summary:summary||`${method} ${path}`,parameters,security:[{ParentBearer:[]}],...(request?{requestBody:{required:true,content:{'application/json':{schema:convert(ref(request))}}}}:{}),responses:{[status]:{description:'Success',content:{'application/json':{schema:convert(ref(response))}}},...Object.fromEntries([400,401,403,404,405,409,413,415,500].map(code=>[code,{description:'Validated error',content:{'application/json':{schema:convert(ref('Error'))}}}]))}}
 }
 return {openapi:'3.1.2',info:{title:'Kidsverse local assessment API proposal',version:'4.0.0',description:'Local mock contract for CFU, Test, Challenge practice and Battle. Proposed routes are marked. This is not the released backend specification. Legacy mission score completion remains a separate compatibility route. State and content versions persist in local SQLite. The complete contract is available at /openapi.json.'},servers:[{url:'http://127.0.0.1:5180/api/v1'},{url:'http://127.0.0.1:5181/api/v1'}],paths,components:{schemas:convert(assessmentSchemas),securitySchemes:{ParentBearer:{type:'http',scheme:'bearer',description:'Local mock parent token. Ownership is enforced.'}}}}
}
