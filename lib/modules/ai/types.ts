// SDK-neutral server-side provider contract. Domain modules depend on this contract.
export interface GenerationRequest { prompt: string; signal: AbortSignal; schema?: object; grounded?: boolean }
export interface GenerationResult { text: string; sources: {title:string;url:string}[] }
export interface AIProvider { generate(request: GenerationRequest): Promise<GenerationResult> }
