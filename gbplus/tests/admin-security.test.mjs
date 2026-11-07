import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../../supabase/functions/gbplus-admin/index.ts',import.meta.url),'utf8');
const moduleSource=source.replace(/^import .*createClient.*;$/m,'').split('\nDeno.serve(')[0];
const {createHandler}=await import('data:text/javascript;base64,'+Buffer.from(moduleSource).toString('base64'));
const owner={id:'11111111-1111-4111-8111-111111111111',email:'owner@example.com',app_metadata:{gbplus_admin:true},user_metadata:{}};
const member={id:'22222222-2222-4222-8222-222222222222',email:'member@example.com',app_metadata:{providers:['google']},user_metadata:{gbplus_profile:{full_name:'Original',phone:'11999999999',address:{city:'Preservada'}},private_note:'not exposed'},encrypted_password:'never expose'};
function fixture(actor=owner){
 const calls=[],events=[];
 const admin={auth:{getUser:async token=>{calls.push(['verify',token]);return {data:{user:actor},error:actor?null:Error('Invalid')};},
  admin:{listUsers:async args=>{calls.push(['list',args]);return {data:{users:[member],total:1,nextPage:null}};},
   getUserById:async id=>({data:{user:id===owner.id?owner:member}}),
   updateUserById:async(id,body)=>{calls.push(['update',id,body]);return {data:{user:{...member,...body}}};}},
  resetPasswordForEmail:async(email,options)=>{calls.push(['recovery',email,options]);return {data:{}};}}};
 const handle=createHandler(()=>admin,event=>events.push(event));
 return {calls,events,send:async(body,headers={})=>{
  const response=await handle(new Request('https://example.com',{method:'POST',headers:{origin:'https://gaveblue.com.br',authorization:'Bearer valid-user-token','content-type':'application/json',...headers},body:JSON.stringify(body)}));
  return {status:response.status,body:await response.json()};
 }};
}
test('rejects anonymous, invalid and forged metadata before listing users',async()=>{
 for(const actor of [null,member,{...member,user_metadata:{gbplus_admin:true}}]){
  const f=fixture(actor),r=await f.send({action:'list'});assert.ok([401,403].includes(r.status));assert.equal(f.calls.filter(c=>c[0]==='list').length,0);
 }
 const f=fixture();assert.equal((await f.send({action:'list'},{authorization:''})).status,401);assert.equal(f.calls.length,0);
});
test('validates live role on every call and rejects suspended admins',async()=>{
 const f=fixture();await f.send({action:'list'});await f.send({action:'list'});assert.equal(f.calls.filter(c=>c[0]==='verify').length,2);
 const banned=fixture({...owner,banned_until:'2099-01-01T00:00:00Z'});assert.equal((await banned.send({action:'list'})).status,403);
});
test('bounded pagination and safe output omit private metadata and secrets',async()=>{
 const f=fixture(),r=await f.send({action:'list',page:1});assert.equal(r.status,200);
 for(const forbidden of ['encrypted_password','private_note','Preservada','never expose'])assert.equal(JSON.stringify(r.body).includes(forbidden),false);
 assert.deepEqual(f.calls.find(c=>c[0]==='list')[1],{page:1,perPage:50});assert.equal((await f.send({action:'list',page:-1})).status,400);
});
test('profile edits preserve other attributes and cannot set privilege, password or email',async()=>{
 const f=fixture();assert.equal((await f.send({action:'profile',user_id:member.id,name:'Nome Novo',phone:'(11) 98888-7777',password:'bad',email:'attacker@example.com',app_metadata:{gbplus_admin:true}})).status,200);
 const update=f.calls.find(c=>c[0]==='update')[2];assert.deepEqual(Object.keys(update),['user_metadata']);
 assert.equal(update.user_metadata.gbplus_profile.full_name,'Nome Novo');assert.deepEqual(update.user_metadata.gbplus_profile.address,{city:'Preservada'});
 assert.equal(update.user_metadata.gbplus_profile.phone,'11988887777');assert.equal(f.events[0].action,'profile');assert.equal(JSON.stringify(f.events).includes('Nome Novo'),false);
});
test('protects admin accounts and supports only reversible member suspension',async()=>{
 const f=fixture();assert.equal((await f.send({action:'suspend',user_id:owner.id})).status,409);
 await f.send({action:'suspend',user_id:member.id});await f.send({action:'reactivate',user_id:member.id});
 assert.deepEqual(f.calls.filter(c=>c[0]==='update').map(c=>c[2]),[{ban_duration:'876000h'},{ban_duration:'none'}]);
 assert.equal((await f.send({action:'delete',user_id:member.id})).status,400);
});
test('recovery recipient and redirect cannot be overridden by caller',async()=>{
 const f=fixture();assert.equal((await f.send({action:'recovery',user_id:member.id,email:'attacker@example.com',redirectTo:'https://evil.example'})).status,200);
 assert.deepEqual(f.calls.find(c=>c[0]==='recovery').slice(1),['member@example.com',{redirectTo:'https://gaveblue.com.br/gbplus/'}]);
});
test('rejects untrusted origins and oversized input before authorization',async()=>{
 const f=fixture();assert.equal((await f.send({action:'list'},{origin:'https://evil.example'})).status,403);
 assert.equal((await f.send({action:'list',padding:'x'.repeat(3000)})).status,413);assert.equal(f.calls.length,0);
});
