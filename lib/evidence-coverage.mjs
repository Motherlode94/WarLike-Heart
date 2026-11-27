// Source diversity describes coverage, not independent confirmation.
export function evidenceCoverage(evidence,links=[]){
 const groups=new Map();for(const r of evidence){const type=r.type||'unknown';if(!groups.has(type))groups.set(type,[]);groups.get(type).push({id:r.id,title:r.title,source:r.source||null});}
 return {groups:[...groups].map(([type,records])=>({type,records})),sourceTypes:groups.size,linkedRelations:links.length,verifiedTruth:false,limitations:'Different record types may repeat the same claim; diversity is not corroboration.'};
}
