// GB+ AI conversation history, stored on this device per authenticated user.
// Nothing is written to Supabase; this module never mutates financial records.
const PREFIX='gbplus-ai-chats-v1:';
const safeId=()=>crypto.randomUUID();
const now=()=>new Date().toISOString();
const empty=()=>({id:safeId(),title:'Novo chat',createdAt:now(),updatedAt:now(),messages:[]});
function validMessage(message){
 return message&&['user','assistant'].includes(message.who)&&typeof message.text==='string'&&typeof message.at==='string';
}
function readUser(id){
 try{
  const doc=JSON.parse(localStorage.getItem(PREFIX+id)||'null');
  const chats=Array.isArray(doc?.chats)?doc.chats.filter(c=>c&&typeof c.id==='string'&&typeof c.title==='string'&&Array.isArray(c.messages)).map(c=>({
   id:c.id,title:c.title.slice(0,90),createdAt:c.createdAt||now(),updatedAt:c.updatedAt||now(),
   messages:c.messages.filter(validMessage).map(m=>({who:m.who,text:m.text,at:m.at}))
  })):[];
  return {chats,activeId:typeof doc?.activeId==='string'?doc.activeId:null};
 }catch{return {chats:[],activeId:null};}
}
export function createChatHistory(onError=()=>{}){
 let owner=null,chats=[],current=null;
 const persist=()=>{
  if(!owner)return;
  try{localStorage.setItem(PREFIX+owner,JSON.stringify({activeId:current,chats}));}
  catch{onError('Sem espaço para salvar o histórico neste dispositivo. As mensagens desta sessão ainda estão disponíveis.');}
 };
 const init=()=>{
  if(!chats.length)chats.push(empty());
  if(!chats.some(c=>c.id===current))current=chats[0].id;
 };
 return {
  setUser(id){
   const next=typeof id==='string'&&/^[a-z0-9-]{8,}$/i.test(id)?id:null;
   if(owner===next&&chats.length)return false;
   owner=next;
   const state=owner?readUser(owner):{chats:[],activeId:null};
   chats=state.chats;current=state.activeId;
   init();persist();return true;
  },
  list(){return [...chats].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));},
  active(){return chats.find(c=>c.id===current)||null;},
  activeId(){return current;},
  create(){
   const chat=empty();chats.unshift(chat);current=chat.id;persist();return chat;
  },
  select(id){if(!chats.some(c=>c.id===id))return false;current=id;persist();return true;},
  remove(id){
   const index=chats.findIndex(c=>c.id===id);if(index<0)return false;
   chats.splice(index,1);if(current===id)current=chats[0]?.id||null;
   init();persist();return true;
  },
  append(id,who,text){
   const chat=chats.find(c=>c.id===id);
   if(!chat||!['user','assistant'].includes(who))return false;
   const message={who,text:String(text),at:now()};chat.messages.push(message);
   if(who==='user'&&chat.title==='Novo chat'){
    chat.title=String(text).replace(/\s+/g,' ').trim().slice(0,55)||'Novo chat';
   }
   chat.updatedAt=message.at;persist();return true;
  },
  stored(){return !!owner;}
 };
}
