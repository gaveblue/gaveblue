// All requests are fulfilled locally or blocked. Never sends customer records.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.CENTRAL_TEST_TOOLS ? path.join(process.env.CENTRAL_TEST_TOOLS,'node_modules/playwright') : 'playwright');
const root=path.resolve(__dirname,'..');
const station={name:'Posto de teste',city:'Cidade teste',address:'Endereço fictício',active:true};
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CENTRAL_TEST_BROWSER || 'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try {
 for(const viewport of [{width:320,height:568},{width:375,height:667},{width:768,height:1024}]){
  const context=await browser.newContext({viewport,serviceWorkers:'block'});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await context.route('**/*',async route=>{
   const u=new URL(route.request().url());
   if(u.hostname==='central.fixture.test'){
    const file=path.resolve(root,'.'+decodeURIComponent(u.pathname === '/' ? '/postoscredenciados-covreecia/index.html':u.pathname));
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return route.fulfill({status:404,body:''});
    const type={'.html':'text/html','.css':'text/css','.js':'application/javascript','.png':'image/png','.jpeg':'image/jpeg','.jpg':'image/jpeg','.webmanifest':'application/manifest+json'}[path.extname(file)];
    return route.fulfill({status:200,body:fs.readFileSync(file),contentType:type || 'application/octet-stream'});
   }
   if(u.pathname.includes('/functions/v1/')){
    const request=route.request().postDataJSON()||{};
    const result={ok:true,records:[],drivers:[],vehicles:[],banners:[],stations:[station],cities:[],config:{},organization:{slug:'covre-e-cia',workspaceId:'covre-e-cia',name:'Empresa fictícia',modules:['central'],branding:{}}};
    assert.ok(!['register','create','save-record'].includes(request.action),'no write action allowed');
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(result)});
   }
   return route.fulfill({status:200,body:'',contentType:u.hostname.includes('fonts')?'text/css':'text/plain'});
  });
  await page.addInitScript(()=>{
   Object.defineProperty(navigator,'deviceMemory',{get:()=>2});
   localStorage.setItem('postoscredenciados-covreecia:driver-profile-v1',JSON.stringify({name:'Motorista fictício',vehicle:'Veículo teste',plate:'TST0001',driverId:'test-driver',vehicleId:'test-vehicle'}));
   localStorage.setItem('postoscredenciados-covreecia:station-directory-cache-v1',JSON.stringify({stations:[{name:'Posto de teste',city:'Cidade teste',address:'Endereço fictício'}],cities:[]}));
  });
  await page.goto('https://central.fixture.test/postoscredenciados-covreecia/index.html',{waitUntil:'load'});
  await page.waitForFunction(()=>centralStartupNavigationReady);
  assert.match(await page.locator('#central-about-version').textContent(),/Versão 3\.00/);
  assert.match(await page.locator('#central-about-address').textContent(),/Agenor Luiz Heringer, 463/);
  assert.equal(await page.locator('#central-about-address').evaluate(el=>el.hidden),false);
  for(const mode of ['rapido','completo','servicos']){
   await page.evaluate(mode=>{
    hideCentralReconfigurationNotice();
    document.getElementById('driver-profile-modal')?.classList.add('hidden');
    // Local fixture only: restore profile after intentionally empty remote directory.
    localStorage.setItem(DRIVER_PROFILE_STORAGE_KEY,JSON.stringify({name:'Motorista fictício',vehicle:'Veículo teste',plate:'TST0001',driverId:'test-driver',vehicleId:'test-vehicle'}));
    if(mode==='servicos')openLooseNoteForm();else openFuelFormMenu(mode);
   },mode);
   const id=mode==='servicos'?'loose-note-form':'fuel-form';
   const state=await page.evaluate(id=>{
    const form=document.getElementById(id);const visible=el=>el.getBoundingClientRect().width>0&&el.getBoundingClientRect().height>0;
    const inputs=[...form.querySelectorAll('input,select')].filter(visible);
    return {formVisible:visible(form),overflows:inputs.filter(el=>el.getBoundingClientRect().right>innerWidth+2||el.getBoundingClientRect().left < -2).map(el=>el.id),requiredKm:form.querySelector('#fuel-km')?.required,bodyWidth:document.documentElement.scrollWidth,width:innerWidth,buttons:[...form.querySelectorAll('button')].filter(visible).map(b=>b.textContent.trim())};
   },id);
   assert.equal(state.formVisible,true);assert.deepEqual(state.overflows,[]);assert.ok(state.bodyWidth<=state.width+2);
   if(mode!=='servicos')assert.equal(state.requiredKm,true);
   assert.ok(state.buttons.some(x=>/Tirar Foto/.test(x)));
   const valid=await page.evaluate(id=>window.CentralFormPages.validate(id),id);assert.equal(valid,false);
   const camera=page.locator(`#${id} button`).filter({hasText:'Tirar Foto'}).first();await camera.scrollIntoViewIfNeeded();
   assert.ok(await camera.isVisible());
   if(process.env.CENTRAL_TEST_SCREENSHOTS)await page.screenshot({path:path.join(process.env.CENTRAL_TEST_SCREENSHOTS,`central-${viewport.width}-${mode}.png`)});
   console.log(JSON.stringify({viewport,mode,result:'PASS'}));
  }
  assert.deepEqual(errors,[]);await context.close();
 }
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
