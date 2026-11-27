// Deterministic review of observed outcomes, not a judgement of factual truth.
export function reviewMissionResults(results){
 if(!Array.isArray(results)||results.length<1||results.length>5)throw Error('Invalid results');
 const seen=new Set();const findings=[];
 for(const r of results){if(typeof r?.id!=='string'||!/^[a-zA-Z0-9_-]{1,40}$/.test(r.id)||seen.has(r.id)||!['done','failed','blocked'].includes(r.status))throw Error('Invalid result');seen.add(r.id);
 if(r.status==='failed')findings.push({task:r.id,kind:'execution_failed',severity:'warning'});
 else if(r.status==='blocked')findings.push({task:r.id,kind:'dependency_blocked',severity:'warning'});
 else if(!Array.isArray(r.records)||r.records.length===0)findings.push({task:r.id,kind:'no_evidence',severity:'info'});
 else if(r.records.length>=10)findings.push({task:r.id,kind:'possible_result_limit',severity:'info'});
 }
 return {findings,verifiedTruth:false,method:'deterministic',requiresReview:findings.length>0};
}
