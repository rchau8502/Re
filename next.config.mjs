import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const staticHost=process.env.RESTORY_STATIC_EXPORT==='true';
const basePath=staticHost?(process.env.RESTORY_BASE_PATH || '/Re'):'';
export default {
 outputFileTracingRoot:root,images:{unoptimized:true},
 ...(staticHost?{output:'export',basePath,trailingSlash:true}:{}),
 env:{NEXT_PUBLIC_RESTORY_STATIC:String(staticHost),NEXT_PUBLIC_BASE_PATH:basePath},
};
