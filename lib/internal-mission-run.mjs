import {contextForAgent} from './agent-handoffs.mjs';
import {rankWithDependencyContext} from './dependency-ranking.mjs';
import {summarizeMission} from './mission-summary.mjs';
import {buildHandoffs} from './agent-handoffs.mjs';
import {collaborationDraft} from './agent-collaboration.mjs';
import {executeWaves} from './mission-waves.mjs';
export async function runInternalMission(db,owner,tasks,now){
 const plan=collaborationDraft(tasks,['heart.memory.search','heart.goal.inspect']);
 if(plan.nodes.length>5)throw Error('Too many tasks');
 const {results,waves}=await executeWaves(plan.nodes,async(n,previousResults)=>{
 const previous=buildHandoffs([n],previousResults);
 const q=n.action==='heart.goal.inspect'?db.prepare("SELECT id,title,status FROM heart_goals WHERE member_id=? AND instr(lower(title),lower(?))>0 ORDER BY id LIMIT 10").bind(owner,n.query):db.prepare("SELECT id,title,kind,substr(content,1,500) AS content FROM heart_cognitive_memory WHERE member_id=? AND (expires_at IS NULL OR expires_at>?) AND instr(lower(title||' '||content),lower(?))>0 ORDER BY id LIMIT 10").bind(owner,now,n.query);
 const r=await q.all();const sharedContext=contextForAgent(n,previousResults);return {records:rankWithDependencyContext(r.results,sharedContext),sharedContext,dependencyContext:previous.map(h=>({from:h.from,recordCount:h.recordCount,records:h.records}))};
 });
 return {results,waves,summary:summarizeMission({results}),handoffs:buildHandoffs(plan.nodes,results),completed:results.every(r=>r.status==='done'),persisted:false};
}
