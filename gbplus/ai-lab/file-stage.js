// GB+ 2.5.0 preparation: local file preview only. No data is transmitted, persisted or reconciled.
function fileStat(label,value){
 const row=document.createElement('div');row.className='ai-file-stat';
 const name=document.createElement('span');name.textContent=label;
 const val=document.createElement('strong');val.textContent=String(value);
 row.append(name,val);return row;
}
export function installAttachmentStage({fileInput,attachButton,messages,activeChatId,isChatActive,addMessage,formatBRL}){
 if(!fileInput||!attachButton||!messages)return;
 attachButton.addEventListener('click',()=>fileInput.click());
 fileInput.addEventListener('change',()=>{
  const file=fileInput.files?.[0];fileInput.value='';
  if(!file)return;
  const chatId=activeChatId();
  addMessage('Selecionei um arquivo para conferência local.','user',chatId);
  void stage(file,chatId);
 });
 async function stage(file,chatId){
  if(!isChatActive(chatId))return;
  const card=document.createElement('section');card.className='ai-file-preview';
  card.setAttribute('aria-label','Prévia de arquivo financeiro');
  const title=document.createElement('h3');title.textContent='Arquivo selecionado';
  const subtitle=document.createElement('p');subtitle.textContent=String(file.name||'').slice(0,140);
  card.append(title,subtitle);messages.append(card);messages.scrollTop=messages.scrollHeight;
  const ext=(String(file.name||'').split('.').pop()||'').toLowerCase();
  if(file.size<=0||file.size>8_000_000){
   card.append(fileStat('Situação','Não processado'),fileStat('Motivo','Limite de 8 MB por arquivo'));return;
  }
  if(['pdf','xlsx','xls'].includes(ext)){
   const hint=document.createElement('p');
   hint.textContent='O anexo foi selecionado neste dispositivo. A leitura de '+ext.toUpperCase()+
    ' e a conciliação serão ativadas na etapa de importação. Nenhum dado foi transmitido ou gravado.';
   card.append(hint,fileStat('Situação','Aguardando implementação'));return;
  }
  if(!['ofx','csv','txt'].includes(ext)){
   card.append(fileStat('Situação','Formato não suportado'));return;
  }
  try{
   const parser=await import('../js/bank-import-preview.js?v=20261105-82');
   const parsed=parser.parseBankStatement(await file.text(),file.name);
   if(!isChatActive(chatId))return;
   const credits=parsed.records.filter(r=>r.amount>0).reduce((sum,r)=>sum+r.amount,0);
   const debits=parsed.records.filter(r=>r.amount<0).reduce((sum,r)=>sum-r.amount,0);
   card.append(fileStat('Movimentações identificadas',parsed.records.length),
    fileStat('Entradas no extrato',formatBRL(credits)),
    fileStat('Saídas no extrato',formatBRL(debits)));
   const hint=document.createElement('p');
   hint.textContent='Prévia local concluída. A comparação com a conta GB+, a classificação e a confirmação dos lançamentos entram na 2.5.0. Nenhuma operação foi gravada.';
   card.append(hint);
  }catch(error){
   if(!isChatActive(chatId))return;
   const hint=document.createElement('p');
   hint.textContent='Não consegui ler este arquivo: '+String(error.message||'formato desconhecido').slice(0,180);
   card.append(hint,fileStat('Situação','Sem gravação'));
  }
 }
}
