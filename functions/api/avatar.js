import {authenticatedHeartUser} from "./account.js";

const KEY="official/avatar.glb";
const MAX=30*1024*1024;
const json=(data,status=200)=>Response.json(data,{status,headers:{"cache-control":"no-store","x-content-type-options":"nosniff"}});
const canManage=user=>Boolean(user&&["owner","referent"].includes(user.role));
const sameOrigin=req=>{const url=new URL(req.url);return url.protocol==="https:"&&req.headers.get("origin")===url.origin&&req.headers.get("sec-fetch-site")!=="cross-site";};
export function inspectGlb(bytes){
 if(!(bytes instanceof ArrayBuffer)||bytes.byteLength<20||bytes.byteLength>MAX)return false;
 const d=new DataView(bytes);
 return d.getUint32(0,true)===0x46546c67 && d.getUint32(4,true)===2 && d.getUint32(8,true)===bytes.byteLength
   && d.getUint32(16,true)===0x4e4f534a && d.getUint32(12,true)>0;
}
export async function onRequestGet({env}){
 if(!env?.HEART_AVATARS)return json({error:"Stockage de l'avatar non configuré."},503);
 try {
  const obj=await env.HEART_AVATARS.get(KEY);
  if(!obj)return json({error:"Aucun avatar 3D officiel publié."},404);
  return new Response(obj.body,{headers:{
   "content-type":"model/gltf-binary","cache-control":"public, max-age=120",
   "x-content-type-options":"nosniff","content-length":String(obj.size),
   "etag":obj.httpEtag||'"heart-avatar"'
  }});
 }catch{return json({error:"Avatar 3D indisponible."},503);}
}
export async function onRequestPut({request,env}){
 if(!env?.HEART_AVATARS)return json({error:"Stockage avatar non configuré."},503);
 if(!sameOrigin(request))return json({error:"Origine non autorisée."},403);
 const user=await authenticatedHeartUser(request,env);
 if(!canManage(user))return json({error:"Publication réservée aux responsables WarLike."},403);
 if(!request.headers.get("content-type")?.toLowerCase().startsWith("model/gltf-binary"))
   return json({error:"Fichier GLB binaire requis."},415);
 const length=Number(request.headers.get("content-length")||0);
 if(length>MAX)return json({error:"Le GLB dépasse 30 Mo. Utilise une version Web optimisée."},413);
 let bytes;try{bytes=await request.arrayBuffer();}catch{return json({error:"Fichier illisible."},400);}
 if(!inspectGlb(bytes))return json({error:"GLB invalide ou supérieur à 30 Mo."},400);
 try{
  const digest=await crypto.subtle.digest("SHA-256",bytes);
  const fingerprint=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,"0")).join("");
  await env.HEART_AVATARS.put(KEY,bytes,{
   httpMetadata:{contentType:"model/gltf-binary"},
   customMetadata:{sha256:fingerprint,authorRole:user.role,uploadedAt:new Date().toISOString()}
  });
  return json({published:true,size:bytes.byteLength,sha256:fingerprint});
 }catch{return json({error:"Publication du GLB impossible."},503);}
}
export async function onRequestDelete({request,env}){
 if(!env?.HEART_AVATARS)return json({error:"Stockage avatar non configuré."},503);
 if(!sameOrigin(request))return json({error:"Origine non autorisée."},403);
 const user=await authenticatedHeartUser(request,env);
 if(!canManage(user))return json({error:"Suppression réservée aux responsables WarLike."},403);
 try{await env.HEART_AVATARS.delete(KEY);return json({deleted:true});}
 catch{return json({error:"Impossible de retirer le modèle publié."},503);}
}
