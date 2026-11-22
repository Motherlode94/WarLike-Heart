import {authenticatedHeartUser} from './account.js';
import {connectors,actions,validateTask} from '../../lib/agent-registry.mjs';
const reply=(d,s=200)=>Response.json(d,{status:s,headers:{'cache-control':'private, no-store','x-content-type-options':'nosniff'}});
const validId=x=>typeof x==='string'&&/^[a-f0-9-]{36}$/.test(x);
async function context(request,env){const u=await authenticatedHeartUser(request,env);return u&&['owner','referent'].includes(u.role)?{owner:u.id,db:env.HEART_DB}:null;}
export async function onRequestGet({request,env}){
 const c=await context(request,env);if(!c)return reply({error:'Accès opérateur requis'},403);if(!c.db)return reply({error:'Base indisponible'},503);
 try{const [r,e]=await c.db.batch([c.db.prepare('SELECT id,action,query,status,result,created_at,updated_at FROM heart_agent_runs WHERE member_id=? ORDER BY updated_at DESC LIMIT 100').bind(c.owner),c.db.prepare('SELECT run_id,seq,event,at FROM heart_agent_events WHERE member_id=? ORDER BY at DESC,seq DESC LIMIT 500').bind(c.owner)]);return reply({connectors,actions,runs:r.results,events:e.results});}catch{return reply({error:'Lecture indisponible'},503);}
}
export async function onRequestPost({request,env}){
 const u=new URL(request.url);if(u.protocol!=='https:'||request.headers.get('origin')!==u.origin||request.headers.get('sec-fetch-site')==='cross-site')return reply({error:'Origine refusée'},403);
 if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return reply({error:'JSON requis'},415);
 const c=await context(request,env);if(!c)return reply({error:'Accès opérateur requis'},403);if(!c.db)return reply({error:'Base indisponible'},503);
 let d;try{const reader=request.body.getReader(),dec=new TextDecoder();let raw='',n=0;for(;;){const {done,value}=await reader.read();if(done)break;n+=value.byteLength;if(n>4000){await reader.cancel();return reply({error:'Requête excessive'},413);}raw+=dec.decode(value,{stream:true});}d=JSON.parse(raw+dec.decode());}catch{return reply({error:'JSON invalide'},400);}
 const {db,owner}=c,now=Date.now();if(!d||typeof d!=='object')return reply({error:'Action invalide'},400);
 try{
 if(d.op==='create'){const t=validateTask(d);if(!t)return reply({error:'Action non autorisée'},400);const id=crypto.randomUUID();
 const r=await db.batch([db.prepare("INSERT INTO heart_agent_runs(member_id,id,action,query,status,created_at,updated_at) SELECT ?,?,?,?,'pending',?,? WHERE (SELECT COUNT(*) FROM heart_agent_runs WHERE member_id=?)<100").bind(owner,id,t.action,t.query,now,now,owner),db.prepare("INSERT INTO heart_agent_events SELECT member_id,id,1,'created',? FROM heart_agent_runs WHERE member_id=? AND id=?").bind(now,owner,id)]);return r[0].meta.changes?reply({id},201):reply({error:'Limite atteinte'},409);}
 if(!validId(d.id))return reply({error:'Identifiant invalide'},400);
 const id=d.id;
 if(d.op==='approve'||d.op==='cancel'){
 const next=d.op==='approve'?'approved':'cancelled';
 if(d.op==='approve'&&d.confirm!==true)return reply({error:'Confirmation requise'},400);
 const allowed=d.op==='approve'?"status='pending'":"status IN ('pending','approved')";
 const r=await db.batch([db.prepare("INSERT INTO heart_agent_events SELECT member_id,id,(SELECT COALESCE(MAX(seq),0)+1 FROM heart_agent_events WHERE member_id=? AND run_id=?),?,? FROM heart_agent_runs WHERE member_id=? AND id=? AND "+allowed).bind(owner,id,next,now,owner,id),db.prepare("UPDATE heart_agent_runs SET status=?,updated_at=? WHERE member_id=? AND id=? AND "+allowed).bind(next,now,owner,id)]);
 return r[1].meta.changes?reply({status:next}):reply({error:'Transition refusée'},409);}
 if(d.op==='run'){
 const row=await db.prepare("SELECT action,query FROM heart_agent_runs WHERE member_id=? AND id=? AND status='approved'").bind(owner,id).first();if(!row||!actions.includes(row.action))return reply({error:'Autorisation requise'},409);
 // Read-only bounded tasks. Commit result and audit atomically only if approval still exists.
 let result;
 if(row.action==='heart.goal.inspect')result=await db.prepare("SELECT id,title,status FROM heart_goals WHERE member_id=? AND instr(lower(title),lower(?))>0 LIMIT 20").bind(owner,row.query).all();
 else result=await db.prepare("SELECT id,title,kind,substr(content,1,500) AS content FROM heart_cognitive_memory WHERE member_id=? AND (expires_at IS NULL OR expires_at>?) AND instr(lower(title||' '||content),lower(?))>0 LIMIT 20").bind(owner,now,row.query).all();
 const r=await db.batch([db.prepare("INSERT INTO heart_agent_events SELECT member_id,id,(SELECT COALESCE(MAX(seq),0)+1 FROM heart_agent_events WHERE member_id=? AND run_id=?),'done',? FROM heart_agent_runs WHERE member_id=? AND id=? AND status='approved'").bind(owner,id,now,owner,id),db.prepare("UPDATE heart_agent_runs SET status='done',result=?,updated_at=? WHERE member_id=? AND id=? AND status='approved'").bind(JSON.stringify(result.results),now,owner,id)]);
 return r[1].meta.changes?reply({status:'done'}):reply({error:'Mission annulée ou déjà exécutée'},409);}
 return reply({error:'Action invalide'},400);
 }catch{return reply({error:'Mission indisponible'},503);}
}
