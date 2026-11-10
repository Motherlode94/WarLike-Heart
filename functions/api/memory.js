import {authenticatedHeartUser} from "./account.js";

// A private per-member snapshot. No public list endpoint and no implicit backup.
// Sensitive data is stored in D1 as JSON, not end-to-end encrypted.
const HEADERS={"content-type":"application/json; charset=utf-8","cache-control":"private, no-store","x-content-type-options":"nosniff"};
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:HEADERS});
const MAX_BYTES=190000;
function sameOrigin(request){const url=new URL(request.url);return url.protocol==="https:"&&request.headers.get("origin")===url.origin&&request.headers.get("sec-fetch-site")!=="cross-site";}
function validText(x,n){return typeof x==="string"&&x.length<=n;}
export function normalizeSnapshot(value){
 if(!value||typeof value!=="object"||Array.isArray(value))return null;
 if(!Array.isArray(value.history)||!Array.isArray(value.memories)||!value.learning||typeof value.learning!=="object")return null;
 const learning=value.learning;
 if(!Array.isArray(learning.dialogues)||!Array.isArray(learning.knowledge))return null;
 if(value.history.length>100||value.memories.length>40||learning.dialogues.length>500||learning.knowledge.length>500)return null;
 if(!value.history.every(m=>m&&["user","assistant"].includes(m.role)&&validText(m.text,4000)))return null;
 if(!value.memories.every(m=>validText(m,300)))return null;
 if(!learning.dialogues.every(x=>x&&validText(x.question,240)&&validText(x.answer,700)))return null;
 if(!learning.knowledge.every(x=>x&&validText(x.subject,100)&&validText(x.content,700)))return null;
 return {version:1,history:value.history.map(x=>({role:x.role,text:x.text})),
  memories:[...value.memories],
  learning:{version:1,dialogues:learning.dialogues.map(x=>({question:x.question,answer:x.answer})),
    knowledge:learning.knowledge.map(x=>({subject:x.subject,content:x.content}))}};
}
async function context(request,env){
 if(!env?.HEART_DB||typeof env.HEART_DB.prepare!=="function")return {error:reply({error:"Stockage Cloud Heart non configuré."},503)};
 const user=await authenticatedHeartUser(request,env);
 if(!user)return {error:reply({error:"Session WarLike Heart expirée : associe de nouveau ton compte."},401)};
 return {db:env.HEART_DB,id:user.id};
}
export async function onRequestGet({request,env}){
 const c=await context(request,env);if(c.error)return c.error;
 try{
  const row=await c.db.prepare("SELECT revision,content,updated_at FROM heart_snapshots WHERE member_id=?").bind(c.id).first();
  if(!row)return reply({revision:0,snapshot:null,updatedAt:null});
  return reply({revision:row.revision,snapshot:normalizeSnapshot(JSON.parse(row.content)),updatedAt:row.updated_at});
 }catch{return reply({error:"Lecture de la mémoire Cloud indisponible."},503);}
}
export async function onRequestPut({request,env}){
 if(!sameOrigin(request))return reply({error:"Origine refusée."},403);
 if(!request.headers.get("content-type")?.startsWith("application/json"))return reply({error:"JSON requis."},415);
 const c=await context(request,env);if(c.error)return c.error;
 let data;
 try {
  if(Number(request.headers.get("content-length")||0)>MAX_BYTES)return reply({error:"Sauvegarde trop volumineuse."},413);
  const raw=await request.text();
  if(new TextEncoder().encode(raw).byteLength>MAX_BYTES)return reply({error:"Sauvegarde trop volumineuse."},413);
  data=JSON.parse(raw);
 }catch{return reply({error:"JSON invalide."},400);}
 const expected=data?.expectedRevision;
 if(!Number.isSafeInteger(expected)||expected<0||expected>1000000000)return reply({error:"Révision attendue invalide."},400);
 const snapshot=normalizeSnapshot(data?.snapshot);
 if(!snapshot)return reply({error:"Données de mémoire invalides."},400);
 const content=JSON.stringify(snapshot),time=Date.now();
 if(new TextEncoder().encode(content).byteLength>MAX_BYTES-1000)return reply({error:"Bibliothèque trop volumineuse."},413);
 try{
  const changed=await c.db.prepare(`INSERT INTO heart_snapshots(member_id,revision,content,updated_at)
   VALUES(?,1,?,?)
   ON CONFLICT(member_id) DO UPDATE SET
    revision=heart_snapshots.revision+1,content=excluded.content,updated_at=excluded.updated_at
   WHERE heart_snapshots.revision=?
   RETURNING revision`).bind(c.id,content,time,expected).first();
  if(!changed)return reply({error:"Conflit de version : recharge la sauvegarde Cloud avant d'écraser.",conflict:true},409);
  return reply({saved:true,revision:changed.revision,updatedAt:time});
 }catch{return reply({error:"Écriture Cloud indisponible."},503);}
}
export async function onRequestDelete({request,env}){
 if(!sameOrigin(request))return reply({error:"Origine refusée."},403);
 if(!request.headers.get("content-type")?.startsWith("application/json"))return reply({error:"JSON requis."},415);
 const c=await context(request,env);if(c.error)return c.error;
 let data;
 try {const raw=await request.text();if(raw.length>200)throw Error("size");data=JSON.parse(raw);}
 catch{return reply({error:"Requête invalide."},400);}
 if(!Number.isSafeInteger(data?.expectedRevision)||data.expectedRevision<0)return reply({error:"Révision invalide."},400);
 try{
  const result=await c.db.prepare("DELETE FROM heart_snapshots WHERE member_id=? AND revision=? RETURNING member_id").bind(c.id,data.expectedRevision).first();
  if(!result && data.expectedRevision!==0)return reply({error:"Conflit de version : le document a changé.",conflict:true},409);
  return reply({deleted:true,revision:0});
 }catch{return reply({error:"Suppression Cloud indisponible."},503);}
}
