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

## Verificação realizada em 4 de novembro de 2026

- Google habilitado no Supabase, preservando e-mail/senha e cadastro com confirmação de e-mail.
- Cliente Web criado no projeto Google Cloud exclusivo `GB Plus`, com origem e callback acima.
- Site URL e URL de retorno exata conferidos no painel do Supabase.
- No domínio oficial, a seleção da conta Google, o consentimento e o retorno autenticado funcionaram.
- Cancelar no Google retornou ao login com a mensagem de cancelamento em português.
- A sessão persistiu ao fechar a aba e reabrir o GB+ no mesmo navegador.
- A conta usada no teste resultou em um usuário e uma identidade Google, sem duplicação nesse fluxo.
- Os cinco testes existentes de autenticação passaram. O cliente mantém PKCE e persistência de sessão.
- Os três registros exclusivos de e-mail do GB+ foram salvos e confirmados por consulta DNS pública.

- Domínio `gbplus.gaveblue.com.br` verificado no Resend, com recebimento desativado.
- SMTP próprio salvo e conferido após recarregar o painel: `smtp.resend.com`, porta 465,
  usuário `resend`, remetente `acesso@gbplus.gaveblue.com.br` e nome `GB+ Gestão Financeira`.
- Credencial restrita a envio pelo domínio do GB+, armazenada apenas no campo seguro
  do Supabase; nenhuma credencial foi incluída nos arquivos do aplicativo.
- Modelos de confirmação, recuperação e alteração de e-mail em português salvos e
  conferidos na prévia. Cópias em `integrations/supabase/email-*.html` preservam os
  placeholders oficiais `{{ .ConfirmationURL }}` e, na alteração, `{{ .NewEmail }}`.
- Recuperação solicitada pelo formulário no domínio oficial; o Resend confirmou
  status `Delivered` para o e-mail de teste. Isso confirma entrega ao provedor de destino,
  não a leitura da mensagem nem a posição na caixa de entrada.
- `emailReady` habilitado após a validação do envio SMTP.

**Pendente:** validação completa de cadastro por e-mail e recuperação com definição de
senha pelo usuário. O Google Cloud ainda está em Testing; a política de privacidade foi
preparada, mas sua publicação e a conclusão do branding estão pendentes de confirmação.

Também permanecem pendentes os testes em celular/PWA instalado, a associação de login
Google a uma conta preexistente com e-mail verificado e registros, e os demais cenários
da matriz que não estejam explicitamente confirmados acima. A configuração e os testes
não excluíram usuários nem títulos e não alteraram RLS ou a estrutura do banco.

## GB+ 2.3.8 — proteção contra abuso e experiência de autenticação (05/11/2026)

**Alterações no aplicativo:** indicador consultivo de força (mínimo de 8 caracteres, sem exigir mistura de letras, números e símbolos); confirmação em tempo real; mensagens para sessões encerradas e links inválidos/expirados; intervalo local de 60 segundos entre pedidos de e-mail de confirmação/recuperação, incluindo troca de senha pelo perfil; tratamento de resposta 429; checklist inicial para conta, saldo de abertura e primeiro lançamento, sem gravar operações automaticamente.

**Proteção efetiva ocorre no servidor.** O intervalo local pode ser contornado e não substitui os rate limits do Supabase Auth, que responde HTTP 429 a requisições excessivas. Documento oficial: https://supabase.com/docs/guides/auth/rate-limits .

**Conferências de servidor pendentes:**
1. [ ] Authentication → Rate Limits: verificar limites atuais para signup, recover, resend, verify, token e envio de e-mails/hora com SMTP Resend; ajustar conforme capacidade real e testes de abuso.
2. [ ] Conferir intervalo de no mínimo 60 segundos para recuperação/confirmação por usuário e proteções por IP, inclusive sem JavaScript.
3. [ ] Avaliar ocorrências de 429 nos logs, limites do provedor de SMTP e necessidade de CAPTCHA/Turnstile, se houver abuso real.
4. [ ] Confirmar política de senha do servidor: mínimo de 8 caracteres e sem exigência de classes; homologar senhas de apenas letras, apenas números e frases longas.
5. [ ] Testar links expirados, usados, inválidos, abertos em outro navegador e reenvio, sem incluir credenciais em logs.
6. [ ] Testar sessão revogada, logout voluntário e alternância entre usuários/dispositivos.
7. [ ] Analisar Security Advisor: proteção contra senhas vazadas desabilitada (pode depender do plano) e aviso da função privilegiada public.gbplus_save. Não modificar a função financeira sem auditar as regras de autorização existentes.

**Limitação desta execução:** o conector Supabase disponível não oferece leitura ou alteração das configurações de rate limits do Auth. Nenhum limite de servidor foi alterado; isso continua pendente no painel administrativo. Nunca armazenar tokens ou chaves administrativas no repositório.
