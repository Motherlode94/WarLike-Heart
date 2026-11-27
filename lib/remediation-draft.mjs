// Draft only: workflow evidence is a diagnostic hint, not a confirmed root cause.
export function remediationDraft(jobs,files){
 if(!Array.isArray(jobs)||jobs.length>30||!Array.isArray(files)||files.length>100)throw Error('Invalid evidence');
 const failures=[];for(const j of jobs){if(!Number.isSafeInteger(j?.id)||j.id<1||!Array.isArray(j.steps)||j.steps.length>40)throw Error('Invalid job');for(const s of j.steps){if(['failure','timed_out','action_required','startup_failure'].includes(s.conclusion)&&failures.length<30)failures.push({jobId:j.id,step:Number.isSafeInteger(s.number)?s.number:null,label:String(s.name??'').slice(0,160),conclusion:s.conclusion});}}
 const candidates=files.filter(f=>typeof f?.path==='string'&&f.path.length<=240&&f.review===true).slice(0,20).map(f=>({path:f.path,reason:'Changed test or build configuration; inspect before editing.'}));
 return {failures,candidates,steps:['Read the relevant failed step log.','Reproduce the failing check at the exact head commit.','Identify the smallest change and add a regression test.','Run the affected checks and review before merging.'],rootCauseVerified:false,patchGenerated:false,executed:false,requiresApproval:true,source:'client-provided'};
}
