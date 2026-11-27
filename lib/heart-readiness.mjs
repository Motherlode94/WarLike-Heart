const checks=[
 ['0003','heart_goals','member_id,id,title,steps,status,revision,updated_at'],
 ['0004','heart_cognitive_memory','member_id,id,kind,title,content,source,revision,created_at,updated_at,expires_at'],
 ['0005','heart_graph_nodes','member_id,id,kind,label,source,confidence'],
 ['0005','heart_graph_edges','member_id,id,from_id,to_id,relation,source,confidence'],
 ['0006','heart_agent_runs','member_id,id,action,query,status,result,created_at,updated_at'],
 ['0006','heart_agent_events','member_id,run_id,seq,event,at'],
 ['0007','heart_plugin_settings','member_id,plugin_id,enabled,revision,updated_at'],
 ['0008','heart_plugin_permissions','member_id,action,permission,granted,updated_at']
];
export async function inspectReadiness(db){
 if(!db)return {binding:false,ready:false,checks:checks.map(([migration,table])=>({migration,table,status:'not_checked'}))};
 const results=await Promise.all(checks.map(async([migration,table,columns])=>{
  try{await db.prepare('SELECT '+columns+' FROM '+table+' LIMIT 0').all();return {migration,table,status:'readable'};}
  catch{return {migration,table,status:'unavailable'};}
 }));
 return {binding:true,ready:results.every(x=>x.status==='readable'),checks:results};
}
