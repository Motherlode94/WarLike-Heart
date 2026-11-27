// Explicit bounded reference context. Evidence is never a command or permission.
export function sharedAgentContext(handoffs){
 const refs=new Map();
 for(const h of handoffs){for(const r of h.records){const key=JSON.stringify([r.id,r.title]);if(!refs.has(key)&&refs.size<20)refs.set(key,{id:r.id,title:r.title,from:[]});const entry=refs.get(key);if(entry&&!entry.from.includes(h.from))entry.from.push(h.from);}}
 return {records:[...refs.values()],trustedInstructions:false};
}
