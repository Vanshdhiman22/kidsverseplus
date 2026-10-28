// Adapt the existing live `answers` and mock `items` response contracts.
export function reviewItems(review={}) {
 const rows=Array.isArray(review?.items)?review.items:Array.isArray(review?.answers)?review.answers:[];
 return rows.filter(q=>q&&typeof q==='object').map(q=>{
  const options=Array.isArray(q.options)?q.options:[];
  const label=value=>{
   if(value==null)return 'No answer';
   if(Array.isArray(value))return value.map(label).join(', ');
   const match=options.find(o=>typeof o==='object'&&o!==null?String(o.key??o.id??o.value??o.label??o.text)===String(value):String(o)===String(value));
   return match&&typeof match==='object'?String(match.label??match.text??match.value??value):String(match??value);
  };
  return {question:q.question_text??q.question??'',selectedLabel:label(q.selected_answer),answerLabel:label(q.correct_answer),correct:q.is_correct===true,explanation:q.explanation||'',model:q.image_url?{image:q.image_url,alt:q.image_alt||q.question_text||q.question}:null};
 });
}
