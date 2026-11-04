# GB+ — Login e cadastro: publicação e homologação

O código de autenticação vive em `gbplus/js/auth.js` e usa Supabase Auth com PKCE.
Este documento é um checklist operacional. **Não colocar Client Secret, senha SMTP nem
chaves `service_role` no GitHub.** O código do cliente já utiliza apenas chave pública.

## Configurações necessárias no Supabase

Projeto do GB+: `layrxmkosyqurpobzmku`

1. **Authentication → URL Configuration**
   - Site URL: `https://gaveblue.com.br/gbplus/`
   - Redirect URL permitida: `https://gaveblue.com.br/gbplus/`
   - Conferir se o domínio real e o domínio configurado são exatamente os mesmos.
2. **Authentication → Providers → Email**
   - Habilitar entrada com e-mail/senha.
   - Habilitar confirmação de e-mail antes de permitir acesso (recomendado).
   - Configurar SMTP próprio para produção e testar entrega, SPF/DKIM/DMARC e spam.
   - Traduzir modelos de confirmação, recuperação e alteração de e-mail usando os modelos oficiais do Supabase.
   - Configurar limites de envio/reenvio e proteção contra abuso.
3. **Authentication → Providers → Google**
   - Habilitar o provedor.
   - Criar um OAuth Web Client no Google Cloud e registrar o URI de callback do Supabase:
     `https://layrxmkosyqurpobzmku.supabase.co/auth/v1/callback`
   - Configurar o domínio autorizado e a tela de consentimento no Google Cloud.
   - Salvar Client ID e Client Secret **somente no painel seguro do Supabase**, nunca no repositório.
   - Liberar o aplicativo para o público pretendido; testar eventuais contas marcadas como usuários de teste.
4. **Dados financeiros**
   - Verificar RLS em `gbplus_documents` e a autorização na função `gbplus_save`.
   - Conferir isolamento: usuário A não acessa títulos, contas ou saldos de B.
   - Testar identidade Google e e-mail/senha com o mesmo e-mail verificado, sem duplicar banco financeiro.

## Comportamento do PWA e PKCE

O PKCE armazena um verificador no ambiente do navegador onde o acesso foi iniciado.
Abrir o link de recuperação/confirmação no navegador de outro aplicativo ou em outro
dispositivo pode invalidar o retorno. Testar explicitamente Chrome, PWA instalado
no Android, outros navegadores e o retorno do Gmail.

Não remover `code`, `state`, tokens ou outros parâmetros de callback **antes**
de o SDK do Supabase processá-los. O GB+ só limpa parâmetros de **erro** reconhecidos,
após capturar uma mensagem apropriada para o usuário.

## Matriz mínima para aprovação antes de produção

- [ ] Cadastro e-mail: e-mail de confirmação chega, usuário confirma e entra.
- [ ] Cadastro e-mail: endereço já existente; mensagem adequada sem revelar identidades.
- [ ] Reenvio da confirmação, inclusive limite de frequência.
- [ ] Login senha certa, senha errada, e-mail ainda não confirmado.
- [ ] Recuperar senha: solicitar, receber, abrir, alterar, voltar, relogar.
- [ ] Login Google: iniciar, selecionar conta, autorizar, retornar ao GB+ autenticado.
- [ ] Login Google cancelado, provedor desativado e falha de rede.
- [ ] Login e-mail e Google no mesmo e-mail verificado sem perder títulos.
- [ ] Sessão persistente após fechar/reabrir o PWA; logout e troca de usuário.
- [ ] Retorno de autenticação não deixa a tela inicial presa; estados offline.
- [ ] Testes no celular, no PWA instalado e no desktop.
- [ ] Verificar no painel do Supabase os logs de Auth sem expor tokens.

**Status:** as melhorias de UX e tratamento de erros podem ser revisadas no GitHub.
O provedor Google, as entregas SMTP e a segurança de produção precisam de validação
na configuração real do Supabase e em dispositivos reais; não foram homologados aqui.
