import {searchMemories} from './cognitive-memory.mjs';
export async function chatContext(db,owner,query,now){
 const rows=await db.prepare("SELECT id,title,kind,content,source FROM heart_cognitive_memory WHERE member_id=? AND (expires_at IS NULL OR expires_at>?) ORDER BY updated_at DESC,id LIMIT 200").bind(owner,now).all();
 return searchMemories(rows.results,query.slice(0,160)).slice(0,5).map(r=>({id:r.id,title:r.title,kind:r.kind,excerpt:r.content.slice(0,400)}));
}
