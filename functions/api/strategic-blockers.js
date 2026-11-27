import {authenticatedHeartUser} from './account.js';
import {strategicBlockers} from '../../lib/strategic-blockers.mjs';
const reply=(d,status=200)=>Response.json(d,{status,headers:{'cache-control':'private, no-store','x-content-type-options':'nosniff'}});
export async function onRequestGet({request,env}){const u=await authenticatedHeartUser(request,env);if(!u)return reply({error:'Session requise'},401);if(!env.HEART_DB)return reply({error:'Base indisponible'},503);try{const r=await env.HEART_DB.prepare('SELECT id,title,status,steps,updated_at FROM heart_goals WHERE member_id=? ORDER BY updated_at DESC,id LIMIT 100').bind(u.id).all();return reply(strategicBlockers(r.results.map(g=>({...g,steps:JSON.parse(g.steps)})),Date.now()));}catch{return reply({error:'Analyse indisponible'},503);}}
