// Read-only diagnostic. Never treats a Cloudflare Pages deployment as proof that
// WarLike Server's actual authenticated API is online.
const SERVER_HEALTH = "https://warlike-server.pages.dev/api/health";
const headers={"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"};
const respond=data=>new Response(JSON.stringify(data),{status:200,headers});
export async function onRequestGet(){
  try {
    const response=await fetch(SERVER_HEALTH,{
      method:"GET",redirect:"error",signal:AbortSignal.timeout(6000),
      headers:{"accept":"application/json"}
    });
    if(response.status===404)return respond({
      status:"endpoint_missing",httpStatus:404,serverHealthy:false,accountConnected:false,
      note:"La route /api/health n'existe pas sur cette adresse. Le site vitrine peut néanmoins être publié."
    });
    if(response.status===503)return respond({
      status:"not_ready",httpStatus:503,serverHealthy:false,accountConnected:false,
      note:"L'API répond, mais signale que ses services ne sont pas prêts (HTTP 503). Vérifier Worker, DB et bindings."
    });
    if(!response.ok)return respond({
      status:"http_error",httpStatus:response.status,serverHealthy:false,accountConnected:false,
      note:"La route de santé répond avec HTTP "+response.status+" ; aucune connexion utilisateur n'est confirmée."
    });
    let data;
    try {data=await response.json();} catch {
      return respond({status:"unexpected_response",httpStatus:response.status,serverHealthy:false,accountConnected:false,
        note:"La route répond, mais ne retourne pas le JSON de santé attendu."});
    }
    if(data?.service!=="warlike-server" || data.ready!==true)
      return respond({status:"unexpected_response",httpStatus:response.status,serverHealthy:false,accountConnected:false,
        note:"Le serveur répond, mais sa disponibilité applicative n'est pas confirmée."});
    return respond({status:"healthy",httpStatus:response.status,serverHealthy:true,accountConnected:false,
      note:"API WarLike Server opérationnelle selon /api/health. Aucun compte n'est authentifié par ce test."});
  } catch {
    return respond({status:"network_error",serverHealthy:false,accountConnected:false,
      note:"Impossible de joindre la route de santé depuis WarLike Heart. La cause réseau n'est pas déterminée."});
  }
}
