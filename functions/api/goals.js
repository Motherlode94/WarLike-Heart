import {decomposeGoal} from '../../lib/goal-decomposition.mjs';
import {authenticatedHeartUser} from './account.js';
const reply=(x,status=200)=>Response.json(x,{status,headers:{'cache-control':'private, no-store','x-content-type-options':'nosniff'}});
const statuses=['planned','active','done','paused'];
const validId=x=>typeof x==='string'&&/^[a-f0-9-]{36}$/.test(x);
const rev=x=>Number.isSafeInteger(x)&&x>=1&&x<1000000000;
async function context(request,env){
 const user=await authenticatedHeartUser(request,env);
 if(!user)return {error:reply({error:'Session requise.'},401)};
 if(!env.HEART_DB)return {error:reply({error:'Base Heart indisponible.'},503)};
 return {db:env.HEART_DB,owner:user.id};
}
export function normalizeGoal(data){
 if(typeof data?.title!=='string'||!data.title.trim()||data.title.length>160||!Array.isArray(data.steps)||data.steps.length>20||!statuses.includes(data.status))return null;
 if(data.steps.some(s=>typeof s?.text!=='string'||!s.text.trim()||s.text.length>240||typeof s.done!=='boolean'))return null;
 if(data.status==='done'&&data.steps.some(s=>!s.done))return null;
 return {title:data.title.trim(),steps:data.steps.map(s=>({text:s.text.trim(),done:s.done})),status:data.status};
}
function unpack(row){return {...row,steps:JSON.parse(row.steps)};}
export async function onRequestGet({request,env}){
 const c=await context(request,env);if(c.error)return c.error;
 try{const x=await c.db.prepare('SELECT id,title,steps,status,revision,updated_at FROM heart_goals WHERE member_id=? ORDER BY updated_at DESC,id LIMIT 100').bind(c.owner).all();return reply({goals:x.results.map(unpack)});}
 catch{return reply({error:'Lecture indisponible.'},503);}
}
export async function onRequestPost({request,env}){
 const url=new URL(request.url);
 if(url.protocol!=='https:'||request.headers.get('origin')!==url.origin||request.headers.get('sec-fetch-site')==='cross-site')return reply({error:'Origine refusée.'},403);
 if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return reply({error:'JSON requis.'},415);
 const c=await context(request,env);if(c.error)return c.error;
 let data;try{
  if(Number(request.headers.get('content-length')||0)>18000)return reply({error:'Requête excessive.'},413);
  const reader=request.body?.getReader();if(!reader)throw Error();
  const decoder=new TextDecoder();let raw='',n=0;
  for(;;){const {done,value}=await reader.read();if(done)break;n+=value.byteLength;if(n>18000){await reader.cancel();return reply({error:'Requête excessive.'},413);}raw+=decoder.decode(value,{stream:true});}raw+=decoder.decode();data=JSON.parse(raw);
 }catch{return reply({error:'JSON invalide.'},400);}
 try{
  if(data?.action==='previewDecomposition'){try{return reply({steps:decomposeGoal(data.title),method:'template',executed:false});}catch{return reply({error:'Objectif invalide.'},400);}}
  if(data?.action==='delete'){
   if(!validId(data.id)||!rev(data.revision))return reply({error:'Identifiant ou révision invalide.'},400);
   const x=await c.db.prepare('DELETE FROM heart_goals WHERE member_id=? AND id=? AND revision=? RETURNING id').bind(c.owner,data.id,data.revision).first();
   return x?reply({deleted:true}):reply({error:'Objectif absent ou modifié.'},409);
  }
  const goal=normalizeGoal(data);if(!goal)return reply({error:'Objectif invalide.'},400);
  if(data.action==='create'){
   const row=await c.db.prepare('INSERT INTO heart_goals(member_id,id,title,steps,status,updated_at) SELECT ?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM heart_goals WHERE member_id=?)<100 RETURNING id,title,steps,status,revision,updated_at').bind(c.owner,crypto.randomUUID(),goal.title,JSON.stringify(goal.steps),goal.status,Date.now(),c.owner).first();
   return row?reply({goal:unpack(row)},201):reply({error:'Limite de 100 objectifs.'},409);
  }
  if(data.action==='update'&&validId(data.id)&&rev(data.revision)){
   const row=await c.db.prepare('UPDATE heart_goals SET title=?,steps=?,status=?,revision=revision+1,updated_at=? WHERE member_id=? AND id=? AND revision=? RETURNING id,title,steps,status,revision,updated_at').bind(goal.title,JSON.stringify(goal.steps),goal.status,Date.now(),c.owner,data.id,data.revision).first();
   return row?reply({goal:unpack(row)}):reply({error:'Objectif absent ou modifié.'},409);
  }
  return reply({error:'Action invalide.'},400);
 }catch{return reply({error:'Écriture indisponible.'},503);}
}
