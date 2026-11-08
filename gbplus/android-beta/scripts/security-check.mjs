#!/usr/bin/env node
// GB+ Android Beta: automated source-level safety gates. This is NOT an APK build.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=(path)=>readFileSync(resolve(root,path),'utf8');
const manifest=read('app/src/main/AndroidManifest.xml');
const activity=read('app/src/main/java/br/com/gaveblue/gbplus/beta/MainActivity.java');
const config=read('app/build.gradle');
const settings=read('settings.gradle');
const workflow=read('../../.github/workflows/android-beta-apk.yml');
let passed=0;
function check(condition, description){assert.ok(condition,description);passed++;}
const requested=[...manifest.matchAll(/<uses-permission\s+android:name="([^"]+)"/g)].map(m=>m[1]);
check(requested.length===1&&requested[0]==='android.permission.INTERNET','No sensitive permissions in beta manifest');
check(!/NotificationListenerService|BIND_NOTIFICATION_LISTENER_SERVICE|android\.permission\.READ_SMS|android\.permission\.CAMERA|AccessibilityService/.test(manifest+activity),'Beta never reads bank notifications, SMS or accessibility');
check(manifest.includes('android:allowBackup="false"'),'Backup through Android OS disabled');
check(manifest.includes('android:usesCleartextTraffic="false"'),'Cleartext traffic disabled');
check(manifest.includes('android:exported="true"'),'Launcher exported explicitly');
check(activity.includes('private static final String APP_URL = "https://gaveblue.com.br/gbplus/"'),'Official URL only');
check(activity.includes('!uri.isHierarchical()')&&activity.includes('uri.getUserInfo() != null'),'Reject ambiguous URI');
check(activity.includes('uri.getPort() != -1 && uri.getPort() != 443'),'HTTPS default port only');
check(activity.includes('"gaveblue.com.br".equalsIgnoreCase(host)'),'Exact domain pin');
check(activity.includes('path.startsWith("/gbplus/")'),'Path restricted to GB+');
check(activity.includes('new Intent(Intent.ACTION_VIEW, uri)'),'External top-frame links open in browser');
check(activity.includes('!"https".equalsIgnoreCase(uri.getScheme()) return')||activity.includes('!"https".equalsIgnoreCase(uri.getScheme())) return'),'No non-HTTPS external links');
check(activity.includes('handler.cancel()')&&!activity.includes('handler.proceed()'),'Reject TLS certificate errors without bypass');
check(activity.includes('setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW)'),'Mixed content blocked');
check(activity.includes('setAllowFileAccess(false)'),'Local files blocked');
check(activity.includes('setAllowContentAccess(false)'),'Content provider auto-access disabled');
check(activity.includes('setJavaScriptCanOpenWindowsAutomatically(false)'),'JS pop-ups disabled');
check(activity.includes('setWebContentsDebuggingEnabled(false)'),'WebView debugging off');
check(!activity.includes('addJavascriptInterface('),'No native JavaScript bridge');
check(activity.includes('request.deny()'),'No unexpected WebView permissions');
check(activity.includes('CookieManager.getInstance()'),'Session cookie management explicit');
check(activity.includes('setAcceptThirdPartyCookies(webView, false)'),'Third-party cookies blocked');
check(activity.includes('retry.setOnClickListener')&&activity.includes('webView.loadUrl(APP_URL)'),'Retry uses fixed HTTPS URL');
check(config.includes('debuggable false')&&config.includes('minSdk 26')&&config.includes('targetSdk 35'),'Release hardened and SDK targets explicit');
check(settings.includes('google()')&&settings.includes('mavenCentral()'),'Only defined standard dependency repositories');
check(workflow.includes('apksigner" verify')&&workflow.includes('sha256sum'),'Signed APK and SHA-256 checked by CI');
check(workflow.includes('actions/upload-artifact@v4'),'Artifacts are retained for review');
check(!activity.includes('http://')&&!activity.includes('setAllowUniversalAccessFromFileURLs(true)'),'No unsafe fallback to insecure loads');

console.log('GB+ Android Beta: '+passed+' verificações estáticas aprovadas. APK e dispositivo ainda precisam de testes reais.');
