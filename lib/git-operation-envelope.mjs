// Prepare an immutable, account-bound operation envelope. Remote writes deliberately absent.
export async function approvalEnvelope(member,plan,policy,verify,digest,branchName,now=Date.now()){
 if(!policy(plan.repo))throw Error('Write disabled');
 const verified=await verify(plan);
 const hash=await digest(member,plan);
 const id=crypto.randomUUID().replace(/-/g,'');
 return {id,branch:branchName(id),digest:hash,repository:plan.repo,commit:verified.commit,path:verified.path,blobSha:verified.blobSha,expiresAt:now+300000,requiresApproval:true,executed:false,remoteWrites:false};
}
