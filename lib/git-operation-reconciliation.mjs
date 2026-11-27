import {developmentBranch} from './github-write-policy.mjs';
import {githubRepoAllowed} from './github-read.mjs';
// Read-only reconciliation, never retry or mutate an uncertain remote operation.
export async function reconcileReview(env,row,fetcher=fetch){
 const repo=row.repository,branch=developmentBranch(row.id);
 if(!githubRepoAllowed(env,repo)||!env.HEART_GITHUB_TOKEN||!['running','failed','done'].includes(row.status))throw Error('Invalid operation');
 const root='https://api.github.com/repos/Motherlode94/'+encodeURIComponent(repo);
 const get=async path=>{const r=await fetcher(root+path,{headers:{authorization:'Bearer '+env.HEART_GITHUB_TOKEN,accept:'application/vnd.github+json','user-agent':'WarLike-Heart'},redirect:'error',signal:AbortSignal.timeout(10000)});if(r.status===404)return null;if(!r.ok)throw Error('Unavailable');return r.json();};
 const ref=await get('/git/ref/heads/'+branch);
 const prs=await get('/pulls?state=all&per_page=30&head='+encodeURIComponent('Motherlode94:'+branch));
 if(!Array.isArray(prs))throw Error('PR lookup unavailable');
 const matches=prs.filter(p=>p.head?.ref===branch&&Number.isSafeInteger(p.number)&&p.number>0).map(p=>({number:p.number,state:p.state,draft:p.draft===true,headSha:p.head?.sha,url:'https://github.com/Motherlode94/'+repo+'/pull/'+p.number}));
 return {repository:repo,branch,branchObserved:!!ref,headSha:ref?.object?.sha??null,pullRequests:matches,recordedStatus:row.status,observedAt:Date.now(),retryAllowed:false,persisted:false,mergeApproved:false};
}
