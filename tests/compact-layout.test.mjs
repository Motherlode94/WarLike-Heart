import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const css=readFileSync(new URL("../compact-layout.css",import.meta.url),"utf8");
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
test("compact sheet overrides navigation style and legacy CSS",()=>{
 const index=html.indexOf("compact-layout.css?v=1.3.1");
 assert.ok(index>html.indexOf("navigation.css?v=1.3"));
 assert.ok(index>html.indexOf("heart-design.css"));
});
test("compact chat and avatar eliminate oversized fixed min-height",()=>{
 assert.match(css,/#homeView \.avatar,#homeView \.chat\{min-height:0!important;height:auto\}/);
 assert.match(css,/#homeView \.messages\{/);
 assert.match(css, /@media\(max-width:900px\)/);
 assert.match(css, /@media\(max-width:600px\)/);
});
