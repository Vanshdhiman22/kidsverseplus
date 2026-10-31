import {learningPathDisplay,nextLearningNode} from './learning-path-display.js'
// Journey topic progress can lag behind real MissionProgress. Read the student
// topic details; never infer completion from local XP or cached demo data.
export async function loadJourneyProgress({journey,studentId,readTopic}) {
 const worlds=await Promise.all((journey.worlds||[]).map(async world=>{
  try{
   const detail=await readTopic(studentId,world.topic_id);
   const nodes=detail.nodes||[];
   const completed=nodes.filter(n=>['completed','mastered'].includes(n.status)).length;
   const active=nodes.some(n=>n.status==='in_progress');
   const ready=nodes.some(n=>n.status==='unlocked');
   const status=nodes.length&&completed===nodes.length?'completed':completed||active?'in_progress':ready?'unlocked':world.status;
   const display=learningPathDisplay(nodes,detail.tiers||[]);
   const next=nextLearningNode(display);
   return {...world,status,completed_missions:completed,total_missions:nodes.length,progress_verified:true,next_lesson:next?.name,exploring:Boolean(next)&&status!=='completed'};
  }catch{return world;}
 }));
 return {...journey,worlds};
}
