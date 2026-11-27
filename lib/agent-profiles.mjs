import {actions} from './agent-registry.mjs';
// Profiles describe capabilities, not grants. Caller must supply currently permitted actions.
const profiles=[{id:'memory',label:'Memory Agent',actions:['heart.memory.search']},{id:'goals',label:'Goal Agent',actions:['heart.goal.inspect']},{id:'developer',label:'Developer Agent',prefix:'github.'},{id:'infrastructure',label:'Infrastructure Agent',prefix:'cloudflare.'},{id:'creative',label:'Creative Agent',prefix:'meshy.'}];
export function listAgentProfiles(permitted=[]){const allowed=new Set(permitted.filter(a=>actions.includes(a)));return profiles.map(p=>({id:p.id,label:p.label,actions:[...allowed].filter(a=>p.actions?.includes(a)||Boolean(p.prefix&&a.startsWith(p.prefix))),requiresApproval:true}));}
