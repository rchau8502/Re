export function textMetrics(text:string) {
  let words=0,characters=0;
  for(const segment of new Intl.Segmenter(undefined,{granularity:'word'}).segment(text))if(segment.isWordLike)words++;
  for(const character of text)characters++;
  return {words,characters,paragraphs:text.trim()?text.trim().split(/\n\s*\n/).length:0,minutes:words?Math.max(1,Math.ceil(words/220)):0};
}
export function findPassages(text:string,query:string) {
  if(!query)return [];
  // Unicode case-folding may change length. Use original offsets for selection.
  const escaped=query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),pattern=new RegExp(escaped,'giu');
  const matches:{start:number;end:number}[]=[];
  for(const match of text.matchAll(pattern)){matches.push({start:match.index!,end:match.index!+match[0].length});if(matches.length===2000)break}
  return matches;
}
