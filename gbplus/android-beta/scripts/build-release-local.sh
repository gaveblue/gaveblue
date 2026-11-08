#!/usr/bin/env bash
# GB+ Android beta: signed APK local build WITHOUT GitHub Actions.
# Requires locally installed Android SDK 36, Java 17+, Gradle 8.13 and keytool.
set -euo pipefail
SELF="$(cd "$(dirname "$0")" && pwd)"
PROJECT="$(cd "$SELF/.." && pwd)"
if ! command -v gradle >/dev/null 2>&1; then
  echo "ERRO: Gradle 8.13 não encontrado. Instale Gradle ou use Android Studio/PWABuilder." >&2
  exit 2
fi
if ! command -v keytool >/dev/null 2>&1; then
  echo "ERRO: keytool não disponível. Instale o JDK." >&2
  exit 2
fi
if [[ -z "$ANDROID_HOME" || ! -d "$ANDROID_HOME/platforms/android-36" ]]; then
  echo "ERRO: Android SDK 36 não encontrado. Instale pelo Android Studio." >&2
  exit 2
fi
if [[ -z "$GB_BETA_KEYSTORE" ]]; then
  echo "ERRO: defina GB_BETA_KEYSTORE com caminho seguro FORA do repositório." >&2
  exit 2
fi
if [[ -z "$GB_BETA_STOREPASS" ]]; then
  read -r -s -p "Senha do keystore (não aparece na tela): " GB_BETA_STOREPASS
  echo
  export GB_BETA_STOREPASS
fi
if [[ -z "$GB_BETA_KEYPASS" ]]; then
  GB_BETA_KEYPASS="$GB_BETA_STOREPASS"
  export GB_BETA_KEYPASS
fi
if [[ ! -f "$GB_BETA_KEYSTORE" ]]; then
  echo "Criando um certificado de TESTES no caminho privado escolhido..."
  mkdir -p "$(dirname "$GB_BETA_KEYSTORE")"
  keytool -genkeypair -noprompt -alias gbplus-beta -keyalg RSA -keysize 3072 -validity 365 \
    -dname "CN=GB+ Android Beta,O=GB+ Experimental,C=BR" -storetype PKCS12 \
    -keystore "$GB_BETA_KEYSTORE" -storepass "$GB_BETA_STOREPASS" -keypass "$GB_BETA_KEYPASS"
fi
node "$SELF/security-check.mjs"
gradle -p "$PROJECT" --no-daemon :app:assembleRelease
APK="$PROJECT/app/build/outputs/apk/release/app-release.apk"
if [[ ! -s "$APK" ]]; then echo "APK não gerado." >&2; exit 1; fi
SIGNER="$(find "$ANDROID_HOME/build-tools" -name apksigner -type f | sort -V | tail -n 1)"
if [[ -z "$SIGNER" ]]; then echo "apksigner indisponível no SDK." >&2; exit 1; fi
"$SIGNER" verify --verbose "$APK"
mkdir -p "$PROJECT/dist"
cp "$APK" "$PROJECT/dist/GBPlus-Android-Beta-0.1.0.apk"
(cd "$PROJECT/dist" && sha256sum GBPlus-Android-Beta-0.1.0.apk > SHA256SUMS.txt)
echo "APK assinado de TESTE: $PROJECT/dist/GBPlus-Android-Beta-0.1.0.apk"
echo "SHA-256: $PROJECT/dist/SHA256SUMS.txt"
echo "NÃO distribuir como versão homologada. Guarde o keystore e suas senhas fora do GitHub."
