// Use declared dependency titles only as ranking evidence, not new queries or instructions.
export function rankWithDependencyContext(records,context){
 const titles=new Set(context.records.map(r=>r.title.normalize('NFKC').trim().toLowerCase()).filter(Boolean));
 return records.map((record,index)=>({record,index,match:titles.has(String(record.title??'').normalize('NFKC').trim().toLowerCase())})).sort((a,b)=>Number(b.match)-Number(a.match)||a.index-b.index).map(x=>x.record);
}
