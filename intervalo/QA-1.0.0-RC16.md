# Intervalo — QA 1.0.0-rc.16 · Cardápio público indisponível

**Data:** 15/11/2026  
**Repositório:** `gaveblue/gaveblue` · branch `main`  
**Backend:** Supabase `fynaaiazebydorzllwip`, Edge Function `public-menu` v4, `verify_jwt=false`.

## Diagnóstico confirmado

O código de `public-menu` permitia no CORS apenas `apikey,content-type,x-client-info`. A biblioteca do Supabase envia **`authorization`** nas chamadas de `functions.invoke`, inclusive para clientes não autenticados. Isso bloqueia o preflight do navegador e faz a consulta falhar, mas o frontend ocultava a causa com a mesma mensagem genérica de cardápio não publicado.

**Dados atuais consultados no Supabase:**

- `novo-mundo`: restaurante `active`, cardápio `is_published=true`, módulo `cardapio` habilitado, 3 categorias ativas, 3 produtos `available=true` e `show_on_menu=true`; nenhum adicional publicado. **Estava apto a ser exibido**, independentemente do erro de CORS.
- `intervalo27`: restaurante `active`, `is_published=false`, módulo habilitado, 0 categorias e 0 produtos. **Continua propositalmente indisponível** até publicação e cadastro, que não foram alterados por esta correção.

## Correções implantadas

1. `source/supabase/functions/public-menu/index.ts`: CORS passa a permitir `authorization, apikey, content-type, x-client-info, x-retry-count, traceparent, tracestate, baggage`; mantém métodos `POST,OPTIONS` e origem restrita a `https://gaveblue.com.br`.
2. Função pública implantada no Supabase **v4**, status `ACTIVE`, `verify_jwt=false`: visitantes não precisam de sessão. Ela só entrega dados de cardápios que satisfazem as regras de publicação/atividade; não expõe credenciais de serviço.
3. `public-menu.js`: diferencia `published=false` de indisponibilidade/rede, mostra mensagem contextual e link **Tentar novamente**. Não inventa publicação nem oculta erros técnicos como se fossem configuração do restaurante.
4. `index.html`: `public-menu.js?v=1.0.0-rc.16` para renovar cache do PWA, com rodapé `rc.16`.

## Testes

| Teste | Resultado |
|---|---|
| Verificação de estado real do `novo-mundo` | PASSOU: publicado, módulo ativo, 3 categorias, 3 produtos |
| Verificação de estado real do `intervalo27` | CONFIRMADO: não publicado e sem produtos |
| Função `public-menu` implantada e recuperada | PASSOU: v4 ativa, `verify_jwt=false` |
| Cabeçalho `authorization` liberado no CORS publicado | PASSOU por inspeção da função ativa |
| Sintaxe JS da tela | PASSOU |
| Resposta simulada publicada | PASSOU: produto aparece |
| Resposta simulada não publicada | PASSOU: mensagem específica |
| Erro de conexão simulado | PASSOU: mensagem de conectividade, não falsa despublicação |
| Resposta HTTP com `published:false` | PASSOU: descrição de cardápio não publicado |
| Botão Tentar novamente | PASSOU: volta ao endereço do mesmo restaurante |
| Browser real com requisição OPTIONS/POST | PENDENTE: ambiente de teste não conseguiu resolver DNS de `gaveblue.com.br`/Supabase |
| Propagação frontend/host público | NÃO CONFIRMADA |
| Revalidação de funcionário/auth | FORA DO ESCOPO, sem alterações |

## Segurança e rollback

- A função continua aberta para consulta pública **apenas de restaurantes publicados**, com domínio de origem restrito e acesso ao banco via chave de serviço **somente dentro da Edge Function**.
- Nenhuma mudança em banco, estoque, preços, publicação, operações ou cadastro de funcionários.
- Correção já entrou no backend em execução; GitHub Actions não foi utilizado.
- Se necessário, rollback da Edge Function à v3 e da interface à rc.15, mas isso restabelecerá o CORS incorreto e o problema. Não há necessidade de rollback de dados.

**Homologação:** backend e testes simulados aprovados, validação HTTP final em navegador externo ainda pendente.
