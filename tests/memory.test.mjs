import test from "node:test";
import assert from "node:assert/strict";
import {onRequestGet,onRequestPut,onRequestDelete,normalizeSnapshot} from "../functions/api/memory.js";
import {onRequestPost as pair} from "../functions/api/account.js";
const origin="https://heart.example";
const baseEnv={HEART_SESSION_SECRET:"very-long-private-heart-session-secret-for-integration-tests"};
const sample={version:1,history:[{role:"user",text:"Salut"}],memories:["J'aime le code"],learning:{version:1,dialogues:[{question:"Salut",answer:"Coucou"}],knowledge:[{subject:"WarLike",content:"Moteur de jeux"}]}};
function fakeD1(){
 const saved=new Map();
 return {prepare(sql){
  let args=[];
  return {bind(...input){args=input;return this;},async first(){
   if(sql.startsWith("SELECT revision")){const row=saved.get(args[0]);return row||null;}
   if(sql.startsWith("INSERT INTO heart_snapshots")){
    const [id,content,updatedAt,expected]=args,old=saved.get(id);
    if(old&&old.revision!==expected)return null;
    const revision=old?old.revision+1:1;
    saved.set(id,{revision,content,updated_at:updatedAt});
    return {revision};
   }
   if(sql.startsWith("DELETE FROM heart_snapshots")){
    const [id,expected]=args,old=saved.get(id);
    if(!old||old.revision!==expected)return null;
    saved.delete(id);return {member_id:id};
   }
   throw Error("Unexpected SQL");
  }};
 }};
}
async function tokenFor(name){
 const original=globalThis.fetch;
 globalThis.fetch=async()=>new Response(JSON.stringify({user:{id:"WL-"+name,name,role:"member"}}),{status:200});
 try{
  const request=new Request(origin+"/api/account",{method:"POST",headers:{"origin":origin,"content-type":"application/json"},body:JSON.stringify({code:"a".repeat(43),verifier:"b".repeat(43)})});
  const response=await pair({request,env:{...baseEnv,WARLIKE_SERVER:{fetch:r=>globalThis.fetch(r)}}});
  assert.equal(response.status,200);
  return response.headers.get("set-cookie").split(";")[0];
 }finally{globalThis.fetch=original;}
}
const get=(cookie,db)=>onRequestGet({request:new Request(origin+"/api/memory",{headers:cookie?{cookie}:{}}),env:{...baseEnv,HEART_DB:db}});
const put=(cookie,db,expectedRevision,snapshot=sample,headers={})=>onRequestPut({
 request:new Request(origin+"/api/memory",{method:"PUT",headers:{"origin":origin,"content-type":"application/json",cookie,...headers},body:JSON.stringify({expectedRevision,snapshot})}),
 env:{...baseEnv,HEART_DB:db}
});
const del=(cookie,db,expectedRevision)=>onRequestDelete({
 request:new Request(origin+"/api/memory",{method:"DELETE",headers:{"origin":origin,"content-type":"application/json",cookie},body:JSON.stringify({expectedRevision})}),
 env:{...baseEnv,HEART_DB:db}
});
test("rejects malformed snapshots, avoids data truncation",()=>{
 assert.equal(normalizeSnapshot(null),null);
 assert.equal(normalizeSnapshot({...sample,history:[{role:"admin",text:"no"}]}),null);
 assert.equal(normalizeSnapshot({...sample,memories:["x".repeat(301)]}),null);
 assert.equal(normalizeSnapshot(sample).learning.dialogues[0].answer,"Coucou");
});
test("no cloud memory access without a signed account",async()=>{
 const db=fakeD1();
 assert.equal((await get("",db)).status,401);
 assert.equal((await put("",db,0)).status,401);
});
test("snapshots are isolated per account with optimistic conflicts and deletion",async()=>{
 const db=fakeD1(),alice=await tokenFor("ALICE"),bob=await tokenFor("BOB");
 const save=await put(alice,db,0);
 assert.equal(save.status,200);assert.equal((await save.json()).revision,1);
 assert.equal((await (await get(alice,db)).json()).snapshot.memories[0],"J'aime le code");
 assert.equal((await (await get(bob,db)).json()).snapshot,null);
 assert.equal((await put(alice,db,0)).status,409);
 assert.equal((await del(bob,db,1)).status,409);
 assert.equal((await (await get(alice,db)).json()).revision,1);
 assert.equal((await del(alice,db,1)).status,200);
 assert.equal((await (await get(alice,db)).json()).snapshot,null);
});
test("rejects cross-site writes and oversized payloads",async()=>{
 const db=fakeD1(),cookie=await tokenFor("EVE");
 assert.equal((await put(cookie,db,0,sample,{"origin":"https://attacker.example"})).status,403);
 const veryBig={...sample,history:[{role:"user",text:"a".repeat(4001)}]};
 assert.equal((await put(cookie,db,0,veryBig)).status,400);
});
