// Roles describe expertise; they never grant connector permissions.
export const specialists=Object.freeze([
 {id:'memory',label:'Memory Analyst',actions:['heart.memory.search']},
 {id:'strategy',label:'Strategy Analyst',actions:['heart.goal.inspect']},
 {id:'developer',label:'Developer Analyst',actions:[]},
 {id:'quality',label:'Quality Reviewer',actions:[]},
 {id:'coordinator',label:'Mission Coordinator',actions:[]}
].map(x=>Object.freeze({...x,actions:Object.freeze(x.actions)})));
export function specialistCapabilities(permitted){const allowed=new Set(permitted);return specialists.map(s=>({id:s.id,label:s.label,availableActions:s.actions.filter(a=>allowed.has(a)),executable:s.actions.some(a=>allowed.has(a)),grantsPermissions:false}));}
