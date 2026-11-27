const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
 const root=path.resolve(__dirname,'..');const server=http.createServer((req,res)=>{
  const file=path.join(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname==='/'?'/index.html':new URL(req.url,'http://localhost').pathname));
  if(!file.startsWith(root)){res.writeHead(403).end();return;}
  fs.readFile(file,(err,body)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.js')||file.endsWith('.mjs')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'text/plain');res.end(body);});
 });await new Promise(resolve=>server.listen(8173,'127.0.0.1',resolve));
 const browser=await chromium.launch({...(process.env.HEART_TEST_CHROMIUM_PATH?{executablePath:process.env.HEART_TEST_CHROMIUM_PATH}:{}),headless:true,args:['--no-sandbox']});
 const probe=await browser.newPage();await probe.goto('http://127.0.0.1:8173/README.md');
 console.log('Real browser WebGPU',await probe.evaluate(async()=>({available:!!navigator.gpu,adapter:navigator.gpu?!!(await navigator.gpu.requestAdapter()):false})));await probe.close();
 const page=await browser.newPage({viewport:{width:1365,height:1000}});const errors=[],posts=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url());
  if(url.origin!=='http://127.0.0.1:8173')return route.abort();
  if(url.pathname.startsWith('/api/')){if(req.method()==='POST')posts.push(url.pathname);return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(url.pathname==='/api/account'?{connected:false}:{aiConfigured:false})});}
  await route.continue();
 });
 await page.addInitScript(()=>{
  window.__modelCalls=[];window.__slow=false;
  Object.defineProperty(navigator,'gpu',{value:{},configurable:true});
  window.Worker=class{
   constructor(){this.terminated=false;}
   postMessage(data){window.__modelCalls.push(data);setTimeout(()=>{if(!this.terminated)this.onmessage?.({data:{id:data.id,type:data.type==='load'?'loaded':'result',reply:'Génération locale testée.'}});},window.__slow&&data.type==='generate'?1000:0);}
   terminate(){this.terminated=true;}
  };
 });
 await page.goto('http://127.0.0.1:8173/');
 await page.waitForFunction(()=>window.WarLikeHeartLocalChat);
 assert.equal(await page.locator('#conversationEngine').inputValue(),'local-llm');
 assert.equal(await page.locator('#localModelLoad').isVisible(),true);
 await page.locator('#localModelLoad').click();await page.waitForFunction(()=>window.WarLikeHeartLocalChat.status().state==='ready');
 // A private token must not change the selected local route.
 await page.evaluate(()=>{document.getElementById('accessToken').value='test-token-present';});
 await page.locator('#message').fill('Explique les étoiles sans réponse préenregistrée.');await page.locator('#chatForm button[type=submit]').click();
 await page.waitForFunction(()=>document.querySelector('#messages .assistant:last-child')?.textContent==='Génération locale testée.');
 assert.deepEqual(posts,[]);
 await page.locator('summary').filter({hasText:'Corriger et enseigner'}).click();await page.locator('#localTeachingUseLast').click();
 assert.equal(await page.locator('#localTeachingAnswer').inputValue(),'Génération locale testée.');
 await page.locator('#localTeachingForm button').click();assert.match(await page.locator('#localTeachingStatus').textContent(),/mémoire/);
 // Enable storage from account, then approve a correction from the chat.
 await page.locator('[data-nav="account"]').click();await page.locator('#remember').check();await page.locator('[data-nav="home"]').click();
 await page.locator('#localTeachingQuestion').fill('Comment observer les étoiles ?');await page.locator('#localTeachingAnswer').fill('Choisir un endroit sombre.');await page.locator('#localTeachingForm button').click();
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('warlike-heart-learning-v1')));assert.equal(stored.dialogues[0].answer,'Choisir un endroit sombre.');
 await page.locator('#localModelLoad').click();await page.waitForFunction(()=>window.WarLikeHeartLocalChat.status().state==='ready');
 await page.locator('#message').fill('Comment observer les étoiles ?');await page.locator('#chatForm button[type=submit]').click();await page.waitForFunction(()=>!document.getElementById('message').disabled);
 assert.match(await page.evaluate(()=>JSON.stringify(window.__modelCalls.at(-1).messages)),/Choisir un endroit sombre/);
 await page.evaluate(()=>window.__slow=true);await page.locator('#message').fill('Réponse en cours à supprimer');await page.locator('#chatForm button[type=submit]').click();
 await page.waitForFunction(()=>window.WarLikeHeartLocalChat.status().state==='generating');
 await page.locator('[data-nav="account"]').click();await page.locator('#clear').click();await page.locator('[data-nav="home"]').click();
 await page.waitForFunction(()=>!document.getElementById('message').disabled);
 assert.equal(await page.locator('#messages .bubble').count(),1);assert.equal(await page.evaluate(()=>localStorage.getItem('warlike-heart-learning-v1')),null);
 assert.deepEqual(errors,[]);assert.deepEqual(posts,[]);
 await page.setViewportSize({width:390,height:844});assert.equal(await page.locator('#localModelLoad').isVisible(),true);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
 await page.screenshot({path:require('node:path').join(require('node:os').tmpdir(),'heart-local-mobile.png'),fullPage:true});
 console.log('PASS (simulated worker): local route with token, correction consent, learned context, in-flight clear, mobile overflow; no API POST; no JS errors.');await browser.close();server.close();
})().catch(error=>{console.error(error);process.exit(1);});
