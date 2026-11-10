import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const css=readFileSync(new URL("../heart-design.css",import.meta.url),"utf8");
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
test("loads the CSS refresh after the legacy styles",()=>{
  assert.match(html,/heart-design\.css\?v=1\.2\.1/);
  assert.ok(html.indexOf("</style>")<html.indexOf("heart-design.css"));
});
test("styles chat, avatar, learning and Cloud panels",()=>{
  for(const selector of [".avatar",".portrait",".chat",".messages",".bubble.user","#learningPanel","#cloudMemoryPanel"])
    assert.ok(css.includes(selector),selector);
});
test("supports mobile viewport, keyboard focus and reduced motion",()=>{
  assert.match(css,/@media\(max-width:600px\)/);
  assert.match(css,/:focus-visible/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
