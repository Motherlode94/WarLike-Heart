import test from 'node:test';import assert from 'node:assert/strict';import {selectLongContext,fetchCognitiveContext} from '../lib/context-selection.mjs';import {buildLocalContext} from '../lib/local-context.mjs';
test('an old relevant fact survives many newer unrelated memories',()=>{
 const memories=['Le projet Aster est un jeu de navigation. UnknownAsterSecret'];for(let i=0;i<39;i++)memories.push('Je possède un livre de cuisine numéro '+i);
 const history=[{role:'user',text:'Quel est mon projet Aster ?'}];
 const chosen=selectLongContext({history,memories});assert.equal(chosen[0].text,memories[0]);assert.match(JSON.stringify(buildLocalContext({history,memories})),/UnknownAsterSecret/);
});
test('Cloud memory is opt-in, uses the authenticated same-origin endpoint and surfaces failures',async()=>{
 let calls=0;const fetcher=async(url,options)=>{calls++;assert.match(url,/search=ranked/);assert.equal(options.credentials,'same-origin');return Response.json({memories:[{title:'Aster',content:'Un jeu.'}]});};
 assert.deepEqual(await fetchCognitiveContext('Aster',{fetcher}),[]);assert.equal(calls,0);
 const result=await fetchCognitiveContext('Aster',{enabled:true,fetcher});assert.equal(result[0].source,'cognitive-memory');assert.equal(calls,1);
 await assert.rejects(fetchCognitiveContext('Aster',{enabled:true,fetcher:async()=>new Response(null,{status:401})}),/401/);
});
