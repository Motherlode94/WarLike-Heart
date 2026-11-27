import test from 'node:test';import assert from 'node:assert/strict';import {calculate,formatNumber,calculatorReply,convert} from '../lib/native-calculator.mjs';
test('rational operations preserve decimals and precedence without executing code',()=>{
 for(const [q,a] of [['0,1+0,2','0,3'],['2+3*4','14'],['(2+3)*4','20'],['-2^2','-4'],['2^3^2','512'],['1/3','0,3333333333'],['10%*50','5']])assert.equal(formatNumber(calculate(q)),a,q);
 for(const q of ['1/0','globalThis.process.exit()','2 2','2^1000','1e999','0^0'])assert.throws(()=>calculate(q),q);
});
test('percentages, budget constraints and dimension-safe conversions are native',()=>{
 assert.equal(calculatorReply('20 % de 150').data.value,'30');assert.equal(calculatorReply('Augmente 150 de 20 %').data.value,'180');
 const b=calculatorReply('/budget 18 ; 4*3+7');assert.equal(b.data.total,'19');assert.equal(b.data.affordable,false);assert.equal(b.data.remaining,'-1');
 assert.equal(formatNumber(convert('2.5','km','m')),'2500');assert.equal(formatNumber(convert('32','°F','°C')),'0');assert.equal(formatNumber(convert('1','Mio','o')),'1048576');
 assert.throws(()=>convert('1','m','kg'));assert.throws(()=>convert('1','eur','usd'));assert.equal(calculatorReply('Parle-moi de toi'),null);
});
