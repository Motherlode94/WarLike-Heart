import test from "node:test";
import assert from "node:assert/strict";
import {DEFAULT_NOTIFICATION_POLICY,localParts,inQuietHours,eligibleSlot} from "../notifications/scheduler.mjs";
test("disabled by default; requires opt-in",()=>{
 assert.equal(DEFAULT_NOTIFICATION_POLICY.enabled,false);
 assert.equal(eligibleSlot({date:new Date("2026-11-10T08:00:00Z")}),null);
});
test("Paris quiet hours 23:00-08:00, including DST",()=>{
 for(const h of [23,0,4,7])assert.equal(inQuietHours(h),true);
 for(const h of [8,12,22])assert.equal(inQuietHours(h),false);
 assert.equal(localParts(new Date("2026-07-01T07:00:00Z")).hour,9);
 assert.equal(localParts(new Date("2026-11-10T08:00:00Z")).hour,9);
});
test("four daily categories; deduplication and max five",()=>{
 const settings={...DEFAULT_NOTIFICATION_POLICY,enabled:true};
 const d=new Date("2026-11-10T08:03:00Z");
 const slot=eligibleSlot({date:d,settings});
 assert.deepEqual({type:slot.type,key:slot.key},{type:"conversation",key:"2026-11-10:9"});
 assert.equal(eligibleSlot({date:d,settings,sentSlotKeys:[slot.key]}),null);
 assert.equal(eligibleSlot({date:d,settings,sentToday:5}),null);
 assert.equal(eligibleSlot({date:new Date("2026-11-10T22:01:00Z"),settings}),null);
});
test("missing categories cannot generate messages",()=>{
 const settings={...DEFAULT_NOTIFICATION_POLICY,enabled:true,categories:[]};
 assert.equal(eligibleSlot({date:new Date("2026-11-10T08:00:00Z"),settings}),null);
});
