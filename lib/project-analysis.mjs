import {appCapabilities} from './app-capabilities.mjs';
const norm=s=>String(s??'').normalize('NFKC').toLowerCase();
export function projectAnalysis(goals){
 const apps=appCapabilities().sort((a,b)=>b.id.length-a.id.length);
 const groups=new Map(apps.map(a=>[a.id,[]]));const unassigned=[];
 for(const g of goals){const title=norm(g.title);const match=apps.find(a=>new RegExp('(?:^|[^a-z0-9])warlike[ -]'+a.id+'(?:$|[^a-z0-9])').test(title));const item={id:g.id,title:g.title,status:g.status,total:g.steps.length,done:g.steps.filter(s=>s.done).length};if(match)groups.get(match.id).push(item);else unassigned.push(item);}
 return {projects:apps.map(a=>({id:a.id,goals:groups.get(a.id),remoteVerified:false})),unassigned,method:'explicit-warlike-title',source:'account-goals',liveRepositoryAudit:false};
}
