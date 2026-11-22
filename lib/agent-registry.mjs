import {pluginActions} from './plugin-gateway.mjs';
export const connectors=Object.freeze([
 {id:'github',label:'GitHub'},{id:'cloudflare',label:'Cloudflare'},{id:'meshy',label:'Meshy 3D'},{id:'heygen',label:'HeyGen'},{id:'fal',label:'fal'},{id:'canva',label:'Canva'},{id:'netlify',label:'Netlify'},{id:'base44',label:'Base44'},{id:'plugin-creator',label:'Plugin Creator'}
].map(x=>Object.freeze({...x,available:false,reason:'External adapter not connected'})));
export const actions=Object.freeze(['heart.goal.inspect','heart.memory.search',...pluginActions]);
export function validateTask(d){
 const valid=typeof d?.query==='string'&&d.query.trim().length>0&&d.query.length<=160;
 if(!actions.includes(d?.action)||!valid)return null;
 return {action:d.action,query:d.query.trim()};
}
