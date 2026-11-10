import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const js=readFileSync(new URL("../heart-initiatives.js",import.meta.url),"utf8");
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
test("Romantic initiatives are opt-in and linked to Heart UI",()=>{
 assert.match(html,/heart-initiatives\.js/);
 assert.match(js,/type="checkbox" id="heartAuto"/);
 assert.doesNotMatch(js,/heartAuto" checked/);
 assert.match(js,/Arrêt immédiat/);
 assert.match(js,/Refus respecté/);
 assert.match(js,/clearInterval\(handle\)/);
});
test("Romantic initiatives never issue robot hardware commands",()=>{
 assert.doesNotMatch(js,/(navigator\.serial|navigator\.usb|BluetoothRemoteGATT|WebSocket\s*\()/);
 assert.match(js,/Interaction simulée/);
});
