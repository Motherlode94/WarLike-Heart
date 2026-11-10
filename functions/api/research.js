import {authenticatedHeartUser} from "./account.js";

/* Read-only web research for consenting WarLike accounts.
 * Fixed-provider destinations: never fetch arbitrary user URLs (SSRF).
 * Results are untrusted source excerpts, not automatically approved knowledge.
 */
const headers={"content-type":"application/json; charset=utf-8","cache-control":"private, no-store","x-content-type-options":"nosniff"};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
const MAX_DAILY=12;
const sameOrigin=req=>{
 const url=new URL(req.url);
 return url.protocol==="https:"&&req.headers.get("origin")===url.origin&&req.headers.get("sec-fetch-site")!=="cross-site";
};
const short=v=>typeof v==="string"?v.replace(/<[^>]+>/g," ").replace(/&(?:amp|quot|lt|gt|nbsp|#39);/g,x=>({"&amp;":"&","&quot;":'"',"&lt;":"<","&gt;":">","&nbsp;":" ","&#39;":"'"}[x]||" ")).replace(/\s+/g," ").trim().slice(0,430):"";
function validUrl(url){
 try{const u=new URL(url);return u.protocol==="https:"&&u.username===""&&u.password===""&&u.href.length<1100?u.href:null;}catch{return null;}
}
export function normalizeResults(provider,data){
 const raw=provider==="wikipedia"?data?.pages:data?.web?.results;
 if(!Array.isArray(raw))return [];
 return raw.slice(0,5).map(row=>{
  const title=short(row.title).slice(0,130),snippet=short(provider==="wikipedia"?(row.description||row.excerpt):row.description);
  const url=provider==="wikipedia"
   ?validUrl("https://fr.wikipedia.org/wiki/"+encodeURIComponent(String(row.key||row.title||"")))
   :validUrl(row.url);
  return title&&url?{title,snippet,url}:null;
 }).filter(Boolean);
}
async function rateLimit(db,id,now=Date.now()){
 const day=new Date(now).toISOString().slice(0,10);
 const result=await db.prepare(`INSERT INTO heart_research_limits(member_id,day,hits)
 VALUES(?,?,1) ON CONFLICT(member_id,day) DO UPDATE SET hits=hits+1
 WHERE hits<? RETURNING hits`).bind(id,day,MAX_DAILY).first();
 return result?.hits??null;
}
export async function onRequestPost({request,env}){
 if(!sameOrigin(request))return json({error:"Origine refusée."},403);
 if(!request.headers.get("content-type")?.startsWith("application/json"))return json({error:"JSON requis."},415);
 const account=await authenticatedHeartUser(request,env);
 if(!account)return json({error:"Associe ton compte WarLike pour autoriser une recherche Internet."},401);
 let data;
 try{
  if(Number(request.headers.get("content-length")||0)>1500)throw Error();
  const raw=await request.text();if(raw.length>1500)throw Error();data=JSON.parse(raw);
 }catch{return json({error:"Requête invalide."},400);}
 const query=typeof data?.query==="string"?data.query.trim():"";
 const provider=data?.provider==="brave"?"brave":data?.provider==="wikipedia"?"wikipedia":null;
 if(query.length<3||query.length>240||!provider)return json({error:"Question (3 à 240 caractères) et source autorisée requises."},400);
 if(provider==="brave"&&!(typeof env?.BRAVE_SEARCH_API_KEY==="string"&&env.BRAVE_SEARCH_API_KEY.length>15))
  return json({error:"Recherche Web générale non configurée : ajouter BRAVE_SEARCH_API_KEY aux secrets Cloudflare. Wikipédia reste disponible sans clé."},503);
 if(!env?.HEART_DB?.prepare)return json({error:"Protection des recherches non configurée."},503);
 let usage;
 try{usage=await rateLimit(env.HEART_DB,account.id);}
 catch{return json({error:"Contrôle de quota Internet indisponible."},503);}
 if(usage===null)return json({error:"Limite de 12 recherches quotidiennes atteinte pour ce compte."},429);
 const url=provider==="wikipedia"
  ?"https://fr.wikipedia.org/w/rest.php/v1/search/page?q="+encodeURIComponent(query)+"&limit=5"
  :"https://api.search.brave.com/res/v1/web/search?q="+encodeURIComponent(query)+"&count=5&search_lang=fr&safesearch=moderate";
 const requestHeaders=provider==="wikipedia"
  ?{"accept":"application/json","api-user-agent":"WarLikeHeartResearch/1.0 (https://warlike-heart.pages.dev; contact via GitHub Motherlode94/WarLike-Heart)"}
  :{"accept":"application/json","x-subscription-token":env.BRAVE_SEARCH_API_KEY};
 try{
  const result=await fetch(url,{method:"GET",headers:requestHeaders,redirect:"error",signal:AbortSignal.timeout(6500)});
  if(!result.ok)return json({error:"Le fournisseur de recherche est indisponible (HTTP "+result.status+")."},502);
  const length=Number(result.headers.get("content-length")||0);
  if(length>450000)return json({error:"Réponse externe trop volumineuse."},502);
  const raw=await result.text();
  if(raw.length>450000)return json({error:"Réponse externe trop volumineuse."},502);
  const sources=normalizeResults(provider,JSON.parse(raw));
  return json({provider,query,sources,remaining:MAX_DAILY-usage,note:"Extraits provenant d'Internet : vérifie les sources. Aucun souvenir enregistré automatiquement."});
 }catch{return json({error:"Impossible de rechercher sur Internet pour le moment."},502);}
}
