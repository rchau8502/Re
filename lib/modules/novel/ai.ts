import {isNovelState,activeChapter,chapterContinuityCurrent,emptyContinuity,chapterReadiness,blueprintFields,isBlueprint,type NovelAction,type NovelState,type NovelSuggestion} from './index';
import {sourceStyleGuidance} from '../writing/source-style';
import {compilePrompt,promptContext,promptBlueprint,promptContinuity,type PromptContext} from '../ai/prompts';
export const novelActions:NovelAction[]=['outline','blueprint','chapter','review','polish','analyze'];
export function validateNovelRequest(body:Record<string,unknown>){
 if(!novelActions.includes(body.action as NovelAction)||!isNovelState(body.notebook)||typeof body.chapterId!=='string'||!body.notebook.chapters.some(c=>c.id===body.chapterId)||body.chapterId!==body.notebook.activeChapterId||typeof body.requestId!=='string'||!body.requestId.trim()||body.requestId.length>100)throw Error('Provide a valid action, active chapter, notebook and request ID.');
 const action=body.action as NovelAction,notebook=body.notebook;
 if(typeof body.instruction!=='string'||!body.instruction.trim()||body.instruction.length>10000)throw Error('Describe the requested change in at most 10,000 characters.');
 if(body.reference!==undefined&&(typeof body.reference!=='string'||body.reference.length>30000))throw Error('Reference text must be at most 30,000 characters.');
 if(action==='analyze'&&(typeof body.reference!=='string'||!body.reference.trim()))throw Error('Paste a reference passage to analyze.');
 if(['blueprint','chapter','review','polish'].includes(action)&&!chapterContinuityCurrent(notebook,body.chapterId))throw Error('Review and confirm the continuation card for this chapter before using chapter AI.');
 if(action==='chapter'){const errors=chapterReadiness(notebook,body.chapterId);if(errors.length)throw Error(errors.join(' '))}
 if(['polish','review'].includes(action)&&!activeChapter(notebook).body.trim())throw Error('Write or import this chapter before reviewing it.');
 if(!['outline','analyze'].includes(action)&&activeChapter(notebook).body.length>30000)throw Error('AI chapter actions accept at most 30,000 characters; manual editing and backups remain available.');
 return {action,notebook,chapterId:body.chapterId,requestId:body.requestId,instruction:body.instruction,reference:body.reference as string|undefined};
}
export function novelPromptDetails(input:ReturnType<typeof validateNovelRequest>,context:unknown,style=sourceStyleGuidance()){
 const tasks:Record<NovelAction,string>={
  outline:'Plan only the book outline: core conflict, viewpoint and reveal limits, bounded opening, and unresolved author decisions. Do not draft prose or invent approved canon.',
  blueprint:'Plan only this chapter. Supply protagonist goal/choice, before-to-after emotion, concrete conflict, causal story beats, exact ending image/action, withheld revelations, viewpoint, and visible-character range. Do not draft prose.',
  chapter:'Draft ONLY the active chapter, in the manuscript language. Follow its approved blueprint and ending boundary. Show emotion through choices and consequences. Respect what each character and the reader currently know. Do not reveal author-only truths early. Return prose only, without planning labels, placeholders or a promise to continue.',
  review:'Review the chapter for goal/choice, cause-action-result, pacing, payoff, ending hook, continuity and premature revelation. Cite exact excerpts and separate evidence from inference. Do not claim a comprehensive consistency guarantee or modify story facts.',
  polish:'Revise only the current chapter, preserving events, viewpoint, character knowledge and reveal boundaries. Address the user instruction and repetitive/explanatory phrasing through concrete story detail. Return revised prose only. Do not change the plot or update canon.',
  analyze:'Analyze ONLY the supplied reference passage: cite short exact evidence for opening hook, character motive, cause/effect, emotional progression, pacing and ending. Distinguish missing evidence from inference; extract reusable craft principles, not renamed copies of the reference plot.',
 };
 if(input.action==='analyze')return compilePrompt(tasks.analyze,{instruction:input.instruction,reference:input.reference});
 const chapter=activeChapter(input.notebook),position=input.notebook.chapters.findIndex(c=>c.id===chapter.id);
 const chapterContext={title:chapter.title,...(input.action==='outline'?{}:{body:chapter.body}),blueprint:promptBlueprint(chapter.blueprint)};
 const data={instruction:input.instruction,outline:input.notebook.outline,chapter:chapterContext,continuity:promptContinuity(chapterContinuityCurrent(input.notebook,chapter.id)?chapter.continuity:emptyContinuity()),previousChapters:input.notebook.chapters.slice(0,position).map(c=>({title:c.title,summary:c.committedRevision===c.revision?c.summary:undefined,current:c.committedRevision===c.revision})),context:promptContext(context as PromptContext)};
 return compilePrompt(tasks[input.action]+' The text field contains only the requested prose or advice. Author-only truths must not become reader knowledge before the blueprint permits it.',data,style);
}
export function novelPrompt(...args:Parameters<typeof novelPromptDetails>){return novelPromptDetails(...args).prompt}
// Recovery history and thread ledgers are local state, not model input. Preserve the
// full editor snapshot separately for stale Apply/Undo checks.
export function novelRequestNotebook(notebook:NovelState){const {history,threads,...request}=notebook;return request;}
export function novelSchema(action:NovelAction):object{
 if(action!=='blueprint')return {type:'object',properties:{text:{type:'string'}},required:['text'],additionalProperties:false};
 return {type:'object',properties:{blueprint:{type:'object',properties:{...Object.fromEntries(blueprintFields.map(k=>[k,{type:'string'}])),minChars:{type:'integer'},maxChars:{type:'integer'}},required:[...blueprintFields,'minChars','maxChars'],additionalProperties:false}},required:['blueprint'],additionalProperties:false};
}
export function validateNovelSuggestion(action:NovelAction,value:unknown):NovelSuggestion{
 if(!value||typeof value!=='object')throw Error('The writing suggestion was incomplete.');
 const v=value as {text?:unknown;blueprint?:unknown};
 if(action==='blueprint'){const blueprint=v.blueprint;if(!isBlueprint(blueprint)||blueprintFields.some(k=>!blueprint[k].trim()))throw Error('The chapter blueprint was incomplete.');return {action,blueprint}}
 const limit=action==='outline'?15000:30000;
 if(typeof v.text!=='string'||!v.text.trim()||v.text.length>limit)throw Error('The writing suggestion was empty or exceeded the supported length.');
 return {action,text:v.text};
}
