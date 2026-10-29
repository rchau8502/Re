// Run against a local production server. Each scenario uses a fresh browser context.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(require.resolve('playwright',{paths:[process.env.RESTORY_BROWSER_MODULES||process.cwd()]}));
const base=process.env.RESTORY_TEST_URL||'http://127.0.0.1:3038';
const url=new URL(base);
if(!['127.0.0.1','localhost','[::1]'].includes(url.hostname))throw Error('UI acceptance only runs against a local server.');
const output=path.resolve(process.env.RESTORY_UI_OUTPUT||'output/release-2026-10-28');
const key='restory-workspaces-v2',original='{"damaged":"原稿 📝",';
fs.mkdirSync(output,{recursive:true});
async function waitFor(check,message){for(let i=0;i<100;i++){if(await check())return;await new Promise(resolve=>setTimeout(resolve,100))}throw Error(message)}
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.RESTORY_BROWSER_EXECUTABLE?{executablePath:process.env.RESTORY_BROWSER_EXECUTABLE}:{})}),errors=[],posts=[],results=[];
 async function context(seed=false,refuse=false){
  const ctx=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
  if(seed)await ctx.addInitScript(({key,original,refuse})=>{
   if(!sessionStorage.getItem('restory-ui-seeded')){localStorage.setItem(key,original);sessionStorage.setItem('restory-ui-seeded','true')}
   if(refuse){const write=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k.startsWith('restory-unreadable-backup'))throw new DOMException('Injected quota refusal','QuotaExceededError');return write.call(this,k,v)}}
  },{key,original,refuse});
  const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()==='POST'&&new URL(r.url()).pathname.startsWith('/api/'))posts.push(r.url())});
  await page.goto(base);await page.getByRole('button',{name:'Open video studio',exact:true}).waitFor({state:'visible'});
  await waitFor(()=>page.getByRole('button',{name:'Open video studio',exact:true}).isEnabled(),'App did not finish loading');
  return {ctx,page};
 }
 async function create(page,text){await page.getByRole('button',{name:'Novel',exact:true}).click();await page.getByRole('textbox',{name:'Story input',exact:true}).fill(text);await page.getByRole('button',{name:'Start writing',exact:true}).click()}
 async function download(page,name,file){const pending=page.waitForEvent('download');await page.getByRole('button',{name,exact:true}).click();const d=await pending;await d.saveAs(path.join(output,file));return fs.readFileSync(path.join(output,file),'utf8')}
 try{
  const normal=await context(),page=normal.page,text='雨停了。沈航收起信封，走向站台。\nThe letter stayed sealed. 📝';
  await create(page,text);await page.getByRole('textbox',{name:'Story',exact:true}).waitFor();assert.equal(await page.getByRole('textbox',{name:'Story',exact:true}).inputValue(),text);
  await page.getByRole('button',{name:'Enable chapter workflow',exact:true}).click();await page.getByRole('button',{name:'Add chapter',exact:true}).click();
  const second='第二章：列车驶入雾中。';await page.getByRole('textbox',{name:'Story',exact:true}).fill(second);
  await waitFor(()=>page.locator('.save-status').textContent().then(value=>value==='Saved on this device'),'Chapter was not saved');
  await page.reload();assert.equal(await page.getByRole('textbox',{name:'Story',exact:true}).inputValue(),second);
  await page.getByRole('button',{name:'Branch',exact:true}).click();const branch=second+'\n分支里的信被打开了。';await page.getByRole('textbox',{name:'Story',exact:true}).fill(branch);
  const backup=await download(page,'Export backup','ui-backup.json');const bundle=JSON.parse(backup);assert.equal(bundle.workspaces.length,2);assert.equal(bundle.workspaces[0].story.scene,branch);assert.equal(bundle.workspaces[1].story.novel.chapters[0].body,text);assert.equal(bundle.workspaces[1].story.scene,second);
  await page.screenshot({path:path.join(output,'writing-desktop.png'),fullPage:true});await page.setViewportSize({width:390,height:844});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Mobile page overflows horizontally');await page.screenshot({path:path.join(output,'writing-mobile.png'),fullPage:true});
  await page.locator('.sidebar-bottom input[type=file]').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(backup)});
  await waitFor(()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)).length===4,key),'Backup was not restored');
  await page.reload();assert.equal(await page.getByRole('textbox',{name:'Story',exact:true}).inputValue(),branch);results.push('Chinese/English exact input, chapters, reload, independent branch, actual backup export/import and mobile layout');await normal.ctx.close();

  const recovered=await context(true);await create(recovered.page,'恢复后继续写作。');await recovered.page.getByRole('textbox',{name:'Story',exact:true}).waitFor();
  await waitFor(()=>recovered.page.locator('.save-status').textContent().then(value=>value==='Saved on this device'),'Recovered project was not saved');
  assert.equal(await recovered.page.evaluate(()=>localStorage.getItem('restory-unreadable-backup')),original);
  await recovered.page.reload();assert.equal(await recovered.page.getByRole('textbox',{name:'Story',exact:true}).inputValue(),'恢复后继续写作。');results.push('Unreadable original preserved byte for byte before new project, new prose survives reload');await recovered.ctx.close();

  const blocked=await context(true,true);await create(blocked.page,'不能丢失的新输入。');await blocked.page.getByRole('alert').filter({hasText:'could not be preserved'}).waitFor();
  assert.equal(await blocked.page.getByRole('textbox',{name:'Story input',exact:true}).inputValue(),'不能丢失的新输入。');assert.equal(await blocked.page.evaluate(key=>localStorage.getItem(key),key),original);
  assert.equal(await download(blocked.page,'Export original storage','original-storage.json'),original);
  await blocked.page.locator('.sidebar-bottom input[type=file]').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(backup)});
  await blocked.page.getByRole('alert').filter({hasText:'could not be preserved'}).waitFor();assert.equal(await blocked.page.evaluate(key=>localStorage.getItem(key),key),original);
  await blocked.page.screenshot({path:path.join(output,'storage-protected.png'),fullPage:true});results.push('Quota refusal blocks creation/import, retains composer and original record, original download works');await blocked.ctx.close();
  assert.deepEqual(errors,[]);assert.deepEqual(posts,[]);
  fs.writeFileSync(path.join(output,'browser-verification.json'),JSON.stringify({passed:true,base,results,pageErrors:errors,generationPosts:posts},null,2));console.log('PASS: '+results.join('; '));
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
