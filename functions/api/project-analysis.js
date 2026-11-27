import {authenticatedHeartUser} from './account.js';
import {projectAnalysis} from '../../lib/project-analysis.mjs';
const reply=(d,status=200)=>Response.json(d,{status,headers:{'cache-control':'private, no-store','x-content-type-options':'nosniff'}});
export async function onRequestGet({request,env}){const user=await authenticatedHeartUser(request,env);if(!user)return reply({error:'Session requise'},401);if(!env.HEART_DB)return reply({error:'Base indisponible'},503);try{const rows=await env.HEART_DB.prepare('SELECT id,title,status,steps FROM heart_goals WHERE member_id=? ORDER BY updated_at DESC,id LIMIT 100').bind(user.id).all();return reply(projectAnalysis(rows.results.map(g=>({...g,steps:JSON.parse(g.steps)}))));}catch{return reply({error:'Analyse indisponible'},503);}}
