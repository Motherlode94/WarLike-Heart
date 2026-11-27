import {authenticatedHeartUser} from './account.js';
import {routingStatus} from '../../lib/model-router.mjs';
export async function onRequestGet({request,env}){const user=await authenticatedHeartUser(request,env);const headers={'cache-control':'private, no-store','x-content-type-options':'nosniff'};if(user?.role!=='owner')return Response.json({error:'Accès propriétaire requis'},{status:403,headers});return Response.json(routingStatus(env),{headers});}
