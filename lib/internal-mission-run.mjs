import {buildHandoffs} from './agent-handoffs.mjs';
import {collaborationDraft} from './agent-collaboration.mjs';
export async function runInternalMission(db,owner,tasks,now){
 const plan=collaborationDraft(tasks,['heart.memory.search','heart.goal.inspect']);const results=[],states=new Map();
 for(const n of plan.nodes){if(n.dependsOn.some(id=>states.get(id)!=='done')){states.set(n.id,'blocked');results.push({id:n.id,status:'blocked'});continue;}
 try{const q=n.action==='heart.goal.inspect'?db.prepare("SELECT id,title,status FROM heart_goals WHERE member_id=? AND instr(lower(title),lower(?))>0 ORDER BY id LIMIT 10").bind(owner,n.query):db.prepare("SELECT id,title,kind,substr(content,1,500) AS content FROM heart_cognitive_memory WHERE member_id=? AND (expires_at IS NULL OR expires_at>?) AND instr(lower(title||' '||content),lower(?))>0 ORDER BY id LIMIT 10").bind(owner,now,n.query);const r=await q.all();states.set(n.id,'done');results.push({id:n.id,status:'done',records:r.results});}catch{states.set(n.id,'failed');results.push({id:n.id,status:'failed'});}}
 return {results,handoffs:buildHandoffs(plan.nodes,results),completed:results.every(r=>r.status==='done'),persisted:false};
}
