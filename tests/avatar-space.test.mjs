import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const html=read("index.html"),nav=read("navigation.js"),scene=read("avatar3d.js"),space=read("avatar-space.js"),css=read("glamour-space.css");
test("public 3D tab is separate from private model import",()=>{
 assert.match(html,/data-nav="space3d"/);
 assert.match(html,/data-view="space3d" hidden/);
 assert.match(nav,/\["home","account","space3d"\]/);
 assert.match(html,/id="studioView"/);
 assert.match(nav,/roles\.has\(account\.role\)/);
 assert.match(html,/id="threeMode"/);
});
test("real OrbitControls and a single renderer are shared",()=>{
 assert.match(scene,/OrbitControls/);
 assert.match(scene,/mountInto\(target\)/);
 assert.match(scene,/restoreMount\(\)/);
 assert.match(space,/mountInto\?\./);
 assert.match(space,/restoreMount\?\./);
 assert.match(scene,/setAutoRotate/);
 assert.match(scene,/setAnimationEnabled/);
 assert.match(scene,/frame\(mode\)/);
});
test("no false claim of built-in official 3D model",()=>{
 assert.match(html,/Portrait officiel 2D — modèle GLB 3D non encore installé/);
 assert.match(space,/isModelLoaded/);
 assert.match(space,/fallback\.hidden=loaded/);
});
test("glamour theme includes mobile and full-screen states",()=>{
 assert.match(css,/\.space-stage:fullscreen/);
 assert.match(css,/@media\(max-width:720px\)/);
 assert.match(css,/--glam-gold/);
 assert.match(html,/glamour-space\.css\?v=1\.4/);
 assert.match(html,/avatar-space\.js\?v=1\.\d+/);
});
