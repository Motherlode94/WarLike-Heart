export const KINDS=['semantic','episodic','procedural','working'];
export function normalizeMemory(input){
 if(!KINDS.includes(input?.kind)||typeof input.title!=='string'||!input.title.trim()||input.title.length>160||typeof input.content!=='string'||!input.content.trim()||input.content.length>2500||typeof (input.source??'')!=='string'||(input.source??'').length>500)return null;
 return {kind:input.kind,title:input.title.trim(),content:input.content.trim(),source:(input.source??'').trim()};
}
export function memoryExpiry(kind,now){return kind==='working'?now+86400000:null;}

// Exact duplicate candidates only; never merge or delete memories automatically.
export function consolidationCandidates(records){const groups=new Map();const norm=s=>String(s??'').normalize('NFC').trim().replace(/\s+/g,' ');for(const r of records){if(r.kind==='working')continue;const key=JSON.stringify([r.kind,norm(r.title),norm(r.content),norm(r.source)]);if(!groups.has(key))groups.set(key,[]);groups.get(key).push({id:r.id,revision:r.revision});}return [...groups.values()].filter(g=>g.length>1);}
