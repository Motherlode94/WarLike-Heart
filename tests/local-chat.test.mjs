import test from 'node:test';import assert from 'node:assert/strict';
import {createLocalChat} from '../local-chat.mjs';
const dom=()=>{
 const nodes=new Map();let events=[];
 return {events,getElementById(id){if(!nodes.has(id))nodes.set(id,{value:'',textContent:'',disabled:false,handlers:{},append(){},reset(){},addEventListener(type,fn){this.handlers[type]=fn;}});return nodes.get(id);},createElement(){return {};},dispatchEvent(event){events.push(event.type);}};
};
test('chat passes conversation, approved knowledge and explicit memory into generation',async()=>{
 const document=dom();let input,enabled=true,written;
 const chat=createLocalChat({document,canRemember:()=>enabled,readLearning:()=>({dialogues:[],knowledge:[{subject:'Studio',content:'Une station audio pour enregistrer la voix.'}]}),readMemories:()=>['Le projet se nomme Studio.'],writeLearning:x=>{written=x;return true;},
  modelFactory:()=>({generate:async messages=>{input=messages;return {reply:'Voici une reformulation utile.'};},status:()=>({state:'ready'}),stop(){}})});
 const answer=await chat.reply([{role:'user',text:'Explique Studio'},{role:'assistant',text:'Une station audio.'},{role:'user',text:'Reformule cela.'}]);
 assert.equal(answer,'Voici une reformulation utile.');assert.match(JSON.stringify(input),/station audio pour enregistrer/);assert.match(JSON.stringify(input),/Le projet se nomme Studio/);assert.equal(input.at(-1).content,'Reformule cela.');assert.equal(written,undefined);
 chat.onReply({question:'Explique Studio',answer});
 await document.getElementById('localTeachingUseLast').handlers.click();
 assert.equal(document.getElementById('localTeachingAnswer').value,answer);
 document.getElementById('localTeachingAnswer').value='Une station audio créative.';
 await document.getElementById('localTeachingForm').handlers.submit({preventDefault(){}});
 assert.equal(written.dialogues[0].answer,'Une station audio créative.');assert.deepEqual(document.events,['warlike-heart-learning-external-update']);
 enabled=false;written=undefined;
 await document.getElementById('localTeachingForm').handlers.submit({preventDefault(){}});assert.equal(written,undefined);assert.match(document.getElementById('localTeachingStatus').textContent,/mémoire/);
 chat.reset();assert.equal(document.getElementById('localTeachingUseLast').disabled,true);
});
