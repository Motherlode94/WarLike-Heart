import {authenticatedHeartUser} from './account.js';
import {suggestInitiatives} from '../../lib/goal-initiatives.mjs';
const headers={'cache-control':'private, no-store','x-content-type-options':'nosniff'};
export async function onRequestGet({request,env}){
 const u=await authenticatedHeartUser(request,env);
 if(!u)return Response.json({error:'Session requise'},{status:401,headers});
 if(!env.HEART_DB)return Response.json({error:'Base indisponible'},{status:503,headers});
 try{const r=await env.HEART_DB.prepare("SELECT id,status,steps FROM heart_goals WHERE member_id=? AND status='active' ORDER BY updated_at DESC,id LIMIT 100").bind(u.id).all();
 return Response.json({initiatives:suggestInitiatives(r.results.map(g=>({...g,steps:JSON.parse(g.steps)}))),delivered:false},{headers});}catch{return Response.json({error:'Lecture indisponible'},{status:503,headers});}
}
