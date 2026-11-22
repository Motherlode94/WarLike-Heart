export async function enabledPlugins(db,owner,configured){
 const rows=await db.prepare('SELECT plugin_id,enabled FROM heart_plugin_settings WHERE member_id=?').bind(owner).all();
 const enabled=new Set(rows.results.filter(x=>x.enabled===1).map(x=>x.plugin_id));
 return Object.fromEntries(Object.entries(configured).map(([id,value])=>[id,Boolean(value&&enabled.has(id))]));
}
export async function pluginAllowed(db,owner,role,configured,id){
 if(role!=='owner'||!Object.hasOwn(configured,id)||!configured[id])return false;
 const row=await db.prepare('SELECT enabled FROM heart_plugin_settings WHERE member_id=? AND plugin_id=?').bind(owner,id).first();
 return row?.enabled===1;
}
