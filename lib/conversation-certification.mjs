import {calculatorReply} from './native-calculator.mjs';
import {verifyLogic,verifyConstraints} from './logical-verification.mjs';
import {archiveTurns,journalEvidence} from './conversation-journal.mjs';
import {answerWithReview} from './conversation-review.mjs';
export async function runConversationCertification({semanticSearch=null}={}){
 const results=[];const check=async(id,run)=>{try{results.push({id,status:await run()?'passed':'failed'});}catch(error){results.push({id,status:'failed',error:error.message});}};
 await check('decimal',()=>calculatorReply('0,1+0,2').data.value==='0,3');
 await check('percentage',()=>calculatorReply('20 % de 150').data.value==='30');
 await check('budget',()=>calculatorReply('/budget 18 ; 4*3+7').data.affordable===false);
 await check('conversion',()=>calculatorReply('2,5 km en m').data.value==='2500');
 await check('constraints',()=>verifyConstraints('x=10 ; x<8').passes===false);
 await check('logic-unknown',()=>verifyLogic({faits:['a'],conclusion:'b'}).status==='unknown');
 await check('logic-contradiction',()=>verifyLogic({faits:['a','!a'],conclusion:'b'}).status==='inconsistent');
 await check('old-context',()=>journalEvidence(archiveTurns([],[{role:'user',text:'Le projet Aster a un budget de 1800 euros.'}]),'budget Aster')[0]?.text.includes('1800'));
 await check('repair-wiring',async()=>{let calls=0;const r=await answerWithReview({history:[{role:'user',text:'Donne une égalité.'}],generate:async()=>({reply:++calls===1?'2+2 = 5':'2+2 = 4'})});return calls===2&&r.verification.status==='partial-checks-passed';});
 if(semanticSearch)await check('semantic-paraphrase',async()=>{const rows=await semanticSearch('Quel est mon salaire mensuel ?',[{source:'knowledge',title:'Finances',text:'Ma rémunération est de 2 200 euros chaque mois.'},{source:'knowledge',title:'Couleur',text:'La maison a des murs rouges.'}]);return rows[0]?.title==='Finances';});
 else results.push({id:'semantic-paraphrase',status:'not-run',reason:'Modèle sémantique non chargé.'});
 return {format:'heart-fixed-conversation-cases',version:1,createdAt:new Date().toISOString(),scope:'Cas fixes natifs, récupération et câblage de réparation. Aucun jugement global sur un modèle génératif.',generativeModelCertified:false,results};
}
