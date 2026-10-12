import {handle} from '@/lib/engine';
export const runtime = 'nodejs';
export const maxDuration = 90;
export async function POST(request: Request) { return handle('proposals', request); }
