import {authenticatedHeartUser} from './account.js';
import {pluginAllowed} from '../../lib/plugin-policy.mjs';
import {pluginAvailability} from '../../lib/plugin-gateway.mjs';
import {readPermissions} from '../../lib/plugin-permissions.mjs';
import {inspectPullRequests} from '../../lib/github-pull-audit.mjs';
const reply=(x,status=200)=>Response.json(x,{status,headers:{'cache-control':'private, no-store','x-content-type-options':'nosniff'}});
export async function onRequestGet({request,env}){const u=await authenticatedHeartUser(request,env);if(u?.role!=='owner')return reply({error:'Accès propriétaire requis'},403);if(!env.HEART_DB)return reply({error:'Base indisponible'},503);const name=new URL(request.url).searchParams.get('repo');try{if(!await pluginAllowed(env.HEART_DB,u.id,u.role,pluginAvailability(env),'github')||!(await readPermissions(env.HEART_DB,u.id))['github.repo.inspect']?.read)return reply({error:'Permission de lecture requise'},403);if(!name||!/^[A-Za-z0-9_.-]{1,100}$/.test(name)||!String(env.HEART_GITHUB_REPOS||'').split(',').map(x=>x.trim()).includes(name)||name==='.'||name==='..')return reply({error:'Dépôt non autorisé'},403);return reply({repository:name,pullRequests:await inspectPullRequests(env,name),limit:30,scope:'open-recent',observedAt:Date.now(),mergeabilityVerified:false});}catch{return reply({error:'Audit indisponible'},503);}}
