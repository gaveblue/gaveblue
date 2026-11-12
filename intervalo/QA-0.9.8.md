# Intervalo — homologação técnica 0.9.8 · PWA Garçom

Data: 12/11/2026. Repositório: `gaveblue/gaveblue` (`main`). Projeto Supabase: `fynaaiazebydorzllwip`.

## Decisão

**LIBERADO PARA TESTE PILOTO ASSISTIDO. NÃO HOMOLOGADO PARA USO COMERCIAL OU VERSÃO 1.0.0.**

Objetivo da versão 0.9.8: corrigir a instalação e a rota direta do PWA Garçom, para que o operador possa abrir a URL de entrada e instalar pelo próprio navegador.

**URL canônica de instalação:** `https://gaveblue.com.br/intervalo/?app=garcom`.

## Evidências aprovadas

| Critério | Resultado | Evidência |
|---|---|---|
| Entrypoint independente com endereço HTTP 200 no GitHub Pages | VALIDADO NO CÓDIGO; HTTP AO VIVO NÃO MEDIDO | Manifest start_url aponta para a pasta /intervalo/ com query app=garcom, cujo index.html existe |
| Fallback de /intervalo/garcom | PASSOU inspeção estática | 404.html raiz inclui rota garcom |
| Manifest correto no PWA do garçom | PASSOU sintaxe/validação de campos | Manifest ID `/intervalo/garcom-pwa`, start URL, scope, standalone, 192/512 SVG |
| Seleção do manifesto após restauração da deep link | PASSOU inspeção de código | `intervaloApplyManifest()` é executado novamente após history.replaceState |
| Retorno do login ao launcher | PASSOU inspeção de código | `destino=garcom` direciona a `/?app=garcom` |
| Launcher sem redirecionamento automático ao único restaurante | PASSOU inspeção de código | Permite clicar no botão de instalação antes de abrir o estabelecimento |
| Ícones PNG em 192 e 512 pixels | PASSOU verificação de arquivos no GitHub | Ambos existem e manifesto os referencia |
| Service Worker com fetch e offline fallback | PASSOU sintaxe e inspeção | Intercepta apenas navegação, prioriza rede; exibe /intervalo/offline.html sem cache de dados privados |
| Códigos JS de portal, garçom, cardápio, catálogo, SW | PASSOU sintaxe | Teste JS `new Function` nos arquivos atuais |
| Edge Functions operacionais | PASSOU inspeção de projeto | `restaurant-core` v7, `restaurant-team` v6 ativas e protegidas por JWT; `public-menu` v2 ativa e pública para somente consulta |
| Site público real no domínio | **NÃO VERIFICADO** | As tentativas de acesso remoto retornaram erro de DNS no ambiente de validação |
| Instalação real no Android | **PENDENTE DE TESTE DO USUÁRIO** | Chrome ou navegador compatível; opções variam |
| Instalação real iOS | **PENDENTE DE TESTE DO USUÁRIO** | Safari → Compartilhar → Adicionar à Tela de Início |
| Login, pedido, cozinha, estoque em múltiplos aparelhos | **PENDENTE** | Teste ponta a ponta com restaurantes reais autorizados |

## Roteiro de teste no Android

1. Abra no Chrome: `https://gaveblue.com.br/intervalo/?app=garcom`.
2. Se precisar de login, entre com uma conta que tenha módulo Garçom habilitado. Ao finalizar, volte ao launcher do Garçom.
3. Abra menu do Chrome (⋮) → `Instalar app` / `Adicionar à tela inicial`, conforme o navegador. Se houver botão `Instalar app do garçom` no painel, também pode usá-lo.
4. Confirme o nome `Intervalo Garçom`, o ícone laranja e abertura em tela de aplicativo.
5. Escolha o restaurante, selecione uma mesa livre, abra uma comanda, adicione produto + observação, envie à cozinha, confira estado e valor.
6. Repita com duas mesas; confirme estados coerentes e ausência de dupla baixa de estoque.
7. Desative temporariamente a internet para testar orientação offline. **Não há envio de pedidos offline.** Restabeleça a rede e confira os dados antes de reenviar.
8. Se alguma tela não refletir a versão, teste em aba anônima sem alterar pedidos reais e confira a publicação do GitHub Pages.

## Cuidados e ressalvas

- Não chamar o teste de **produção homologada**. É liberado **exclusivamente para piloto e identificação de falhas**, a pedido do proprietário.
- Não registrar pedidos de clientes em operação sem verificar isolamento, disponibilidade, execução e fechamento de caixa.
- Não usar GitHub Actions por restrição de cobrança da conta.
- Não é APK nem download de arquivo executável: a instalação é feita via browser como PWA.
- Sem SMTP, sem emissão fiscal, sem impressão automática. A impressão do Caixa e da Cozinha é manual via navegador.
- O problema de DNS impede a comprovação independente de propagação HTTP/HTTPS da URL real.
- A proteção contra senhas vazadas do Supabase foi indicada como desabilitada na revisão anterior e continua item de segurança a validar antes do release comercial.

## Status

✅ Homologação **técnica** de arquivos, rotas e configuração para **teste piloto**.  
⏳ Homologação **funcional** de instalação em celular, domínio ao vivo, segurança e operação real: ainda pendente.

Registro complementar: `QA-0.9.7.md` e `ESCOPO-1.0.0.md`.
