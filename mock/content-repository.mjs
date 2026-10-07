import {DatabaseSync} from 'node:sqlite'
import {mkdirSync} from 'node:fs'
import {dirname} from 'node:path'
import {randomUUID} from 'node:crypto'
import {seedWorlds} from './content-seed.mjs'
import {reject} from './contracts.mjs'
import {normalizeContentPackage,normalizeAuthoredQuestionBank} from '../src/content/normalize.js'
import {subjectKey} from '../src/lib/live-data.js'
import {serialize,deserialize} from 'node:v8'
import {validatePackageShape} from './api-contracts.mjs'
import companionSeed from '../src/content/companion-fixtures.json' with {type:'json'}

const banks={cfu:'check_for_understanding',test:'concept_test_questions',battle:'battle_questions',challenge:'challenge_questions'}
const slug=v=>v.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
const json=JSON.stringify,parse=JSON.parse
const requireText=(v,name)=>{if(typeof v!=='string'||!v.trim()||v.length>4000)reject(400,`${name} must be nonempty text`);return v.trim()}
const grade=v=>String(v).replace(/^Grade\s+/i,'').trim()
function validateQuestion(q,name){
  if(!q||typeof q!=='object')reject(400,`${name} must be an object`)
  requireText(q.question,name+'.question')
  if(!Array.isArray(q.options)||q.options.length<2||q.options.length>8||q.options.some(v=>typeof v!=='string'||!v.trim())||new Set(q.options).size!==q.options.length||!q.options.includes(q.answer))reject(400,`${name} requires unique text options and an answer from those options`)
  if(q.marks!==undefined&&(!Number.isFinite(q.marks)||q.marks<=0))reject(400,`${name}.marks must be positive`)
  if(q.xp!==undefined&&(!Number.isInteger(q.xp)||q.xp<0))reject(400,`${name}.xp must be a nonnegative integer`)
}
export function validateContentPackage(body){
  validatePackageShape(body)
  const keys=['curriculum','concept','theme_interest','content_type','learning_content','learn_before_test','check_for_understanding','test_questions','battle_questions','challenge']
  if(!body||typeof body!=='object'||Array.isArray(body))reject(400,'Content package must be an object')
  for(const key of Object.keys(body))if(!keys.includes(key))reject(400,`Unknown content field: ${key}`)
  for(const field of ['grade','board','subject','topic'])requireText(body.curriculum?.[field],`curriculum.${field}`)
  requireText(body.concept?.name,'concept.name');requireText(body.concept?.learning_objective,'concept.learning_objective');requireText(body.theme_interest,'theme_interest')
  if(body.content_type!=='concept_package')reject(400,'content_type must be concept_package')
  if(!body.learning_content||typeof body.learning_content!=='object'||Array.isArray(body.learning_content))reject(400,'learning_content must be an object')
  requireText(body.learning_content.explanation,'learning_content.explanation')
  const before=body.learn_before_test
  if(!before||before.required!==true||json(before.order)!==json(['understand','example','remember'])||before.starts_quiz_after!=='remember'||!Array.isArray(before.steps)||before.steps.length!==3)reject(400,'Exactly three ordered learning steps are required before quiz')
  before.steps.forEach((step,i)=>{
    if(step?.step_key!==before.order[i])reject(400,'Learning steps do not match their declared order')
    for(const key of ['title','teaching_text','key_idea'])requireText(step[key],`steps.${i}.${key}`)
    validateQuestion(step.mini_question,`steps.${i}.mini_question`)
    if(step.explanation_ways&&step.step_key!=='example')reject(400,'Explanation ways are only allowed on the example step')
    const labels=new Set()
    for(const [j,way]of (step.explanation_ways||[]).entries()){
      const label=requireText(way.label,`steps.${i}.explanation_ways.${j}.label`)
      requireText(way.teaching_text,`steps.${i}.explanation_ways.${j}.teaching_text`)
      if(labels.has(label))reject(400,'Explanation way labels must be distinct');labels.add(label)
      if(way.mini_question)validateQuestion(way.mini_question,`steps.${i}.explanation_ways.${j}.mini_question`)
    }
  })
  for(const [kind,rows]of Object.entries({cfu:body.check_for_understanding,test:body.test_questions?.questions,battle:body.battle_questions,challenge:body.challenge?.questions})){
    if(!Array.isArray(rows)||!rows.length||rows.length>100)reject(400,`${kind} bank requires 1–100 authored questions`)
    rows.forEach((q,i)=>validateQuestion(q,`${kind}.${i}`))
  }
  return structuredClone(body)
}

