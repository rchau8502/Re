// GitHub Pages advertises the product; Vercel runs the full application.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),source=path.join(root,'landing'),output=path.join(root,'out');
function copy(from,to){if(fs.statSync(from).isDirectory()){fs.mkdirSync(to,{recursive:true});for(const name of fs.readdirSync(from))copy(path.join(from,name),path.join(to,name));}else fs.writeFileSync(to,fs.readFileSync(from));}
for(const name of ['index.html','styles.css','assets/workspace.png'])if(!fs.existsSync(path.join(source,name)))throw Error('Missing landing page file: '+name);
fs.rmSync(output,{recursive:true,force:true});copy(source,output);fs.writeFileSync(path.join(output,'.nojekyll'),'');
console.log('Advertising landing page ready: '+output);
