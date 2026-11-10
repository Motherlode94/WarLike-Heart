/* Public read-only avatar space: genuine 3D viewer for uploaded GLB.
   Uses the existing scene/renderer; never publishes model uploads.
   A 2D official portrait is clearly labeled when no GLB is installed. */
(() => {
  "use strict";
  const $=id=>document.getElementById(id);
  const stage=$("spaceStage"),target=$("avatarSpaceCanvas");
  if(!stage||!target)return;
  const status=$("spaceStatus"),fallback=$("spacePortraitFallback"),portrait=$("spacePortrait");
  const names=["spaceTurn","spaceZoomIn","spaceZoomOut","spaceReset","spaceFace","spaceBody","spaceIdle","spaceFull"];
  const btns=Object.fromEntries(names.map(name=>[name,$(name)]));
  let auto=false,idle=true,active=false,remoteChecked=false,remoteLoading=false;
  const loadPublished=async(force=false)=>{
    const viewer=api();
    if(!viewer||remoteLoading||(!force&&(remoteChecked||viewer.isModelLoaded?.())))return;
    remoteChecked=true;remoteLoading=true;
    status.textContent="Recherche du modèle officiel sur WarLike Heart…";
    try{
      const found=await viewer.loadPublishedGLB();
      update();
      if(!found)status.textContent="Modèle 3D non encore publié. Le portrait 2D reste affiché.";
    }catch(e){update();status.textContent="Chargement du modèle 3D indisponible : "+(e?.message||"erreur réseau");}
    finally{remoteLoading=false;}
  };
  const api=()=>window.WarLikeHeart3D;
  // Mirror the public official portrait as a 2D placeholder, never as a faux 3D mesh.
  const original=$("officialPortrait");
  if(original?.getAttribute("src"))portrait.src=original.getAttribute("src");
  portrait.addEventListener("error",()=>{portrait.hidden=true;});
  const update=()=>{
    const viewer=api(),loaded=Boolean(viewer?.isModelLoaded?.());
    fallback.hidden=loaded;
    status.textContent=!viewer
      ?"Visionneuse WebGL indisponible sur cet appareil."
      :loaded?"Modèle 3D chargé · tu peux faire pivoter la caméra et changer le cadrage."
      :"Aucun GLB officiel installé. L'image affichée est un portrait 2D, pas un avatar 3D riggé.";
    for(const name of ["spaceZoomIn","spaceZoomOut","spaceReset","spaceFace","spaceBody","spaceIdle","spaceTurn"]){
      btns[name].disabled=!viewer||!loaded;
    }
    btns.spaceFull.disabled=!stage.requestFullscreen;
  };
  const syncMount=(view)=>{
    active=view==="space3d";
    if(active){api()?.mountInto?.(target);void loadPublished();}
    else api()?.restoreMount?.();
    update();
  };
  document.addEventListener("warlike-heart-view-changed",e=>syncMount(e.detail?.view));
  document.addEventListener("warlike-heart-3d-ready",()=>syncMount(active?"space3d":location.hash==="#space3d"?"space3d":"home"));
  document.addEventListener("warlike-heart-avatar-loaded",update);
  document.addEventListener("warlike-heart-avatar-published",()=>{remoteChecked=false;void loadPublished(true);});
  btns.spaceTurn.addEventListener("click",()=>{
    auto=!auto;api()?.setAutoRotate?.(auto);
    btns.spaceTurn.setAttribute("aria-pressed",String(auto));
    btns.spaceTurn.textContent=auto?"↻ Rotation active":"↻ Rotation auto";
  });
  btns.spaceZoomIn.addEventListener("click",()=>api()?.zoom?.(1));
  btns.spaceZoomOut.addEventListener("click",()=>api()?.zoom?.(-1));
  btns.spaceReset.addEventListener("click",()=>api()?.resetView?.());
  btns.spaceFace.addEventListener("click",()=>api()?.frame?.("face"));
  btns.spaceBody.addEventListener("click",()=>api()?.frame?.("full"));
  btns.spaceIdle.addEventListener("click",()=>{
    idle=!idle;api()?.setAnimationEnabled?.(idle);
    btns.spaceIdle.setAttribute("aria-pressed",String(idle));
    btns.spaceIdle.textContent=idle?"Animation idle":"Animation arrêtée";
  });
  btns.spaceFull.addEventListener("click",async()=>{
    try {
      if(document.fullscreenElement)await document.exitFullscreen();
      else await stage.requestFullscreen();
    }catch{status.textContent="Le mode plein écran est indisponible sur ce navigateur.";}
  });
  update();
  if(location.hash==="#space3d")syncMount("space3d");
})();