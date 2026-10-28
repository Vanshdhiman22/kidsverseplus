const text=v=>String(v??'').trim();
const options=q=>(q.options||[]).map(o=>text(typeof o==='object'?o.label??o.text??o.value:o)).sort();
// Join media only on exact question text AND complete choice labels. Never copy an answer.
export function questionMedia(question,questions=[]) {
 const matches=questions.filter(q=>text(q.question_text??q.question)===text(question.question_text)&&JSON.stringify(options(q))===JSON.stringify(options(question)));
 if(matches.length!==1)return question;
 const m=matches[0];
 return {...question,image_url:question.image_url||m.image_url||m.image||null,image_alt:question.image_alt||m.image_alt||'',explanation:question.explanation||m.explanation||''};
}
