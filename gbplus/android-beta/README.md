# GB+ Android Beta — pacote de avaliação

Este protótipo **não é o aplicativo Android de produção** e **não lê notificações bancárias**. Ele contém um WebView Android restrito ao endereço `https://gaveblue.com.br/gbplus/`, aproveitando o GB+ web já publicado. O código PWA/servidor permanece inalterado.

## Proteções da beta

- Requisita apenas `INTERNET`. Não inclui serviços de leitura de notificações, SMS, Accessibility ou permissões de câmera/microfone.
- Carrega somente o domínio e caminho oficiais por HTTPS; sites externos são abertos no navegador padrão, não dentro do WebView.
- Bloqueia conexões sem TLS, erros de certificado, conteúdo misto, acesso arbitrário a arquivos e pontes JavaScript nativas.
- JavaScript e armazenamento DOM ficam ativos porque são necessários ao GB+; arquivos só podem ser escolhidos manualmente pelo usuário.
- Dados continuam sob a autenticação do GB+ no site oficial; a versão experimental pode ter limitações de autenticação por link, atualização, backup e integrações que exigem navegador externo.
- **Não é possível afirmar segurança total sem auditoria independente, teste em aparelho e validação de dados de teste.**

## Decisão do projeto: sem GitHub Actions

A pedido do responsável, **GitHub Actions é considerado indisponível para o GB+**. A branch Android **não contém mais workflows** e não depende da recuperação de runners.

O caminho prioritário para obter um **APK instalável do GB+ PWA** é o [PWABuilder](https://www.pwabuilder.com/): informar `https://gaveblue.com.br/gbplus/`, escolher Android, gerar pacote assinado e guardar o keystore. A TWA gerada NÃO acessa notificações bancárias de outros aplicativos. Detalhes e instruções de `assetlinks.json`: [BUILD-SEM-GITHUB-ACTIONS.md](./BUILD-SEM-GITHUB-ACTIONS.md).

Para evoluir a leitura opcional de notificações Pix, o projeto nativo nesta pasta pode ser compilado **localmente com Android Studio**, Java, Gradle e SDK, usando scripts que validam assinatura e checksum SHA-256:
- Linux/macOS: `bash scripts/build-release-local.sh`;
- Windows PowerShell: `powershell -File scripts/build-release-local.ps1`;
- Testes estáticos independentes: `node scripts/security-check.mjs`.

Use um keystore privado **persistente**, fora do repositório. O arquivo não deve ser compartilhado nem comitado.

**Estado:** o projeto nativo ainda não foi compilado nem instalado neste ambiente, pois aqui faltam Gradle/Android SDK e não há acesso à rede para baixar dependências. Não existe APK nativo homologado ou disponibilizado por este projeto. As verificações estáticas de segurança não substituem uma compilação nem testes em Android.

Por segurança, não ative acesso a notificações nem conceda permissões extras por fora das configurações oficiais. Não ignore alertas do Google Play Protect. Não utilize dados financeiros reais até a homologação de autenticação, tela inicial, faturas e backup.

## Próxima etapa (não incluída)

Para propor importação a partir de notificações Pix, será necessário desenvolver código nativo separado, configurar a permissão explícita e implementar detecção estrita de apps bancários selecionados, armazenamento temporário mínimo, prevenção de duplicidade e **confirmação obrigatória** dentro do GB+. Essa função não é implementável por PWA isolado e será objeto de revisão de privacidade, Lei Geral de Proteção de Dados e política de distribuição. O Play Protect pode bloquear APKs instalados fora da loja que peçam permissão de leitor de notificações.

## Como compilar localmente

Requer Java 17+, Android SDK 36, Gradle 8.13, Node.js e acesso à rede para dependências. Defina `GB_BETA_KEYSTORE`, `GB_BETA_STOREPASS` e `GB_BETA_KEYPASS` com um certificado de testes sob seu controle e fora da pasta do repositório. Depois execute um dos scripts indicados acima. Em caso de sucesso, a saída ficará em `dist/GBPlus-Android-Beta-0.1.0.apk` com `SHA256SUMS.txt`.

