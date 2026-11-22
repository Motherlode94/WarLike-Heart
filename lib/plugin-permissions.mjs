import {pluginActions} from './plugin-gateway.mjs';
export const permissionKinds=Object.freeze(['read','diagnostic','create','update','delete','publish','spend']);
export function supportedPermission(action,kind){return pluginActions.includes(action)&&['read','diagnostic'].includes(kind);}
export async function readPermissions(db,owner){
 const rows=await db.prepare('SELECT action,permission FROM heart_plugin_permissions WHERE member_id=? AND granted=1').bind(owner).all();
 return Object.fromEntries(pluginActions.map(a=>[a,Object.fromEntries(permissionKinds.map(k=>[k,supportedPermission(a,k)&&rows.results.some(r=>r.action===a&&r.permission===k)]))]));
}
export async function setPermission(db,owner,role,action,kind,granted,now){
 if(role!=='owner'||!supportedPermission(action,kind)||typeof granted!=='boolean')return false;
 await db.prepare('INSERT INTO heart_plugin_permissions(member_id,action,permission,granted,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(member_id,action,permission) DO UPDATE SET granted=excluded.granted,updated_at=excluded.updated_at').bind(owner,action,kind,Number(granted),now).run();
 return true;
}
