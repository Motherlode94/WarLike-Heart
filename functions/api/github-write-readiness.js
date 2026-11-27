import {authenticatedHeartUser} from './account.js';
import {writeAllowed} from '../../lib/github-write-policy.mjs';
import {authorizedRepositories} from '../../lib/github-read.mjs';
import {pluginAllowed} from '../../lib/plugin-policy.mjs';
import {pluginAvailability} from '../../lib/plugin-gateway.mjs';
import {readPermissions} from '../../lib/plugin-permissions.mjs';
export async function onRequestGet({request,env}){const headers={'cache-control':'private, no-store','x-content-type-options':'nosniff'};const reply=(x,status=200)=>Response.json(x,{status,headers});const u=await authenticatedHeartUser(request,env);if(u?.role!=='owner')return reply({error:'Accès propriétaire requis'},403);if(!env.HEART_DB)return reply({error:'Base indisponible'},503);try{if(!await pluginAllowed(env.HEART_DB,u.id,u.role,pluginAvailability(env),'github')||!(await readPermissions(env.HEART_DB,u.id))['github.repo.inspect']?.read)return reply({error:'Lecture non autorisée'},403);return reply({repositories:authorizedRepositories(env).filter(name=>writeAllowed(env,name)),branchPrefix:'heart-review/',enabled:env.HEART_GITHUB_WRITE_ENABLED==='true',liveVerified:false,mergeAllowed:false,requiresApproval:true});}catch{return reply({error:'Configuration indisponible'},503);}}
