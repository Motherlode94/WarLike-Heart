import {authenticatedHeartUser} from './account.js';
import {appCapabilities} from '../../lib/app-capabilities.mjs';
export async function onRequestGet({request,env}){
 const user=await authenticatedHeartUser(request,env);const headers={'cache-control':'private, no-store','x-content-type-options':'nosniff'};
 if(!user||!['owner','referent'].includes(user.role))return Response.json({error:'Accès opérateur requis'},{status:403,headers});
 return Response.json({apps:appCapabilities(),executed:false},{headers});
}
