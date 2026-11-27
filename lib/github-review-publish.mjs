import {writeAllowed,developmentBranch} from './github-write-policy.mjs';
import {safeSourcePath} from './github-source-reader.mjs';
// Fixed endpoints; no arbitrary ref, merge, force push or existing PR update.
export async function publishReview(env,plan,id,verified,branchReceipt,fetcher=fetch){
 const repo=plan.repo,branch=developmentBranch(id);
 if(!writeAllowed(env,repo)||!safeSourcePath(plan.path)||!verified?.verifiedAgainstSource||verified.repository!==repo||verified.path!==plan.path||verified.commit!==plan.commit||verified.blobSha!==plan.blobSha||branchReceipt.branch!==branch||branchReceipt.commit!==plan.commit||branchReceipt.base===branch||typeof branchReceipt.base!=='string'||!branchReceipt.base.split('/').every(x=>/^[A-Za-z0-9_-][A-Za-z0-9_.-]*$/.test(x)))throw Error('Invalid review');
 const bytes=new TextEncoder().encode(verified.updated);if(bytes.length>26000)throw Error('File too large');
 const call=async(path,method,body)=>{if(!writeAllowed(env,repo))throw Error('Write disabled');const r=await fetcher('https://api.github.com/repos/Motherlode94/'+encodeURIComponent(repo)+path,{method,headers:{authorization:'Bearer '+env.HEART_GITHUB_WRITE_TOKEN,accept:'application/vnd.github+json','content-type':'application/json','user-agent':'WarLike-Heart'},...(body?{body:JSON.stringify(body)}:{}),redirect:'error',signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('GitHub operation unavailable');return r.json();};
 const ref=await call('/git/ref/heads/'+branch,'GET');if(ref.object?.sha!==plan.commit)throw Error('Review branch changed');
 const committed=await call('/contents/'+plan.path.split('/').map(encodeURIComponent).join('/'),'PUT',{message:'HEART reviewed correction '+id,content:btoa(Array.from(bytes,c=>String.fromCharCode(c)).join('')),sha:plan.blobSha,branch});
 if(!/^[a-f0-9]{40}$/.test(committed.commit?.sha||''))throw Error('Commit not confirmed');
 const receipt={branch,commit:committed.commit.sha,prNumber:null,stage:'commit-created'};
 try{const pr=await call('/pulls','POST',{title:'HEART — reviewed correction '+id.slice(0,8),body:'Supervised single-file proposal. Review and run checks before merge.\n\n'+plan.reason,head:branch,base:branchReceipt.base,draft:true});if(!Number.isSafeInteger(pr.number)||pr.number<1||pr.draft!==true)throw Error('PR not confirmed');return {...receipt,prNumber:pr.number,url:'https://github.com/Motherlode94/'+repo+'/pull/'+pr.number,stage:'draft-pr-created',merged:false};}catch{return {...receipt,stage:'pr-unconfirmed',merged:false};}
}
