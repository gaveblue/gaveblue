# GB+ — QA do hotfix 3.0.10 — 2026-11-23

## Diagnóstico confirmado
- A mensagem da captura provém de `startupLimit(...,16000)` em `gbplus/js/app.js`, não de uma exclusão de registros.
- O projeto Supabase `layrxmkosyqurpobzmku` (GB+) foi consultado e encontrado em `INACTIVE`.
- A reativação foi solicitada com sucesso, e o status passou para `COMING_UP` no momento do diagnóstico.

## Verificações estáticas concluídas
- Inicialização em modo somente leitura, sem alterar o repositório financeiro.
- Ação primária "Tentar abrir novamente" continua usando `location.reload()`.
- Link alternativo para `recuperar.html` preservado e devidamente nomeado.
- Mensagens distinguem sem conexão de timeout; nenhuma limpeza automática de `localStorage`, IndexedDB ou cookies.
- Versão de HTML, `version.json` e cache do Service Worker unificada em `3.0.10 / 3010`.
- Lista de assets da versão anterior conservada.

## Pendências de homologação
- Confirmar Supabase `ACTIVE_HEALTHY` e consulta SQL somente leitura.
- Realizar login real em um navegador autorizado e confirmar leitura das contas/lançamentos e sincronização.
- Reabrir o PWA instalado no Android e verificar transição da splash para login ou painel.

**Status:** hotfix de interface validado estaticamente; homologação de ponta a ponta não concluída nesta etapa. Não confundir reativação do banco com validação de login de usuário.
