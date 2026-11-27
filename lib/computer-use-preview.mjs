// Computer-use plans are inert. No desktop executor is installed.
export function previewComputerUse(input){
 if(!Array.isArray(input)||input.length<1||input.length>12)throw Error('Plan invalide');
 const allowed=['inspect','navigate','capture'];return {steps:input.map(s=>{if(!allowed.includes(s?.action)||typeof s.target!=='string'||!s.target.trim()||s.target.length>160)throw Error('Étape invalide');return {action:s.action,target:s.target.trim(),requiresApproval:true};}),executorAvailable:false,executed:false};
}
