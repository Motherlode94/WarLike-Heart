import {writeAllowed,developmentBranch} from './github-write-policy.mjs';
// Separate write credential; fixed GitHub endpoints, no force update or default branch writes.
export async function gitWriteRequest(env,repo,path,method,body,fetcher=fetch){
 if(!writeAllowed(env,repo))throw Error('Write disabled');
 if(!((method==='GET'&&(path===''||/^\/git\/ref\/heads\/[A-Za-z0-9_.%/-]+$/.test(path)))||(method==='POST'&&['/git/refs','/pulls'].includes(path))||(method==='PUT'&&/^\/contents\/[A-Za-z0-9_./%-]+$/.test(path))))throw Error('Invalid operation');
 const r=await fetcher('https://api.github.com/repos/Motherlode94/'+encodeURIComponent(repo)+path,{method,headers:{authorization:'Bearer '+env.HEART_GITHUB_WRITE_TOKEN,accept:'application/vnd.github+json','content-type':'application/json','user-agent':'WarLike-Heart'},...(body?{body:JSON.stringify(body)}:{}),redirect:'error',signal:AbortSignal.timeout(10000)});
 if(!r.ok)throw Error('GitHub operation unavailable');return r.json();
}
export async function createReviewBranch(env,repo,id,expectedCommit,fetcher=fetch){
 if(!/^[a-f0-9]{40}$/.test(expectedCommit))throw Error('Invalid commit');
 const branch=developmentBranch(id),meta=await gitWriteRequest(env,repo,'','GET',null,fetcher),base=meta.default_branch;
 if(typeof base!=='string'||!base.split('/').every(x=>/^[A-Za-z0-9_-][A-Za-z0-9_.-]*$/.test(x))||base.startsWith('heart-review/'))throw Error('Invalid base');
 const current=await gitWriteRequest(env,repo,'/git/ref/heads/'+base.split('/').map(encodeURIComponent).join('/'),'GET',null,fetcher);
 if(current.object?.sha!==expectedCommit)throw Error('Base changed');
 const result=await gitWriteRequest(env,repo,'/git/refs','POST',{ref:'refs/heads/'+branch,sha:expectedCommit},fetcher);
 if(result.ref!=='refs/heads/'+branch||result.object?.sha!==expectedCommit)throw Error('Unconfirmed branch');
 return {branch,base,commit:expectedCommit};
}
