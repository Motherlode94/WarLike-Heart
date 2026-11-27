import {authenticatedHeartUser} from './account.js';
import {pluginAllowed} from '../../lib/plugin-policy.mjs';
import {pluginAvailability} from '../../lib/plugin-gateway.mjs';
import {readPermissions} from '../../lib/plugin-permissions.mjs';
import {reconcileReview} from '../../lib/git-operation-reconciliation.mjs';
const reply=(x,status=200)=>Response.json(x,{status,headers:{'cache-control':'private, no-store','x-content-type-options':'nosniff'}});
export async function onRequestGet({request,env}){try{const u=await authenticatedHeartUser(request,env);if(u?.role!=='owner'||!env.HEART_DB||!await pluginAllowed(env.HEART_DB,u.id,u.role,pluginAvailability(env),'github')||!(await readPermissions(env.HEART_DB,u.id))['github.repo.inspect']?.read)return reply({error:'Accès refusé'},403);const id=new URL(request.url).searchParams.get('id')||'';if(!/^[a-f0-9]{32}$/.test(id))return reply({error:'Identifiant invalide'},400);const row=await env.HEART_DB.prepare('SELECT id,repository,status FROM heart_git_operations WHERE member_id=? AND id=?').bind(u.id,id).first();if(!row)return reply({error:'Opération absente'},404);return reply(await reconcileReview(env,row));}catch{return reply({error:'Vérification distante indisponible'},503);}}
