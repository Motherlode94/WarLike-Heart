// Opt-in real CPU inference: downloads public MiniLM weights and runtime.
// Not part of offline unit CI; no mock embeddings, no account or private data.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
if(process.env.HEART_RUN_SEMANTIC_MODEL!=='1'){console.log('Set HEART_RUN_SEMANTIC_MODEL=1 to authorize public model downloads.');process.exit(0);}
(async()=>{
 const root=path.resolve(__dirname,'..'),server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(file,(e,b)=>{res.setHeader('Content-Type','text/javascript');res.writeHead(e?404:200);res.end(e?'':b);});
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({...(process.env.HEART_TEST_CHROMIUM_PATH?{executablePath:process.env.HEART_TEST_CHROMIUM_PATH}:{}),...(process.env.HTTPS_PROXY?{proxy:{server:process.env.HTTPS_PROXY,bypass:'127.0.0.1,localhost'}}:{}),headless:true,args:['--no-sandbox',...(process.env.HEART_TEST_IGNORE_HTTPS_ERRORS==='1'?['--ignore-certificate-errors']:[])]});
 try{
  const page=await browser.newPage({ignoreHTTPSErrors:process.env.HEART_TEST_IGNORE_HTTPS_ERRORS==='1'});await page.goto('http://127.0.0.1:'+server.address().port+'/lib/semantic-index.mjs');
  const result=await page.evaluate(async()=>{
   const {createSemanticSearch}=await import('/lib/semantic-search.mjs');const s=createSemanticSearch();
   try{await s.load();return await s.search('Quel est mon salaire mensuel ?',[{source:'knowledge',title:'Finances',text:'Ma rémunération est de 2 200 euros chaque mois.'},{source:'knowledge',title:'Couleur',text:'La maison a des murs rouges.'}]);}finally{s.stop();}
  });assert.equal(result[0]?.title,'Finances');console.log('PASS real MiniLM CPU/WASM paraphrase retrieval',JSON.stringify(result));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(error=>{console.error(error);process.exitCode=1;});
