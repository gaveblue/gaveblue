# Intervalo — QA 1.0.0-rc.12 · Carregamento da Gestão

Data: 15/11/2026 · repositório `gaveblue/gaveblue` · branch `main`.

## Escopo
Aplicação do carregamento no novo visual da Gestão: skeleton com dimensões de cabeçalho, KPIs, módulos e painéis; animação shimmer discreta; texto de status de carregamento; indicador fino durante atualizações; feedback `Salvando...` e `Concluindo...` em Dados do restaurante. Nenhuma alteração nos formulários, credenciais ou regras de Equipe/Permissões.

## Implementação
- `intervalo/management.js`: `renderLoading()`, chamado antes da requisição inicial; `refresh()` controla indicador e `aria-busy` com `try/finally`, inclusive se a API falhar; a renderização de dados reais substitui o skeleton.
- `intervalo/management-design-rc11.css`: layout skeleton responsivo e estilos de carregamento com `prefers-reduced-motion: reduce`. Arquivo preserva nome por compatibilidade, cache `?v=1.0.0-rc.12`.
- `intervalo/index.html`: import dinâmico atualizado para `management.js?v=1.0.0-rc.12`.
- Salvamento dos dados do restaurante bloqueia o botão durante a operação e exibe `Salvando...` / `Concluindo...`; estado é restaurado em erros sem afetar os formulários de funcionários.

## Testes

| Teste | Resultado | Evidência |
|---|---|---|
| Sintaxe JavaScript | PASSOU | Código compilado depois de remover import/export |
| Skeleton aparece antes da resposta | PASSOU | Promise de `restaurant-team.list` adiada durante simulação |
| Mostra cartões KPI/módulos de placeholder | PASSOU | Verificada a primeira renderização com `mg-v2-skel-kpis` |
| Sinaliza acessibilidade durante carregamento | PASSOU | `aria-busy=true`, `role=status` e descrição |
| Skeleton desaparece quando API responde | PASSOU | Dashboard real substitui a tela em simulação DOM |
| Indicador encerra após sucesso | PASSOU | `aria-busy=false`, `is-refreshing` removido |
| Falha de API não deixa skeleton infinito | PASSOU | Mensagem de erro substitui o loader e indicador é removido |
| Botões salvar/concluir têm estados de progresso | PASSOU por inspeção | Botão desabilitado durante operação e restaurado em `finally` |
| Respeita reduzir animações | PASSOU por inspeção CSS | `prefers-reduced-motion: reduce` |
| Módulo Equipe e permissões | NÃO ALTERADO | Chamadas e formulários existentes preservados |
| Android/PWA e computador reais | PENDENTE | Não disponível teste autenticado em navegador neste ambiente |
| Publicação e propagação HTTP | NÃO VERIFICADA | Commit na `main` não demonstra propagação no domínio |

## Validação manual recomendada
1. Abra a Gestão em `https://gaveblue.com.br/intervalo/novo-mundo/gestao` depois de autenticar.
2. Observe skeleton enquanto as consultas são realizadas e a troca automática pelo painel real.
3. Confira que nenhum número aparece como dado real antes do carregamento.
4. Entre em Dados do restaurante, altere um campo e salve: botão deverá mostrar `Salvando...` durante a requisição, sem aceitar toques repetidos.
5. Teste em conexão lenta e em modo reduzido de movimento.
6. Reabra o PWA instalado para validar o cache `rc.12`.

**Homologação:** técnica parcial. Não foi comprovada a propagação nem houve execução de GitHub Actions.
