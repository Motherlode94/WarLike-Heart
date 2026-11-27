// Mission plans are drafts, with explicit dependencies and no execution.
export function planMission(tasks){
 if(!Array.isArray(tasks)||tasks.length<1||tasks.length>20)throw Error('Mission invalide');
 const map=new Map();
 for(const t of tasks){if(typeof t?.id!=='string'||!/^[a-zA-Z0-9_-]{1,40}$/.test(t.id)||map.has(t.id)||typeof t.title!=='string'||!t.title.trim()||t.title.length>240||!Array.isArray(t.dependsOn)||t.dependsOn.length>19||new Set(t.dependsOn).size!==t.dependsOn.length)throw Error('Tâche invalide');map.set(t.id,{id:t.id,title:t.title.trim(),dependsOn:[...t.dependsOn]});}
 for(const t of map.values())if(t.dependsOn.some(id=>!map.has(id)||id===t.id))throw Error('Dépendance invalide');
 const layers=[],finished=new Set();
 while(finished.size<map.size){const layer=[...map.values()].filter(t=>!finished.has(t.id)&&t.dependsOn.every(id=>finished.has(id)));if(!layer.length)throw Error('Dépendances cycliques');layers.push(layer.map(t=>({...t,status:'planned'})));for(const t of layer)finished.add(t.id);}
 return {layers,total:map.size,executed:false};
}
