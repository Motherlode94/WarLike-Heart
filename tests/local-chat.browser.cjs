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
   window.__modelCalls=[];window.__slow=false;
   Object.defineProperty(navigator,'gpu',{value:{},configurable:true});
   window.Worker=class{constructor(){this.terminated=false;}postMessage(data){window.__modelCalls.push(data);setTimeout(()=>{if(!this.terminated)this.onmessage?.({data:{id:data.id,type:data.type==='load'?'loaded':'result',reply:'Génération locale testée.'}});},window.__slow&&data.type==='generate'?1000:0);}terminate(){this.terminated=true;}};
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
  console.log('PASS (simulated worker/Cloud): settings relocation, preserved draft, follow-up context, per-response correction, old memory, opt-in Cloud, cancellation, isolated model comparison, review export, desktop/mobile; no AI API POST.');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exit(1);});
