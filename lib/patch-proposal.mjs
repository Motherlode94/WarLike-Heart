// One explicitly supplied excerpt, one replacement, no application or execution.
export function validatePatchProposal(input,output){
 if(typeof input?.code!=='string'||!input.code.length||input.code.length>8000||typeof input.path!=='string'||input.path.length>240||!/^[a-f0-9]{40}$/i.test(input.commit||''))throw Error('Invalid input');
 const p=JSON.parse(output);if(typeof p?.before!=='string'||!p.before.length||p.before.length>2000||typeof p.after!=='string'||p.after.length>3000||p.before===p.after||typeof p.reason!=='string'||!p.reason.trim()||p.reason.length>500)throw Error('Invalid proposal');
 const start=input.code.indexOf(p.before);if(start<0||input.code.indexOf(p.before,start+1)>=0)throw Error('Ambiguous replacement');
 return {path:input.path,commit:input.commit,before:p.before,after:p.after,reason:p.reason,excerptOffset:start,source:'client-provided-excerpt',format:'exact-text-replacement',applied:false,testsRun:false,requiresApproval:true};
}
