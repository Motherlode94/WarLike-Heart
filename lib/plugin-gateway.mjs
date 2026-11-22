// Server-side, read-only adapters. All destinations and operation names are fixed.
export const pluginActions=['fal.task.inspect','meshy.task.inspect','github.repo.inspect','cloudflare.account.inspect'];
export function pluginAvailability(env){return {fal:!!env.HEART_FAL_KEY&&/^[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+$/.test(env.HEART_FAL_APP||''),meshy:!!env.HEART_MESHY_TOKEN,github:!!env.HEART_GITHUB_TOKEN,cloudflare:!!env.HEART_CLOUDFLARE_TOKEN&&/^[a-f0-9]{32}$/i.test(env.HEART_CLOUDFLARE_ACCOUNT_ID||'')};}
export function validPluginQuery(action,query,env){
 if(action==='github.repo.inspect')return /^[A-Za-z0-9_.-]{1,100}$/.test(query)&&query!=='.'&&query!=='..'&&String(env.HEART_GITHUB_REPOS||'').split(',').map(x=>x.trim()).includes(query);
 if(action==='cloudflare.account.inspect')return query==='account';
 if(action==='meshy.task.inspect')return /^[a-f0-9-]{36}$/i.test(query);
 if(action==='fal.task.inspect')return /^[a-f0-9-]{36}$/i.test(query)&&/^[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+$/.test(env.HEART_FAL_APP||'');
 return false;
}
export async function executePlugin(env,action,query,fetcher=fetch){
 if(!validPluginQuery(action,query,env))throw Error('Resource not allowed');
 const available=pluginAvailability(env);let url,token;
 if(action==='fal.task.inspect'){
  if(!available.fal)throw Error('Connector not configured');
  const r=await fetcher('https://queue.fal.run/'+env.HEART_FAL_APP+'/requests/'+encodeURIComponent(query)+'/status',{headers:{authorization:'Key '+env.HEART_FAL_KEY,accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(10000)});
  if(!r.ok)throw Error('Connector unavailable');const d=await r.json();
  return [{id:d.request_id,status:d.status,queuePosition:d.queue_position,failed:!!d.error,errorType:d.error_type}];
 }
 if(action==='meshy.task.inspect'){
  if(!available.meshy)throw Error('Connector not configured');
  const r=await fetcher('https://api.meshy.ai/openapi/v2/text-to-3d/'+encodeURIComponent(query),{headers:{authorization:'Bearer '+env.HEART_MESHY_TOKEN,accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(10000)});
  if(!r.ok)throw Error('Connector unavailable');const d=await r.json();
  return [{id:d.id,status:d.status,progress:d.progress,consumedCredits:d.consumed_credits,hasGlb:!!d.model_urls?.glb}];
 }
 if(action==='github.repo.inspect'&&available.github){url='https://api.github.com/repos/Motherlode94/'+encodeURIComponent(query);token=env.HEART_GITHUB_TOKEN;}
 else if(action==='cloudflare.account.inspect'&&available.cloudflare){url='https://api.cloudflare.com/client/v4/accounts/'+env.HEART_CLOUDFLARE_ACCOUNT_ID;token=env.HEART_CLOUDFLARE_TOKEN;}
 else throw Error('Connector not configured');
 const r=await fetcher(url,{headers:{authorization:'Bearer '+token,accept:'application/json','user-agent':'WarLike-Heart'},redirect:'error',signal:AbortSignal.timeout(10000)});
 if(!r.ok)throw Error('Connector unavailable');
 const d=await r.json();
 if(action==='github.repo.inspect')return [{name:d.full_name,defaultBranch:d.default_branch,private:!!d.private,openIssues:d.open_issues_count,url:d.html_url}];
 if(!d.success||!d.result)throw Error('Connector unavailable');
 return [{id:d.result.id,name:d.result.name}];
}
