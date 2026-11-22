import {authenticatedHeartUser} from './account.js';
const reply=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'private, no-store','x-content-type-options':'nosniff'}});
const kinds=['person','project','application','event','knowledge','goal','memory'];
const relations=['related_to','depends_on','supports','contradicts','part_of','references'];
const str=(x,n)=>typeof x==='string'&&x.trim().length>0&&x.length<=n;
const id=x=>typeof x==='string'&&/^[a-f0-9-]{36}$/.test(x);
async function ctx(request,env){const user=await authenticatedHeartUser(request,env);return user?{owner:user.id,db:env.HEART_DB}:null;}
export async function onRequestGet({request,env}){
 const c=await ctx(request,env);if(!c)return reply({error:'Session requise'},401);if(!c.db)return reply({error:'Base indisponible'},503);
 try{
 const [n,e,g,m]=await c.db.batch([
 c.db.prepare('SELECT id,kind,label,source,confidence FROM heart_graph_nodes WHERE member_id=? ORDER BY label,id').bind(c.owner),
 c.db.prepare('SELECT id,from_id,to_id,relation,source,confidence FROM heart_graph_edges WHERE member_id=? ORDER BY id').bind(c.owner),
 c.db.prepare('SELECT id,title FROM heart_goals WHERE member_id=? ORDER BY updated_at DESC LIMIT 200').bind(c.owner),
 c.db.prepare("SELECT id,title FROM heart_cognitive_memory WHERE member_id=? AND (expires_at IS NULL OR expires_at>?) ORDER BY updated_at DESC LIMIT 200").bind(c.owner,Date.now())]);
 return reply({nodes:n.results,edges:e.results,goals:g.results,memories:m.results});
 }catch{return reply({error:'Lecture indisponible'},503);}
}
export async function onRequestPost({request,env}){
 const u=new URL(request.url);if(u.protocol!=='https:'||request.headers.get('origin')!==u.origin||request.headers.get('sec-fetch-site')==='cross-site')return reply({error:'Origine refusée'},403);
 if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return reply({error:'JSON requis'},415);
 const c=await ctx(request,env);if(!c)return reply({error:'Session requise'},401);if(!c.db)return reply({error:'Base indisponible'},503);
 let d;try{const reader=request.body.getReader();let raw='',size=0;const dec=new TextDecoder();for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>8000){await reader.cancel();return reply({error:'Requête excessive'},413);}raw+=dec.decode(value,{stream:true});}d=JSON.parse(raw+dec.decode());}catch{return reply({error:'JSON invalide'},400);}
 const {db,owner}=c;if(!d||typeof d!=='object')return reply({error:'Action invalide'},400);
 try{
 if(d.action==='deleteEdge'&&id(d.id)){await db.prepare('DELETE FROM heart_graph_edges WHERE member_id=? AND id=?').bind(owner,d.id).run();return reply({ok:true});}
 if(d.action==='deleteNode'&&id(d.id)){await db.batch([db.prepare('DELETE FROM heart_graph_edges WHERE member_id=? AND (from_id=? OR to_id=?)').bind(owner,d.id,d.id),db.prepare('DELETE FROM heart_graph_nodes WHERE member_id=? AND id=?').bind(owner,d.id)]);return reply({ok:true});}
 const source=d.source??'',confidence=d.confidence??50;if(typeof source!=='string'||source.length>500||!Number.isInteger(confidence)||confidence<0||confidence>100)return reply({error:'Provenance ou confiance invalide'},400);
 if(d.action==='createNode'&&kinds.includes(d.kind)&&str(d.label,160)){
 const row=await db.prepare('INSERT INTO heart_graph_nodes(member_id,id,kind,label,source,confidence) SELECT ?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM heart_graph_nodes WHERE member_id=?)<200 ON CONFLICT DO NOTHING RETURNING id').bind(owner,crypto.randomUUID(),d.kind,d.label.trim(),source,confidence,owner).first();
 return row?reply(row,201):reply({error:'Doublon ou limite atteinte'},409);}
 if(d.action==='createEdge'&&id(d.from)&&id(d.to)&&d.from!==d.to&&relations.includes(d.relation)){
 const row=await db.prepare('INSERT INTO heart_graph_edges(member_id,id,from_id,to_id,relation,source,confidence) SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM heart_graph_nodes WHERE member_id=? AND id=?) AND EXISTS(SELECT 1 FROM heart_graph_nodes WHERE member_id=? AND id=?) AND (SELECT COUNT(*) FROM heart_graph_edges WHERE member_id=?)<500 ON CONFLICT DO NOTHING RETURNING id').bind(owner,crypto.randomUUID(),d.from,d.to,d.relation,source,confidence,owner,d.from,owner,d.to,owner).first();
 return row?reply(row,201):reply({error:'Relation impossible, doublon ou limite'},409);}
 return reply({error:'Action invalide'},400);
 }catch{return reply({error:'Écriture indisponible'},503);}
}
