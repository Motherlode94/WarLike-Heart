/* WarLike Heart v1.3: separate public and account-bound screens.
 * This is presentation gating, not authorization: sensitive APIs enforce access server-side.
 */
(() => {
  "use strict";
  const $=id=>document.getElementById(id);
  const views=new Map([...document.querySelectorAll("[data-view]")].map(el=>[el.dataset.view,el]));
  const buttons=[...document.querySelectorAll("[data-nav]")];
  const roles=new Set(["owner","referent"]);
  let account=null;
  const accountLabel=$("navAccountStatus");
  const guard=$("navNotice");
  const settings=document.querySelector(".chat > .settings");
  const accountBody=$("accountBody");
  if(settings&&accountBody)accountBody.append(settings);
  // These are operator tools, not public avatar controls.
  const studioBody=$("studioBody");
  for(const id of ["pickPortrait","clearPortrait","portraitFile","threeMode","modelFile"]){
    const node=$(id);
    if(node&&studioBody)studioBody.append(node);
  }
  const advancedConfig=$("accessToken")?.closest("details");
  if(advancedConfig&&studioBody)studioBody.append(advancedConfig);
  function allowed(view){
    if(["home","account","space3d"].includes(view))return true;
    if(["brain","cloud"].includes(view))return Boolean(account);
    if(view==="studio")return Boolean(account&&roles.has(account.role));
    return false;
  }
  function show(view,writeHistory=true){
    if(!views.has(view))view="home";
    if(!allowed(view)){
      guard.hidden=false;
      guard.textContent=view==="studio"
        ?"Atelier privé : accès réservé aux rôles WarLike owner ou referent."
        :"Section privée : associe ton compte depuis « Mon compte » pour y accéder.";
      view="account";
    }else{guard.hidden=true;guard.textContent="";}
    for(const [id,el] of views)el.hidden=id!==view;
    for(const b of buttons){
      b.setAttribute("aria-current",b.dataset.nav===view?"page":"false");
      b.setAttribute("aria-selected",String(b.dataset.nav===view));
    }
    if(writeHistory)history.replaceState(history.state,"","#"+view);
    $("pageTitle").textContent=({home:"Conversation",space3d:"Espace 3D",account:"Mon compte",brain:"Cerveau & apprentissage",cloud:"Mémoire Cloud",studio:"Atelier privé"})[view]||"Conversation";
    document.dispatchEvent(new CustomEvent("warlike-heart-view-changed",{detail:{view}}));
    window.scrollTo({top:0,behavior:"instant"});
  }
  function updateAccount(data){
    account=data?.connected&&data?.user?data.user:null;
    const member=Boolean(account),admin=member&&roles.has(account.role);
    accountLabel.textContent=member?"Connecté : "+account.name:"Mode visiteur";
    for(const b of buttons){
      const gate=b.dataset.access;
      b.hidden=(gate==="member"&&!member)||(gate==="operator"&&!admin);
    }
    const current=[...views].find(([_,el])=>!el.hidden)?.[0]||"home";
    if(!allowed(current))show("account",false);
  }
  async function refresh(){
    try{
      const response=await fetch("/api/account",{credentials:"same-origin",cache:"no-store"});
      if(!response.ok)throw Error("Session indisponible");
      updateAccount(await response.json());
    }catch{updateAccount(null);}
  }
  buttons.forEach(button=>button.addEventListener("click",()=>show(button.dataset.nav)));
  document.addEventListener("warlike-heart-account-updated",event=>updateAccount(event.detail));
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)refresh();});
  const target=location.hash.replace(/^#/,"");
  show(views.has(target)?target:"home",false);
  refresh().then(()=>{if(views.has(target)&&allowed(target))show(target,false);});
})();
