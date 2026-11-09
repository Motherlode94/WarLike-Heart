/* WarLike Heart · local demo + optional authenticated Cloudflare AI */
"use strict";
(() => {
  const $ = id => document.getElementById(id);
  const KEY = "warlike-heart-demo-v1"; // keep compatibility with v0.2 history
  const MAX = 100;
  const welcome = {role:"assistant",text:"Bonjour ! Je suis le prototype local de WarLike Heart. Tu peux écrire, essayer la voix ou exporter notre conversation. Les réponses sont des démonstrations : aucun modèle IA n'est encore connecté."};
  let history = [welcome];
  let recognition = null;
  let busy = false;
  let portraitObjectUrl = null;
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
    window.WarLikeHeart3D?.setSpeaking(false);
  };
  const speak = (text) => {
    if (!state.voiceEnabled) return;
    if (!("speechSynthesis" in window)) { status("Synthèse vocale non prise en charge ici."); return; }
    stopVoice();
    const utterance = new SpeechSynthesisUtterance(text); utterance.lang = "fr-FR"; utterance.rate = 1; utterance.pitch = 1;
    utterance.onstart = () => {$("portrait").classList.add("speaking");window.WarLikeHeart3D?.setSpeaking(true);};
    utterance.onend = utterance.onerror = () => {$("portrait").classList.remove("speaking");window.WarLikeHeart3D?.setSpeaking(false);};
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
  $("chatForm").addEventListener("submit",async ev => {
    ev.preventDefault();
    const field=$("message"); const text=field.value.trim();
    if (!text || busy) return;
    busy=true; const sendButton=$("chatForm").querySelector("button[type=submit]");
    sendButton.disabled=true; field.disabled=true;
    stopVoice();append("user",text);field.value="";
    const token=$("accessToken").value.trim();
    let answer;
    if (!token) {
      answer=reply(text);
      $("apiStatus").textContent="Mode démo : aucun jeton saisi.";
      $("aiMode").textContent="Mode démo · IA non configurée";
    } else {
      $("apiStatus").textContent="Connexion au modèle IA…";
      $("aiMode").textContent="Mode IA · connexion privée";
      const controller=new AbortController();
      const timeout=setTimeout(()=>controller.abort(),30000);
      try {
        const result=await fetch("/api/chat", {
          method:"POST",
          credentials:"same-origin",
          headers:{"content-type":"application/json","authorization":"Bearer "+token},
          body:JSON.stringify({messages:history.filter(m=>["user","assistant"].includes(m.role)).slice(-20)}),
          signal:controller.signal,
          cache:"no-store"
        });
        const data=await result.json().catch(()=>({}));
        if(!result.ok||typeof data.reply!=="string") throw Error(data.error||"Serveur indisponible.");
        answer=data.reply;
        $("apiStatus").textContent="Connectée au moteur IA pour cette réponse.";
      } catch(error) {
        answer="La réponse IA n'a pas pu être obtenue : "+(error.name==="AbortError"?"délai dépassé.":error.message)+" Tu peux réessayer ou retirer le jeton pour utiliser le mode démo.";
        $("apiStatus").textContent="Connexion IA en erreur.";
        status("Le serveur IA n'a pas répondu.");
      } finally {clearTimeout(timeout);}
    }
    append("assistant",answer);
    if(window.WarLikeHeart3D){const l=answer.toLowerCase();const next=/heureuse|content|bonjour|plaisir|♥|❤️/.test(l)?"happy":/désol|erreur|impossible/.test(l)?"sad":(/pourquoi|comment/.test(l)||l.includes("?"))?"curious":"neutral";window.WarLikeHeart3D.setMood(next);}
    // Do not speak technical error messages.
    if($("apiStatus").textContent==="Connectée au moteur IA pour cette réponse." || !token) speak(answer);
    busy=false;sendButton.disabled=false;field.disabled=false;field.focus();
  });
  $("threeMode").addEventListener("click",()=> $("modelFile").click());
  $("modelFile").addEventListener("change",async ev=>{
    const file=ev.target.files?.[0];ev.target.value="";
    if(!file)return;
    if(!window.WarLikeHeart3D){status("La visionneuse 3D n'est pas disponible. Vérifie WebGL et l'accès au module Three.js.");return;}
    status("Chargement et vérification du véritable modèle GLB…");
    try{
      const result=await window.WarLikeHeart3D.loadGLB(file);
      $("portrait").classList.add("is3d");
      $("heart3d").classList.add("active");
      status("Modèle GLB chargé : "+result.animations+" animations, "+result.morphTargets+" cibles d'expressions. Le rendu n'est pas une validation de ressemblance.");
    }catch(error){
      status("Modèle 3D non chargé : "+error.message);
    }
  });
  $("checkServer").addEventListener("click",async()=>{
    const btn=$("checkServer");btn.disabled=true;$("serverStatus").textContent="Vérification de la disponibilité…";
    try{
      const r=await fetch("/api/server-status",{cache:"no-store"});
      if(!r.ok)throw Error("Diagnostic indisponible");
      const data=await r.json();
      $("serverStatus").textContent=(data.serverHealthy?"API de santé accessible. ":"Serveur non opérationnel ou indisponible. ")+"Aucun compte authentifié.";
    }catch{$("serverStatus").textContent="Diagnostic non disponible : déployer les fonctions Cloudflare Pages. Aucun compte connecté.";}
    finally{btn.disabled=false;}
  });
  document.addEventListener("warlike-heart-3d-ready",()=>{
    status("Visionneuse GLB disponible. Aucun modèle officiel n'est encore importé.");
  });
  // The original portrait is the canonical fallback if the asset is in this repository.
  const officialPortrait=$("officialPortrait");
  if(officialPortrait){
    const portraitReady=()=>{
      if(!officialPortrait.naturalWidth)return;
      officialPortrait.hidden=false;
      $("portrait").classList.add("has-image");
      $("portrait").classList.remove("is3d");
      $("heart3d").classList.remove("active");
      status("Portrait officiel affiché.");
    };
    officialPortrait.addEventListener("load",portraitReady);
    officialPortrait.addEventListener("error",()=>status("Image officielle absente du dépôt : charge le portrait validé ou ajoute assets/portrait-officiel.webp sur GitHub."));
    if(officialPortrait.complete && officialPortrait.naturalWidth)portraitReady();
  }
  $("pickPortrait").addEventListener("click",()=> $("portraitFile").click());
  $("portraitFile").addEventListener("change",ev=>{
    const file=ev.target.files?.[0];ev.target.value="";
    if(!file)return;
    if(!["image/jpeg","image/png","image/webp"].includes(file.type) || file.size>5*1024*1024){
      status("Portrait refusé : utilise JPG, PNG ou WebP, 5 Mo maximum.");return;
    }
    if(portraitObjectUrl) URL.revokeObjectURL(portraitObjectUrl);
    portraitObjectUrl=URL.createObjectURL(file);
    const area=$("portrait");
    let img=area.querySelector("img");
    if(!img){img=document.createElement("img");img.alt="Portrait personnalisé de WarLike Heart";area.appendChild(img);}
    if(officialPortrait)officialPortrait.hidden=true;
    img.src=portraitObjectUrl;
    area.classList.add("has-image");
    area.classList.remove("is3d");$("heart3d").classList.remove("active");
    status("Portrait chargé pour cette session. Cette image reste sur ton appareil, sans envoi au serveur.");
  });
  $("accessToken").addEventListener("input",()=>{
    const connected=Boolean($("accessToken").value.trim());
    $("aiMode").textContent=connected?"Mode IA demandé · vérifier la connexion":"Mode démo · réponses prédéfinies";
    $("apiStatus").textContent=connected?"Jeton présent en mémoire ; une requête sera envoyée au prochain message.":"Le mode démo reste accessible sans jeton.";
  });
  $("voiceEnabled").addEventListener("change",ev => {state.voiceEnabled=ev.target.checked; if(!state.voiceEnabled) stopVoice();persist();});
  $("remember").addEventListener("change",ev => {state.remember=ev.target.checked;persist();status(state.remember?"Stockage local activé.":"Stockage local désactivé et ancienne copie supprimée.");});
  $("stop").addEventListener("click",() => {stopVoice();if(recognition){recognition.abort();recognition=null;}$("portrait").classList.remove("listening");status("Voix arrêtée.");});
  $("listen").addEventListener("click",() => {
    const Engine=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!Engine){status("Reconnaissance vocale non prise en charge par ce navigateur.");return;}
    if(recognition){recognition.abort();recognition=null;}
    const rec=new Engine(); recognition=rec;rec.lang="fr-FR";rec.interimResults=false;rec.maxAlternatives=1;
    rec.onresult=ev=>{if(ev.results?.[0]?.[0]?.transcript){$("message").value=ev.results[0][0].transcript;$("message").focus();status("Dictée insérée. Appuie sur Envoyer pour confirmer.");}};
    rec.onerror=ev=>status("Microphone : "+ev.error+". Vérifie l'autorisation et la connexion.");
    rec.onend=()=>{if(recognition===rec)recognition=null;$("portrait").classList.remove("listening");window.WarLikeHeart3D?.setListening(false);};
    try{rec.start();window.WarLikeHeart3D?.setListening(true);$("portrait").classList.add("listening");status("Écoute en cours…");}catch{status("Impossible de démarrer la dictée.");}
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