// Persistent local test double. Content is relational; API runtime state is an
// atomic V8 graph in the same SQLite database, including Maps and shared refs.
// Production should implement the same joins using the senior's database models.
export function createContentRepository({filename=':memory:',seed=true,clock=Date.now}={}){
  if(filename!==':memory:')mkdirSync(dirname(filename),{recursive:true})
  const db=new DatabaseSync(filename)
  let cachedWorlds=null,lastDataVersion
  db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;
    PRAGMA busy_timeout=3000;
    CREATE TABLE IF NOT EXISTS mock_runtime_state(id INTEGER PRIMARY KEY CHECK(id=1),payload BLOB NOT NULL);
    CREATE TABLE IF NOT EXISTS curriculums(id TEXT PRIMARY KEY,board TEXT NOT NULL,grade TEXT NOT NULL,name TEXT NOT NULL,UNIQUE(board,grade));
    CREATE TABLE IF NOT EXISTS subjects(id TEXT PRIMARY KEY,curriculum_id TEXT NOT NULL REFERENCES curriculums(id),name TEXT NOT NULL,slug TEXT NOT NULL,UNIQUE(curriculum_id,slug));
    CREATE TABLE IF NOT EXISTS topics(id TEXT PRIMARY KEY,subject_id TEXT NOT NULL REFERENCES subjects(id),name TEXT NOT NULL,UNIQUE(subject_id,name));
    CREATE TABLE IF NOT EXISTS concepts(id TEXT PRIMARY KEY,topic_id TEXT NOT NULL REFERENCES topics(id),name TEXT NOT NULL,objective TEXT NOT NULL,UNIQUE(topic_id,name));
    CREATE TABLE IF NOT EXISTS themes(id TEXT PRIMARY KEY,name TEXT NOT NULL UNIQUE,slug TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS concept_packages(id TEXT PRIMARY KEY,concept_id TEXT NOT NULL REFERENCES concepts(id),theme_id TEXT NOT NULL REFERENCES themes(id),mission_id TEXT NOT NULL UNIQUE,test_id TEXT NOT NULL UNIQUE,challenge_id TEXT NOT NULL UNIQUE,challenge_test_id TEXT NOT NULL UNIQUE,version INTEGER NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,UNIQUE(concept_id,theme_id));
    CREATE TABLE IF NOT EXISTS package_versions(package_id TEXT NOT NULL REFERENCES concept_packages(id),version INTEGER NOT NULL,payload_backup TEXT NOT NULL,PRIMARY KEY(package_id,version));
    CREATE TABLE IF NOT EXISTS missions(id TEXT PRIMARY KEY,package_id TEXT NOT NULL REFERENCES concept_packages(id),xp_reward INTEGER NOT NULL DEFAULT 20);
    CREATE TABLE IF NOT EXISTS tests(id TEXT PRIMARY KEY,package_id TEXT NOT NULL REFERENCES concept_packages(id),assessment_type TEXT NOT NULL,max_xp INTEGER NOT NULL DEFAULT 50,estimated_minutes INTEGER NOT NULL DEFAULT 8);
    CREATE TABLE IF NOT EXISTS challenges(id TEXT PRIMARY KEY,package_id TEXT NOT NULL REFERENCES concept_packages(id),win_xp INTEGER NOT NULL DEFAULT 50,loss_xp INTEGER NOT NULL DEFAULT 10,pass_percent REAL NOT NULL DEFAULT 50,round_limit INTEGER NOT NULL DEFAULT 3);
    CREATE TABLE IF NOT EXISTS learning_contents(id TEXT PRIMARY KEY,package_id TEXT NOT NULL,version INTEGER NOT NULL,content TEXT NOT NULL,FOREIGN KEY(package_id,version) REFERENCES package_versions(package_id,version));
    CREATE TABLE IF NOT EXISTS learn_before_test_steps(package_id TEXT NOT NULL,version INTEGER NOT NULL,position INTEGER NOT NULL,content TEXT NOT NULL,PRIMARY KEY(package_id,version,position),FOREIGN KEY(package_id,version) REFERENCES package_versions(package_id,version));
  `)
  for(const table of Object.values(banks))db.exec(`CREATE TABLE IF NOT EXISTS ${table}(id TEXT PRIMARY KEY,package_id TEXT NOT NULL,version INTEGER NOT NULL,position INTEGER NOT NULL,content TEXT NOT NULL,FOREIGN KEY(package_id,version) REFERENCES package_versions(package_id,version),UNIQUE(package_id,version,position))`)
  // Add playable definitions to databases created before these tables existed.
  db.exec(`INSERT OR IGNORE INTO missions(id,package_id) SELECT mission_id,id FROM concept_packages;
    INSERT OR IGNORE INTO tests(id,package_id,assessment_type) SELECT test_id,id,'test' FROM concept_packages;
    INSERT OR IGNORE INTO tests(id,package_id,assessment_type) SELECT challenge_test_id,id,'challenge' FROM concept_packages;
    INSERT OR IGNORE INTO challenges(id,package_id) SELECT challenge_id,id FROM concept_packages;`)
  const all=(sql,...args)=>db.prepare(sql).all(...args),one=(sql,...args)=>db.prepare(sql).get(...args),run=(sql,...args)=>db.prepare(sql).run(...args)
  db.exec('CREATE TABLE IF NOT EXISTS companion_contents(id TEXT PRIMARY KEY, content TEXT NOT NULL)')
  if(seed) for(const activity of companionSeed) run('INSERT OR IGNORE INTO companion_contents(id,content) VALUES(?,?)',activity.id,json(activity))
  const addColumn=(table,name,type)=>{if(!all(`PRAGMA table_info(${table})`).some(c=>c.name===name))db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${type}`)}
  addColumn('curriculums','description',"TEXT NOT NULL DEFAULT ''")
  addColumn('themes','description',"TEXT NOT NULL DEFAULT ''")
  addColumn('themes','icon_asset',"TEXT NOT NULL DEFAULT ''")
  if(!all('PRAGMA table_info(concept_packages)').some(c=>c.name==='published_version')){
    addColumn('concept_packages','published_version','INTEGER')
    run('UPDATE concept_packages SET published_version=version')
  }
  addColumn('concept_packages','archived','INTEGER NOT NULL DEFAULT 0')
  // Normalize existing subject aliases without deleting content or changing IDs.
  for(const s of all('SELECT * FROM subjects')){
    const key=subjectKey(s.slug)
    if(key!==s.slug&&!one('SELECT id FROM subjects WHERE curriculum_id=? AND slug=?',s.curriculum_id,key))run('UPDATE subjects SET slug=? WHERE id=?',key,s.id)
  }
  const base=`SELECT p.*,c.id concept_id,c.name concept_name,c.objective,t.id topic_id,t.name topic_name,s.id subject_id,s.name subject_name,s.slug subject_slug,u.id curriculum_id,u.board,u.grade,h.name theme FROM concept_packages p JOIN concepts c ON c.id=p.concept_id JOIN topics t ON t.id=c.topic_id JOIN subjects s ON s.id=t.subject_id JOIN curriculums u ON u.id=s.curriculum_id JOIN themes h ON h.id=p.theme_id`
  function rows(filters={}){return all(base).filter(r=>Object.entries(filters).every(([key,value])=>!value||({grade:()=>grade(r.grade)===grade(value),board:()=>r.board===value,subject:()=>subjectKey(r.subject_name)===subjectKey(value),topic:()=>r.topic_name===value,theme:()=>r.theme===value,curriculum_id:()=>r.curriculum_id===value}[key]?.()??true)))}
  function detail(packageId,version){
    const r=one(base+' WHERE p.id=?',packageId);if(!r)reject(404,'Content package not found')
    const latest=r.version
    if(version!==undefined){if(!Number.isInteger(version)||version<1||!one('SELECT version FROM package_versions WHERE package_id=? AND version=?',r.id,version))reject(404,'Content version not found');r.version=version}
    const backup=parse(one('SELECT payload_backup FROM package_versions WHERE package_id=? AND version=?',r.id,r.version).payload_backup)
    const questions=kind=>all(`SELECT id,content FROM ${banks[kind]} WHERE package_id=? AND version=? ORDER BY position`,r.id,r.version).map(v=>parse(v.content))
    return {curriculum:backup.curriculum,concept:backup.concept,theme_interest:backup.theme_interest,content_type:'concept_package',learning_content:parse(one('SELECT content FROM learning_contents WHERE package_id=? AND version=?',r.id,r.version).content),learn_before_test:{...backup.learn_before_test,steps:all('SELECT content FROM learn_before_test_steps WHERE package_id=? AND version=? ORDER BY position',r.id,r.version).map(v=>parse(v.content))},check_for_understanding:questions('cfu'),test_questions:{...backup.test_questions,questions:questions('test')},battle_questions:questions('battle'),challenge:{...backup.challenge,questions:questions('challenge')},package_id:r.id,content_version:r.version,latest_version:latest,published_version:r.published_version,is_published:!r.archived&&r.published_version!==null,archived:!!r.archived,created_at:r.created_at,updated_at:r.updated_at}
  }
  function feed(input,ids={},publish=true,expected={}){
    const body=validateContentPackage(input),stamp=new Date(clock()).toISOString()
    db.exec('SAVEPOINT content_feed')
    try{
      const ensure=(table,where,values,insert)=>{let r=one(`SELECT * FROM ${table} WHERE ${where}`,...values);if(!r){insert();r=one(`SELECT * FROM ${table} WHERE ${where}`,...values)}return r}
      const cu=body.curriculum
      const curriculum=ensure('curriculums','board=? AND grade=?',[cu.board,`Grade ${grade(cu.grade)}`],()=>run('INSERT INTO curriculums(id,board,grade,name) VALUES(?,?,?,?)',randomUUID(),cu.board,`Grade ${grade(cu.grade)}`,`${cu.board} - Grade ${grade(cu.grade)}`))
      const subject=ensure('subjects','curriculum_id=? AND slug=?',[curriculum.id,subjectKey(cu.subject)],()=>run('INSERT INTO subjects VALUES(?,?,?,?)',ids.id||randomUUID(),curriculum.id,cu.subject,subjectKey(cu.subject)))
      const topic=ensure('topics','subject_id=? AND name=?',[subject.id,cu.topic],()=>run('INSERT INTO topics VALUES(?,?,?)',ids.topicId||randomUUID(),subject.id,cu.topic))
      const concept=ensure('concepts','topic_id=? AND name=?',[topic.id,body.concept.name],()=>run('INSERT INTO concepts VALUES(?,?,?,?)',randomUUID(),topic.id,body.concept.name,body.concept.learning_objective))
      run('UPDATE concepts SET objective=? WHERE id=?',body.concept.learning_objective,concept.id)
      const theme=ensure('themes','name=?',[body.theme_interest],()=>run('INSERT INTO themes(id,name,slug) VALUES(?,?,?)',randomUUID(),body.theme_interest,slug(body.theme_interest)))
      let p=one('SELECT * FROM concept_packages WHERE concept_id=? AND theme_id=?',concept.id,theme.id)
      if(expected.id&&p?.id!==expected.id)reject(409,'Package identity cannot be changed by an update')
      if(expected.version!==undefined&&p?.version!==expected.version)reject(409,'Content changed; reload the latest version before updating')
      if(p?.archived)reject(409,'Archived content cannot be updated')
      if(p){p={...p,version:p.version+1,updated_at:stamp};run('UPDATE concept_packages SET version=?,updated_at=? WHERE id=?',p.version,stamp,p.id)}
      else{p={id:randomUUID(),version:1,mission_id:ids.missionId||randomUUID(),test_id:ids.testId||randomUUID(),challenge_id:ids.challengeId||randomUUID(),challenge_test_id:randomUUID()};run('INSERT INTO concept_packages(id,concept_id,theme_id,mission_id,test_id,challenge_id,challenge_test_id,version,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)',p.id,concept.id,theme.id,p.mission_id,p.test_id,p.challenge_id,p.challenge_test_id,1,stamp,stamp)}
      if(publish)run('UPDATE concept_packages SET published_version=? WHERE id=?',p.version,p.id)
      run('INSERT OR IGNORE INTO missions(id,package_id) VALUES(?,?)',p.mission_id,p.id)
      run('INSERT OR IGNORE INTO tests(id,package_id,assessment_type) VALUES(?,?,?)',p.test_id,p.id,'test')
      run('INSERT OR IGNORE INTO tests(id,package_id,assessment_type) VALUES(?,?,?)',p.challenge_test_id,p.id,'challenge')
      run('INSERT OR IGNORE INTO challenges(id,package_id) VALUES(?,?)',p.challenge_id,p.id)
      run('INSERT INTO package_versions VALUES(?,?,?)',p.id,p.version,json(body))
      const learningId=randomUUID();run('INSERT INTO learning_contents VALUES(?,?,?,?)',learningId,p.id,p.version,json(body.learning_content))
      body.learn_before_test.steps.forEach((v,i)=>run('INSERT INTO learn_before_test_steps VALUES(?,?,?,?)',p.id,p.version,i,json(v)))
      const collections={cfu:body.check_for_understanding,test:body.test_questions.questions,battle:body.battle_questions,challenge:body.challenge.questions}
      for(const [kind,questions]of Object.entries(collections))questions.forEach((q,i)=>run(`INSERT INTO ${banks[kind]} VALUES(?,?,?,?,?)`,ids[kind+'Ids']?.[i]||randomUUID(),p.id,p.version,i,json(q)))
      db.exec('RELEASE content_feed')
      cachedWorlds=null
      const counts=Object.fromEntries(Object.entries(collections).map(([k,v])=>[k,v.length]));counts.total=Object.values(counts).reduce((a,b)=>a+b,0)
      return {status:'success',data:{curriculum_id:curriculum.id,curriculum:curriculum.name,subject_id:subject.id,subject:subject.name,board:cu.board,grade:curriculum.grade,topic_id:topic.id,topic:topic.name,concept_id:concept.id,concept:concept.name,theme_id:theme.id,theme:theme.name,package_id:p.id,learning_content_id:learningId,mission_id:p.mission_id,test_id:p.test_id,challenge_id:p.challenge_id,challenge_test_id:p.challenge_test_id,content_version:p.version,published_version:one('SELECT published_version FROM concept_packages WHERE id=?',p.id).published_version,learn_before_test_steps_saved:3,questions_saved:counts}}
    }catch(e){db.exec('ROLLBACK TO content_feed');db.exec('RELEASE content_feed');throw e}
  }
  function worlds(){const dataVersion=one('PRAGMA data_version').data_version;if(dataVersion!==lastDataVersion){cachedWorlds=null;lastDataVersion=dataVersion}return cachedWorlds??=rows().filter(r=>!r.archived&&r.published_version!==null).map(r=>{
    r.version=r.published_version
    const payload=detail(r.id,r.version),pkg=normalizeContentPackage(payload,`db-${r.id}`,seedWorlds[0].pkg)
    const mission=one('SELECT * FROM missions WHERE id=?',r.mission_id),test=one('SELECT * FROM tests WHERE id=?',r.test_id),challengeTest=one('SELECT * FROM tests WHERE id=?',r.challenge_test_id),battle=one('SELECT * FROM challenges WHERE id=?',r.challenge_id)
    pkg.mission.xp=mission.xp_reward
    pkg.assessments.test_questions=normalizeAuthoredQuestionBank(payload.test_questions.questions,payload.learning_content)
    pkg.assessments.battle_questions=normalizeAuthoredQuestionBank(payload.battle_questions,payload.learning_content)
    pkg.assessments.challenge_questions=normalizeAuthoredQuestionBank(payload.challenge.questions,payload.learning_content)
    const questionRows=kind=>all(`SELECT id FROM ${banks[kind]} WHERE package_id=? AND version=? ORDER BY position`,r.id,r.version)
    const raw={cfu:payload.check_for_understanding,test:payload.test_questions.questions,battle:payload.battle_questions,challenge:payload.challenge.questions}
    const assign=(kind,items)=>{const ids=questionRows(kind);return items.map((q,i)=>({...q,answer:`option_${raw[kind][i].options.indexOf(raw[kind][i].answer)+1}`,id:ids[i].id,order_index:i+1}))}
    return {id:r.subject_id,slug:r.subject_slug,name:r.subject_name,topicId:r.topic_id,missionId:r.mission_id,testId:r.test_id,challengeId:r.challenge_id,challengeTestId:r.challenge_test_id,packageId:r.id,contentVersion:r.version,curriculumId:r.curriculum_id,grade:r.grade,board:r.board,rules:{test,challengeTest,battle},pkg,cfuQuestions:assign('cfu',normalizeAuthoredQuestionBank(payload.check_for_understanding,payload.learning_content)),questions:assign('test',pkg.assessments.test_questions),battleQuestions:assign('battle',pkg.assessments.battle_questions),challengeQuestions:assign('challenge',pkg.assessments.challenge_questions)}
  })}
  if(seed&&!one('SELECT id FROM concept_packages LIMIT 1'))for(const w of seedWorlds){
    const body=structuredClone(w.pkg.studio);body.content_type='concept_package';body.curriculum={...body.curriculum,grade:'Grade 4'}
    body.battle_questions=w.battleQuestions.map(q=>({question:q.instruction,options:q.options.map(o=>o.label),answer:q.options.find(o=>o.key===q.answer).label,explanation:q.explanation||'Review the concept.',difficulty:q.difficulty||'Medium',marks:q.marks||1,xp:q.xp_on_correct||10}))
    // Preserve existing demonstration IDs. Only initial seed questions use these IDs.
    feed(body,{...w,testIds:w.questions.map(q=>q.id),battleIds:w.battleQuestions.map(q=>q.id)})
  }
  const entityTables={curriculums:['board','grade','name','description'],subjects:['name'],topics:['name'],concepts:['name','learning_objective'],themes:['name','description','icon_asset']}
  function entity(table,id){const r=one(`SELECT * FROM ${table} WHERE id=?`,id);if(!r)reject(404,`${table} entry not found`);return table==='concepts'?{...r,learning_objective:r.objective}:r}
  function createEntity(table,body,parentId){
    const id=randomUUID()
    try{
      if(table==='curriculums')run('INSERT INTO curriculums(id,board,grade,name,description) VALUES(?,?,?,?,?)',id,body.board,`Grade ${grade(body.grade)}`,body.name,body.description||'')
      if(table==='themes')run('INSERT INTO themes(id,name,slug,description,icon_asset) VALUES(?,?,?,?,?)',id,body.name,slug(body.name),body.description||'',body.icon_asset||'')
      if(table==='subjects'){entity('curriculums',parentId);run('INSERT INTO subjects VALUES(?,?,?,?)',id,parentId,body.name,subjectKey(body.name))}
      if(table==='topics'){entity('subjects',parentId);run('INSERT INTO topics VALUES(?,?,?)',id,parentId,body.name)}
      if(table==='concepts'){entity('topics',parentId);run('INSERT INTO concepts VALUES(?,?,?,?)',id,parentId,body.name,body.learning_objective)}
    }catch(error){if(error.message.includes('UNIQUE constraint'))reject(409,'This catalogue entry already exists');throw error}
    cachedWorlds=null;return entity(table,id)
  }
  function mutateEntity(table,id,method,body){
    entity(table,id)
    const children={curriculums:['subjects','curriculum_id'],subjects:['topics','subject_id'],topics:['concepts','topic_id'],concepts:['concept_packages','concept_id'],themes:['concept_packages','theme_id']}[table]
    // IDs and published hierarchy are stable. Referenced metadata must be
    // edited through versioned content, not by changing a live tree silently.
    if(one(`SELECT id FROM ${children[0]} WHERE ${children[1]}=? LIMIT 1`,id))reject(409,'Entry is referenced; change its versioned content instead')
    if(method==='DELETE'){run(`DELETE FROM ${table} WHERE id=?`,id);return null}
    const changes=entityTables[table].filter(field=>body[field]!==undefined).map(field=>[field==='learning_objective'?'objective':field,field==='grade'?`Grade ${grade(body[field])}`:body[field]])
    if(body.name&&['subjects','themes'].includes(table))changes.push(['slug',table==='subjects'?subjectKey(body.name):slug(body.name)])
    try{run(`UPDATE ${table} SET ${changes.map(([column])=>column+'=?').join(',')} WHERE id=?`,...changes.map(([,value])=>value),id)}catch(error){if(error.message.includes('UNIQUE constraint'))reject(409,'This catalogue entry already exists');throw error}
    cachedWorlds=null;return entity(table,id)
  }
  function publication(id,action,version){
    const r=entity('concept_packages',id)
    if(action==='publish'){
      if(r.archived)reject(409,'Archived package cannot be published')
      if(version!==r.version)reject(409,'Only the current validated draft version can be published')
      detail(id,version);run('UPDATE concept_packages SET published_version=?,updated_at=? WHERE id=?',version,new Date(clock()).toISOString(),id)
    }else if(action==='unpublish')run('UPDATE concept_packages SET published_version=NULL WHERE id=?',id)
    else if(action==='archive')run('UPDATE concept_packages SET archived=1,published_version=NULL WHERE id=?',id)
    cachedWorlds=null;return detail(id)
  }
  return {feed,detail,worlds,entity,createEntity,mutateEntity,publication,close:()=>db.close(),filename,
    companionActivities:()=>all('SELECT content FROM companion_contents ORDER BY id').map(row=>parse(row.content)),
    catalogueTree:curriculumId=>all('SELECT * FROM subjects WHERE curriculum_id=?',curriculumId).map(s=>({...s,topics:all('SELECT * FROM topics WHERE subject_id=?',s.id).map(t=>({...t,concepts:all('SELECT * FROM concepts WHERE topic_id=?',t.id)}))})),
    loadRuntime:()=>{const row=one('SELECT payload FROM mock_runtime_state WHERE id=1');return row?deserialize(row.payload):null},
    saveRuntime:state=>run('INSERT INTO mock_runtime_state VALUES(1,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload',serialize(state)),
    transaction:async action=>{db.exec('BEGIN IMMEDIATE');try{const result=await action();db.exec('COMMIT');return result}catch(error){db.exec('ROLLBACK');cachedWorlds=null;throw error}},
    list:filters=>rows(filters).map(r=>({id:r.id,concept_id:r.concept_id,concept_name:r.concept_name,topic_name:r.topic_name,subject_name:r.subject_name,grade:r.grade,board:r.board,theme:r.theme,content_type:'concept_package',is_published:!r.archived&&r.published_version!==null,archived:!!r.archived,published_version:r.published_version,content_version:r.version,question_count:Object.values(banks).reduce((n,t)=>n+one(`SELECT count(*) n FROM ${t} WHERE package_id=? AND version=?`,r.id,r.version).n,0),created_at:r.created_at,updated_at:r.updated_at})),
    curriculums:filters=>all('SELECT * FROM curriculums').filter(r=>(!filters?.board||r.board===filters.board)&&(!filters?.grade||grade(r.grade)===grade(filters.grade))),
    themes:()=>all('SELECT * FROM themes'),
    tree:filters=>{const selected=rows(filters).filter(r=>!r.archived&&r.published_version!==null),topics=new Map();for(const r of selected){if(!topics.has(r.topic_id))topics.set(r.topic_id,{id:r.topic_id,curriculum_id:r.curriculum_id,name:r.topic_name,slug:slug(r.topic_name),subject:r.subject_name,grade:r.grade,board:r.board,concepts:[]});const t=topics.get(r.topic_id);let c=t.concepts.find(c=>c.id===r.concept_id);if(!c){c={id:r.concept_id,name:r.concept_name,slug:slug(r.concept_name),objective:detail(r.id,r.published_version).concept.learning_objective,available_themes:[]};t.concepts.push(c)}c.available_themes.push(r.theme)}return [...topics.values()]},
  }
}
