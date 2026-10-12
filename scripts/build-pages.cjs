// Build a static copy without changing the full application's server routes.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {spawnSync}=require('node:child_process');
const source=path.resolve(__dirname,'..');
const stage=fs.mkdtempSync(path.join(os.tmpdir(),'restory-pages-'));
const basePath=process.env.RESTORY_BASE_PATH || '/Re';
if(!/^\/[A-Za-z0-9_-]+$/.test(basePath))throw Error('RESTORY_BASE_PATH must be one repository path, such as /Re.');
function copy(from,to){
 if(fs.statSync(from).isDirectory()){
  fs.mkdirSync(to,{recursive:true});
  for(const name of fs.readdirSync(from)){
   if(from===path.join(source,'app')&&name==='api')continue;
   copy(path.join(from,name),path.join(to,name));
  }
 }else fs.writeFileSync(to,fs.readFileSync(from));
}
try{
 for(const name of ['app','lib','public','package.json','package-lock.json','tsconfig.json','next.config.mjs','postcss.config.mjs','next-env.d.ts'])copy(path.join(source,name),path.join(stage,name));
 fs.symlinkSync(path.join(source,'node_modules'),path.join(stage,'node_modules'),'dir');
 const css=path.join(stage,'app','globals.css');
 fs.writeFileSync(css,fs.readFileSync(css,'utf8').replaceAll("url('/fonts/",`url('${basePath}/fonts/`));
 const result=spawnSync(process.execPath,[path.join(source,'node_modules','next','dist','bin','next'),'build'],{cwd:stage,stdio:'inherit',env:{...process.env,RESTORY_STATIC_EXPORT:'true',RESTORY_BASE_PATH:basePath}});
 if(result.status!==0)process.exitCode=result.status || 1;
 else{
  const output=path.join(source,'out');fs.rmSync(output,{recursive:true,force:true});copy(path.join(stage,'out'),output);fs.writeFileSync(path.join(output,'.nojekyll'),'');
  console.log(`GitHub Pages export ready: ${output} (base path ${basePath})`);
 }
}finally{fs.rmSync(stage,{recursive:true,force:true});}
