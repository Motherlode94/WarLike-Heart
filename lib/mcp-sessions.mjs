const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function readMcpSessions(env,fetcher=fetch){
 if(typeof env.HEART_WARLIKE_MCP_TOKEN!=='string'||env.HEART_WARLIKE_MCP_TOKEN.length<32)throw Error('Not configured');
 const r=await fetcher('https://warlike-mcp.pages.dev/mcp',{method:'POST',headers:{authorization:'Bearer '+env.HEART_WARLIKE_MCP_TOKEN,'content-type':'application/json',accept:'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'warlike_list_sessions',arguments:{}}}),redirect:'error',signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw Error('MCP unavailable');const d=await r.json();if(d?.jsonrpc!=='2.0'||d.id!==1||d.error||d.result?.isError||!Array.isArray(d.result?.content))throw Error('Invalid RPC');
 const t=d.result.content.find(x=>x.type==='text');if(typeof t?.text!=='string'||t.text.length>16000)throw Error('Invalid sessions');const data=JSON.parse(t.text);if(!Array.isArray(data.sessions))throw Error('Invalid sessions');
 return data.sessions.slice(0,30).filter(x=>uuid.test(x.id)&&['read','edit'].includes(x.permission)&&Number.isSafeInteger(x.last_seen)).map(x=>({id:x.id,permission:x.permission,lastSeen:x.last_seen}));
}
