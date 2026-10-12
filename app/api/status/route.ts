import {serviceStatus} from '@/lib/engine';
export const dynamic = 'force-dynamic';
export function GET() { return Response.json(serviceStatus(), {headers:{'Cache-Control':'no-store'}}); }
