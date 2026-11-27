// Full-file unified diff, bounded to small text files. No execution.
export function unifiedDiff(path,before,after){
 if(typeof path!=='string'||!path.split('/').every(p=>/^[A-Za-z0-9_-][A-Za-z0-9_.-]*$/.test(p))||path.length>240||![before,after].every(x=>typeof x==='string'&&x.length<=26000&&!x.includes('\0')&&!x.includes('\r'))||before===after)throw Error('Invalid diff');
 const lines=s=>s===''?[]:s.endsWith('\n')?s.slice(0,-1).split('\n'):s.split('\n');
 const a=lines(before),b=lines(after);const range=n=>n===0?'0,0':n===1?'1':'1,'+n;
 const emit=(arr,prefix,raw)=>arr.flatMap((line,i)=>[prefix+line,...(i===arr.length-1&&!raw.endsWith('\n')?['\\ No newline at end of file']:[])]);
 return ['diff --git a/'+path+' b/'+path,'--- a/'+path,'+++ b/'+path,'@@ -'+range(a.length)+' +'+range(b.length)+' @@',...emit(a,'-',before),...emit(b,'+',after)].join('\n')+'\n';
}
