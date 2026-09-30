// Run before publishing: node recibos-covre/build-release.cjs
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=__dirname,indexPath=path.join(root,'index.html');
const hash=value=>crypto.createHash('sha256').update(value).digest('hex').slice(0,16);
let html=fs.readFileSync(indexPath,'utf8').replace(/(<meta name="app-release" content=")[^"]+(">)/,'$1development$2');
const assets=[];
html=html.replace(/((?:src|href)="\.\/)([^"?]+\.(?:js|css))(?:\?v=[a-f0-9]+)?(")/g,(match,prefix,file,suffix)=>{
  const version=hash(fs.readFileSync(path.join(root,file)));assets.push({file,version});return prefix+file+'?v='+version+suffix;
});
const version=hash(html+JSON.stringify(assets));
html=html.replace('name="app-release" content="development"','name="app-release" content="'+version+'"');
fs.writeFileSync(indexPath,html);fs.writeFileSync(path.join(root,'release.json'),JSON.stringify({version,assets},null,2)+'\n');
console.log('Receipt release: '+version+' ('+assets.length+' versioned assets)');
