'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const workerCode=fs.readFileSync(path.resolve(__dirname,'../gbplus/sw.js'),'utf8');

async function offlineRequest(pathname,{current=null,previous=null}={}){
 const listeners={},crossBuildLookups=[];
 const own={match:async()=>current};
 const cacheStore={
  open:async()=>own,
  match:async(request,options)=>{
   crossBuildLookups.push({url:request.url||String(request),options});
   return previous;
  }
 };
 const self={
  registration:{scope:'https://gaveblue.com.br/gbplus/'},
  addEventListener:(type,fn)=>{listeners[type]=fn;}
 };
 vm.runInNewContext(workerCode,{
  self,caches:cacheStore,
  fetch:async()=>{throw Error('offline');},
  URL,AbortController,Response,setTimeout,clearTimeout,Promise
 },{filename:'sw.js'});
 let pending;
 listeners.fetch({
  request:{method:'GET',url:'https://gaveblue.com.br/gbplus/'+pathname,mode:'cors'},
  respondWith:response=>{pending=response;},
  waitUntil(){}
 });
 assert.ok(pending,'service worker must intercept scoped requests');
 return {response:await pending,crossBuildLookups};
}

test('offline PWA never falls back to arbitrary old unversioned code',async()=>{
 const result=await offlineRequest('js/legacy.js',{previous:{from:'old-build'}});
 assert.equal(result.crossBuildLookups.length,0);
 assert.equal(result.response.type,'error');
});
test('versioned offline asset fallback uses exact prior URL without ignoreSearch',async()=>{
 const old={from:'older-build-matching-URL'};
 const result=await offlineRequest('js/auth.js?v=20261105-69',{previous:old});
 assert.equal(result.response,old);
 assert.equal(result.crossBuildLookups.length,1);
 assert.equal(result.crossBuildLookups[0].options,undefined);
});
test('current-build cache is preferred for downloaded assets',async()=>{
 const current={from:'current-build'};
 const result=await offlineRequest('js/auth.js?v=20261105-69',{current,previous:{from:'old-build'}});
 assert.equal(result.response,current);
 assert.equal(result.crossBuildLookups.length,0);
});
test('offline version verification fails clearly instead of showing a stale release',async()=>{
 const result=await offlineRequest('version.json',{previous:{version:'999.9.9'}});
 assert.equal(result.response.status,503);
 assert.equal(result.crossBuildLookups.length,0);
});
