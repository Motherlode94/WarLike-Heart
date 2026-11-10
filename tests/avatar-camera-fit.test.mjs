import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fitDistance,centerOffset} from "../avatar-camera-fit.mjs";
const code=readFileSync(new URL("../avatar3d.js",import.meta.url),"utf8");
test("fit distance increases for a tall portrait viewport",()=>{
 const wide=fitDistance(3.4,2.9,.5,16/9,35);
 const portrait=fitDistance(3.4,2.9,.5,3/4,35);
 assert.ok(portrait>wide);
 assert.ok(wide>0);
});
test("fit distance leaves vertical margin at default fov",()=>{
 const height=2.9,dist=fitDistance(1.1,height,.35,1,35);
 const visibleHeight=2*dist*Math.tan(35*Math.PI/360);
 assert.ok(visibleHeight>height*1.18);
});
test("center offset correctly compensates mesh scale and arbitrary GLB origin",()=>{
 const center={x:15,y:230,z:-24},scale=.01;
 const o=centerOffset(center,scale);
 assert.ok(Math.abs(o.x+.15)<1e-10);
 assert.ok(Math.abs(o.y+2.3)<1e-10);
 assert.ok(Math.abs(o.z-.24)<1e-10);
 assert.ok(Math.abs(center.y*scale+o.y)<1e-10);
});
test("viewport changes and menu transitions recalculate camera fit",()=>{
 assert.match(code,/if\(current\)framePose\(viewMode\)/);
 assert.match(code,/mountInto\(target\).*resize\(\)/);
 assert.match(code,/restoreMount\(\).*resize\(\)/);
 assert.match(code,/framePose\("full"\)/);
 assert.match(code,/centerOffset\(center,scale\)/);
});
