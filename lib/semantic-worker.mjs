import {createSemanticIndex,SEMANTIC_MODEL,SEMANTIC_REVISION} from './semantic-index.mjs';
let index=null;
self.onmessage=async({data})=>{const {id,type}=data;try{
 if(type==='load'){
  const {pipeline,env}=await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js');
  env.allowLocalModels=false;env.backends.onnx.wasm.numThreads=1;
  const extractor=await pipeline('feature-extraction',SEMANTIC_MODEL,{quantized:true,revision:SEMANTIC_REVISION,progress_callback:p=>self.postMessage({id,type:'progress',detail:p.status==='progress'?'Téléchargement : '+Math.round(p.progress||0)+' %':'Chargement du modèle sémantique…'})});
  index=createSemanticIndex(async texts=>(await extractor(texts,{pooling:'mean',normalize:true,truncation:true})).tolist());
  self.postMessage({id,type:'ready'});
 }else if(type==='search'){
  if(!index)throw Error('Recherche sémantique non chargée.');
  const rows=await index.search(data.query,data.records,{progress:p=>self.postMessage({id,type:'progress',detail:'Indexation locale : '+p.done+'/'+p.total})});
  self.postMessage({id,type:'result',rows});
 }else throw Error('Commande sémantique inconnue.');
 }catch(error){self.postMessage({id,type:'error',error:error.message});}
};
