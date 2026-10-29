'use client';
import {useDeferredValue,useMemo,useState} from 'react';
import type {Story} from '@/lib/story';
import {BOOK_SEARCH_LIMIT,findBookPassages,type BookMatch} from '@/lib/modules/novel/search';
type Props={story:Story;locate:(match:BookMatch,expected:Story)=>void};
export function BookSearch({story,locate}:Props){
 const [open,setOpen]=useState(false),[query,setQuery]=useState(''),[error,setError]=useState('');
 const input=useMemo(()=>({story,query,open}),[story,query,open]);
 const deferred=useDeferredValue(input);
 const result=useMemo(()=>deferred.open?findBookPassages(deferred.story.novel!,deferred.query):{matches:[],hasMore:false},[deferred]);
 const pending=deferred.story!==story||deferred.query!==query;
 return <details className="book-search" onToggle={event=>setOpen(event.currentTarget.open)}><summary>Find across chapters</summary>
  {open&&<><label>Find in book<input aria-label="Find in book" maxLength={200} value={query} onChange={event=>{setQuery(event.target.value);setError('')}} placeholder="Search a name, clue or sentence"/></label><p>Literal, case-insensitive search of chapter prose. Open a result to select its text in the manuscript editor.</p>
   <p role="status">{pending?'Updating results…':!query?'Enter text to search the book.':result.hasMore?`Showing the first ${BOOK_SEARCH_LIMIT} matches. Narrow your search for more specific results.`:result.matches.length?`${result.matches.length} ${result.matches.length===1?'match':'matches'} across chapters.`:'No matches in chapter prose.'}</p>
   <ol className="book-search-results" aria-label="Book search results">{result.matches.map(match=><li key={`${match.chapterId}:${match.start}`}><button disabled={pending} aria-label={`Open match in chapter ${match.chapterNumber}, line ${match.line}: ${match.chapterTitle || 'Untitled chapter'}`} onClick={()=>{try{locate(match,deferred.story);setError('')}catch(e){setError(e instanceof Error?e.message:'The passage could not be opened.')}}}>Chapter {match.chapterNumber} · {match.chapterTitle || 'Untitled chapter'} · line {match.line}</button><p>{match.before}<mark>{match.text}</mark>{match.after}</p></li>)}</ol>
   {error&&<p role="alert">{error}</p>}
  </>}
 </details>;
}
