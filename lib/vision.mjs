export const MAX_IMAGE_BYTES=4*1024*1024;
export const IMAGE_TYPES=['image/png','image/jpeg','image/webp'];
export function validateImage(mime,bytes){
 if(!IMAGE_TYPES.includes(mime)||!(bytes instanceof Uint8Array)||bytes.length<12||bytes.length>MAX_IMAGE_BYTES)return false;
 if(mime==='image/png')return [137,80,78,71,13,10,26,10].every((x,i)=>bytes[i]===x);
 if(mime==='image/jpeg')return bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 return String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
}
export function imageDataUrl(mime,bytes){
 if(!validateImage(mime,bytes))throw Error('Image invalide');
 let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
 return 'data:'+mime+';base64,'+btoa(binary);
}
