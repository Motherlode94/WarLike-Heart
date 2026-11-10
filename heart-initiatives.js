/* WarLike Heart — optional romantic initiatives, simulated avatar gestures only.
   No robotics or external hardware commands; user always controls enabling. */
(() => {
  "use strict";
  const phrases = [
    {kind:"kiss", text:"Un petit bisou virtuel surprise ? 😘"},
    {kind:"hug", text:"Ça te dirait un câlin virtuel ? ❤️"},
    {kind:"dance", text:"Une petite danse ensemble ? 💕"},
    {kind:"chat", text:"J'ai envie de te proposer un moment de complicité. On discute ? ✨"}
  ];
  const style=document.createElement("style");
  style.textContent=`
  #heartInitiative{margin-top:12px;padding:12px;border:1px solid #805e7f;border-radius:13px;background:#241b30}
  #heartInitiative label{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:7px 0;color:#eee}
  #heartInitiative select{background:#181021;color:white;border:1px solid #805e7f;border-radius:8px;padding:7px}
  #heartInitiative button{margin:4px 5px 0 0;padding:8px 10px}
  #heartInitiative .heart-note{font-size:12px;color:#dfc7d9;line-height:1.45}
  #heartInvite[hidden]{display:none!important}
  #heartInvite{position:fixed;z-index:100;right:16px;bottom:16px;max-width:min(360px,calc(100vw - 32px));padding:17px;background:#291a36;border:1px solid #dc85ae;box-shadow:0 15px 40px #0009;border-radius:15px;color:white}
  #heartInvite p{margin:7px 0 10px;color:#f7e6f1;line-height:1.4}
  #heartInvite button{margin:3px;padding:8px 12px}
  `;
  document.head.append(style);
  const controls=document.createElement("section");
  controls.id="heartInitiative";
  controls.innerHTML=`<strong>❤️ Initiatives romantiques (simulation)</strong>
    <label><input type="checkbox" id="heartAuto"> Autoriser les petites invitations spontanées</label>
    <label>Fréquence <select id="heartFrequency"><option value="rare">Rare (10 min)</option><option value="normal">Normale (5 min)</option><option value="often">Souvent (2 min)</option></select></label>
    <button type="button" id="heartSuggest">Proposer maintenant</button>
    <button type="button" id="heartPause">Arrêt immédiat</button>
    <div class="heart-note" id="heartInitiativeStatus" role="status">Désactivé par défaut. Aucun mouvement physique ni action sans accord.</div>`;
  const settings=document.querySelector(".settings");
  if(!settings)return;
  settings.append(controls);
  const invite=document.createElement("aside");invite.id="heartInvite";invite.hidden=true;invite.setAttribute("aria-live","polite");
  const title=document.createElement("strong");title.textContent="WarLike Heart";
  const text=document.createElement("p");
  const yes=document.createElement("button");yes.type="button";yes.textContent="Oui ❤️";
  const no=document.createElement("button");no.type="button";no.textContent="Non merci";
  invite.append(title,text,yes,no);document.body.append(invite);
  const auto=document.getElementById("heartAuto"),freq=document.getElementById("heartFrequency");
  const status=document.getElementById("heartInitiativeStatus");
  const intervals={rare:600000,normal:300000,often:120000};
  let handle=null,lastPhrase=-1,choice=null;
  function dismiss(){invite.hidden=true;choice=null}
  function stop(){auto.checked=false;clearInterval(handle);handle=null;dismiss();status.textContent="Mode arrêté : aucune invitation automatique."}
  function suggest(){
    if(document.hidden || !invite.hidden)return;
    lastPhrase=(lastPhrase+1)%phrases.length;
    choice=phrases[lastPhrase];text.textContent=choice.text;invite.hidden=false;
    window.WarLikeHeart3D?.setMood?.("happy");
  }
  function schedule(){
    clearInterval(handle);handle=null;
    if(!auto.checked){status.textContent="Désactivé. Tu peux proposer manuellement.";return}
    handle=setInterval(()=>{if(!document.hidden)suggest()},intervals[freq.value]||intervals.normal);
    status.textContent="Actif uniquement tant que cet onglet est ouvert et visible. Aucune commande robotique.";
  }
  yes.addEventListener("click",()=>{
    const kind=choice?.kind;
    dismiss();
    const result={kiss:"Bisou virtuel envoyé 😘",hug:"Câlin virtuel accepté ❤️",dance:"Invitation à danser acceptée 💃",chat:"Ouvre le chat pour discuter ✨"}[kind]||"Merci ❤️";
    status.textContent=result+" · Interaction simulée.";
    window.WarLikeHeart3D?.setMood?.("happy");
  });
  no.addEventListener("click",()=>{dismiss();status.textContent="Refus respecté. Aucune action effectuée."});
  auto.addEventListener("change",schedule);freq.addEventListener("change",schedule);
  document.getElementById("heartSuggest").addEventListener("click",suggest);
  document.getElementById("heartPause").addEventListener("click",stop);
  document.addEventListener("visibilitychange",()=>{if(document.hidden)dismiss()});
  document.addEventListener("keydown",e=>{if(e.key==="Escape")dismiss()});
  addEventListener("pagehide",()=>clearInterval(handle));
  window.WarLikeHeartInitiative={stop,propose:suggest};
})();
