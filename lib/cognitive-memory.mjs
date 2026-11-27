export const KINDS=['semantic','episodic','procedural','working'];
export function normalizeMemory(input){
 if(!KINDS.includes(input?.kind)||typeof input.title!=='string'||!input.title.trim()||input.title.length>160||typeof input.content!=='string'||!input.content.trim()||input.content.length>2500||typeof (input.source??'')!=='string'||(input.source??'').length>500)return null;
 return {kind:input.kind,title:input.title.trim(),content:input.content.trim(),source:(input.source??'').trim()};
}
export function memoryExpiry(kind,now){return kind==='working'?now+86400000:null;}

const terms=value=>String(value??'').normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().match(/[\p{L}\p{N}]+/gu)||[];
export function searchMemories(records,query){const q=[...new Set(terms(query))];if(!q.length)return [];return records.map((record,index)=>{const title=new Set(terms(record.title)),body=new Set(terms(record.content+' '+record.source));return {record,index,score:q.reduce((sum,w)=>sum+(title.has(w)?3:0)+(body.has(w)?1:0),0),matches:q.filter(w=>title.has(w)||body.has(w)).length};}).filter(x=>x.matches===q.length).sort((a,b)=>b.score-a.score||a.index-b.index).map(x=>x.record);}
