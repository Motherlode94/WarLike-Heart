import {authenticatedHeartUser} from './account.js';
import {pluginAllowed} from '../../lib/plugin-policy.mjs';
import {pluginAvailability} from '../../lib/plugin-gateway.mjs';
import {readPermissions} from '../../lib/plugin-permissions.mjs';
import {githubRepoAllowed} from '../../lib/github-read.mjs';
const reply=(x,status=200)=>Response.json(x,{status,headers:{'cache-control':'private, no-store','x-content-type-options':'nosniff'}});
import {readSource,safeSourcePath} from '../../lib/github-source-reader.mjs';
export async function onRequestGet({request,env}){const u=await authenticatedHeartUser(request,env);if(u?.role!=='owner')return reply({error:'Accès propriétaire requis'},403);if(!env.HEART_DB)return reply({error:'Base indisponible'},503);const q=new URL(request.url).searchParams,name=q.get('repo'),sha=q.get('sha')||'',path=q.get('path');try{if(!await pluginAllowed(env.HEART_DB,u.id,u.role,pluginAvailability(env),'github')||!(await readPermissions(env.HEART_DB,u.id))['github.repo.inspect']?.read||!githubRepoAllowed(env,name))return reply({error:'Lecture non autorisée'},403);if(!safeSourcePath(path)||!/^[a-f0-9]{40}$/i.test(sha))return reply({error:'Fichier ou commit invalide'},400);return reply(await readSource(env,name,sha,path));}catch{return reply({error:'Lecture indisponible'},503);}}
