// Local, deterministic synthesis: no model request and no inferred facts.
export function summarizeMission(result){
 const items=result.results;
 const counts={done:0,failed:0,blocked:0};
 for(const item of items){if(Object.hasOwn(counts,item.status))counts[item.status]++;}
 return {method:'local-counts',counts,recordCount:items.reduce((n,r)=>n+(Array.isArray(r.records)?r.records.length:0),0),tasks:items.map(r=>({id:r.id,status:r.status,recordCount:Array.isArray(r.records)?r.records.length:0})),limitations:'Record counts are not unique findings or verified conclusions.'};
}
