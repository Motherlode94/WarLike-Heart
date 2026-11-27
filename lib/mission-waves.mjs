// Execute independent read-only tasks in bounded waves, never external operations.
export async function executeWaves(nodes,execute,maxParallel=2){
 if(!Number.isInteger(maxParallel)||maxParallel<1||maxParallel>2)throw Error('Invalid concurrency');
 const states=new Map(),results=new Map(),waves=[],pending=new Map(nodes.map(n=>[n.id,n]));
 if(pending.size!==nodes.length)throw Error('Duplicate task');
 while(pending.size){
  for(const n of pending.values())if(n.dependsOn.some(id=>['failed','blocked'].includes(states.get(id)))){states.set(n.id,'blocked');results.set(n.id,{id:n.id,status:'blocked'});pending.delete(n.id);}
  if(!pending.size)break;
  const ready=[...pending.values()].filter(n=>n.dependsOn.every(id=>states.get(id)==='done')).slice(0,maxParallel);
  if(!ready.length){if([...pending.values()].some(n=>n.dependsOn.some(id=>['failed','blocked'].includes(states.get(id)))))continue;throw Error('Invalid dependency graph');}
  waves.push(ready.map(n=>n.id));
  await Promise.all(ready.map(async n=>{let result;try{result={...await execute(n,[...results.values()]),id:n.id,status:'done'};}catch{result={id:n.id,status:'failed'};}states.set(n.id,result.status);results.set(n.id,result);pending.delete(n.id);}));
 }
 return {results:nodes.map(n=>results.get(n.id)),waves};
}
