import {authenticatedHeartUser} from './account.js';
import {pluginAllowed} from '../../lib/plugin-policy.mjs';
import {pluginAvailability} from '../../lib/plugin-gateway.mjs';
import {readPermissions} from '../../lib/plugin-permissions.mjs';
import {githubRepoAllowed} from '../../lib/github-read.mjs';
import {inspectWorkflows} from '../../lib/github-ci-audit.mjs';
import {reviewCommitChecks} from '../../lib/commit-check-review.mjs';
const reply=(x,status=200)=>Response.json(x,{status,headers:{'cache-control':'private, no-store','x-content-type-options':'nosniff'}});
export async function onRequestGet({request,env}){const u=await authenticatedHeartUser(request,env);if(u?.role!=='owner')return reply({error:'Accès propriétaire requis'},403);if(!env.HEART_DB)return reply({error:'Base indisponible'},503);const q=new URL(request.url).searchParams,repo=q.get('repo'),sha=q.get('sha')||'';try{if(!githubRepoAllowed(env,repo)||!await pluginAllowed(env.HEART_DB,u.id,u.role,pluginAvailability(env),'github')||!(await readPermissions(env.HEART_DB,u.id))['github.repo.inspect']?.read)return reply({error:'Lecture non autorisée'},403);if(!/^[a-f0-9]{40}$/i.test(sha))return reply({error:'Commit invalide'},400);const data=await inspectWorkflows(env,repo);return reply({...reviewCommitChecks(sha,data.runs),repository:repo,observedAt:Date.now(),scope:'latest-20-workflow-runs'});}catch{return reply({error:'Contrôles indisponibles'},503);}}
