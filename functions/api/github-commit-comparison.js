import {authenticatedHeartUser} from './account.js';
import {pluginAllowed} from '../../lib/plugin-policy.mjs';
import {pluginAvailability} from '../../lib/plugin-gateway.mjs';
import {readPermissions} from '../../lib/plugin-permissions.mjs';
import {githubRepoAllowed} from '../../lib/github-read.mjs';
const reply=(x,status=200)=>Response.json(x,{status,headers:{'cache-control':'private, no-store','x-content-type-options':'nosniff'}});
import {compareSourceCommits} from '../../lib/github-commit-comparison.mjs';
export async function onRequestGet({request,env}){const u=await authenticatedHeartUser(request,env);if(u?.role!=='owner')return reply({error:'Accès propriétaire requis'},403);if(!env.HEART_DB)return reply({error:'Base indisponible'},503);const q=new URL(request.url).searchParams,name=q.get('repo');try{if(!await pluginAllowed(env.HEART_DB,u.id,u.role,pluginAvailability(env),'github')||!(await readPermissions(env.HEART_DB,u.id))['github.repo.inspect']?.read||!githubRepoAllowed(env,name))return reply({error:'Lecture non autorisée'},403);const base=q.get('base')||'',head=q.get('head')||'';if(![base,head].every(x=>/^[a-f0-9]{40}$/i.test(x)))return reply({error:'Commits invalides'},400);return reply(await compareSourceCommits(env,name,base,head));}catch{return reply({error:'Comparaison indisponible'},503);}}
