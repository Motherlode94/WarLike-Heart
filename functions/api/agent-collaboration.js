import {authenticatedHeartUser} from './account.js';
import {collaborationDraft} from '../../lib/agent-collaboration.mjs';
const reply=(x,status=200)=>Response.json(x,{status,headers:{'cache-control':'private, no-store','x-content-type-options':'nosniff'}});
export async function onRequestPost({request,env}){
 const u=new URL(request.url);if(u.protocol!=='https:'||request.headers.get('origin')!==u.origin||request.headers.get('sec-fetch-site')==='cross-site')return reply({error:'Origine refusée'},403);
 if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return reply({error:'JSON requis'},415);
 const user=await authenticatedHeartUser(request,env);if(!user||!['owner','referent'].includes(user.role))return reply({error:'Accès opérateur requis'},403);
 let data;try{const reader=request.body.getReader(),dec=new TextDecoder();let raw='',size=0;for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>16000){await reader.cancel();return reply({error:'Requête excessive'},413);}raw+=dec.decode(value,{stream:true});}data=JSON.parse(raw+dec.decode());}catch{return reply({error:'JSON invalide'},400);}
 try{return reply(collaborationDraft(data?.tasks,['heart.memory.search','heart.goal.inspect']));}catch{return reply({error:'Tâches ou dépendances invalides'},400);}
}
