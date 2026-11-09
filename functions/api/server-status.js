// Same-origin read-only connectivity diagnostic for WarLike Server.
// Does NOT authenticate to WarLike Server or transmit personal information.
const SERVER_HEALTH = "https://warlike-server.pages.dev/api/health";
export async function onRequestGet(){
 const headers={"content-type":"application/json; charset=utf-8","cache-control":"no-store"};
 try{
  const response=await fetch(SERVER_HEALTH,{method:"GET",redirect:"error",signal:AbortSignal.timeout(6000),headers:{"accept":"application/json"}});
  return new Response(JSON.stringify({
    reachable:response.ok,
    serverHealthy:response.status===200,
    status:response.status,
    accountConnected:false,
    note:response.status===200?"API de santé accessible ; aucune authentification n'est déduite.":"Service WarLike Server non opérationnel ou non disponible sur cette URL. Aucun compte connecté."
  }),{status:200,headers});
 }catch{
  return new Response(JSON.stringify({reachable:false,serverHealthy:false,accountConnected:false,note:"Diagnostic WarLike Server indisponible."}),{status:200,headers});
 }
}
