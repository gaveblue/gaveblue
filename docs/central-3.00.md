# Central 3.00 — 06/10/2026

- Versão 3.00 exibida em Configurações → Sobre.
- Endereço institucional da Covre preservado quando a resposta da empresa não traz endereço; valor remoto preenchido continua tendo prioridade. Outras empresas não recebem esse endereço.
- Preferência antiga por câmera frontal ou de identificação desconhecida não substitui a traseira reconhecida. Frontal identificada pelo navegador é interrompida antes da prévia; a traseira principal é procurada pelo identificador, mantendo limites de resolução e a proteção contra câmera reaberta depois de fechar.
- Câmeras frontais identificadas ficam fora da lista de alternância. Caso não seja possível identificar/abrir uma traseira, permanece o recurso à câmera nativa; não é possível comprovar a escolha física da lente sem testar no aparelho.
- Cache/asset release: `20261006-3.00`. Sem alterações no banco ou nos registros.

Validação: 179 testes automatizados aprovados, incluindo os novos casos de câmera frontal, fechamento durante a troca e endereço por empresa. Nove cenários locais de interface aprovados, com conferência de versão/endereço. As câmeras são simuladas nos testes; validar a lente nos celulares reais após reabrir sem envio em andamento.
