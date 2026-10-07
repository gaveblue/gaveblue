# Câmera leve: captura e confirmação — 07/10/2026

Release técnica: `20261007-camera-lifecycle-1` (versão visível 3.00).

## Falhas corrigidas

- A captura podia começar enquanto a seleção automática de lente ainda alterava a geração da câmera. A imagem codificada era descartada pela proteção de requisição antiga. Agora captura e alternância só são liberadas quando a abertura termina.
- Toques repetidos para abrir reiniciavam a sessão. Abertura em andamento agora é única.
- O OK descartava a revisão antes de concluir a anexação. Agora aguarda resultado positivo; falha ou exceção mantém o arquivo capturado e a revisão para tentar novamente sem fotografar outra vez.
- Falha ao tirar novamente fechava o fluxo. Agora restaura a foto anterior.
- Respostas atrasadas de sessões encerradas não podem anexar streams antigos nem fechar uma sessão nova.
- Falha de abertura mostra instrução e opção explícita de câmera nativa, sem fechamento/tentativa automática em sequência.
- Controles indisponíveis ficam desabilitados com feedback de abertura, captura e anexação. A opção de câmera nativa permanece acessível durante abertura demorada.

Mantidos limite de resolução, confirmação do servidor, rascunhos, Cloudinary e dados existentes. Sem mudanças financeiras, migração ou limpeza de armazenamento. A prévia visual da barra rejeitada pelo usuário não faz parte desta release.

## Validação

- 185 testes automatizados aprovados, incluindo seis novos cenários de ciclo de vida: seleção de lente lenta, múltiplos toques, falha de anexação, falha ao refazer foto, conclusão antiga e oito capturas consecutivas.
- 72 ciclos no Chrome headless com câmera sintética: oito por combinação entre rápido/completo/serviços e 320×568, 375×667, 768×1024. CPU desacelerada 4× e callback de codificação atrasado 300 ms; cada ciclo confirmou arquivo anexado. Nove cenários de interface também passaram.
- A primeira execução do ensaio de navegador atingiu timeout esperando câmera pronta. A repetição completa com diagnóstico de fase passou; isso não demonstra que a demora de hardware do aparelho foi reproduzida ou eliminada.
- Rede dos testes interceptada, dados fictícios, sem uploads de teste a clientes nem câmera física acessada.

Para repetir: usar as ferramentas descritas em `central-lite-2026-10-05.md`; definir `CENTRAL_CAMERA_STRESS=1` ao executar `tests/central-performance-browser.cjs`.

## Aceite físico pendente

Reabrir a Central sem envio pendente, sem limpar dados. Em cada celular afetado, capturar, confirmar e verificar que a foto permanece anexada. Confirmar legibilidade e lente traseira. Caso persista, identificar em qual fase para (abertura, captura, revisão ou anexação) e o modelo/navegador; a simulação não representa integralmente RAM, permissões ou driver de câmera reais.
