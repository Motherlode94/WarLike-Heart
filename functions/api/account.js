// WarLike Heart: short-lived, signed, HttpOnly session after explicit PKCE linking.
// No passwords or WarLike Server cookies are transferred to this domain.
const UPSTREAM="https://warlike-server.pages.dev/api/heart/exchange";
const COOKIE="__Host-heart_warlike";
const h={"content-type":"application/json; charset=utf-8","cache-control":"private, no-store","x-content-type-options":"nosniff"};
const respond=(data,status=200,extra={})=>new Response(JSON.stringify(data),{status,headers:{...h,...extra}});
const valid=v=>typeof v==="string"&&/^[A-Za-z0-9_-]{43,128}$/.test(v);
const encoder=new TextEncoder();
const asB64=bytes=>btoa(Array.from(bytes,x=>String.fromCharCode(x)).join("")).replaceAll("+","-").replaceAll("/","_").replaceAll("=","");
const fromB64=s=>Uint8Array.from(atob(s.replaceAll("-","+").replaceAll("_","/")),c=>c.charCodeAt(0));
async function key(secret){return crypto.subtle.importKey("raw",encoder.encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign","verify"]);}
async function issue(user,secret){
 const payload=asB64(encoder.encode(JSON.stringify({version:1,id:user.id,name:user.name,role:user.role,expires:Date.now()+600_000})));
 const signature=asB64(new Uint8Array(await crypto.subtle.sign("HMAC",await key(secret),encoder.encode(payload))));
 return payload+"."+signature;
}
async function read(cookie,secret){
 try {
  const pieces=cookie.split(";").map(x=>x.trim()).filter(x=>x.startsWith(COOKIE+"="));
  if(pieces.length!==1)return null;
  const [payload,signature]=pieces[0].slice(COOKIE.length+1).split(".");
  if(!payload||!signature||payload.length>1000||signature.length!==43)return null;
  const ok=await crypto.subtle.verify("HMAC",await key(secret),fromB64(signature),encoder.encode(payload));
  if(!ok)return null;
  const data=JSON.parse(new TextDecoder().decode(fromB64(payload)));
  if(data.version!==1||!Number.isSafeInteger(data.expires)||data.expires<=Date.now()||data.expires>Date.now()+600_000||
     typeof data.id!=="string"||data.id.length>100||typeof data.name!=="string"||data.name.length>120||
     !["owner","referent","member"].includes(data.role))return null;
  return {id:data.id,name:data.name,role:data.role,expires:data.expires};
 }catch{return null;}
}
function configured(env){return typeof env.HEART_SESSION_SECRET==="string"&&env.HEART_SESSION_SECRET.length>=32;}
function sameOrigin(request){const url=new URL(request.url);return url.protocol==="https:"&&request.headers.get("origin")===url.origin;}
export async function onRequestGet({request,env}){
 if(!configured(env))return respond({available:false,connected:false,reason:"Session WarLike Heart non configurée."});
 const user=await read(request.headers.get("cookie")||"",env.HEART_SESSION_SECRET);
 return respond({available:true,connected:Boolean(user),user});
}
export async function onRequestPost({request,env}){
 if(!configured(env))return respond({error:"Association WarLike désactivée : secret de session absent."},503);
 if(!sameOrigin(request))return respond({error:"Origine refusée."},403);
 if(!request.headers.get("content-type")?.startsWith("application/json"))return respond({error:"JSON requis."},415);
 let input;
 try{
  if(Number(request.headers.get("content-length")||0)>1024)throw Error();
  const raw=await request.text();if(raw.length>1024)throw Error();input=JSON.parse(raw);
 }catch{return respond({error:"Demande invalide."},400);}
 if(!valid(input?.code)||!valid(input?.verifier))return respond({error:"Code d'association invalide."},400);
 let upstream;
 try{upstream=await fetch(UPSTREAM,{method:"POST",headers:{"content-type":"application/json","accept":"application/json"},body:JSON.stringify({code:input.code,verifier:input.verifier}),signal:AbortSignal.timeout(7000),redirect:"error"});}
 catch{return respond({error:"WarLike Server ne répond pas à l'association."},502);}
 if(!upstream.ok)return respond({error:"Association refusée ou expirée sur WarLike Server."},401);
 let user;try{user=(await upstream.json()).user;}catch{return respond({error:"Réponse du serveur invalide."},502);}
 if(!user||typeof user.id!=="string"||user.id.length>100||typeof user.name!=="string"||user.name.length>120||!["owner","referent","member"].includes(user.role))
   return respond({error:"Identité serveur invalide."},502);
 const token=await issue(user,env.HEART_SESSION_SECRET);
 return respond({connected:true,user:{id:user.id,name:user.name,role:user.role}},200,{"set-cookie":COOKIE+"="+token+"; Path=/; Max-Age=600; HttpOnly; Secure; SameSite=Lax"});
}
export async function onRequestDelete({request}){
 if(!sameOrigin(request))return respond({error:"Origine refusée."},403);
 return respond({connected:false},200,{"set-cookie":COOKIE+"=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax"});
}
