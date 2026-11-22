// All claims and terminal transitions are atomic D1 batches. No automatic retry.
export async function claimRun(db,owner,id,plugin,now,permission='read'){
 if(plugin&&!['read','diagnostic'].includes(permission))return false;
 const guard=plugin?" AND EXISTS(SELECT 1 FROM heart_plugin_settings WHERE member_id=? AND plugin_id=? AND enabled=1) AND EXISTS(SELECT 1 FROM heart_plugin_permissions p WHERE p.member_id=heart_agent_runs.member_id AND p.action=heart_agent_runs.action AND p.permission=? AND p.granted=1)":"";
 const args=plugin?[owner,plugin,permission]:[];
 const r=await db.batch([
 db.prepare("INSERT INTO heart_agent_events SELECT member_id,id,(SELECT COALESCE(MAX(seq),0)+1 FROM heart_agent_events WHERE member_id=heart_agent_runs.member_id AND run_id=heart_agent_runs.id),'running',? FROM heart_agent_runs WHERE member_id=? AND id=? AND status='approved'"+guard).bind(now,owner,id,...args),
 db.prepare("UPDATE heart_agent_runs SET status='running',updated_at=? WHERE member_id=? AND id=? AND status='approved'"+guard).bind(now,owner,id,...args)]);
 return r[1].meta.changes===1;
}
export async function finishRun(db,owner,id,status,result,now){
 if(!['done','failed'].includes(status))throw Error('Invalid terminal status');
 const r=await db.batch([
 db.prepare("INSERT INTO heart_agent_events SELECT member_id,id,(SELECT COALESCE(MAX(seq),0)+1 FROM heart_agent_events WHERE member_id=heart_agent_runs.member_id AND run_id=heart_agent_runs.id),?,? FROM heart_agent_runs WHERE member_id=? AND id=? AND status='running'").bind(status,now,owner,id),
 db.prepare("UPDATE heart_agent_runs SET status=?,result=?,updated_at=? WHERE member_id=? AND id=? AND status='running'").bind(status,result,now,owner,id)]);
 return r[1].meta.changes===1;
}
export async function expireRuns(db,owner,now){
 const cutoff=now-120000;
 await db.batch([
 db.prepare("INSERT INTO heart_agent_events SELECT member_id,id,(SELECT COALESCE(MAX(seq),0)+1 FROM heart_agent_events WHERE member_id=heart_agent_runs.member_id AND run_id=heart_agent_runs.id),'execution_timeout',? FROM heart_agent_runs WHERE member_id=? AND status='running' AND updated_at<?").bind(now,owner,cutoff),
 db.prepare("UPDATE heart_agent_runs SET status='failed',result=NULL,updated_at=? WHERE member_id=? AND status='running' AND updated_at<?").bind(now,owner,cutoff)]);
}
export async function deleteRun(db,owner,id){
 const r=await db.batch([
 db.prepare("DELETE FROM heart_agent_events WHERE member_id=? AND run_id=? AND EXISTS(SELECT 1 FROM heart_agent_runs WHERE member_id=? AND id=? AND status IN ('done','failed','cancelled'))").bind(owner,id,owner,id),
 db.prepare("DELETE FROM heart_agent_runs WHERE member_id=? AND id=? AND status IN ('done','failed','cancelled')").bind(owner,id)]);
 return r[1].meta.changes===1;
}
