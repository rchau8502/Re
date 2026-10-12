const string = { type: 'string' };
const strings = { type: 'array', items: string };
const object = (properties: Record<string, unknown>) => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });
export const bibleSchema = object({
  found: { type: 'boolean' }, title: string, mediaType: string, summary: string,
  characters: { type: 'array', items: object({name: string, personality: string, goals: strings, relationships: strings, status: string}) },
  relationships: strings, timeline: strings, worldRules: strings, powerSystem: strings, factions: strings,
  majorEvents: strings, themes: strings, ending: string, importantCanonRules: strings,
  majorDecisionPoints: strings, uncertainties: strings,
});
const preferences = object({
  targetChange: string, startingPoint: string, desiredTone: string,
  outputMedium: {type:'string',enum:['Prose','Outline','Storyboard']},
  outputLength: {type:'string',enum:['Short scene','Full chapter','Story outline']},
  controls: object(Object.fromEntries(['Character personalities','World rules','Power system','Relationships','Timeline','Original ending'].map(k => [k, {type:'number',minimum:0,maximum:100}]))),
  toggles: object({'Allow new characters': {type:'boolean'},'Allow canon contradictions':{type:'boolean'}}),
});
export const directorSchema = object({ reply: string, options: strings, preferences });
export const planSchema = object({premise:string,divergencePoint:string,alternateTimeline:strings,consequences:strings,keep:strings,change:strings});
export const storySchema = object({title:string,premise:string,divergencePoint:string,changesFromCanon:strings,alternateTimeline:strings,storySummary:string,scene:string,storyboard:{type:'array',items:object({shot:string,action:string,dialogue:string})}});
