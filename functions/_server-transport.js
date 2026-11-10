// Shared Cloudflare Service Binding transport for WarLike Server.
// No direct external fetch to pages.dev: both Workers run on the same account.
// Fail closed if the binding is absent rather than silently using an unsafe fallback.
const SERVER_ORIGIN="https://warlike-server.pages.dev";
export function hasServerBinding(env){
 return Boolean(env?.WARLIKE_SERVER && typeof env.WARLIKE_SERVER.fetch==="function");
}
export async function serverFetch(env,path,init={}){
 if(!hasServerBinding(env))throw new Error("WARLIKE_SERVER_BINDING_MISSING");
 if(!/^\/api\/(?:health|heart\/exchange)$/.test(path))throw new Error("UNAPPROVED_SERVER_ROUTE");
 const {signal,...requestInit}=init;
 const request=new Request(SERVER_ORIGIN+path,{...requestInit,redirect:"manual",signal});
 return env.WARLIKE_SERVER.fetch(request);
}
