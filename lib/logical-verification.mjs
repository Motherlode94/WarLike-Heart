import {calculate} from './native-calculator.mjs';
// Propositional Horn rules with explicit negation, bounded forward chaining.
// Unknown is not false. Inconsistent input never proves arbitrary conclusions.
const literal=value=>{if(typeof value!=='string'||!/^!?[\p{L}_][\p{L}\p{N}_-]{0,59}$/u.test(value))throw Error('Proposition invalide (mot simple, négation !).');return value;};
const opposite=x=>x.startsWith('!')?x.slice(1):'!'+x;
export function verifyLogic({faits=[],regles=[],conclusion}={}){
 if(!Array.isArray(faits)||faits.length>80||!Array.isArray(regles)||regles.length>80)throw Error('Maximum 80 faits et 80 règles.');
 const goal=literal(conclusion),known=new Map(faits.map(x=>[literal(x),{fact:true}]));
 const rules=regles.map((r,index)=>{if(!Array.isArray(r?.si)||!r.si.length||r.si.length>8)throw Error('Chaque règle exige si: [propositions] et alors: proposition.');return {si:r.si.map(literal),alors:literal(r.alors),index};});
 let changed=true;while(changed){changed=false;for(const r of rules)if(!known.has(r.alors)&&r.si.every(x=>known.has(x))){known.set(r.alors,{rule:r.index+1,from:r.si});changed=true;}}
 const contradictions=[...known.keys()].filter(x=>!x.startsWith('!')&&known.has(opposite(x)));
 const status=contradictions.length?'inconsistent':known.has(goal)?'proved':known.has(opposite(goal))?'refuted':'unknown';
 const proof=[],seen=new Set();function trace(x){if(seen.has(x)||!known.has(x))return;seen.add(x);const step=known.get(x);for(const p of step.from||[])trace(p);proof.push({proposition:x,...step});}
 if(status==='proved')trace(goal);if(status==='refuted')trace(opposite(goal));
 return {status,conclusion:goal,contradictions,proof};
}
export function verifyConstraints(input){
 if(typeof input!=='string'||input.length>1000)throw Error('Contraintes trop longues.');
 const parts=input.split(';').map(x=>x.trim()).filter(Boolean);if(!parts.length||parts.length>30)throw Error('Maximum 30 affectations ou comparaisons.');
 const variables=Object.create(null),checks=[];
 for(const part of parts){
  const assignment=part.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=(?!=)\s*(.+)$/);
  if(assignment){if(Object.hasOwn(variables,assignment[1]))throw Error('Variable déjà définie : '+assignment[1]);variables[assignment[1]]=calculate(assignment[2],variables);continue;}
  const comparison=part.match(/^(.+?)\s*(<=|>=|==|!=|<|>)\s*(.+)$/);if(!comparison)throw Error('Format : x=10 ; x>=5 ; x<=8.');
  const a=calculate(comparison[1],variables),b=calculate(comparison[3],variables),delta=a.n*b.d-b.n*a.d;
  checks.push({constraint:part,passes:{'<':delta<0n,'>':delta>0n,'<=':delta<=0n,'>=':delta>=0n,'==':delta===0n,'!=':delta!==0n}[comparison[2]]});
 }
 if(!checks.length)throw Error('Ajoute au moins une comparaison.');
 return {passes:checks.every(x=>x.passes),checks};
}
export function logicReply(text){
 if(typeof text!=='string')return null;const match=text.match(/^\/(logique|contraintes)\s+([\s\S]+)$/i);if(!match)return null;
 try{
  const logic=match[1].toLowerCase()==='logique',data=logic?verifyLogic(JSON.parse(match[2])):verifyConstraints(match[2]);
  const reply=logic?({proved:'Conclusion démontrée à partir des faits et règles fournis.',refuted:'La négation de la conclusion est démontrée.',unknown:'Conclusion indéterminée : ni elle ni sa négation ne sont démontrées.',inconsistent:'Faits ou règles contradictoires : '+data.contradictions.join(', ')+'. Aucune conclusion validée.'}[data.status]+(data.proof.length?'\n'+data.proof.map(p=>p.proposition+' — '+(p.fact?'fait fourni':'règle '+p.rule+', depuis '+p.from.join(', '))).join('\n'):''))
   :data.checks.map(x=>(x.passes?'Respectée : ':'Non respectée : ')+x.constraint).join('\n');
  return {kind:logic?'logic':'constraints',reply,data,verification:{status:'native-verified',scope:logic?'provided-propositions':'provided-numeric-values'}};
 }catch(error){return {kind:'logic-error',reply:error instanceof SyntaxError?'JSON invalide. Exemple : /logique {"faits":["pluie"],"regles":[{"si":["pluie"],"alors":"mouille"}],"conclusion":"mouille"}':error.message,verification:{status:'input-error',scope:'logic'}};}
}
