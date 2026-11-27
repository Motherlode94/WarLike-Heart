import {authenticatedHeartUser} from './account.js';
import {selectEvidence,compareOptions,contextualEvidence} from '../../lib/reasoning.mjs';
const reply=(d,status=200)=>Response.json(d,{status,headers:{'cache-control':'private, no-store','x-content-type-options':'nosniff'}});
export async function onRequestPost({request,env}){
 const url=new URL(request.url);if(url.protocol!=='https:'||request.headers.get('origin')!==url.origin||request.headers.get('sec-fetch-site')==='cross-site')return reply({error:'Origine refusée'},403);
 if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return reply({error:'JSON requis'},415);
 const user=await authenticatedHeartUser(request,env);if(!user)return reply({error:'Session requise'},401);if(!env.HEART_DB)return reply({error:'Base indisponible'},503);
 let d;try{const reader=request.body.getReader(),dec=new TextDecoder();let raw='',size=0;for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>16000){await reader.cancel();return reply({error:'Requête excessive'},413);}raw+=dec.decode(value,{stream:true});}d=JSON.parse(raw+dec.decode());}catch{return reply({error:'JSON invalide'},400);}
 if(typeof d?.question!=='string'||!d.question.trim()||d.question.length>1000)return reply({error:'Question invalide'},400);
 let ranking=[];try{if(d.options!==undefined||d.criteria!==undefined)ranking=compareOptions(d.options,d.criteria);}catch(e){return reply({error:e.message},400);}
 try{
 const db=env.HEART_DB,owner=user.id;
 const [g,m,n,e]=await db.batch([
 db.prepare('SELECT id,title,status,steps FROM heart_goals WHERE member_id=? LIMIT 100').bind(owner),
 db.prepare('SELECT id,title,content,kind,source FROM heart_cognitive_memory WHERE member_id=? AND (expires_at IS NULL OR expires_at>?) LIMIT 200').bind(owner,Date.now()),
 db.prepare('SELECT id,label AS title,kind,source,confidence FROM heart_graph_nodes WHERE member_id=? LIMIT 200').bind(owner),
 db.prepare('SELECT id,from_id,to_id,relation,source,confidence FROM heart_graph_edges WHERE member_id=? LIMIT 500').bind(owner)]);
 const records=[...g.results.map(x=>({...x,type:'goal',content:x.status+' '+x.steps})),...m.results.map(x=>({...x,type:'memory'})),...n.results.map(x=>({...x,type:'node'}))];
 const evidence=(d.contextual===true?contextualEvidence:selectEvidence)(d.question,records).map(({steps,...r})=>({...r,content:r.content?.slice(0,500)}));
 const ids=new Set(evidence.filter(x=>x.type==='node').map(x=>x.id));
 const links=e.results.filter(x=>ids.has(x.from_id)||ids.has(x.to_id)).slice(0,30);
 return reply({evidence,links,ranking,limitations:['Recherche lexicale, non sémantique','Sources déclaratives, non vérifiées','Scores fournis par utilisateur, pas des probabilités','Aucune action exécutée'],needsEvidence:!evidence.length});
 }catch{return reply({error:'Analyse indisponible'},503);}
}
