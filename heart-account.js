/* Optional authorized WarLike account link. Never handles passwords or WarLike cookies. */
(() => {
 "use strict";
 const $=id=>document.getElementById(id);
 const button=$("heartLinkAccount"),disconnect=$("heartUnlinkAccount"),status=$("heartAccountStatus");
 if(!button||!disconnect||!status)return;
 const pendingKey="warlike-heart-pkce-pending";
 const b64=bytes=>btoa(Array.from(bytes,n=>String.fromCharCode(n)).join("")).replaceAll("+","-").replaceAll("/","_").replaceAll("=","");
 const error=e=>{status.textContent=String(e?.message||e||"Connexion impossible.");};
 const refresh=async()=>{
  try {
   const response=await fetch("/api/account",{cache:"no-store",credentials:"same-origin"});
   const data=await response.json();
   if(!data.available){button.disabled=true;disconnect.hidden=true;status.textContent="Association non configurée côté serveur. Le chat local reste disponible.";return;}
   button.disabled=false;
   disconnect.hidden=!data.connected;
   status.textContent=data.connected?"Compte WarLike associé : "+data.user.name+" (session temporaire de 10 minutes).":"Aucun compte WarLike associé. Aucun mot de passe n'est partagé.";
  }catch{button.disabled=true;status.textContent="Diagnostic de connexion indisponible. Le chat local fonctionne toujours.";}
 };
 button.addEventListener("click",async()=>{
  if(!crypto?.subtle||!sessionStorage)return error("Navigateur HTTPS requis.");
  button.disabled=true;status.textContent="Ouverture de WarLike Server pour autorisation…";
  try{
   const verifier=b64(crypto.getRandomValues(new Uint8Array(32)));
   const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(verifier));
   const challenge=b64(new Uint8Array(digest));
   const state=b64(crypto.getRandomValues(new Uint8Array(24)));
   sessionStorage.setItem(pendingKey,JSON.stringify({verifier,state,created:Date.now()}));
   window.location.assign("https://warlike-server.pages.dev/connect/heart?challenge="+encodeURIComponent(challenge)+"&state="+encodeURIComponent(state));
  }catch(e){error(e);button.disabled=false;}
 });
 disconnect.addEventListener("click",async()=>{
  const response=await fetch("/api/account",{method:"DELETE",headers:{"origin":location.origin},credentials:"same-origin"});
  if(!response.ok)return error("Déconnexion impossible.");
  await refresh();
 });
 async function consume(){
  const hash=new URLSearchParams(location.hash.replace(/^#/,""));
  const code=hash.get("warlike_pair"),state=hash.get("state");
  if(!code)return;
  history.replaceState(null,"",location.pathname+location.search);
  let pending;
  try{pending=JSON.parse(sessionStorage.getItem(pendingKey)||"null");}catch{}
  sessionStorage.removeItem(pendingKey);
  if(!pending||pending.state!==state||Date.now()-pending.created>300_000)return error("Association invalide ou expirée. Réessaie.");
  status.textContent="Vérification de l'autorisation WarLike…";
  try {
   const r=await fetch("/api/account",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({code,verifier:pending.verifier}),credentials:"same-origin"});
   const data=await r.json();
   if(!r.ok)throw Error(data.error||"Association refusée.");
   await refresh();
  }catch(e){error(e);}
 }
 refresh().then(consume);
})();
