import {handle} from '@/lib/engine';
export const dynamic='force-dynamic';
export async function POST(request:Request){return handle('novel',request,true)}
