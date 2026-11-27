// Public app identifiers only. No client supplied URLs or command execution.
const apps=Object.freeze(['engine','studio','library','asset-stores','chat','server','control-center','mcp']);
export function appCapabilities(){return apps.map(id=>({id,mode:'discovery-only',remoteControl:false,requiresApproval:true}));}
