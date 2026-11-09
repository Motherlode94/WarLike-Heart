/* WarLike Heart · browser-only prototype — no external AI calls */
"use strict";
(() => {
  const $ = id => document.getElementById(id);
  const KEY = "warlike-heart-demo-v1";
  const MAX = 100;
  const welcome = {role:"assistant",text:"Bonjour ! Je suis le prototype local de WarLike Heart. Tu peux écrire, essayer la voix ou exporter notre conversation. Les réponses sont des démonstrations : aucun modèle IA n'est encore connecté."};
  let history = [welcome];
  let recognition = null;
  const state = {voiceEnabled:false,remember:false};
  const status = (text) => { $("status").textContent = text; };
  const safeHistory = (value) => Array.isArray(value) ? value.filter(x => x && ["user","assistant"].includes(x.role) && typeof x.text === "string" && x.text.length <= 4000).slice(-MAX) : null;
  const render = () => {
    const area = $("messages"); area.replaceChildren();
    for (const item of history) {
      const el = document.createElement("div");
      el.className = "bubble " + item.role;
      el.textContent = item.text;
      area.appendChild(el);
    }
    area.scrollTop = area.scrollHeight;
  };
  const persist = () => {
    if (!state.remember) { try { localStorage.removeItem(KEY); } catch {} return; }
    try { localStorage.setItem(KEY,JSON.stringify({version:1,history:history.slice(-MAX),voiceEnabled:state.voiceEnabled,remember:true})); }
    catch { status("Stockage local indisponible. Exporte ton JSON pour sauvegarder."); }
  };
  const stopVoice = () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    $("portrait").classList.remove("speaking");
  };
  const speak = (text) => {
    if (!state.voiceEnabled) return;
    if (!("speechSynthesis" in window)) { status("Synthèse vocale non prise en charge ici."); return; }
    stopVoice();
    const utterance = new SpeechSynthesisUtterance(text); utterance.lang = "fr-FR"; utterance.rate = 1; utterance.pitch = 1;
    utterance.onstart = () => $("portrait").classList.add("speaking");
    utterance.onend = utterance.onerror = () => $("portrait").classList.remove("speaking");
    window.speechSynthesis.speak(utterance);
  };
  function reply(text) {
    const normalized = text.toLocaleLowerCase("fr").normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    if (/bonjour|salut|coucou|hello/.test(normalized)) return "Bonjour ! Je suis là pour construire ton projet WarLike Heart. ♥";
    if (/qui es.tu|ton nom|tu es qui/.test(normalized)) return "Je suis WarLike Heart, un personnage d'assistante virtuelle. Pour l'instant, ce site est une interface de démonstration sans IA connectée.";
    if (/raspberry|materiel|appareil/.test(normalized)) return "La cible prévue est un Raspberry Pi 5. Il reste à installer un service audio, un moteur de dialogue et l'avatar officiel.";
    if (/voix|parler|micro/.test(normalized)) return "Active la lecture vocale ci-dessous et essaie « Dicter ». Les fonctions disponibles dépendent de ton navigateur et de ses autorisations.";
    if (/sauvegard|memoire|export/.test(normalized)) return "Clique sur « Exporter JSON » pour conserver cette conversation. Le stockage local est facultatif et désactivé par défaut.";
    return "J'ai reçu ton message. Ce prototype ne génère pas encore de réponses IA. On pourra connecter un moteur conversationnel autorisé dans une prochaine version.";
  }
  function append(role,text) {
    history.push({role,text}); history=history.slice(-MAX); render(); persist();
  }
  $("chatForm").addEventListener("submit",ev => {
    ev.preventDefault(); const field=$("message"); const text=field.value.trim(); if(!text) return;
    stopVoice(); append("user",text); field.value="";
    const answer=reply(text); append("assistant",answer); speak(answer);
  });
  $("voiceEnabled").addEventListener("change",ev => {state.voiceEnabled=ev.target.checked; if(!state.voiceEnabled) stopVoice();persist();});
  $("remember").addEventListener("change",ev => {state.remember=ev.target.checked;persist();status(state.remember?"Stockage local activé.":"Stockage local désactivé et ancienne copie supprimée.");});
  $("stop").addEventListener("click",() => {stopVoice();if(recognition){recognition.abort();recognition=null;}status("Voix arrêtée.");});
  $("listen").addEventListener("click",() => {
    const Engine=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!Engine){status("Reconnaissance vocale non prise en charge par ce navigateur.");return;}
    if(recognition){recognition.abort();recognition=null;}
    const rec=new Engine(); recognition=rec;rec.lang="fr-FR";rec.interimResults=false;rec.maxAlternatives=1;
    rec.onresult=ev=>{if(ev.results?.[0]?.[0]?.transcript){$("message").value=ev.results[0][0].transcript;$("message").focus();status("Dictée insérée. Appuie sur Envoyer pour confirmer.");}};
    rec.onerror=ev=>status("Microphone : "+ev.error+". Vérifie l'autorisation et la connexion.");
    rec.onend=()=>{if(recognition===rec)recognition=null;};
    try{rec.start();status("Écoute en cours…");}catch{status("Impossible de démarrer la dictée.");}
  });
  $("export").addEventListener("click",()=>{
    const json=JSON.stringify({format:"warlike-heart-conversation",version:1,exportedAt:new Date().toISOString(),history,settings:{voiceEnabled:state.voiceEnabled}},null,2);
    const blob=new Blob([json],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");
    a.href=url;a.download="warlike-heart-conversation.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);status("Export JSON préparé.");
  });
  $("import").addEventListener("click",()=>$("importFile").click());
  $("importFile").addEventListener("change",async ev=>{
    const file=ev.target.files?.[0];ev.target.value="";if(!file)return;
    if(file.size>1024*1024){status("Fichier trop volumineux (maximum 1 Mo).");return;}
    try {const data=JSON.parse(await file.text());if(data.format!=="warlike-heart-conversation"||data.version!==1)throw Error("format");
      const imported=safeHistory(data.history);if(!imported||!imported.length)throw Error("content");
      history=imported;stopVoice();render();persist();status("Conversation importée depuis le fichier.");
    }catch{status("Import impossible : format ou contenu non valide.");}
  });
  $("clear").addEventListener("click",()=>{
    stopVoice();history=[welcome];render();
    state.remember=false;$("remember").checked=false;
    try{localStorage.removeItem(KEY);}catch{}
    status("Conversation et stockage local effacés.");
  });
  try {
    const stored=JSON.parse(localStorage.getItem(KEY)||"null");
    if(stored?.remember===true){const h=safeHistory(stored.history);if(h?.length){history=h;state.remember=true;$("remember").checked=true;}}
    if(state.remember&&typeof stored.voiceEnabled==="boolean"){state.voiceEnabled=stored.voiceEnabled;$("voiceEnabled").checked=state.voiceEnabled;}
  }catch{status("Aucune sauvegarde locale valide.");}
  render();
})();
