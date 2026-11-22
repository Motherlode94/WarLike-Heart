import {authenticatedHeartUser} from './account.js';
import {KINDS,normalizeMemory,memoryExpiry} from '../../lib/cognitive-memory.mjs';
const reply=(x,status=200)=>Response.json(x,{status,headers:{'cache-control':'private, no-store','x-content-type-options':'nosniff'}});
const cols='id,kind,title,content,source,revision,created_at,updated_at,expires_at';
async function context(request,env){
 const user=await authenticatedHeartUser(request,env);
 if(!user)return {error:reply({error:'Session requise.'},401)};
 if(!env.HEART_DB)return {error:reply({error:'Base Heart indisponible.'},503)};
 return {db:env.HEART_DB,owner:user.id};
}
async function purge(c,now){await c.db.prepare('DELETE FROM heart_cognitive_memory WHERE member_id=? AND expires_at<=?').bind(c.owner,now).run();}
export async function onRequestGet({request,env}){
 const c=await context(request,env);if(c.error)return c.error;
 const params=new URL(request.url).searchParams,kind=params.get('kind')||'',q=(params.get('q')||'').trim();
 if((kind&&!KINDS.includes(kind))||q.length>160)return reply({error:'Filtre invalide.'},400);
 try{const now=Date.now();await purge(c,now);const rows=await c.db.prepare('SELECT '+cols+' FROM heart_cognitive_memory WHERE member_id=? AND (expires_at IS NULL OR expires_at>?) AND (?=\'\' OR kind=?) AND (?=\'\' OR instr(lower(title||\' \'||content||\' \'||source),lower(?))>0) ORDER BY updated_at DESC,id LIMIT 200').bind(c.owner,now,kind,kind,q,q).all();return reply({memories:rows.results});}catch{return reply({error:'Lecture indisponible.'},503);}
}
export async function onRequestPost({request,env}){
 const url=new URL(request.url);if(url.protocol!=='https:'||request.headers.get('origin')!==url.origin||request.headers.get('sec-fetch-site')==='cross-site')return reply({error:'Origine refusée.'},403);
 if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return reply({error:'JSON requis.'},415);
 const c=await context(request,env);if(c.error)return c.error;
 let data;try{const reader=request.body?.getReader();if(!reader)throw Error();let size=0,raw='';const decoder=new TextDecoder();for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>16000){await reader.cancel();return reply({error:'Requête excessive.'},413);}raw+=decoder.decode(value,{stream:true});}data=JSON.parse(raw+decoder.decode());}catch{return reply({error:'JSON invalide.'},400);}
 const id=data?.id,revision=data?.revision,valid=typeof id==='string'&&/^[a-f0-9-]{36}$/.test(id)&&Number.isSafeInteger(revision)&&revision>0;
 try{
  const now=Date.now();await purge(c,now);
  if(data?.action==='clear'){if(data.confirm!==true)return reply({error:'Confirmation requise.'},400);await c.db.prepare('DELETE FROM heart_cognitive_memory WHERE member_id=?').bind(c.owner).run();return reply({deleted:true});}
  if(data?.action==='delete'&&valid){const row=await c.db.prepare('DELETE FROM heart_cognitive_memory WHERE member_id=? AND id=? AND revision=? RETURNING id').bind(c.owner,id,revision).first();return row?reply({deleted:true}):reply({error:'Entrée absente ou modifiée.'},409);}
  const m=normalizeMemory(data);if(!m)return reply({error:'Mémoire invalide.'},400);
  const expiry=memoryExpiry(m.kind,now);
  if(data.action==='create'){const row=await c.db.prepare('INSERT INTO heart_cognitive_memory(member_id,id,kind,title,content,source,created_at,updated_at,expires_at) SELECT ?,?,?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM heart_cognitive_memory WHERE member_id=?)<200 RETURNING '+cols).bind(c.owner,crypto.randomUUID(),m.kind,m.title,m.content,m.source,now,now,expiry,c.owner).first();return row?reply({memory:row},201):reply({error:'Limite de 200 entrées.'},409);}
  if(data.action==='update'&&valid){const row=await c.db.prepare('UPDATE heart_cognitive_memory SET kind=?,title=?,content=?,source=?,updated_at=?,expires_at=?,revision=revision+1 WHERE member_id=? AND id=? AND revision=? RETURNING '+cols).bind(m.kind,m.title,m.content,m.source,now,expiry,c.owner,id,revision).first();return row?reply({memory:row}):reply({error:'Entrée absente ou modifiée.'},409);}
  return reply({error:'Action invalide.'},400);
 }catch{return reply({error:'Écriture indisponible.'},503);}
}
