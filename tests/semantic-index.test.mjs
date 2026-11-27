import test from 'node:test';import assert from 'node:assert/strict';import {createSemanticIndex,cosine,semanticCorpus} from '../lib/semantic-index.mjs';import {createSemanticSearch} from '../lib/semantic-search.mjs';
test('vector retrieval can recover paraphrases without lexical overlap; removed texts leave cache',async()=>{
 let calls=0;const embed=async texts=>{calls++;return texts.map(x=>/voiture|automobile/.test(x)?[1,0]:[0,1]);};
 const index=createSemanticIndex(embed),rows=[{source:'knowledge',title:'Transport',text:'Une automobile rouge.'},{source:'knowledge',title:'Cuisine',text:'Un gâteau.'}];
 assert.equal((await index.search('ma voiture',rows))[0].title,'Transport');const before=calls;await index.search('voiture',rows);assert.equal(calls,before+1);
 assert.deepEqual(await index.search('voiture',[rows[1]]),[]);assert.throws(()=>cosine([1],[NaN]));assert.equal(cosine([0,0],[1,0]),0);
 const corpus=semanticCorpus({memories:['Préférence'],learning:{knowledge:[{subject:'Son',content:'voix'}]},archive:[{role:'assistant',text:'ancien',partial:true}]});assert.equal(corpus[2].source,'conversation-excerpt');
});
test('semantic worker loading is explicit, cancellable and rejects late replies',async()=>{
 let worker,posted=[];const search=createSemanticSearch({workerFactory:()=>worker={postMessage:x=>posted.push(x),terminate(){this.dead=true;}}});assert.equal(posted.length,0);
 const loading=search.load();worker.onmessage({data:{id:posted[0].id,type:'ready'}});await loading;assert.equal(search.status(),'ready');
 const p=search.search('private query',[]);search.stop();await assert.rejects(p,/arrêtée/);assert.equal(worker.dead,true);assert.equal(search.status(),'idle');
});
