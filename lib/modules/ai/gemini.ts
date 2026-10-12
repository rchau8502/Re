import { GoogleGenAI } from '@google/genai';
import type { AIProvider, GenerationRequest, GenerationResult } from './types';
export class GeminiProvider implements AIProvider {
  constructor(private apiKey: string, private model: string) {}
  async generate(request: GenerationRequest): Promise<GenerationResult> {
    const ai = new GoogleGenAI({apiKey:this.apiKey,httpOptions:{timeout:15000}});
    const result = await ai.models.generateContent({
      model:this.model,contents:request.prompt,
      config:{abortSignal:request.signal,...(request.grounded ? {tools:[{googleSearch:{}}]} : {responseMimeType:'application/json',responseJsonSchema:request.schema}),maxOutputTokens:8192},
    });
    const sources=(result.candidates?.[0]?.groundingMetadata?.groundingChunks || []).flatMap(chunk=>{
      const uri=chunk.web?.uri;
      if(!uri)return [];
      try { const url=new URL(uri);return ['http:','https:'].includes(url.protocol)?[{title:chunk.web?.title || uri,url:url.toString()}]:[]; } catch{return [];}
    });
    return {text:result.text || '',sources};
  }
}
