import test from "node:test";
import assert from "node:assert/strict";
import {TOTAL_ARCS,SCENES_PER_ARC,TOTAL_SCENES,getStory,getScene,getSceneById,allScenes} from "../romance/novelas.mjs";
test("35 000 scènes distinctement identifiées",()=>{
 assert.equal(TOTAL_ARCS,350);assert.equal(SCENES_PER_ARC,100);assert.equal(TOTAL_SCENES,35000);
 const ids=new Set();
 for(const scene of allScenes()){assert(!ids.has(scene.id));ids.add(scene.id);assert.equal(scene.dialogue.length,4);assert.equal(scene.adult_non_explicit,true);}
 assert.equal(ids.size,35000);
});
test("continuité, référencement et bornes",()=>{
 assert.equal(getStory(1).id,"WH-N-001");
 assert.equal(getScene(1,1).id,"WH-R-001-001");
 assert.equal(getScene(350,100).id,"WH-R-350-100");
 assert.equal(getScene(1,1).continuity.previous,null);
 assert.equal(getScene(1,1).continuity.next,"WH-R-001-002");
 assert.equal(getScene(1,100).continuity.next,null);
 assert.deepEqual(getSceneById("WH-R-350-100"),getScene(350,100));
 assert.throws(()=>getScene(351,1),RangeError);
 assert.throws(()=>getScene(1,0),RangeError);
 assert.throws(()=>getSceneById("invalid"),TypeError);
});
