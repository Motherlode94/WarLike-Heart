import {actions,validateTask} from './agent-registry.mjs';
// Draft collaboration graph. Roles are suggestions, not permissions.
export function collaborationDraft(tasks,permitted){
 if(!Array.isArray(tasks)||!tasks.length||tasks.length>20)throw Error('Invalid tasks');
 const allowed=new Set(permitted),seen=new Set(),nodes=[];
 for(const t of tasks){const v=validateTask(t);if(!v||!allowed.has(v.action)||typeof t.id!=='string'||!/^[a-zA-Z0-9_-]{1,40}$/.test(t.id)||seen.has(t.id)||!Array.isArray(t.dependsOn)||new Set(t.dependsOn).size!==t.dependsOn.length||t.dependsOn.some(id=>!seen.has(id)))throw Error('Invalid task or dependency');seen.add(t.id);nodes.push({id:t.id,...v,agent:v.action.startsWith('heart.memory.')?'memory':v.action.startsWith('heart.goal.')?'goals':v.action.split('.')[0],dependsOn:[...t.dependsOn],status:'draft',requiresApproval:true});}
 return {nodes,executed:false};
}
