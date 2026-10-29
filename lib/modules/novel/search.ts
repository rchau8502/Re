import type {NovelState} from './index';
import {findPassages} from '../writing/text';
export type BookMatch={chapterId:string;chapterTitle:string;chapterNumber:number;start:number;end:number;line:number;before:string;text:string;after:string};
export const BOOK_SEARCH_LIMIT=100;
export function findBookPassages(novel:NovelState,query:string){
 const matches:BookMatch[]=[];
 if(!query)return {matches,hasMore:false};
 if(query.length>200)throw Error('Search text must be at most 200 characters.');
 for(const [index,chapter] of novel.chapters.entries()){
  for(const match of findPassages(chapter.body,query)){
   if(matches.length===BOOK_SEARCH_LIMIT)return {matches,hasMore:true};
   const before=Array.from(chapter.body.slice(Math.max(0,match.start-120),match.start)).slice(-50).join('');
   const after=Array.from(chapter.body.slice(match.end,match.end+120)).slice(0,50).join('');
   matches.push({chapterId:chapter.id,chapterTitle:chapter.title,chapterNumber:index+1,...match,line:chapter.body.slice(0,match.start).split('\n').length,before,text:chapter.body.slice(match.start,match.end),after});
  }
 }
 return {matches,hasMore:false};
}
