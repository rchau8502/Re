import {handle} from '@/lib/engine';
export const dynamic='force-dynamic';
export const maxDuration=90;
export async function POST(request:Request){return handle('novel',request)}
