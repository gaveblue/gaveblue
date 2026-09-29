// Prepare the conditional form before app.js binds its fields and navigation.
(() => {
  const form=document.getElementById('receipt-form');
  for(const [prefix,name] of [['payer','pagadorNome'],['receiver','nome']]){
    const old=document.getElementById(prefix+'-search'),results=document.getElementById(prefix+'-results'),input=form.elements.namedItem(name);
    results.remove();old.closest('label').remove();
    input.id=prefix+'-search';input.autocomplete='off';input.placeholder='Digite nome ou CPF/CNPJ para buscar';input.setAttribute('aria-controls',results.id);input.setAttribute('aria-expanded','false');
    input.closest('label').append(results);
  }
  for(const name of ['recebedorBanco','recebedorAgencia','recebedorConta'])form.elements.namedItem(name).closest('label').remove();
  for(const name of ['pagadorIE','pagadorEndereco','pagadorCidade','pagadorCEP','recebedorIE','recebedorEndereco','recebedorCidade','recebedorCEP']){
    const input=form.elements.namedItem(name);input.closest('label').hidden=true;input.dataset.partnerDetail='true';
  }
  const details=form.querySelector('[data-step="5"]');details.dataset.step='6';
  details.querySelector('.panel').id='payment-cheque';
  const review=[...form.querySelectorAll('.step')].at(-1);review.dataset.step='8';
  const method=document.createElement('section');method.className='step';method.dataset.step='5';method.hidden=true;
  method.innerHTML='<div class="panel"><h2>Forma de pagamento</h2><p>Selecione como o pagamento foi realizado.</p><div class="model-grid payment-methods">'+[['cheque','Cheque'],['deposito','Depósito bancário'],['pix','PIX'],['dinheiro','Dinheiro']].map(([value,label])=>'<label class="model-card"><input type="radio" name="formaPagamento" value="'+value+'" '+(value==='cheque'?'checked':'')+'><strong>'+label+'</strong></label>').join('')+'</div></div>';
  details.before(method);
  const extra=document.createElement('div');
  extra.innerHTML='<div id="payment-deposito" class="panel" hidden><h2>Dados do depósito</h2><div class="fields"><label class="wide">Titular da conta<input name="depositoTitular" required maxlength="80" disabled></label><label class="wide">Banco<input name="depositoBanco" required maxlength="100" disabled></label><label>Agência<input name="depositoAgencia" required maxlength="20" disabled></label><label>Conta<input name="depositoConta" required maxlength="25" disabled></label><label>Tipo de conta<select name="depositoTipo" disabled><option value="corrente">Conta corrente</option><option value="poupanca">Poupança</option></select></label></div></div><div id="payment-pix" class="panel" hidden><h2>Dados do PIX</h2><div class="fields"><label>Tipo de chave<select name="pixTipo" disabled><option value="cpf">CPF</option><option value="cnpj">CNPJ</option><option value="email">E-mail</option><option value="telefone">Telefone</option><option value="aleatoria">Chave aleatória</option></select></label><label>Chave PIX<input name="pixChave" required maxlength="100" autocomplete="off" disabled></label></div></div><div id="payment-dinheiro" class="panel" hidden><h2>Pagamento em dinheiro</h2><p>Não é necessário informar dados adicionais.</p></div>';
  const annex=details.querySelectorAll('.panel')[1];for(const panel of [...extra.children])annex.before(panel);
  const attachmentStep=document.createElement('section');attachmentStep.className='step';attachmentStep.dataset.step='7';attachmentStep.hidden=true;attachmentStep.append(annex);review.before(attachmentStep);
  const skip=document.createElement('button');skip.id='skip-attachment';skip.type='button';skip.className='secondary';skip.textContent='Pular por enquanto';skip.hidden=true;document.getElementById('next').before(skip);
  const exit=document.createElement('dialog');exit.id='receipt-exit-dialog';exit.className='form-dialog exit-dialog';exit.setAttribute('aria-labelledby','receipt-exit-title');exit.innerHTML='<p class="eyebrow">RECIBOS COVRE</p><h2 id="receipt-exit-title">Deseja sair do recibo?</h2><p>Salve o recibo preenchido ou saia sem salvar as alterações. Para continuar preenchendo, apenas feche este aviso.</p><div class="exit-actions"><button type="button" id="exit-discard" class="danger">Sair sem salvar</button><button type="button" id="exit-save">Salvar e sair</button><button type="button" id="exit-cancel" class="secondary" autofocus>Apenas fechar</button></div>';document.body.append(exit);
  const steps=document.querySelector('.steps');steps.replaceChildren();
  ['Modelo','Pagador','Recebedor','Emissão','Serviço','Forma de pagamento','Dados do pagamento','Comprovante','Conferência'].forEach((name,index)=>{
    const li=document.createElement('li');li.dataset.title=name;li.title=name;li.setAttribute('aria-label','Etapa '+(index+1)+': '+name);li.innerHTML='<span class="step-dot" aria-hidden="true"></span>';steps.append(li);
  });
})();
