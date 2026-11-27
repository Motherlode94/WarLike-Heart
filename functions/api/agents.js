import {listAgentProfiles} from '../../lib/agent-profiles.mjs';
import {readPermissions,setPermission,supportedPermission} from '../../lib/plugin-permissions.mjs';
import {probePlugin} from '../../lib/plugin-health.mjs';
import {claimRun,finishRun,expireRuns,deleteRun} from '../../lib/agent-execution.mjs';
import {enabledPlugins,pluginAllowed} from '../../lib/plugin-policy.mjs';
import {pluginActions,pluginAvailability,validPluginQuery,executePlugin} from '../../lib/plugin-gateway.mjs';
import {authenticatedHeartUser} from './account.js';
import {connectors,actions,validateTask} from '../../lib/agent-registry.mjs';
const reply=(d,s=200)=>Response.json(d,{status:s,headers:{'cache-control':'private, no-store','x-content-type-options':'nosniff'}});
const validId=x=>typeof x==='string'&&/^[a-f0-9-]{36}$/.test(x);
async function context(request,env){const u=await authenticatedHeartUser(request,env);return u&&['owner','referent'].includes(u.role)?{owner:u.id,role:u.role,db:env.HEART_DB}:null;}
export async function onRequestGet({request,env}){
 const c=await context(request,env);if(!c)return reply({error:'Accès opérateur requis'},403);if(!c.db)return reply({error:'Base indisponible'},503);
 try{await expireRuns(c.db,c.owner,Date.now());const [r,e]=await c.db.batch([c.db.prepare('SELECT id,action,query,status,result,created_at,updated_at FROM heart_agent_runs WHERE member_id=? ORDER BY updated_at DESC LIMIT 100').bind(c.owner),c.db.prepare('SELECT run_id,seq,event,at FROM heart_agent_events WHERE member_id=? ORDER BY at DESC,seq DESC LIMIT 500').bind(c.owner)]);const configured=c.role==='owner'?pluginAvailability(env):{},availability=await enabledPlugins(c.db,c.owner,configured);const permissions=c.role==='owner'?await readPermissions(c.db,c.owner):{};const permitted=actions.filter(a=>!pluginActions.includes(a)||(c.role==='owner'&&availability[a.split('.')[0]]&&(permissions[a]?.read||permissions[a]?.diagnostic)));return reply({profiles:listAgentProfiles(permitted),permissions,connectors:connectors.map(x=>({...x,available:!!availability[x.id],configured:!!configured[x.id],manageable:c.role==='owner'&&!!configured[x.id],reason:availability[x.id]?'Enabled, not live verified':configured[x.id]?'Disabled':x.reason})),actions:permitted,runs:r.results,events:e.results});}catch{return reply({error:'Lecture indisponible'},503);}
}
export async function onRequestPost({request,env}){
 const u=new URL(request.url);if(u.protocol!=='https:'||request.headers.get('origin')!==u.origin||request.headers.get('sec-fetch-site')==='cross-site')return reply({error:'Origine refusée'},403);
 if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return reply({error:'JSON requis'},415);
 const c=await context(request,env);if(!c)return reply({error:'Accès opérateur requis'},403);if(!c.db)return reply({error:'Base indisponible'},503);
 let d;try{const reader=request.body.getReader(),dec=new TextDecoder();let raw='',n=0;for(;;){const {done,value}=await reader.read();if(done)break;n+=value.byteLength;if(n>4000){await reader.cancel();return reply({error:'Requête excessive'},413);}raw+=dec.decode(value,{stream:true});}d=JSON.parse(raw+dec.decode());}catch{return reply({error:'JSON invalide'},400);}
 const {db,owner}=c,now=Date.now();if(!d||typeof d!=='object')return reply({error:'Action invalide'},400);
 try{
 if(d.op==='setPermission'){
 if(c.role!=='owner'||!supportedPermission(d.action,d.permission)||typeof d.granted!=='boolean'||(d.granted&&d.confirm!==true))return reply({error:'Permission non autorisée'},403);
 await setPermission(db,owner,c.role,d.action,d.permission,d.granted,now);return reply({action:d.action,permission:d.permission,granted:d.granted});
 }
 if(d.op==='setPlugin'){
 const configured=pluginAvailability(env);
 if(c.role!=='owner'||typeof d.plugin!=='string'||!Object.hasOwn(configured,d.plugin)||typeof d.enabled!=='boolean'||(d.enabled&&(!configured[d.plugin]||d.confirm!==true)))return reply({error:'Modification non autorisée'},403);
 const statements=[db.prepare("INSERT INTO heart_plugin_settings(member_id,plugin_id,enabled,updated_at) VALUES(?,?,?,?) ON CONFLICT(member_id,plugin_id) DO UPDATE SET enabled=excluded.enabled,updated_at=excluded.updated_at,revision=heart_plugin_settings.revision+1").bind(owner,d.plugin,Number(d.enabled),now)];
 if(!d.enabled){const prefix=d.plugin+'.%';statements.push(db.prepare("INSERT INTO heart_agent_events SELECT member_id,id,(SELECT COALESCE(MAX(seq),0)+1 FROM heart_agent_events WHERE member_id=heart_agent_runs.member_id AND run_id=heart_agent_runs.id),'plugin_disabled',? FROM heart_agent_runs WHERE member_id=? AND action LIKE ? AND status IN ('pending','approved')").bind(now,owner,prefix),db.prepare("UPDATE heart_agent_runs SET status='cancelled',updated_at=? WHERE member_id=? AND action LIKE ? AND status IN ('pending','approved')").bind(now,owner,prefix));}
 await db.batch(statements);return reply({plugin:d.plugin,enabled:d.enabled});
 }
 if(d.op==='create'){const t=validateTask(d);if(!t)return reply({error:'Action non autorisée'},400);if(pluginActions.includes(t.action)&&(!await pluginAllowed(db,owner,c.role,pluginAvailability(env),t.action.split('.')[0])||!validPluginQuery(t.action,t.query,env)))return reply({error:'Connecteur ou ressource non autorisé'},403);if(pluginActions.includes(t.action)){const p=(await readPermissions(db,owner))[t.action];if(!p?.read&&!p?.diagnostic)return reply({error:'Permission requise'},403);}const id=crypto.randomUUID();
 const r=await db.batch([db.prepare("INSERT INTO heart_agent_runs(member_id,id,action,query,status,created_at,updated_at) SELECT ?,?,?,?,'pending',?,? WHERE (SELECT COUNT(*) FROM heart_agent_runs WHERE member_id=?)<100").bind(owner,id,t.action,t.query,now,now,owner),db.prepare("INSERT INTO heart_agent_events SELECT member_id,id,1,'created',? FROM heart_agent_runs WHERE member_id=? AND id=?").bind(now,owner,id)]);return r[0].meta.changes?reply({id},201):reply({error:'Limite atteinte'},409);}
 if(!validId(d.id))return reply({error:'Identifiant invalide'},400);
 const id=d.id;
 if(d.op==='delete'){if(d.confirm!==true)return reply({error:'Confirmation requise'},400);return await deleteRun(db,owner,id)?reply({deleted:true}):reply({error:'Suppression refusée'},409);}
 if(d.op==='approve'||d.op==='cancel'){
 const next=d.op==='approve'?'approved':'cancelled';
 if(d.op==='approve'&&d.confirm!==true)return reply({error:'Confirmation requise'},400);
 const allowed=d.op==='approve'?"status='pending'":"status IN ('pending','approved')";
 const r=await db.batch([db.prepare("INSERT INTO heart_agent_events SELECT member_id,id,(SELECT COALESCE(MAX(seq),0)+1 FROM heart_agent_events WHERE member_id=? AND run_id=?),?,? FROM heart_agent_runs WHERE member_id=? AND id=? AND "+allowed).bind(owner,id,next,now,owner,id),db.prepare("UPDATE heart_agent_runs SET status=?,updated_at=? WHERE member_id=? AND id=? AND "+allowed).bind(next,now,owner,id)]);
 return r[1].meta.changes?reply({status:next}):reply({error:'Transition refusée'},409);}
 if(d.op==='run'||d.op==='probe'){
 const row=await db.prepare("SELECT action,query FROM heart_agent_runs WHERE member_id=? AND id=? AND status='approved'").bind(owner,id).first();if(!row||!actions.includes(row.action))return reply({error:'Autorisation requise'},409);
 const plugin=pluginActions.includes(row.action)?row.action.split('.')[0]:null;
 if(d.op==='probe'&&!plugin)return reply({error:'Diagnostic externe requis'},400);
 if(plugin&&(!await pluginAllowed(db,owner,c.role,pluginAvailability(env),plugin)||!validPluginQuery(row.action,row.query,env)))return reply({error:'Connecteur ou ressource non autorisé'},403);
 if(!await claimRun(db,owner,id,plugin,Date.now(),d.op==='probe'?'diagnostic':'read'))return reply({error:'Mission déjà prise en charge ou désactivée'},409);
 try{
 let result;
 if(d.op==='probe'){
 const health=await probePlugin(env,row.action,row.query);
 const status=health.status==='verified'?'done':'failed';
 const committed=await finishRun(db,owner,id,status,JSON.stringify({diagnostic:health}),Date.now());
 return committed?reply({status,diagnostic:health}):reply({error:'Mission expirée'},409);
 }
 if(plugin)result={results:await executePlugin(env,row.action,row.query)};
 else if(row.action==='heart.goal.inspect')result=await db.prepare("SELECT id,title,status FROM heart_goals WHERE member_id=? AND instr(lower(title),lower(?))>0 LIMIT 20").bind(owner,row.query).all();
 else result=await db.prepare("SELECT id,title,kind,substr(content,1,500) AS content FROM heart_cognitive_memory WHERE member_id=? AND (expires_at IS NULL OR expires_at>?) AND instr(lower(title||' '||content),lower(?))>0 LIMIT 20").bind(owner,now,row.query).all();
 const saved=JSON.stringify(result.results);
 if(saved.length>64000)throw Error('Result too large');
 return await finishRun(db,owner,id,'done',saved,Date.now())?reply({status:'done'}):reply({error:'Mission expirée'},409);
 }catch{await finishRun(db,owner,id,'failed',null,Date.now());return reply({error:'Exécution échouée; aucune relance automatique'},502);}
 }
 return reply({error:'Action invalide'},400);
 }catch{return reply({error:'Mission indisponible'},503);}
}
