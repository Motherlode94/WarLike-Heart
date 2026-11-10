import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {saveLocalAvatar,readLocalAvatar,deleteLocalAvatar,MAX_AVATAR_BYTES,DB_NAME} from "../avatar-store.mjs";
test("private GLB storage has a 30 MiB size cap and descriptive database",()=>{
 assert.equal(MAX_AVATAR_BYTES,30*1024*1024);
 assert.match(DB_NAME,/warlike-heart/);
});
test("invalid files are rejected before any browser storage attempt",async()=>{
 await assert.rejects(saveLocalAvatar(null),/GLB/);
 await assert.rejects(saveLocalAvatar({name:"x.txt",size:32}),/GLB/);
 await assert.rejects(saveLocalAvatar({name:"x.glb",size:MAX_AVATAR_BYTES+1}),/GLB/);
});
test("storage fails without IndexedDB rather than claiming persistence",async()=>{
 await assert.rejects(readLocalAvatar(),/IndexedDB/);
 await assert.rejects(deleteLocalAvatar(),/IndexedDB/);
});
test("viewer restores local model before dispatching its ready event",()=>{
 const viewer=readFileSync(new URL("../avatar3d.js",import.meta.url),"utf8");
 const app=readFileSync(new URL("../app.js",import.meta.url),"utf8");
 const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
 assert.match(viewer,/await readLocalAvatar\(\)/);
 assert.match(viewer,/await api.loadGLB\(file,\{source:"local"\}\)/);
 assert.match(viewer,/finally\{document.dispatchEvent\(new Event\("warlike-heart-3d-ready"\)\)\}/);
 assert.match(app,/loadGLB\(file,\{rememberLocal:true\}\)/);
 assert.match(html,/id="forgetLocalAvatar"/);
 assert.match(html,/avatar3d\.js\?v=1\.6\.3/);
});
