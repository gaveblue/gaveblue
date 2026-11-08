# GB+ Android Beta — pacote de avaliação

Este protótipo **não é o aplicativo Android de produção** e **não lê notificações bancárias**. Ele contém um WebView Android restrito ao endereço `https://gaveblue.com.br/gbplus/`, aproveitando o GB+ web já publicado. O código PWA/servidor permanece inalterado.

## Proteções da beta

- Requisita apenas `INTERNET`. Não inclui serviços de leitura de notificações, SMS, Accessibility ou permissões de câmera/microfone.
- Carrega somente o domínio e caminho oficiais por HTTPS; sites externos são abertos no navegador padrão, não dentro do WebView.
- Bloqueia conexões sem TLS, erros de certificado, conteúdo misto, acesso arbitrário a arquivos e pontes JavaScript nativas.
- JavaScript e armazenamento DOM ficam ativos porque são necessários ao GB+; arquivos só podem ser escolhidos manualmente pelo usuário.
- Dados continuam sob a autenticação do GB+ no site oficial; a versão experimental pode ter limitações de autenticação por link, atualização, backup e integrações que exigem navegador externo.
- **Não é possível afirmar segurança total sem auditoria independente, teste em aparelho e validação de dados de teste.**

## Assinatura e APK

O workflow `.github/workflows/android-beta-apk.yml` usa um certificado **temporário gerado no runner** e não o publica. Gera um APK de release, verifica a assinatura e entrega o APK junto com `SHA256SUMS.txt` como artifact de GitHub Actions. **Não utilizar como produção**. O certificado temporário não é reutilizado, então futuras betas podem exigir desinstalar esta antes de instalar outra (com risco de apagar dados locais dentro deste APK).

Por segurança, não ative acesso a notificações nem conceda permissões extras por fora das configurações oficiais. Não ignore alertas do Google Play Protect. Não insira informações financeiras reais até a homologação dos fluxos de login, tela inicial, faturas e backup neste APK.

## Próxima etapa (não incluída)

Para propor importação a partir de notificações Pix, será necessário desenvolver código nativo separado, configurar a permissão explícita e implementar detecção estrita de apps bancários selecionados, armazenamento temporário mínimo, prevenção de duplicidade e **confirmação obrigatória** dentro do GB+. Essa função não é implementável por PWA isolado e será objeto de revisão de privacidade, Lei Geral de Proteção de Dados e política de distribuição. O Play Protect pode bloquear APKs instalados fora da loja que peçam permissão de leitor de notificações.

## Como compilar localmente

Requer Java 17, Android SDK 36, Gradle 8.13 e conexão para dependências. Para gerar release assinado, defina `GB_BETA_KEYSTORE`, `GB_BETA_STOREPASS` e `GB_BETA_KEYPASS` para um keystore de testes sob seu controle. Na pasta `gbplus/android-beta`, execute `gradle :app:assembleRelease`. Não compartilhe nem comite o keystore.
