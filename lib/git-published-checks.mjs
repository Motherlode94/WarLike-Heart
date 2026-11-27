import {githubRepoAllowed} from './github-read.mjs';
import {reviewCommitChecks} from './commit-check-review.mjs';
export async function publishedChecks(env,row,fetcher=fetch){
 if(row.status!=='done'||!githubRepoAllowed(env,row.repository)||!env.HEART_GITHUB_TOKEN)throw Error('Unavailable');
 const receipt=JSON.parse(row.result);const sha=receipt.commit;
 if(receipt.stage!=='draft-pr-created'||!/^[a-f0-9]{40}$/.test(sha||'')||!Number.isSafeInteger(receipt.prNumber)||receipt.prNumber<1)throw Error('Invalid receipt');
 const r=await fetcher('https://api.github.com/repos/Motherlode94/'+encodeURIComponent(row.repository)+'/actions/runs?head_sha='+sha+'&per_page=20',{headers:{authorization:'Bearer '+env.HEART_GITHUB_TOKEN,accept:'application/vnd.github+json','user-agent':'WarLike-Heart'},redirect:'error',signal:AbortSignal.timeout(10000)});
 if(!r.ok)throw Error('Unavailable');const d=await r.json();if(!Array.isArray(d.workflow_runs))throw Error('Invalid runs');
 const runs=d.workflow_runs.slice(0,20).map(x=>({id:x.id,name:x.name,event:x.event,headSha:x.head_sha,status:x.status,conclusion:x.conclusion,updatedAt:x.updated_at}));
 return {...reviewCommitChecks(sha,runs),repository:row.repository,prNumber:receipt.prNumber,observedAt:Date.now(),scope:'receipt-commit-latest-20-runs'};
}
