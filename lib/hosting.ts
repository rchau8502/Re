// Public build flags describe hosting capabilities, never provider credentials.
export const STATIC_HOST = process.env.NEXT_PUBLIC_RESTORY_STATIC === 'true';
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';
