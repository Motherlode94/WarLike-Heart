/* Private browser storage for an explicitly imported GLB. No server upload.
 * IndexedDB stores blobs (not base64/localStorage) up to the existing 30 MiB limit.
 * Data is per-browser and can be evicted by the browser or cleared by the user.
 */
export const DB_NAME="warlike-heart-local-avatar";
export const MAX_AVATAR_BYTES=30*1024*1024;
const STORE="model", KEY="current";
function dbOpen(){
 return new Promise((resolve,reject)=>{
  if(typeof indexedDB==="undefined")return reject(Error("IndexedDB indisponible."));
  const request=indexedDB.open(DB_NAME,1);
  request.onupgradeneeded=()=>request.result.createObjectStore(STORE);
  request.onerror=()=>reject(request.error||Error("Stockage navigateur inaccessible."));
  request.onsuccess=()=>resolve(request.result);
 });
}
async function transaction(mode,operation){
 const db=await dbOpen();
 try{
  return await new Promise((resolve,reject)=>{
   const tx=db.transaction(STORE,mode);
   const request=operation(tx.objectStore(STORE));
   let value;
   request.onsuccess=()=>{value=request.result;};
   request.onerror=()=>reject(request.error||Error("Opération IndexedDB refusée."));
   tx.oncomplete=()=>resolve(value);
   tx.onerror=()=>reject(tx.error||Error("Transaction IndexedDB échouée."));
   tx.onabort=()=>reject(tx.error||Error("Transaction IndexedDB annulée."));
  });
 }finally{db.close();}
}
export async function saveLocalAvatar(file){
 if(!file||typeof file.name!=="string"||!/\.glb$/i.test(file.name)||file.size<20||file.size>MAX_AVATAR_BYTES)
  throw Error("Un GLB valide de 30 Mo maximum est requis.");
 return transaction("readwrite",store=>store.put({name:file.name,blob:file,storedAt:Date.now()},KEY));
}
export async function readLocalAvatar(){
 const value=await transaction("readonly",store=>store.get(KEY));
 if(!value||typeof value.name!=="string"||!/\.glb$/i.test(value.name)||
   !value.blob||value.blob.size<20||value.blob.size>MAX_AVATAR_BYTES)return null;
 return new File([value.blob],value.name,{type:"model/gltf-binary"});
}
export async function deleteLocalAvatar(){
 return transaction("readwrite",store=>store.delete(KEY));
}
