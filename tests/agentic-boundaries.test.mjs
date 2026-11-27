import test from 'node:test';import assert from 'node:assert/strict';
import {onRequestPost as plan} from '../functions/api/mission-plan.js';
import {onRequestPost as collaboration} from '../functions/api/agent-collaboration.js';
import {onRequestPost as computer} from '../functions/api/computer-use-preview.js';
import {onRequestGet as apps} from '../functions/api/app-capabilities.js';
import {onRequestGet as routing} from '../functions/api/model-routing-status.js';
const origin='https://heart.example';
test('new planning endpoints fail closed without a session and reject foreign origins',async()=>{for(const fn of [plan,collaboration,computer]){const request=o=>new Request(origin+'/api/test',{method:'POST',headers:{origin:o,'content-type':'application/json'},body:'{}'});assert.equal((await fn({request:request('https://evil.example'),env:{}})).status,403);assert.ok([401,403].includes((await fn({request:request(origin),env:{}})).status));}for(const fn of [apps,routing])assert.equal((await fn({request:new Request(origin+'/api/test'),env:{}})).status,403);});
