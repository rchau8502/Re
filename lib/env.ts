const requiredPublic = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? 'CanonKeep',
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

export const env = {
  ...requiredPublic,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  openAiApiKey: process.env.OPENAI_API_KEY,
  openAiModel: process.env.OPENAI_MODEL ?? 'gpt-5',
  openAiExtractionModel: process.env.OPENAI_EXTRACTION_MODEL ?? process.env.OPENAI_MODEL ?? 'gpt-5',
  openAiReasoningEffort: process.env.OPENAI_REASONING_EFFORT ?? 'medium',
  openAiVectorStoreId: process.env.OPENAI_VECTOR_STORE_ID,
};

export const isSupabaseConfigured = Boolean(requiredPublic.supabaseUrl && requiredPublic.supabaseAnonKey);
export const isOpenAiConfigured = Boolean(env.openAiApiKey);
export const isDemoMode = !isSupabaseConfigured;
