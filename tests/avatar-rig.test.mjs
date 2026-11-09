import test from "node:test";
import assert from "node:assert/strict";
import { inspectAvatar, visemeForText } from "../avatar-rig.mjs";

const bones=["Hips","Spine","Neck","Head","LeftArm","RightArm","LeftUpLeg","RightUpLeg"];
test("full humanoid rig with facial shapes qualifies as a candidate, never as canonical",()=>{
 const result=inspectAvatar({bones,skinnedMeshes:1,meshes:3,shapes:["viseme_aa","viseme_pp","eyeBlinkLeft"],animations:2});
 assert.equal(result.fullBodyRigCandidate,true);
 assert.equal(result.speechReady,true);
 assert.equal(result.canonicalAppearanceValidated,false);
 assert.deepEqual(result.missingBones,[]);
});
test("a static mesh is not passed off as a rigged full-body avatar",()=>{
 const result=inspectAvatar({meshes:1,shapes:["mouthOpen"]});
 assert.equal(result.fullBodyRigCandidate,false);
 assert.equal(result.speechReady,false);
 assert.ok(result.missingBones.includes("head"));
});
test("partial face shapes cannot claim speech readiness",()=>{
 assert.equal(inspectAvatar({shapes:["mouthOpen"]}).speechReady,false);
});
test("French text approximates labial, dental, rounded and open poses",()=>{
 assert.equal(visemeForText("bonjour",0),"closed");
 assert.equal(visemeForText("femme",0),"teeth");
 assert.equal(visemeForText("oui",0),"round");
 assert.equal(visemeForText("amie",0),"wide");
 assert.equal(visemeForText("salut !",6),"neutral");
});
test("boundaries safely clamp to the text",()=>{
 assert.equal(visemeForText("",0),"neutral");
 assert.equal(visemeForText("a",-9),"wide");
 assert.equal(visemeForText("a",900),"wide");
});
