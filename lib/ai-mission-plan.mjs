import {collaborationDraft} from './agent-collaboration.mjs';
export function parseAiMission(text){
 if(typeof text!=='string'||text.length>4000)throw Error('Invalid response');
 const data=JSON.parse(text);if(!Array.isArray(data.tasks)||data.tasks.length>5)throw Error('Invalid tasks');
 const plan=collaborationDraft(data.tasks,['heart.memory.search','heart.goal.inspect']);
 return {tasks:plan.nodes.map(({id,action,query,dependsOn})=>({id,action,query,dependsOn})),requiresApproval:true,executed:false};
}
