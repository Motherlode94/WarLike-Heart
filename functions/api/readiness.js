import {authenticatedHeartUser} from './account.js';
import {inspectReadiness} from '../../lib/heart-readiness.mjs';
import {pluginAvailability} from '../../lib/plugin-gateway.mjs';
const reply=(d,s=200)=>Response.json(d,{status:s,headers:{'cache-control':'private, no-store','x-content-type-options':'nosniff'}});
export async function onRequestGet({request,env}){
 const user=await authenticatedHeartUser(request,env);if(user?.role!=='owner')return reply({error:'Accès propriétaire requis'},403);
 const database=await inspectReadiness(env.HEART_DB);
 return reply({database,providers:Object.entries(pluginAvailability(env)).map(([id,configured])=>({id,configured:Boolean(configured),verified:false})),scope:'Schema column readability only; no write, migration or provider verification',checkedAt:Date.now()},database.ready?200:503);
}
