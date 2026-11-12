# Intervalo — Agente de impressão (Windows, protótipo)

**Atenção:** Este arquivo não é um agente operacional: formata tickets para validação local, sem hardware, rede ou credenciais.

## Teste de prévia
1. Instalar Node.js 22+ no Windows de testes.
2. Abrir o terminal na pasta print-agent.
3. Executar: node agent.mjs --dry-run sample-ticket.json
4. Conferir o texto em dry-run-output. O script não imprime em nenhum dispositivo.

## Pendências de integração
- Verificar driver, comunicação USB/Bluetooth e protocolo real da B&G BG-06.
- Autenticação do agente vinculada a um restaurante e estação, sem service_role no Windows.
- Busca de jobs autenticada, lease atômico, retry, deduplicação, timeout e auditoria.
- Testar acentuação, bobina, ESC/POS se suportado, corte e reimpressão física.
- Nunca transformar texto do cliente em comando da impressora sem sanitização.

**Nenhum equipamento está conectado e nenhuma impressão foi homologada.**
