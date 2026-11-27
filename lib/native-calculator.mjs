// Bounded rational arithmetic. No eval, Function, scripts or remote exchange rates.
const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b)[a,b]=[b,a%b];return a||1n;};
export function rational(n,d=1n){n=BigInt(n);d=BigInt(d);if(!d)throw Error('Division par zéro.');if(d<0n){n=-n;d=-d;}const g=gcd(n,d);n/=g;d/=g;if(n.toString().length>160||d.toString().length>160)throw Error('Calcul trop grand.');return {n,d};}
export function decimal(value){const s=String(value).trim().replace(',','.');if(!/^[+-]?\d{1,24}(?:\.\d{1,12})?$/.test(s))throw Error('Nombre invalide (24 chiffres, 12 décimales maximum).');const sign=s[0]==='-'?-1n:1n,[whole,fraction='']=s.replace(/^[+-]/,'').split('.');return rational(sign*BigInt(whole+fraction),10n**BigInt(fraction.length));}
const add=(a,b)=>rational(a.n*b.d+b.n*a.d,a.d*b.d),mul=(a,b)=>rational(a.n*b.n,a.d*b.d);
export function formatNumber(a){
 const sign=a.n<0n?'-':'',n=a.n<0n?-a.n:a.n,scale=10n**10n,rounded=(n*scale*2n/a.d+1n)/2n;
 const whole=rounded/scale,fraction=(rounded%scale).toString().padStart(10,'0').replace(/0+$/,'');return sign+whole+(fraction?','+fraction:'');
}
export const equalRational=(a,b)=>a.n*b.d===b.n*a.d;
export function calculate(expression,variables={}){
 if(typeof expression!=='string'||expression.length>500)throw Error('Expression trop longue.');
 const source=expression.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-').replace(/\*\*/g,'^');
 const tokens=source.match(/\d+(?:[.,]\d+)?|[A-Za-z_][A-Za-z0-9_]*|[()+*/^%\-]|[^\s]/g)||[];
 if(!tokens.length||tokens.length>160)throw Error('Expression vide ou trop complexe.');let index=0,depth=0;
 function atom(){if(++depth>30)throw Error('Trop de parenthèses.');let value,t=tokens[index++];
  if(t==='+'||t==='-'){value=parse(3);if(t==='-')value=rational(-value.n,value.d);}
  else if(t==='('){value=parse(0);if(tokens[index++]!==')')throw Error('Parenthèse manquante.');}
  else if(/^\d/.test(t||''))value=decimal(t);
  else if(Object.hasOwn(variables,t))value=typeof variables[t]==='object'?rational(variables[t].n,variables[t].d):decimal(variables[t]);
  else throw Error('Nombre, variable connue ou parenthèse requis.');
  while(tokens[index]==='%'){index++;value=mul(value,rational(1n,100n));}
  depth--;return value;
 }
 function parse(min){let left=atom();for(;;){const op=tokens[index],priority={'+':1,'-':1,'*':2,'/':2,'^':4}[op];if(priority===undefined||priority<min)break;index++;const right=parse(priority+(op==='^'?0:1));
  if(op==='+')left=add(left,right);if(op==='-')left=add(left,rational(-right.n,right.d));if(op==='*')left=mul(left,right);if(op==='/')left=mul(left,rational(right.d,right.n));
  if(op==='^'){if(right.d!==1n||right.n< -12n||right.n>12n)throw Error('Exposant entier de −12 à 12 requis.');if(!left.n&&right.n===0n)throw Error('0 puissance 0 est indéterminé.');const e=right.n<0n?-right.n:right.n;left=right.n<0n?rational(left.d**e,left.n**e):rational(left.n**e,left.d**e);}
 }return left;}
 const value=parse(0);if(index!==tokens.length)throw Error('Expression non reconnue.');return value;
}
export function budget(total,expenses){const available=calculate(total),cost=calculate(expenses),remaining=add(available,rational(-cost.n,cost.d));if(available.n<0n||cost.n<0n)throw Error('Budget et dépenses doivent être positifs.');return {available,cost,remaining,affordable:remaining.n>=0n};}
const units={mm:['length','0.001'],cm:['length','0.01'],m:['length','1'],km:['length','1000'],mg:['mass','0.000001'],g:['mass','0.001'],kg:['mass','1'],t:['mass','1000'],ms:['time','0.001'],s:['time','1'],min:['time','60'],h:['time','3600'],j:['time','86400'],ml:['volume','0.001'],cl:['volume','0.01'],l:['volume','1'],'m³':['volume','1000'],o:['data','1'],ko:['data','1000'],mo:['data','1000000'],go:['data','1000000000'],kio:['data','1024'],mio:['data','1048576'],gio:['data','1073741824']};
const canonical=unit=>unit.toLowerCase().replace('°','').replace(/^(celsius)$/,'c').replace(/^(fahrenheit)$/,'f').replace(/^(heures?)$/,'h').replace(/^(minutes?)$/,'min').replace(/^(secondes?)$/,'s').replace(/^(litres?)$/,'l').replace(/^(kilometres?)$/,'km').replace(/^(metres?)$/,'m').replace(/^(kilogrammes?)$/,'kg').replace(/^(grammes?)$/,'g');
export function convert(value,from,to){let x=calculate(value);from=canonical(from);to=canonical(to);
 if(['c','f','k'].includes(from)&&['c','f','k'].includes(to)){
  if(from==='f')x=mul(add(x,rational(-32n)),rational(5n,9n));if(from==='k')x=add(x,decimal('-273.15'));
  if(x.n*100n< -27315n*x.d)throw Error('Température sous le zéro absolu.');
  if(to==='f')x=add(mul(x,rational(9n,5n)),rational(32n));if(to==='k')x=add(x,decimal('273.15'));return x;
 }
 const a=units[from],b=units[to];if(!a||!b||a[0]!==b[0])throw Error('Unités absentes ou incompatibles. Aucun taux de change n’est inventé.');return mul(mul(x,decimal(a[1])),rational(decimal(b[1]).d,decimal(b[1]).n));
}
const result=(kind,reply,data)=>({kind,reply,data,verification:{status:'native-verified',scope:kind}});
export function calculatorReply(input){
 if(typeof input!=='string'||input.length>1500)return null;
 const raw=input.trim(),explicit=/^\/(?:calcul|budget|convertis?)\b/i.test(raw);
 let text=raw.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[?!.]+$/,'').trim(),m;
 try{
  if((m=text.match(/^\/?budget\s*:?\s*([^;]+);\s*(?:depenses?\s*:?\s*)?(.+)$/))){const b=budget(m[1].replace(/€|euros?/g,''),m[2].replace(/€|euros?/g,''));return result('budget','Dépenses : '+formatNumber(b.cost)+' €. Budget : '+formatNumber(b.available)+' €. '+(b.affordable?'Il reste '+formatNumber(b.remaining)+' €.':'Il manque '+formatNumber(rational(-b.remaining.n,b.remaining.d))+' €.'),{total:formatNumber(b.cost),remaining:formatNumber(b.remaining),affordable:b.affordable});}
  if((m=text.match(/^(?:(?:convertis?|convertir)\s+|\/convertis?\s+)?([+-]?\d+(?:[.,]\d+)?)\s*([a-z°³]+)\s+(?:en|vers)\s+([a-z°³]+)$/))){const value=convert(m[1],m[2],m[3]);return result('conversion',m[1]+' '+m[2]+' = '+formatNumber(value)+' '+m[3]+'.',{value:formatNumber(value),from:m[2],to:m[3]});}
  if((m=text.match(/^(?:calcule\s+|\/calcul\s+)?([+-]?\d+(?:[.,]\d+)?)\s*%\s+de\s+([+-]?\d+(?:[.,]\d+)?)$/))){const value=calculate(m[1]+'/100*'+m[2]);return result('percentage',m[1]+' % de '+m[2]+' = '+formatNumber(value)+'.',{value:formatNumber(value)});}
  if((m=text.match(/^(augmenter|augmente|reduire|reduis|diminuer|diminue)\s+([+-]?\d+(?:[.,]\d+)?)\s+de\s+([+-]?\d+(?:[.,]\d+)?)\s*%$/))){const value=calculate(m[2]+'*(1'+(/^aug/.test(m[1])?'+':'-')+m[3]+'/100)');return result('percentage',formatNumber(value)+'.',{value:formatNumber(value)});}
  text=text.replace(/^(?:\/calcul|calcule|calculer|combien (?:font|fait|donne))\s*:?\s*/,'').replace(/\bfois\b/g,'*').replace(/\bplus\b/g,'+').replace(/\bmoins\b/g,'-').replace(/\bdivise par\b/g,'/');
  if(/^[\d\s.,()+*/^%×÷−-]+$/.test(text)&&/[+*/^%×÷−-]/.test(text.replace(/^[+-]/,''))){const value=calculate(text);return result('arithmetic',text+' = '+formatNumber(value)+'.',{value:formatNumber(value),approximate:value.n*10n**10n%value.d!==0n});}
  if(explicit)throw Error('Format : /calcul (4 * 3) + 7 ; /budget 18 ; 4 * 3 + 7 ; 2,5 km en m.');
 }catch(error){return {kind:'calculation-error',reply:error.message,verification:{status:'input-error',scope:'arithmetic'}};}
 return null;
}
