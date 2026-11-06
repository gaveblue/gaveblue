'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../gbplus');
const source=fs.readFileSync(path.join(root,'js/update.js'),'utf8');
const version=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8'));
// Test pure code without invoking registrations, network checks, user-data writes or reload.
function isolatedUpdate(){
 const prepared=source.replace('(function(){','return (function(){')
  .replace(/\}\)\(\);\s*$/,'return {validRelease,releaseHighlights,notes,els,compareRelease,newerThanInstalled,releaseId};})();');
 const document={
  currentScript:{src:'https://gaveblue.com.br/gbplus/js/update.js'},
  readyState:'loading',
  querySelector:selector=>({content:selector.includes('gbplus-build')?'62':'2.4.8'}),
  addEventListener(){},
  createElement(tag){return new Element(tag);}
 };
 return new Function('document','location','URL',prepared)(document,{href:'https://gaveblue.com.br/gbplus/'},URL);
}
class Element{
 constructor(tag){this.tag=tag;this.children=[];this.parentElement=null;this.textContent='';this.className='';this.hidden=false;this.innerHTML='';}
 append(...children){for(const child of children){this.children.push(child);child.parentElement=this;}}
 replaceChildren(){this.children=[];}
}
test('PWA update center accepts release with more than 80 verified assets',()=>{
 const core=isolatedUpdate();
 assert.ok(version.assets.length>80);
 assert.equal(core.validRelease(version),true);
 assert.equal(core.validRelease({...version,assets:Array.from({length:501},(_,i)=>'./asset'+i+'.js')}),false);
 assert.equal(core.validRelease({...version,assets:['https://other.invalid/malware.js']}),false);
});
test('structured highlighted release notes retain each title, description and icon',()=>{
 const core=isolatedUpdate();
 const highlights=core.releaseHighlights(version);
 assert.equal(highlights.length,version.highlights.length);
 assert.ok(highlights.every((item,i)=>item.title===version.highlights[i].title));
 assert.ok(highlights.every(x=>x.description.length>0));
 assert.ok(highlights.some(x=>x.icon==='file'));
 assert.ok(highlights.some(x=>x.icon==='repeat'));
});
test('legacy plain-text notes still work; no more first-three truncation',()=>{
 const core=isolatedUpdate();
 const six=core.releaseHighlights({notes:['Bancos','Cartões','Gráficos','Segurança','OFX','Novidades']});
 assert.equal(six.length,6);
 assert.deepEqual(six.map(item=>item.icon),['bank','card','chart','shield','file','sparkles']);
});
test('release notes render with textContent, never injecting user-controlled markup',()=>{
 const core=isolatedUpdate();
 const parent=new Element('section');
 const list=new Element('ul');list.parentElement=parent;
 core.els.notes=list;core.els['features-count']=new Element('small');
 core.notes({highlights:[
  {icon:'not-an-allowed-icon',title:'<img src=x onerror=alert(1)>',description:'<script>alert(1)</script>'},
  {icon:'bank',title:'Bancos',description:'78 instituições'}
 ]});
 assert.equal(list.children.length,2);
 assert.equal(list.children[0].children[1].children[0].textContent,'<img src=x onerror=alert(1)>');
 assert.equal(list.children[0].children[1].children[1].textContent,'<script>alert(1)</script>');
 assert.ok(!list.children[0].children[0].innerHTML.includes('onerror'));
 assert.equal(core.els['features-count'].textContent,'2 melhorias');
});
test('code preserves manual update check, download, progress and explicit restart',()=>{
 assert.match(source,/current\(hosted\)/);
 assert.match(source,/if\(info&&compareRelease\(info,installed,installedBuild\)===0\)notes\(info\)/);
 assert.match(source,/manifest\.assets/);
 assert.match(source,/setProgress\(completed\/total\*92/);
 assert.match(source,/location\.assign\(destination\.href\)/);
});

test('app detects build 63 even when semantic version remains 2.4.8',()=>{
 const core=isolatedUpdate();
 assert.ok(core.newerThanInstalled({version:'2.4.8',build:63}));
 assert.equal(core.compareRelease({version:'2.4.8',build:63},'2.4.8',62),1);
 assert.equal(core.compareRelease({version:'2.4.8',build:62},'2.4.8',62),0);
 assert.equal(core.compareRelease({version:'2.4.7',build:999},'2.4.8',62)<0,true);
 assert.equal(core.releaseId({version:'2.4.8',build:63}),'2.4.8:63');
});
