// Only fixed GitHub GET operations against explicitly configured repositories.
export async function inspectPullRequests(env,name,fetcher=fetch){
 if(typeof name!=='string'||!/^[A-Za-z0-9_.-]{1,100}$/.test(name)||name==='.'||name==='..'||!String(env.HEART_GITHUB_REPOS||'').split(',').map(x=>x.trim()).includes(name)||!env.HEART_GITHUB_TOKEN)throw Error('Repository not authorized');
 const response=await fetcher('https://api.github.com/repos/Motherlode94/'+encodeURIComponent(name)+'/pulls?state=open&per_page=30&sort=updated&direction=desc',{headers:{authorization:'Bearer '+env.HEART_GITHUB_TOKEN,accept:'application/vnd.github+json','user-agent':'WarLike-Heart'},redirect:'error',signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw Error('GitHub unavailable');const data=await response.json();if(!Array.isArray(data))throw Error('Invalid GitHub response');
 return data.slice(0,30).map(p=>({number:p.number,title:String(p.title??'').slice(0,200),state:p.state,draft:p.draft===true,updatedAt:p.updated_at,headSha:p.head?.sha,base:p.base?.ref,url:'https://github.com/Motherlode94/'+name+'/pull/'+p.number})).filter(p=>Number.isSafeInteger(p.number)&&p.number>0);
}
