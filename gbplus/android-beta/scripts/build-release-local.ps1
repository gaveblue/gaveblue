# GB+ Android beta: gerar APK no Windows sem GitHub Actions.
# Requisitos: Android SDK 36, Gradle 8.13, JDK 17+, Node.js no computador.
$ErrorActionPreference = 'Stop'
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = Split-Path -Parent $scriptDir
$androidHome = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { $env:ANDROID_SDK_ROOT }
if (-not (Get-Command gradle -ErrorAction SilentlyContinue)) { throw 'Gradle 8.13 não encontrado. Instale o Gradle ou use PWABuilder.' }
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js não encontrado.' }
if (-not (Get-Command keytool -ErrorAction SilentlyContinue)) { throw 'JDK keytool não encontrado.' }
if (-not $androidHome -or -not (Test-Path (Join-Path $androidHome 'platforms/android-36'))) { throw 'Android SDK 36 não encontrado.' }
if (-not $env:GB_BETA_KEYSTORE) { throw 'Defina GB_BETA_KEYSTORE com um caminho privado FORA do repositório.' }
if (-not $env:GB_BETA_STOREPASS) {
  $secure = Read-Host 'Senha do certificado de testes (oculta)' -AsSecureString
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try { $env:GB_BETA_STOREPASS = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}
if (-not $env:GB_BETA_KEYPASS) { $env:GB_BETA_KEYPASS = $env:GB_BETA_STOREPASS }
if (-not (Test-Path $env:GB_BETA_KEYSTORE)) {
  $keystoreDir = Split-Path -Parent $env:GB_BETA_KEYSTORE
  if (-not (Test-Path $keystoreDir)) { New-Item -ItemType Directory -Path $keystoreDir -Force | Out-Null }
  & keytool -genkeypair -noprompt -alias gbplus-beta -keyalg RSA -keysize 3072 -validity 365 -dname 'CN=GB+ Android Beta,O=GB+ Experimental,C=BR' -storetype PKCS12 -keystore $env:GB_BETA_KEYSTORE -storepass $env:GB_BETA_STOREPASS -keypass $env:GB_BETA_KEYPASS
  if ($LASTEXITCODE -ne 0) { throw 'Não foi possível gerar o certificado de testes.' }
}
& node (Join-Path $scriptDir 'security-check.mjs')
if ($LASTEXITCODE -ne 0) { throw 'A verificação de segurança falhou.' }
& gradle -p $projectDir --no-daemon ':app:assembleRelease'
if ($LASTEXITCODE -ne 0) { throw 'Gradle falhou ao gerar APK.' }
$apk = Join-Path $projectDir 'app/build/outputs/apk/release/app-release.apk'
if (-not (Test-Path $apk)) { throw 'APK não encontrado após compilação.' }
$signer = Get-ChildItem (Join-Path $androidHome 'build-tools') -Directory | Sort-Object Name -Descending | ForEach-Object { Join-Path $_.FullName 'apksigner.bat' } | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $signer) { throw 'apksigner não encontrado no Android SDK.' }
& $signer verify --verbose $apk
if ($LASTEXITCODE -ne 0) { throw 'Assinatura do APK inválida.' }
$dist = Join-Path $projectDir 'dist'
New-Item -ItemType Directory -Path $dist -Force | Out-Null
$target = Join-Path $dist 'GBPlus-Android-Beta-0.1.0.apk'
Copy-Item $apk $target -Force
$sha = (Get-FileHash $target -Algorithm SHA256).Hash.ToLowerInvariant()
Set-Content -Path (Join-Path $dist 'SHA256SUMS.txt') -Value ($sha + '  GBPlus-Android-Beta-0.1.0.apk') -Encoding ascii
Write-Host "APK beta assinado de TESTE: $target"
Write-Host 'Não utilize dados financeiros reais sem homologação. Guarde o certificado fora do repositório.'
