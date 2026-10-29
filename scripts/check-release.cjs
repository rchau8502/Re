// Local acceptance only: regression providers are stubbed; no live calls or deployment.
const {spawnSync}=require('node:child_process');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const build=process.argv.includes('--build');
if(process.argv.slice(2).some(arg=>arg!=='--build'))throw Error('Usage: node scripts/check-release.cjs [--build]');
const [major,minor]=process.versions.node.split('.').map(Number);
if(major<22||major===22&&minor<13){console.error('Verification requires Node.js 22.13 or newer for the SQLite reopen checks.');process.exit(1)}
const checks=['backend','writing','passage','world','novel','chapter-history','continuity','threads','backup','storage-recovery','source-style','video','prompts'];
const steps=checks.map(name=>({label:name,args:[path.join(root,'scripts',`check-${name}.cjs`)],timeout:120000}));
if(build)steps.push(
 {label:'TypeScript',args:[require.resolve('typescript/bin/tsc'),'--noEmit'],timeout:120000},
 {label:'Production build',args:[require.resolve('next/dist/bin/next'),'build'],timeout:300000}
);
for(const [index,step] of steps.entries()){
 console.log(`\n[${index+1}/${steps.length}] ${step.label}`);
 const result=spawnSync(process.execPath,step.args,{cwd:root,stdio:'inherit',timeout:step.timeout,env:{...process.env,GEMINI_API_KEY:'',VIDEO_ACCESS_CODE:'',NEXT_TELEMETRY_DISABLED:'1'}});
 if(result.error||result.status!==0){console.error(`FAILED: ${step.label}${result.error?` (${result.error.message})`:''}`);process.exit(result.status||1)}
}
console.log(`\nPASS: ${steps.length} local checks. Live model quality, paid video continuation and deployment are separate acceptance steps.`);
