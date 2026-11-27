export async function inspectWorkflows(env,name,fetcher=fetch){
 if(typeof name!=='string'||!/^[A-Za-z0-9_.-]{1,100}$/.test(name)||name==='.'||name==='..'||!String(env.HEART_GITHUB_REPOS||'').split(',').map(x=>x.trim()).includes(name)||!env.HEART_GITHUB_TOKEN)throw Error('Repository not authorized');
 const response=await fetcher('https://api.github.com/repos/Motherlode94/'+encodeURIComponent(name)+'/actions/runs?per_page=20',{headers:{authorization:'Bearer '+env.HEART_GITHUB_TOKEN,accept:'application/vnd.github+json','user-agent':'WarLike-Heart'},redirect:'error',signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw Error('GitHub unavailable');const data=await response.json();if(!Array.isArray(data.workflow_runs))throw Error('Invalid GitHub response');
 const runs=data.workflow_runs.slice(0,20).filter(r=>Number.isSafeInteger(r.id)&&r.id>0).map(r=>({id:r.id,name:String(r.name??'').slice(0,160),status:r.status,conclusion:r.conclusion??null,headSha:r.head_sha,branch:r.head_branch,event:r.event,updatedAt:r.updated_at,url:'https://github.com/Motherlode94/'+name+'/actions/runs/'+r.id}));
 return {runs,failed:runs.filter(r=>r.status==='completed'&&['failure','timed_out','action_required','startup_failure'].includes(r.conclusion)).length,pending:runs.filter(r=>r.status!=='completed').length,scope:'latest-20-workflow-runs',regressionVerified:false};
}
