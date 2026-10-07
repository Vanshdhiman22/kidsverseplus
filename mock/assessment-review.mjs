export function gradeAnswers(questions,answers){
 const submitted=id=>answers instanceof Map?answers.get(id):answers[id]
 const total_marks=questions.reduce((n,q)=>n+(q.marks??1),0)
 const earned_marks=questions.reduce((n,q)=>n+(submitted(q.id)?.is_correct?(q.marks??1):0),0)
 return {score:earned_marks/total_marks*100,correct_count:questions.filter(q=>submitted(q.id)?.is_correct).length,total_questions:questions.length,earned_marks,total_marks}
}
export function buildAnswerReview({attempt_id,assessment_type,package_id,content_version,questions,answers}){
 const submitted=id=>answers instanceof Map?answers.get(id):answers[id]
 return {attempt_id,assessment_type,package_id,content_version,status:'completed',items:questions.map(q=>{
  const a=submitted(q.id),marks=q.marks??1
  return {question_id:q.id,question_text:q.instruction,options:q.options,selected_answer:a?.selected??null,correct_answer:q.answer,is_correct:a?.is_correct??false,explanation:q.explanation||'',image_url:q.models?.[0]?.image??null,image_alt:q.models?.[0]?.alt??null,marks,earned_marks:a?.is_correct?marks:0}
 })}
}
