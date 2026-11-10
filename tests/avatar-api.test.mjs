import test from "node:test";
import assert from "node:assert/strict";
import {onRequestGet,onRequestPut,onRequestDelete,inspectGlb} from "../functions/api/avatar.js";
import {onRequestPost as linkAccount} from "../functions/api/account.js";
const origin="https://heart.example";
const secret="heart-private-secret-for-test-that-is-long-enough";
const glb=()=>{
 const b=new ArrayBuffer(20),d=new DataView(b);
 d.setUint32(0,0x46546c67,true);d.setUint32(4,2,true);d.setUint32(8,20,true);d.setUint32(12,4,true);d.setUint32(16,0x4e4f534a,true);return b;
};
const mockBucket=()=>{
 let stored=null;
 return {
  async get(){return stored&&{body:stored,size:stored.byteLength,httpEtag:'"etag"'};},
  async put(_,bytes){stored=bytes;},
  async delete(){stored=null;}
 };
};
async function cookie(role){
 const saved=globalThis.fetch;
 globalThis.fetch=async()=>new Response(JSON.stringify({user:{id:"test-"+role,name:"Test",role}}),{status:200});
 try{
  const req=new Request(origin+"/api/account",{method:"POST",headers:{"origin":origin,"content-type":"application/json"},body:JSON.stringify({code:"a".repeat(43),verifier:"b".repeat(43)})});
  const res=await linkAccount({request:req,env:{HEART_SESSION_SECRET:secret,WARLIKE_SERVER:{fetch:globalThis.fetch}}});
  assert.equal(res.status,200);
  return res.headers.get("set-cookie").split(";")[0];
 }finally{globalThis.fetch=saved;}
}
function context(bucket,roleCookie,method,body=undefined,headers={}){
 const request=new Request(origin+"/api/avatar",{method,headers:{"origin":origin,"content-type":"model/gltf-binary",cookie:roleCookie||"",...headers},body});
 return {request,env:{HEART_AVATARS:bucket,HEART_SESSION_SECRET:secret}};
}
test("only valid GLB 2.0 header and length accepted",()=>{
 assert.equal(inspectGlb(glb()),true);
 const wrong=glb();new DataView(wrong).setUint32(8,21,true);
 assert.equal(inspectGlb(wrong),false);assert.equal(inspectGlb(new ArrayBuffer(2)),false);
});
test("public read is empty before publication; anonymous and member cannot modify",async()=>{
 const bucket=mockBucket();
 assert.equal((await onRequestGet({env:{HEART_AVATARS:bucket}})).status,404);
 assert.equal((await onRequestPut(context(bucket,"","PUT",glb()))).status,403);
 const member=await cookie("member");
 assert.equal((await onRequestPut(context(bucket,member,"PUT",glb()))).status,403);
 assert.equal((await onRequestDelete(context(bucket,member,"DELETE"))).status,403);
});
test("owner may upload, anyone may view, owner may remove",async()=>{
 const bucket=mockBucket(),owner=await cookie("owner");
 const uploaded=await onRequestPut(context(bucket,owner,"PUT",glb()));
 assert.equal(uploaded.status,200);
 assert.equal((await uploaded.json()).size,20);
 const publicRes=await onRequestGet({env:{HEART_AVATARS:bucket}});
 assert.equal(publicRes.status,200);
 assert.equal(publicRes.headers.get("content-type"),"model/gltf-binary");
 assert.equal((await publicRes.arrayBuffer()).byteLength,20);
 assert.equal((await onRequestDelete(context(bucket,owner,"DELETE"))).status,200);
 assert.equal((await onRequestGet({env:{HEART_AVATARS:bucket}})).status,404);
});
test("cross-origin uploads are rejected",async()=>{
 const bucket=mockBucket(),owner=await cookie("owner");
 assert.equal((await onRequestPut(context(bucket,owner,"PUT",glb(),{"origin":"https://bad.example"}))).status,403);
});
