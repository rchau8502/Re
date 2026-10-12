// A local source mirror avoids cloud-offloaded dependency reads on macOS.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {spawnSync,spawn}=require('node:child_process'),{createHash}=require('node:crypto');
const source=path.resolve(__dirname,'..');
const target=process.env.RESTORY_RUNTIME_DIR||path.join(os.tmpdir(),'restory-local-'+createHash('sha256').update(source).digest('hex').slice(0,8));
if(path.resolve(target)===source)throw Error('The runtime directory must differ from the source directory.');
fs.mkdirSync(target,{recursive:true});
// Explicit reads materialize iCloud-offloaded files; native copy/clone can stall.
function materialize(from,to){if(fs.statSync(from).isDirectory()){fs.mkdirSync(to,{recursive:true});for(const name of fs.readdirSync(from))materialize(path.join(from,name),path.join(to,name));}else fs.writeFileSync(to,fs.readFileSync(from));}
for(const item of ['app','lib','public']){fs.rmSync(path.join(target,item),{recursive:true,force:true});materialize(path.join(source,item),path.join(target,item));}
for(const item of ['package.json','package-lock.json','tsconfig.json','next.config.mjs','postcss.config.mjs','next-env.d.ts','.env.local']){const from=path.join(source,item),to=path.join(target,item);if(fs.existsSync(from))fs.writeFileSync(to,fs.readFileSync(from));else if(item==='.env.local')fs.rmSync(to,{force:true});}
console.log('Re:Story local runtime:',target);
function run(args){const r=spawnSync('npm',args,{cwd:target,stdio:'inherit',shell:process.platform==='win32'});if(r.status!==0)process.exit(r.status||1)}
if(!fs.existsSync(path.join(target,'node_modules','next')))run(['ci']);
run(['run','build']);
const child=spawn('npm',['run','start'],{cwd:target,stdio:'inherit',shell:process.platform==='win32'});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
child.on('exit',code=>process.exit(code||0));
