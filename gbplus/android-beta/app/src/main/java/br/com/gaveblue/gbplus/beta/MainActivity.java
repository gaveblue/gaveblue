package br.com.gaveblue.gbplus.beta;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.net.http.SslError;
import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.SslErrorHandler;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.TextView;

/**
 * GB+ Android beta: a locked-down WebView over the existing HTTPS app.
 * No notification listener, accessibility service, SMS access or JavaScript bridge.
 * This is an experimental installation shell, not a production release.
 */
public final class MainActivity extends Activity {
    private static final String APP_URL = "https://gaveblue.com.br/gbplus/";
    private static final int FILE_PICKER_REQUEST = 1007;
    private WebView webView;
    private ValueCallback<Uri[]> pendingFiles;

    private boolean isInternal(Uri uri) {
        if (uri == null) return false;
        if (!"https".equalsIgnoreCase(uri.getScheme())) return false;
        final String host = uri.getHost();
        if (!"gaveblue.com.br".equalsIgnoreCase(host)) return false;
        final String path = uri.getPath();
        return path != null && ("/gbplus".equals(path) || path.startsWith("/gbplus/"));
    }

    private void openExternal(Uri uri) {
        if (uri == null || !"https".equalsIgnoreCase(uri.getScheme())) return;
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, uri);
            intent.addCategory(Intent.CATEGORY_BROWSABLE);
            startActivity(intent);
        } catch (Exception ignored) {
            // Never load untrusted origins internally as fallback.
        }
    }

    private void showConnectionError() {
        TextView error = new TextView(this);
        error.setBackgroundColor(Color.rgb(17, 18, 20));
        error.setTextColor(Color.WHITE);
        error.setTextSize(15f);
        error.setPadding(44, 90, 44, 44);
        error.setText("Não foi possível abrir o GB+ com segurança. Verifique sua conexão e tente novamente.\n\nO aplicativo não ignorou erros de certificado.");
        setContentView(error);
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.rgb(17, 18, 20));
        getWindow().setNavigationBarColor(Color.rgb(17, 18, 20));
        WebView.setWebContentsDebuggingEnabled(false);
        webView = new WebView(this);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true); // GB+ itself requires JS.
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setSafeBrowsingEnabled(true);
        settings.setGeolocationEnabled(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);
        cookies.setAcceptThirdPartyCookies(webView, false);
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                final Uri uri = request.getUrl();
                if (isInternal(uri)) return false;
                if (request.isForMainFrame()) openExternal(uri);
                return true;
            }
            @Override
            public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
                handler.cancel();
                showConnectionError();
            }
            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) showConnectionError();
            }
        });
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (pendingFiles != null) pendingFiles.onReceiveValue(null);
                pendingFiles = callback;
                try {
                    Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                    intent.setType("*/*");
                    intent.addCategory(Intent.CATEGORY_OPENABLE);
                    startActivityForResult(Intent.createChooser(intent, "Escolher documento"), FILE_PICKER_REQUEST);
                    return true;
                } catch (Exception e) {
                    pendingFiles = null;
                    return false;
                }
            }
            @Override
            public void onPermissionRequest(android.webkit.PermissionRequest request) {
                // Beta does not request camera, microphone or other native access.
                request.deny();
            }
        });
        webView.setDownloadListener((url, userAgent, disposition, mimeType, contentLength) -> {
            Uri uri = Uri.parse(url);
            // Only HTTPS links are handed to the user's regular browser.
            openExternal(uri);
        });
        setContentView(webView);
        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState);
        } else {
            webView.loadUrl(APP_URL);
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != FILE_PICKER_REQUEST) return;
        if (pendingFiles == null) return;
        pendingFiles.onReceiveValue(resultCode == RESULT_OK && data != null && data.getData() != null
                ? new Uri[]{data.getData()} : null);
        pendingFiles = null;
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        if (webView != null) webView.saveState(outState);
        super.onSaveInstanceState(outState);
    }

    @SuppressWarnings("deprecation")
    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onPause() {
        if (webView != null) webView.onPause();
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) webView.onResume();
    }

    @Override
    protected void onDestroy() {
        if (pendingFiles != null) {
            pendingFiles.onReceiveValue(null);
            pendingFiles = null;
        }
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
