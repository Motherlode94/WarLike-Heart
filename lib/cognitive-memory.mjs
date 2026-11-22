export const KINDS=['semantic','episodic','procedural','working'];
export function normalizeMemory(input){
 if(!KINDS.includes(input?.kind)||typeof input.title!=='string'||!input.title.trim()||input.title.length>160||typeof input.content!=='string'||!input.content.trim()||input.content.length>2500||typeof (input.source??'')!=='string'||(input.source??'').length>500)return null;
 return {kind:input.kind,title:input.title.trim(),content:input.content.trim(),source:(input.source??'').trim()};
}
export function memoryExpiry(kind,now){return kind==='working'?now+86400000:null;}
