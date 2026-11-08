# GB+ Android Beta — pacote de avaliação

Este protótipo **não é o aplicativo Android de produção** e **não lê notificações bancárias**. Ele contém um WebView Android restrito ao endereço `https://gaveblue.com.br/gbplus/`, aproveitando o GB+ web já publicado. O código PWA/servidor permanece inalterado.

## Proteções da beta

- Requisita apenas `INTERNET`. Não inclui serviços de leitura de notificações, SMS, Accessibility ou permissões de câmera/microfone.
- Carrega somente o domínio e caminho oficiais por HTTPS; sites externos são abertos no navegador padrão, não dentro do WebView.
- Bloqueia conexões sem TLS, erros de certificado, conteúdo misto, acesso arbitrário a arquivos e pontes JavaScript nativas.
- JavaScript e armazenamento DOM ficam ativos porque são necessários ao GB+; arquivos só podem ser escolhidos manualmente pelo usuário.
- Dados continuam sob a autenticação do GB+ no site oficial; a versão experimental pode ter limitações de autenticação por link, atualização, backup e integrações que exigem navegador externo.
- **Não é possível afirmar segurança total sem auditoria independente, teste em aparelho e validação de dados de teste.**

## Situação verificada em 08/11/2026

**Código-fonte pronto para validação Android, mas NENHUM APK gerado até esta data.** A execução nativa do Android SDK e da suíte de compilação permanece bloqueada.

- As **28 regras automatizadas** do arquivo `scripts/security-check.mjs` passaram ao serem executadas sobre os arquivos atuais, incluindo restrição HTTPS, permissões mínimas, políticas do WebView, assinatura e SHA-256.
- Correções aplicadas: checagem de porta HTTPS e userinfo, tela de falha de rede com botão `Tentar novamente`, distinção entre rede indisponível e certificado TLS inválido, `.gitignore` para chaves e artefatos.
- O teste mínimo [GitHub Actions #42514802968](https://github.com/gaveblue/gaveblue/actions/runs/42514802968) falhou *antes de executar uma única etapa*, sem depender de SDK ou Gradle. A tentativa de build [#42515189182](https://github.com/gaveblue/gaveblue/actions/runs/42515189182) também falhou sem iniciar as etapas; **não há artifact APK**.
- Este ambiente de desenvolvimento não possui Android SDK ou Gradle instalados e não conseguiu baixar dependências externas. Por isso não é possível atestar a compilação nem instalação neste ambiente.

### Ação necessária para liberar a compilação

1. No GitHub, abra **gaveblue/gaveblue → Settings → Actions → General** e confira se os workflows estão permitidos; revise eventuais mensagens de conta desabilitada, bloqueio de política ou cobrança.
2. Confira também as configurações e disponibilidade de **Runners** e as informações de uso/cobrança do GitHub Actions. O erro específico ainda não foi disponibilizado pelo serviço, portanto não atribuímos a falha a uma causa não confirmada.
3. Se o GitHub informar que o Actions está desabilitado para a conta, contate o suporte GitHub: alterar apenas as permissões do repositório pode não resolver esse tipo de bloqueio.
4. Quando o runner conseguir executar o teste mínimo, vá em **Actions → GB+ Android Beta APK (somente testes) → Run workflow**, selecione a branch `experiment/gbplus-android-beta-apk` e execute.
5. Se a compilação realmente passar, o artefato disponibilizará o APK assinado de **teste**, `SHA256SUMS.txt` e `LEIA-ANTES.txt`. Antes de usar, verifique o hash e instale somente em dispositivo de teste e com uma conta financeira de demonstração.

**A assinatura atual é temporária de laboratório** e muda a cada execução. Essa versão não deve ser distribuída como release estável nem usada para finanças reais. A chave de assinatura persistente deve ficar sob custódia privada antes do primeiro release oficial.

## Assinatura e APK

O workflow `.github/workflows/android-beta-apk.yml` usa um certificado **temporário gerado no runner** e não o publica. Gera um APK de release, verifica a assinatura e entrega o APK junto com `SHA256SUMS.txt` como artifact de GitHub Actions. **Não utilizar como produção**. O certificado temporário não é reutilizado, então futuras betas podem exigir desinstalar esta antes de instalar outra (com risco de apagar dados locais dentro deste APK).

Por segurança, não ative acesso a notificações nem conceda permissões extras por fora das configurações oficiais. Não ignore alertas do Google Play Protect. Não insira informações financeiras reais até a homologação dos fluxos de login, tela inicial, faturas e backup neste APK.

## Próxima etapa (não incluída)

Para propor importação a partir de notificações Pix, será necessário desenvolver código nativo separado, configurar a permissão explícita e implementar detecção estrita de apps bancários selecionados, armazenamento temporário mínimo, prevenção de duplicidade e **confirmação obrigatória** dentro do GB+. Essa função não é implementável por PWA isolado e será objeto de revisão de privacidade, Lei Geral de Proteção de Dados e política de distribuição. O Play Protect pode bloquear APKs instalados fora da loja que peçam permissão de leitor de notificações.

## Como compilar localmente

Requer Java 17, Android SDK 36, Gradle 8.13 e conexão para dependências. Para gerar release assinado, defina `GB_BETA_KEYSTORE`, `GB_BETA_STOREPASS` e `GB_BETA_KEYPASS` para um keystore de testes sob seu controle. Na pasta `gbplus/android-beta`, execute `gradle :app:assembleRelease`. Não compartilhe nem comite o keystore.
