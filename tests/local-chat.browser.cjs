const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
(async()=>{
 const root=path.resolve(__dirname,'..');
 const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname,file=path.resolve(root,'.'+decodeURIComponent(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(file,(error,body)=>{if(error){res.writeHead(404).end();return;}res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'text/plain');res.end(body);});
 });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({...(process.env.HEART_TEST_CHROMIUM_PATH?{executablePath:process.env.HEART_TEST_CHROMIUM_PATH}:{}),headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1365,height:1000}}),errors=[],posts=[];let cloudReads=0;
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',async route=>{
   const req=route.request(),url=new URL(req.url());if(url.origin!==origin)return route.abort();
   if(url.pathname.startsWith('/api/')){
    if(req.method()==='POST')posts.push(url.pathname);
    let data=url.pathname==='/api/account'?{connected:false}:{aiConfigured:false};
    if(url.pathname==='/api/cognitive-memory'){cloudReads++;data={memories:[{title:'Projet Aster',content:'Le véhicule du projet Aster est un voilier rouge. CloudOnlyToken'}]};}
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
   }await route.continue();
  });
  await page.addInitScript(()=>{
   window.__modelCalls=[];window.__semanticCalls=[];window.__replyQueue=[];window.__slow=false;
   Object.defineProperty(navigator,'gpu',{value:{},configurable:true});
   window.Worker=class{constructor(url){this.terminated=false;this.semantic=String(url).includes('semantic-worker');}postMessage(data){(this.semantic?window.__semanticCalls:window.__modelCalls).push(data);const reply=window.__replyQueue.length&&data.type==='generate'?window.__replyQueue.shift():'Génération locale testée.';setTimeout(()=>{if(!this.terminated)this.onmessage?.({data:{id:data.id,type:data.type==='load'?'loaded':'result',reply,rows:this.semantic&&data.type==='search'?data.records.filter(x=>/rémunération/.test(x.text)).map(x=>({...x,score:.8})):undefined}});},window.__slow&&data.type==='generate'?1000:0);}terminate(){this.terminated=true;}};
  });
  await page.goto(origin);await page.waitForFunction(()=>window.WarLikeHeartLocalChat);
  assert.equal(await page.locator('#localModelLoad').isVisible(),false);assert.equal(await page.locator('#openBrainSettings').isVisible(),true);
  await page.locator('#message').fill('Explique les étoiles.');await page.locator('#chatForm button[type=submit]').click();
  assert.equal(await page.locator('#brainSettings').isVisible(),true);assert.equal(await page.locator('#message').inputValue(),'Explique les étoiles.');assert.equal(await page.locator('#messages .bubble').count(),1);
  await page.locator('#localModelLoad').click();await page.waitForFunction(()=>window.WarLikeHeartLocalChat.status().state==='ready');
  await page.locator('#backToChat').click();await page.evaluate(()=>{document.getElementById('accessToken').value='test-token-present';});
  const send=async text=>{await page.locator('#message').fill(text);await page.locator('#chatForm button[type=submit]').click();await page.waitForFunction(()=>!document.getElementById('message').disabled);};
  await send('Explique les étoiles.');await send('Reformule cela autrement.');
  assert.match(await page.evaluate(()=>JSON.stringify(window.__modelCalls.at(-1).messages)),/reformulation/);assert.equal(await page.locator('.reply-teach').count(),2);assert.equal(cloudReads,0);assert.deepEqual(posts,[]);
  await page.locator('.reply-teach').first().click();assert.equal(await page.locator('#localTeachingQuestion').inputValue(),'Explique les étoiles.');
  await page.locator('#localTeachingForm button').click();assert.match(await page.locator('#localTeachingStatus').textContent(),/mémoire/);await page.locator('#localTeachingClose').click();
  await page.locator('[data-nav="account"]').click();await page.locator('#remember').check();await page.locator('#backToChat').click();
  await page.locator('.reply-teach').first().click();await page.locator('#localTeachingAnswer').fill('Les étoiles émettent leur lumière.');await page.locator('#localTeachingForm button').click();
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('warlike-heart-learning-v1')).dialogues[0].answer),'Les étoiles émettent leur lumière.');await page.locator('#localTeachingClose').click();
  await page.evaluate(()=>{localStorage.setItem('warlike-heart-explicit-memories-v1',JSON.stringify(['Mon projet Aster est un jeu de navigation. OldAsterToken',...Array.from({length:39},(_,i)=>'Mon livre de cuisine numéro '+i)]));});
  await send('Quel est mon projet Aster ?');assert.match(await page.evaluate(()=>JSON.stringify(window.__modelCalls.at(-1).messages)),/OldAsterToken/);
  await page.locator('#openBrainSettings').click();await page.locator('#localCognitiveContext').check();await page.locator('#backToChat').click();
  await send('Quel véhicule utilise mon projet Aster ?');assert.equal(cloudReads,1);assert.match(await page.evaluate(()=>JSON.stringify(window.__modelCalls.at(-1).messages)),/CloudOnlyToken/);assert.deepEqual(posts,[]);
  await page.locator('#openBrainSettings').click();await page.locator('#localCognitiveContext').uncheck();await page.locator('#localModelLoad').click();await page.waitForFunction(()=>window.WarLikeHeartLocalChat.status().state==='ready');await page.locator('#backToChat').click();
  await page.evaluate(()=>window.__slow=true);await page.locator('#message').fill('Réponse en cours à supprimer');await page.locator('#chatForm button[type=submit]').click();await page.waitForFunction(()=>window.WarLikeHeartLocalChat.status().state==='generating');
  await page.locator('[data-nav="account"]').click();await page.locator('#clear').click();await page.locator('#backToChat').click();await page.waitForFunction(()=>!document.getElementById('message').disabled);
  assert.equal(await page.locator('#messages .bubble').count(),1);assert.equal(await page.evaluate(()=>localStorage.getItem('warlike-heart-learning-v1')),null);
  // Comparison uses synthetic prompts only and does not append to the chat.
  await page.evaluate(()=>window.__slow=false);await page.locator('#openBrainSettings').click();await page.locator('#modelComparisonPanel summary').click();
  const before=await page.evaluate(()=>window.__modelCalls.length);await page.locator('#modelComparisonPanel [data-compare]').click();
  await page.waitForFunction(()=>document.querySelector('#modelComparisonPanel [data-status]').textContent.startsWith('Comparaison terminée'));
  assert.equal(await page.locator('#modelComparisonPanel [data-results] section').count(),10);assert.equal(await page.locator('#messages .bubble').count(),1);
  const comparison=await page.evaluate(start=>JSON.stringify(window.__modelCalls.slice(start)),before);assert.doesNotMatch(comparison,/OldAsterToken|CloudOnlyToken|les étoiles/);
  await page.locator('#modelComparisonPanel [data-results] select').first().selectOption('satisfactory');
  const pending=page.waitForEvent('download');await page.locator('#modelComparisonPanel [data-export]').click();const download=await pending,stream=await download.createReadStream(),chunks=[];for await(const chunk of stream)chunks.push(chunk);const report=JSON.parse(Buffer.concat(chunks));assert.equal(report.qualityCertified,false);assert.equal(report.results[0].review,'satisfactory');
  await page.locator('#backToChat').click();await page.screenshot({path:path.join(os.tmpdir(),'heart-r24-desktop.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});assert.equal(await page.locator('#localModelLoad').isVisible(),false);assert.equal(await page.locator('#openBrainSettings').isVisible(),true);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  await page.waitForFunction(()=>document.querySelector('#chatForm').getBoundingClientRect().bottom<=innerHeight-8);
  assert.equal(await page.locator('#chatForm button[type=submit]').evaluate(button=>{const r=button.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===button;}),true);
  await page.screenshot({path:path.join(os.tmpdir(),'heart-r24-mobile.png'),fullPage:true});assert.deepEqual(errors,[]);
  // R25: deterministic tools work before loading a conversational model.
  await page.setViewportSize({width:1365,height:1000});await page.locator('#openBrainSettings').click();await page.locator('#clear').click();await page.locator('#backToChat').click();
  const nativeStart=await page.evaluate(()=>window.__modelCalls.length);
  await send('0,1+0,2');assert.match(await page.locator('.bubble.assistant').last().textContent(),/0,3/);
  await send('/budget 18 ; 4*3+7');assert.match(await page.locator('.bubble.assistant').last().textContent(),/manque 1/);
  await send('/contraintes x=10 ; x<=8');assert.match(await page.locator('.bubble.assistant').last().textContent(),/Non respectée/);
  assert.equal(await page.evaluate(()=>window.__modelCalls.length),nativeStart);assert.equal(await page.locator('.reply-check').last().textContent(),'Vérification native · données fournies');
  await page.locator('#openBrainSettings').click();await page.locator('#remember').check();
  const longHistory=Array.from({length:100},(_,i)=>({role:i%2?'assistant':'user',text:i===0?'Le budget Aster est de 1800 euros.':'Ancien sujet '+i}));
  await page.locator('#importFile').setInputFiles({name:'conversation.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({format:'warlike-heart-conversation',version:1,history:longHistory,memories:[],archive:[],learning:{dialogues:[],knowledge:[{subject:'Finances',content:'Ma rémunération est de 2200 euros chaque mois.'}]}}))});
  await page.waitForFunction(()=>document.getElementById('status').textContent.startsWith('Conversation importée'));
  await page.locator('#backToChat').click();await send('1+1');await send('/rappel budget Aster');assert.match(await page.locator('.bubble.assistant').last().textContent(),/1800/);
  assert.match(await page.evaluate(()=>JSON.stringify(window.WarLikeHeartCloudBridge.snapshot().archive)),/1800/);
  await page.reload();await page.waitForFunction(()=>window.WarLikeHeartLocalChat);await send('/rappel budget Aster');assert.match(await page.locator('.bubble.assistant').last().textContent(),/1800/);
  await page.locator('#openBrainSettings').click();await page.locator('summary').filter({hasText:/^Recherche sémantique locale$/}).click();await page.locator('#semanticLoad').click();await page.waitForFunction(()=>document.getElementById('semanticStatus').textContent.includes('prête'));
  await page.locator('#backToChat').click();await send('/rappel salaire mensuel');assert.match(await page.locator('.bubble.assistant').last().textContent(),/rémunération/);assert.match(await page.locator('.bubble.assistant').last().textContent(),/similarité sémantique/);
  await page.locator('#openBrainSettings').click();await page.locator('summary').filter({hasText:/^Vérification et cas de certification$/}).click();await page.locator('#certificationRun').click();await page.waitForFunction(()=>!document.getElementById('certificationExport').disabled);
  const certPending=page.waitForEvent('download');await page.locator('#certificationExport').click();const certDownload=await certPending,certStream=await certDownload.createReadStream(),certChunks=[];for await(const chunk of certStream)certChunks.push(chunk);const cert=JSON.parse(Buffer.concat(certChunks));assert.equal(cert.generativeModelCertified,false);assert.equal(cert.results.filter(x=>x.status==='passed').length,10);
  await page.locator('#localModelLoad').click();await page.waitForFunction(()=>window.WarLikeHeartLocalChat.status().state==='ready');await page.locator('#backToChat').click();
  await page.evaluate(()=>window.__replyQueue=['2+2 = 5','2+2 = 4']);const repairStart=await page.evaluate(()=>window.__modelCalls.filter(x=>x.type==='generate').length);await send('Donne une égalité numérique.');assert.equal(await page.locator('.bubble.assistant').last().textContent(),'2+2 = 4');assert.equal(await page.evaluate(()=>window.__modelCalls.filter(x=>x.type==='generate').length),repairStart+2);assert.match(await page.locator('.reply-check').last().textContent(),/Contrôles partiels/);
  await page.evaluate(()=>window.__replyQueue=['2+2 = 5','2+2 = 5']);await send('Propose une autre égalité.');assert.match(await page.locator('.reply-check').last().textContent(),/À vérifier/);assert.deepEqual(posts,[]);
  await page.locator('#openBrainSettings').click();await page.locator('#remember').uncheck();assert.equal(await page.evaluate(()=>localStorage.getItem('warlike-heart-demo-v1')),null);assert.deepEqual(await page.evaluate(()=>window.WarLikeHeartCloudBridge.snapshot().archive),[]);
  assert.deepEqual(errors,[]);
  console.log('PASS (simulated worker/Cloud): settings relocation, preserved draft, follow-up context, per-response correction, old memory, opt-in Cloud, cancellation, isolated model comparison, review export, desktop/mobile; R25 native tools, evicted context persisted, semantic adapter, one repair, failed repair label, fixed-case JSON; no AI API POST.');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exit(1);});
