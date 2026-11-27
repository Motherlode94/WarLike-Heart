// User-provided horizons and dates; no invented deadlines or automatic execution.
export function strategicPlan(goals,assignments,now){
 if(!Array.isArray(assignments)||assignments.length>100)throw Error('Invalid assignments');
 const byId=new Map(goals.map(g=>[g.id,g])),seen=new Set();const groups={short:[],medium:[],long:[],unassigned:[]};
 for(const a of assignments){if(!byId.has(a?.goalId)||seen.has(a.goalId)||!['short','medium','long'].includes(a.horizon))throw Error('Invalid assignment');seen.add(a.goalId);const g=byId.get(a.goalId);groups[a.horizon].push({id:g.id,title:g.title,status:g.status,next:g.steps.find(s=>!s.done)?.text??null});}
 for(const g of goals)if(!seen.has(g.id))groups.unassigned.push({id:g.id,title:g.title,status:g.status});
 return {groups,asOf:now,method:'user-assigned-horizons',persisted:false,executed:false,requiresApproval:true};
}
