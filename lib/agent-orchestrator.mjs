// Dependencies must have succeeded; this function never claims or executes a run.
export function nextRunnable(nodes,states){
 const known=new Set(nodes.map(n=>n.id));if(known.size!==nodes.length)throw Error('Duplicate task');
 return nodes.map(n=>{if(!Array.isArray(n.dependsOn)||n.dependsOn.some(id=>!known.has(id)||id===n.id))throw Error('Invalid dependency');const state=states[n.id]??'pending';const deps=n.dependsOn.map(id=>states[id]??'pending');return {id:n.id,state,ready:state==='approved'&&deps.every(s=>s==='done'),blocked:deps.some(s=>['failed','cancelled'].includes(s))};});
}
