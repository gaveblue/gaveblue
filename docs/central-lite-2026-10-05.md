# Central leve — 20261005-lite-2

## Mudanças implementadas

1. Tailwind 3.4.17 compilado antes da publicação; navegador recebe `utilities.css`, também incluído no cache offline. Configuração, entrada e ferramentas versionadas permitem repetir o build.
2. Removidos Lucide sem uso e pacote Font Awesome inteiro, usado por somente dois ícones. Câmera e flash agora usam SVG inline.
3. Uploads serializados, com prioridade de espera para envios interativos. Um envio já iniciado não é abortado, evitando resultado remoto incerto. Confirmação HTTPS, timeout, IDs e proteção contra duplicidade preservados.
4. Consultas silenciosas de histórico, heartbeat, diretório e filas adiam trabalho durante envio em primeiro plano. As tarefas adiadas são agrupadas e retomadas após liberar o envio. Requisições já iniciadas não são abortadas.
5. Diretório de postos válido em cache permite continuar a inicialização enquanto a atualização ocorre. Primeira utilização ainda aguarda o diretório. Identificação da empresa, restauração do dispositivo e configuração de onboarding não são puladas.
6. Fila IndexedDB enumera metadados por cursor e lê somente o comprovante a processar. Leitura continua isolada por empresa, fecha o banco em falhas e não apaga registros.
7. Digitação agrupa gravações de rascunho em 250 ms. Mudança de campo, câmera, ocultação/saída e fechamento de formulário preservam gravação imediata. Confirmação/descartar cancela gravação atrasada para não recriar rascunho; troca de identidade impede gravar no perfil errado.
8. Modo leve desativa autoplay dos banners e transições/efeitos dispensáveis. Navegação manual e retenção de atual/próximo permanecem; redução de movimento também é respeitada.
9. Câmera de captura limitada continua sendo a opção padrão. Arquivos externos grandes continuam sem decodificação arriscada em celulares modestos; aviso informa tamanho e orienta recaptura leve sem bloquear ou apagar a foto existente.
10. Diagnóstico local `getCentralPerformanceSnapshot()` guarda somente até dez amostras de tamanho, duração e resultado do upload, em memória. Não transmite telemetria, fotos, nomes, URLs, tokens nem identifica usuários.

## Verificação

- 173 testes automatizados aprovados, sem falhas: câmera/lente, pouca memória, upload, duplicidade, confirmação, isolamento de empresas, perfil, fila, rascunho, KM, carrossel e novos casos de desempenho.
- Nove cenários de interface aprovados no Chrome headless: rápido/completo/serviços em 320×568, 375×667 e 768×1024; sem erros JavaScript, campos fora da largura ou perda do acesso ao botão de foto. Campos obrigatórios continuam validados.
- Teste de fila com fake-indexeddb verificou metadados sem Blob, leitura individual e separação de empresas.
- Teste de inicialização mantém navegação aguardando quando não há cache e permite avançar com cache enquanto consulta de postos ainda está pendente.
- Teste de uploads verifica ordem, ausência de concorrência e desbloqueio após falha.
- Nenhum registro de produção foi criado/alterado. Rede dos testes de interface é inteiramente interceptada; dados fictícios.

Os testes não simulam fielmente RAM/CPU dos aparelhos físicos. Não há promessa de tempo fixo em rede móvel. Validar nos dois celulares, na mesma rede, com a mesma foto e versão, incluindo comprovante comprido e legibilidade. O caminho de galeria pode continuar lento se enviar vários megabytes; não se deve tentar resolver isso decodificando uma foto enorme num aparelho com pouca memória.

Não houve migração de provedor, alteração do Supabase/Cloudinary, limpeza de armazenamento ou mudança nas regras financeiras. Evitou-se dividir integralmente o aplicativo em módulos nesta correção: a remoção das bibliotecas desnecessárias reduz trabalho sem alterar a ordem dos manipuladores dos formulários.

## Reproduzir

Com Node e npm disponíveis, na raiz:

```powershell
npm ci --prefix scripts/central-tools --ignore-scripts
npm run build --prefix scripts/central-tools
$env:CENTRAL_TEST_TOOLS = (Resolve-Path scripts/central-tools).Path
node --test --test-isolation=none tests/central-*.test.cjs
# Opcional: CENTRAL_TEST_BROWSER aponta para um Chrome instalado.
node tests/central-performance-browser.cjs
```

Ferramentas somente de desenvolvimento; nenhum pacote novo é instalado no telefone. `utilities.css` é versionado porque o site é estático. Regenerá-lo sempre que mudar classes HTML/JS, inclusive classes montadas dinamicamente (adicionar safelist se necessário).

## Atualização e retorno

Versões do HTML, assets e ambos os service workers alinhadas em `20261005-lite-2`. Não recarregar automaticamente uma página com preenchimento pendente. Para retornar, reverter o commit da otimização e publicar nova identificação de cache; nunca apagar IndexedDB/localStorage para reverter interface.
