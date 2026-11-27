import {authenticatedHeartUser} from './account.js';
import {taskProgress} from '../../lib/task-progress.mjs';
const reply=(x,status=200)=>Response.json(x,{status,headers:{'cache-control':'private, no-store','x-content-type-options':'nosniff'}});
export async function onRequestGet({request,env}){
 const user=await authenticatedHeartUser(request,env);if(!user)return reply({error:'Session requise'},401);if(!env.HEART_DB)return reply({error:'Base indisponible'},503);
 try{const rows=await env.HEART_DB.prepare('SELECT id,title,steps,status,revision FROM heart_goals WHERE member_id=? ORDER BY updated_at DESC,id LIMIT 100').bind(user.id).all();return reply({tasks:rows.results.map(r=>taskProgress({...r,steps:JSON.parse(r.steps)}))});}catch{return reply({error:'Lecture indisponible'},503);}
}
