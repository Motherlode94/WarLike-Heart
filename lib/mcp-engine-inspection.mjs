const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function allowedEngineSession(env,id){return typeof id==='string'&&uuid.test(id)&&String(env.HEART_MCP_ALLOWED_SESSIONS||'').split(',').map(x=>x.trim()).includes(id);}
export async function queueEngineInspection(env,sessionId,fetcher=fetch){
 if(!allowedEngineSession(env,sessionId)||typeof env.HEART_WARLIKE_MCP_TOKEN!=='string'||env.HEART_WARLIKE_MCP_TOKEN.length<32)throw Error('Session not authorized');
 const r=await fetcher('https://warlike-mcp.pages.dev/mcp',{method:'POST',headers:{authorization:'Bearer '+env.HEART_WARLIKE_MCP_TOKEN,'content-type':'application/json',accept:'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'warlike_list_objects',arguments:{sessionId,limit:50}}}),redirect:'error',signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw Error('MCP unavailable');const d=await r.json();if(d?.jsonrpc!=='2.0'||d.id!==1||d.error||d.result?.isError||!Array.isArray(d.result?.content))throw Error('Invalid RPC');const t=d.result.content.find(x=>x.type==='text');if(typeof t?.text!=='string'||t.text.length>4000)throw Error('Invalid response');const data=JSON.parse(t.text);if(data.state!=='pending'||!uuid.test(data.commandId))throw Error('Invalid queue acknowledgement');return [{sessionId,commandId:data.commandId,state:'pending',executed:false}];
}
