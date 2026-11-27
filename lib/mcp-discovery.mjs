export function inspectMcpDiscovery(data,id=1){
 if(data?.jsonrpc!=='2.0'||data.id!==id||data.error||!Array.isArray(data.result?.tools))throw Error('Invalid MCP response');
 const seen=new Set();return data.result.tools.slice(0,100).filter(t=>typeof t?.name==='string'&&/^[a-zA-Z0-9_.-]{1,100}$/.test(t.name)&&!seen.has(t.name)&&seen.add(t.name)).map(t=>({name:t.name,description:typeof t.description==='string'?t.description.slice(0,300):''}));
}
