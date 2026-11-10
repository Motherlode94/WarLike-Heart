import test from "node:test";
import assert from "node:assert/strict";
import {onRequestGet,onRequestPost,onRequestDelete} from "../functions/api/account.js";
const origin="https://heart.example";
const env={HEART_SESSION_SECRET:"a-long-private-signing-secret-with-at-least-32-characters",WARLIKE_SERVER:{fetch:(request)=>globalThis.fetch(request)}};
const req=(path="",options={})=>new Request(origin+"/api/account"+path,options);
const code="c".repeat(43),verifier="v".repeat(43);
test("unconfigured secret fails closed",async()=>{
 const r=await onRequestGet({request:req(),env:{}});
 assert.equal((await r.json()).available,false);
 const request=req("",{method:"POST",headers:{"origin":origin,"content-type":"application/json"},body:JSON.stringify({code,verifier})});
 assert.equal((await onRequestPost({request,env:{}})).status,503);
});
test("cross-origin and malformed pairing are rejected",async()=>{
 let request=req("",{method:"POST",headers:{"origin":"https://evil.test","content-type":"application/json"},body:JSON.stringify({code,verifier})});
 assert.equal((await onRequestPost({request,env})).status,403);
 request=req("",{method:"POST",headers:{"origin":origin,"content-type":"application/json"},body:JSON.stringify({code:"bad",verifier})});
 assert.equal((await onRequestPost({request,env})).status,400);
});
test("session cookie is HttpOnly, signed and temporary",async t=>{
 const previous=globalThis.fetch;
 globalThis.fetch=async()=>new Response(JSON.stringify({user:{id:"WL-ALICE",name:"Alice",role:"member"}}),{status:200});
 t.after(()=>{globalThis.fetch=previous;});
 const request=req("",{method:"POST",headers:{"origin":origin,"content-type":"application/json"},body:JSON.stringify({code,verifier})});
 const response=await onRequestPost({request,env});
 assert.equal(response.status,200);
 const cookie=response.headers.get("set-cookie");
 assert.match(cookie,/HttpOnly/);assert.match(cookie,/Secure/);assert.match(cookie,/SameSite=Lax/);assert.match(cookie,/Max-Age=600/);
 const active=await onRequestGet({request:req("",{headers:{"cookie":cookie.split(";")[0]}}),env});
 assert.equal((await active.json()).user.name,"Alice");
 const cleared=await onRequestDelete({request:req("",{method:"DELETE",headers:{"origin":origin}})});
 assert.match(cleared.headers.get("set-cookie"),/Max-Age=0/);
});

test("pairing is unavailable without the internal Cloudflare binding",async()=>{
 const request=req("",{method:"POST",headers:{"origin":origin,"content-type":"application/json"},body:JSON.stringify({code,verifier})});
 const response=await onRequestPost({request,env:{HEART_SESSION_SECRET:env.HEART_SESSION_SECRET}});
 assert.equal(response.status,503);
 assert.match((await response.json()).error,/liaison/i);
});
