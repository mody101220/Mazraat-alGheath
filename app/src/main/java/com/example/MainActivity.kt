package com.example

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.viewinterop.AndroidView
import com.example.ui.theme.MyApplicationTheme

class MainActivity : ComponentActivity() {
    private var webView: WebView? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Handle Back Press to navigate inside WebView back history natively
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView?.canGoBack() == true) {
                    webView?.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })

        setContent {
            MyApplicationTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = Color(0xFF0F1B0B) // Dark forest green matching premium theme
                ) {
                    val viewModel: MainViewModel = androidx.lifecycle.viewmodel.compose.viewModel()
                    val isAuthenticated by viewModel.isAuthenticated.collectAsState()
                    var registeredUser by remember { mutableStateOf<Triple<String, String, String>?>(null) }

                    if (isAuthenticated) {
                        com.example.ui.GameDashboardScreen(
                            viewModel = viewModel,
                            onLogout = {
                                viewModel.logout()
                            }
                        )
                    } else {
                        com.example.ui.OnboardingScreen(
                            viewModel = viewModel,
                            onLoginSuccess = { name, alliance, avatar ->
                                registeredUser = Triple(name, alliance, avatar)
                                viewModel.updateCharacterConfig(name, "المزارع الرقمي", alliance)
                                viewModel.loginWithGoogle()
                            }
                        )
                    }
                }
            }
        }
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun MainAppContent(onWebViewCreated: (WebView) -> Unit = {}) {
    AndroidView(
        modifier = Modifier
            .fillMaxSize()
            .statusBarsPadding()
            .navigationBarsPadding(),
        factory = { context ->
            WebView(context).apply {
                settings.apply {
                    javaScriptEnabled = true
                    domStorageEnabled = true
                    databaseEnabled = true
                    useWideViewPort = true
                    loadWithOverviewMode = true
                    allowFileAccess = true
                    allowContentAccess = true
                    cacheMode = WebSettings.LOAD_DEFAULT
                    mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                }

                webViewClient = object : WebViewClient() {
                    override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
                        return false // Force WebView to handle navigation internally
                    }
                }

                webChromeClient = WebChromeClient()

                loadUrl("file:///android_asset/web/index.html")
                onWebViewCreated(this)
            }
        }
    )
}
