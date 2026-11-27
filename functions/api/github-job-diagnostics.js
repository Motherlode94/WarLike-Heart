import {authenticatedHeartUser} from './account.js';
import {pluginAllowed} from '../../lib/plugin-policy.mjs';
import {pluginAvailability} from '../../lib/plugin-gateway.mjs';
import {readPermissions} from '../../lib/plugin-permissions.mjs';
import {githubRepoAllowed} from '../../lib/github-read.mjs';
const reply=(x,status=200)=>Response.json(x,{status,headers:{'cache-control':'private, no-store','x-content-type-options':'nosniff'}});
import {inspectJobs} from '../../lib/github-job-diagnostics.mjs';
export async function onRequestGet({request,env}){const u=await authenticatedHeartUser(request,env);if(u?.role!=='owner')return reply({error:'Accès propriétaire requis'},403);if(!env.HEART_DB)return reply({error:'Base indisponible'},503);const q=new URL(request.url).searchParams,name=q.get('repo');try{if(!await pluginAllowed(env.HEART_DB,u.id,u.role,pluginAvailability(env),'github')||!(await readPermissions(env.HEART_DB,u.id))['github.repo.inspect']?.read||!githubRepoAllowed(env,name))return reply({error:'Lecture non autorisée'},403);const raw=q.get('run');if(!/^[0-9]{1,16}$/.test(raw||'')||!Number.isSafeInteger(Number(raw))||Number(raw)<1)return reply({error:'Run invalide'},400);return reply(await inspectJobs(env,name,Number(raw)));}catch{return reply({error:'Diagnostic indisponible'},503);}}
