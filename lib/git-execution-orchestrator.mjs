import {writeAllowed,validWritePlan,planDigest,developmentBranch} from './github-write-policy.mjs';
import {verifyRemotePatch} from './remote-patch-verification.mjs';
import {claimOperation,finishOperation} from './git-operation-transitions.mjs';
import {createReviewBranch} from './github-development-branch.mjs';
import {publishReview} from './github-review-publish.mjs';
// Dependencies injectable for tests; no automatic retry or cleanup of remote artifacts.
export async function executeApprovedOperation(env,member,id,plan,deps={}){
 const db=env.HEART_DB,now=deps.now||Date.now,verify=deps.verify||verifyRemotePatch,claim=deps.claim||claimOperation,finish=deps.finish||finishOperation,branch=deps.branch||createReviewBranch,publish=deps.publish||publishReview;
 if(!db||!/^[a-f0-9]{32}$/.test(id)||!validWritePlan(plan)||!writeAllowed(env,plan.repo))throw Error('Write disabled or invalid plan');
 const hash=await planDigest(member,plan);
 const verified=await verify(env,plan);
 if(!await claim(db,member,id,hash,now()))throw Error('Approval unavailable');
 let receipt={repository:plan.repo,branch:developmentBranch(id),stage:'branch-unconfirmed',merged:false,testsRun:false};
 try{const created=await branch(env,plan.repo,id,plan.commit);receipt={...receipt,stage:'branch-created',base:created.base};const published=await publish(env,plan,id,verified,created);receipt={...receipt,...published};}catch{receipt={...receipt,needsManualReconciliation:true};}
 const status=receipt.stage==='draft-pr-created'?'done':'failed';
 if(status==='failed')receipt.needsManualReconciliation=true;
 if(!await finish(db,member,id,status,receipt,now()))return {status:'unconfirmed',receipt,needsManualReconciliation:true};
 return {status,receipt};
}
