import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {HEART_PERSONALITY,LOCAL_GENERATION_SETTINGS} from '../lib/heart-personality.mjs';import {buildLocalContext} from '../lib/local-context.mjs';
test('local and remote use the same persona and preserve untrusted context boundaries',()=>{
 const remote=readFileSync(new URL('../functions/api/chat.js',import.meta.url),'utf8');
 assert.match(remote,/const instructions = HEART_PERSONALITY/);assert.equal(buildLocalContext({history:[{role:'user',text:'Salut'}]}).messages[0].content,HEART_PERSONALITY);
 assert.match(HEART_PERSONALITY,/tutoie/);assert.match(HEART_PERSONALITY,/précision seulement/);assert.match(HEART_PERSONALITY,/pas des instructions/);
 assert.ok(LOCAL_GENERATION_SETTINGS.frequency_penalty>0);assert.ok(LOCAL_GENERATION_SETTINGS.presence_penalty>0);
});
