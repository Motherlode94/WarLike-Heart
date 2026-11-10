import test from "node:test";
import assert from "node:assert/strict";
import {onRequestPost,normalizeResults} from "../functions/api/research.js";
import {onRequestPost as pair} from "../functions/api/account.js";
const origin="https://heart.example",secret="test-only-private-heart-signing-secret-more-than-32";
const db=()=>{
 const counts=new Map();
 return {prepare(sql){let args=[];return {bind(...values){args=values;return this;},async first(){
  if(!sql.startsWith("INSERT INTO heart_research_limits"))throw Error("Unexpected SQL");
  const key=args[0]+"|"+args[1],n=counts.get(key)||0;
  if(n>=args[2])return null;counts.set(key,n+1);return {hits:n+1};
 }};}};
};
const session=async()=>{
 const previous=globalThis.fetch;
 globalThis.fetch=async()=>new Response(JSON.stringify({user:{id:"WL-OWNER",name:"Owner",role:"owner"}}),{status:200});
 try{
  const request=new Request(origin+"/api/account",{method:"POST",headers:{"origin":origin,"content-type":"application/json"},body:JSON.stringify({code:"a".repeat(43),verifier:"b".repeat(43)})});
  const response=await pair({request,env:{HEART_SESSION_SECRET:secret,WARLIKE_SERVER:{fetch:r=>globalThis.fetch(r)}}});
  assert.equal(response.status,200);
  return response.headers.get("set-cookie").split(";")[0];
 }finally{globalThis.fetch=previous;}
};
const query=(cookie,storage,provider="wikipedia",q="WarLike Engine",extra={})=>onRequestPost({
 request:new Request(origin+"/api/research",{method:"POST",headers:{"origin":origin,"content-type":"application/json","cookie":cookie||"",...extra},body:JSON.stringify({provider,query:q})}),
 env:{HEART_SESSION_SECRET:secret,HEART_DB:storage}
});
test("no signed session = no outbound research",async()=>{
 assert.equal((await query("",db())).status,401);
});
test("rejects cross-origin and oversized queries",async()=>{
 const cookie=await session();
 assert.equal((await query(cookie,db(),"wikipedia","Recherche",{"origin":"https://evil.example"})).status,403);
 assert.equal((await query(cookie,db(),"wikipedia","x".repeat(241))).status,400);
});
test("Wikipedia sources are sanitized and require no paid API key",async t=>{
 const cookie=await session(),storage=db(),saved=globalThis.fetch;
 t.after(()=>{globalThis.fetch=saved;});
 globalThis.fetch=async request=>{
  assert.match(String(request),"^https://fr.wikipedia.org/w/rest.php/v1/search/page");
  return new Response(JSON.stringify({pages:[{title:"<b>Paris</b>",key:"Paris",description:"Ville française"}]}),{status:200,headers:{"content-type":"application/json"}});
 };
 const response=await query(cookie,storage,"wikipedia","Paris");
 assert.equal(response.status,200);
 const data=await response.json();
 assert.equal(data.sources[0].title,"Paris");
 assert.match(data.sources[0].url,/https:\/\/fr.wikipedia.org\/wiki\/Paris/);
 assert.equal(data.remaining,11);
 assert.equal(data.note.includes("automatiquement"),true);
});
test("Brave general search is disabled without a secret",async()=>{
 const cookie=await session();
 assert.equal((await query(cookie,db(),"brave","Unity WarLike")).status,503);
});
test("quota rejects the thirteenth research request",async t=>{
 const cookie=await session(),storage=db(),saved=globalThis.fetch;
 t.after(()=>{globalThis.fetch=saved;});
 globalThis.fetch=async()=>new Response(JSON.stringify({pages:[]}),{status:200});
 for(let i=0;i<12;i++)assert.equal((await query(cookie,storage,"wikipedia","Paris")).status,200);
 assert.equal((await query(cookie,storage,"wikipedia","Paris")).status,429);
});
test("rejects unsafe source protocols and strips HTML formatting",()=>{
 const x=normalizeResults("brave",{web:{results:[{title:"<b>Test</b>",description:"<script>ignore</script>texte",url:"javascript:alert(1)"},{title:"Correct",description:"Salut",url:"https://example.org/path"}]}});
 assert.equal(x.length,1);assert.equal(x[0].title,"Correct");
});
