import {executePlugin,pluginAvailability,validPluginQuery,pluginActions} from './plugin-gateway.mjs';
export async function probePlugin(env,action,query,fetcher=fetch){
 const id=typeof action==='string'?action.split('.')[0]:'';
 if(!pluginActions.includes(action)||!validPluginQuery(action,query,env))return {status:'invalid_resource'};
 if(!pluginAvailability(env)[id])return {status:'not_configured'};
 const start=Date.now();let httpStatus=null;
 try{
  await executePlugin(env,action,query,async(url,opts)=>{const r=await fetcher(url,opts);httpStatus=r.status;return r;});
  return {status:'verified',httpStatus,latencyMs:Date.now()-start};
 }catch(e){
  const status=httpStatus===401?'authentication_failed':httpStatus===403?'permission_denied':httpStatus===404?'resource_not_found':httpStatus===429?'rate_limited':httpStatus>=500?'provider_error':e?.name==='TimeoutError'||e?.name==='AbortError'?'timeout':httpStatus===null?'network_error':'invalid_response';
  return {status,httpStatus,latencyMs:Date.now()-start};
 }
}
