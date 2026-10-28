// Display API state without inferring prerequisites, mastery or entitlement.
export function learningPathDisplay(nodes=[]) {
 return nodes.map(node=>{
  const state={completed:['Completed','done'],mastered:['Mastered','done'],in_progress:['Continue learning','progress'],unlocked:['Start learning','ready'],locked:['Locked','locked']}[node.status];
  const startable=['unlocked','in_progress','completed','mastered'].includes(node.status);
  return {...node,displayLabel:state?.[0]||node.status||'Unavailable',displayState:state?.[1]||'locked',startable,needsStart:false};
 });
}
export function nextLearningNode(nodes){return nodes.find(n=>n.startable&&!['completed','mastered'].includes(n.status))||nodes.find(n=>n.startable);}
