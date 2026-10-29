// Adapted from Oh Story's report-only prose checks (MIT).
// Source commit and license: docs/integrations/oh-story.md, third-party/oh-story/LICENSE.
export type ProseFinding={type:string;line:number;excerpt:string;message:string;blocking:boolean};
export function reviewProse(text:string):ProseFinding[]{
 const findings:ProseFinding[]=[],lines=text.split(/\r?\n/),seen=new Map<string,number>();
 const add=(type:string,line:number,excerpt:string,message:string,blocking=false)=>{if(findings.length<100)findings.push({type,line,excerpt:excerpt.slice(0,100),message,blocking})};
 let last='',lastLine=0;
 for(let i=0;i<lines.length;i++){
  const raw=lines[i].trim();if(!raw||raw.startsWith('#'))continue;last=raw;lastLine=i+1;
  // Dialogue may legitimately discuss writing or repeat a line. Preserve source positions.
  const prose=raw.replace(/“[^”]*”|「[^」]*」|『[^』]*』|"[^"]*"/g,m=>' '.repeat(m.length));
  if(/细纲|情节点|卷纲|功能标签|目标情绪|字数目标|章首钩子|章尾钩子/.test(prose))add('meta-leak',i+1,raw,'Writing instructions may have leaked into the prose.',true);
  if(/(?:作为(?:一个)?(?:AI|人工智能|语言模型)[，,]|As an AI|TODO|placeholder|[（(](?:此处)?省略)/i.test(prose))add('placeholder',i+1,raw,'Possible placeholder or model commentary.',true);
  if(/不是[^。！？!?\n]{1,60}[，,]而是|声音不[大高][^。！？!?\n]{0,15}却|命运的齿轮|故事才刚刚开始/.test(prose))add('style-pattern',i+1,raw,'Formulaic phrasing: review its function before rewriting.');
  const key=prose.trim();if(key.replace(/[^\p{L}\p{N}]/gu,'').length>=12){if(seen.has(key))add('repetition',i+1,raw,'Repeated narrative line; check for a generation loop.',true);else seen.set(key,i+1)}
 }
 if(last&&!/[。.!！?？…“”"'’』」）)】\]]$/.test(last))add('truncated',lastLine,last.slice(-100),'The ending may be cut off; confirm it is intentional.',true);
 return findings;
}
