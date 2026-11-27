import {authenticatedHeartUser} from './account.js';
import {planMission} from '../../lib/mission-planning.mjs';
const reply=(x,status=200)=>Response.json(x,{status,headers:{'cache-control':'private, no-store','x-content-type-options':'nosniff'}});
export async function onRequestPost({request,env}){
 const u=new URL(request.url);if(u.protocol!=='https:'||request.headers.get('origin')!==u.origin||request.headers.get('sec-fetch-site')==='cross-site')return reply({error:'Origine refusée'},403);
 if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return reply({error:'JSON requis'},415);
 if(!await authenticatedHeartUser(request,env))return reply({error:'Session requise'},401);
 let data;try{const reader=request.body.getReader(),decoder=new TextDecoder();let raw='',size=0;for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>16000){await reader.cancel();return reply({error:'Requête excessive'},413);}raw+=decoder.decode(value,{stream:true});}data=JSON.parse(raw+decoder.decode());}catch{return reply({error:'JSON invalide'},400);}
 try{return reply(planMission(data?.tasks));}catch{return reply({error:'Plan ou dépendances invalides'},400);}
}
