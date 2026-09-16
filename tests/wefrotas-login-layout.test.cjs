const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const css=fs.readFileSync(path.join(__dirname,'../wefrotas/wefrotas-login.css'),'utf8');
const rule=s=>css.slice(css.indexOf(s),css.indexOf('}',css.indexOf(s))+1);
test('scroll lock is scoped to authentication',()=>{
  assert.match(rule('body.auth-locked {'),/position: fixed/);
  assert.match(rule('html:has(body.auth-locked)'),/overflow: hidden/);
  assert.match(rule('html:has(body.auth-locked)'),/scrollbar-gutter: auto/);
});
test('loading overlay clips animated progress horizontal overflow',()=>assert.match(rule('.online-auth-checking {'),/overflow: hidden/));
test('card fits dynamic viewport and remains internally accessible',()=>{
  const r=rule('.online-auth-loading-card {');assert.match(r,/100dvh/);assert.match(r,/overflow: auto/);assert.match(r,/scrollbar-width: none/);assert.match(r,/box-sizing: border-box/);
});
test('login stylesheet has a new version',()=>assert.match(fs.readFileSync(path.join(__dirname,'../wefrotas/index.html'),'utf8'),/wefrotas-login.css\?v=20260915-fixed-login-1/));
