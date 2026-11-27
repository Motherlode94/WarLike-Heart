import {collaborationDraft} from './agent-collaboration.mjs';
// Suggestions are derived from client-provided outcomes, never execute automatically.
export function followupMission(tasks,results){
 const plan=collaborationDraft(tasks,['heart.memory.search','heart.goal.inspect']);
 if(plan.nodes.length>5||!Array.isArray(results)||results.length!==plan.nodes.length)throw Error('Invalid results');
 const byId=new Map();for(const r of results){if(!plan.nodes.some(n=>n.id===r.id)||byId.has(r.id)||!['done','failed','blocked'].includes(r.status))throw Error('Invalid result');byId.set(r.id,r);}
 const suggestions=[];
 for(const n of plan.nodes){const r=byId.get(n.id);if(r.status!=='done')continue;if(!Array.isArray(r.records)||!r.records.length){const action=n.action==='heart.memory.search'?'heart.goal.inspect':'heart.memory.search';if(!plan.nodes.some(t=>t.action===action&&t.query===n.query)&&!suggestions.some(t=>t.action===action&&t.query===n.query))suggestions.push({id:'followup'+(suggestions.length+1),action,query:n.query,dependsOn:[],reason:'alternative_internal_source',sourceTask:n.id});}}
 return {tasks:suggestions,requiresApproval:true,executed:false,source:'client-provided'};
}
