import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const html=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
const js=fs.readFileSync(new URL("../navigation.js",import.meta.url),"utf8");
const css=fs.readFileSync(new URL("../navigation.css",import.meta.url),"utf8");
test("one main navigation with separate views",()=>{
 for(const view of ["home","account","brain","cloud","studio"])assert.match(html,new RegExp('data-(?:nav|view)="'+view+'"'));
 assert.match(html,/id="homeView" data-view="home"/);
 for(const view of ["brain","cloud","studio"])assert.match(html,new RegExp('data-view="'+view+'" hidden'));
 assert.match(html,/data-access="operator" hidden/);
 assert.match(html,/data-access="member" hidden/);
});
test("navigation verifies server identity and role",()=>{
 assert.match(js,/fetch\("\/api\/account"/);
 assert.match(js,/roles\.has\(account\.role\)/);
 assert.match(js,/if\(!allowed\(view\)\)/);
 assert.match(js,/warlike-heart-account-updated/);
});
test("sensitive backend stays separately protected",()=>{
 const memory=fs.readFileSync(new URL("../functions/api/memory.js",import.meta.url),"utf8");
 const chat=fs.readFileSync(new URL("../functions/api/chat.js",import.meta.url),"utf8");
 assert.match(memory,/authenticatedHeartUser/);
 assert.match(memory,/sameOrigin\(request\)/);
 assert.match(chat,/HEART_ACCESS_TOKEN/);
});
test("CSS retains hidden and responsive behavior",()=>{
 assert.match(css,/\[hidden\]\{display:none!important\}/);
 assert.match(css,/@media\(max-width:720px\)/);
 assert.match(html,/navigation\.js\?v=1\.3/);
});
