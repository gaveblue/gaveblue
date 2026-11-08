# Decisão de arquitetura — GB+ Android sem GitHub Actions

**Registrado por solicitação do responsável em 08/11/2026.**

**DECISÃO:** a conta/repositório GB+ está sem acesso utilizável ao GitHub Actions. **Não propor novas compilações, workflows ou tentativas de reexecução no GitHub Actions** para construir APK do GB+ até o responsável informar que o acesso voltou. GitHub continua sendo usado apenas para versionar código e documentar revisões.

## Caminho A: APK do GB+ PWA com PWABuilder (mais rápido)

Este caminho **não compila o projeto Java experimental**. Empacota o PWA já publicado como **Trusted Web Activity (TWA)**, sem necessidade de Actions ou Android SDK local.

1. Abrir [PWABuilder](https://www.pwabuilder.com/).
2. Informar a URL pública oficial: `https://gaveblue.com.br/gbplus/`.
3. Selecionar **Package for stores → Android → Generate Package**, escolher as configurações e gerar um pacote assinado para **testes**.
4. **Guardar em local seguro o keystore e informações de assinatura** gerados, pois serão necessários para atualizar o app. Não compartilhar em chat, não comitar no repositório.
5. Obter o APK do ZIP, conferir seu nome e hash SHA-256, e testar primeiro em dispositivo e conta de demonstração, sem dados financeiros reais.
6. Publicar corretamente o `assetlinks.json` fornecido pelo PWABuilder em `https://gaveblue.com.br/.well-known/assetlinks.json` para comprovar a relação de confiança com o domínio e permitir exibição sem barra de navegador. Sem isso a TWA pode exibir uma aba/erro.
7. Antes de distribuição comercial, revisar as regras do Google Play, identidade da aplicação, segurança, backups e LGPD.

**Limitação:** a TWA apenas encapsula o PWA; **não lê notificações bancárias de outros aplicativos**, nem oferece automaticamente um `NotificationListenerService` para o Pix.

## Caminho B: Android nativo/híbrido com Android Studio (módulo futuro de Pix)

O projeto Java em `gbplus/android-beta/` pode ser aberto/compilado em computador com Android Studio, Android SDK, Java e Gradle instalados **sem GitHub Actions**. O build exige dependências obtidas pela máquina de desenvolvimento com conexão à internet.

Fluxo da assinatura de testes local:
- Instalar Android Studio + SDK 36 + build-tools.
- Abrir `gbplus/android-beta` no Android Studio, aguardar a sincronização Gradle.
- Criar um keystore **sob custódia do responsável**, fora da pasta do repositório. Não usar chave temporária descartável em releases futuros.
- Configurar `GB_BETA_KEYSTORE`, `GB_BETA_STOREPASS`, `GB_BETA_KEYPASS` somente no computador do compilador.
- Executar `gradle :app:assembleRelease` (ou o equivalente pela interface do Android Studio) e usar `apksigner verify` para verificar o APK antes do teste.
- Instalar somente em Android de teste. Validar autenticação, banco de dados de demonstração, faturas, tema e downloads. APK válido **não significa** aplicativo homologado.

**Limitação:** este projeto Android atual ainda não implementa leitura de notificações bancárias. Para isso, será necessária implementação nativa opcional, consentimento explícito, regras de filtragem, LGPD, prevenção de duplicidades e confirmação antes de lançar qualquer valor.

## Segurança e compromissos

- Nunca inserir chaves de assinatura, senha ou dados financeiros reais no GitHub.
- Nunca disponibilizar APK não compilado como instalável.
- Separar a versão experimental do PWA em produção e não alegar homologação sem testes.
- Não sugerir GitHub Actions como caminho de compilação enquanto o acesso continuar bloqueado.
