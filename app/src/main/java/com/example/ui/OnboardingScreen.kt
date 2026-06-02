package com.example.ui

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.MainViewModel
import com.example.R
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlin.math.sin

@OptIn(ExperimentalAnimationApi::class)
@Composable
fun OnboardingScreen(
    viewModel: MainViewModel,
    onLoginSuccess: (name: String, alliance: String, avatar: String) -> Unit,
    modifier: Modifier = Modifier
) {
    val coroutineScope = rememberCoroutineScope()
    val scrollState = rememberScrollState()

    // Dialog state
    var showEmailLoginDialog by remember { mutableStateOf(false) }
    var showRegisterDialog by remember { mutableStateOf(false) }

    // Onboarding values
    var emailInput by remember { mutableStateOf("") }
    var passwordInput by remember { mutableStateOf("") }
    
    var registerUsername by remember { mutableStateOf("") }
    var registerAlliance by remember { mutableStateOf("تحالف الغياث الدولي") }
    var registerAvatarSeed by remember { mutableStateOf("Ghaith") }

    val authLoading by viewModel.authLoading.collectAsState()

    // Infinite transitions for dynamic mobile game background animations
    val infiniteTransition = rememberInfiniteTransition(label = "GameOnboarding")

    // 1. Floating Clouds Animation
    val cloudOffset1 by infiniteTransition.animateFloat(
        initialValue = -150f,
        targetValue = 500f,
        animationSpec = infiniteRepeatable(
            animation = tween(28000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "Cloud1"
    )
    val cloudOffset2 by infiniteTransition.animateFloat(
        initialValue = 450f,
        targetValue = -200f,
        animationSpec = infiniteRepeatable(
            animation = tween(24000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "Cloud2"
    )

    // 2. Animated Sunlight Glow Pulse
    val sunGlowScale by infiniteTransition.animateFloat(
        initialValue = 0.95f,
        targetValue = 1.12f,
        animationSpec = infiniteRepeatable(
            animation = tween(3500, easing = EaseInOutSine),
            repeatMode = RepeatMode.Reverse
        ),
        label = "SunGlow"
    )

    // 3. Wind crop sway rotation
    val cropSwayRotation by infiniteTransition.animateFloat(
        initialValue = -4f,
        targetValue = 4f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = EaseInOutQuad),
            repeatMode = RepeatMode.Reverse
        ),
        label = "CropSway"
    )

    // 4. Logo pulsing scale
    val logoScaleMultiplier by infiniteTransition.animateFloat(
        initialValue = 1.0f,
        targetValue = 1.06f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = EaseInOut),
            repeatMode = RepeatMode.Reverse
        ),
        label = "LogoPulsing"
    )

    // 5. Flying bird translation
    val birdX by infiniteTransition.animateFloat(
        initialValue = -50f,
        targetValue = 480f,
        animationSpec = infiniteRepeatable(
            animation = tween(14000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "BirdX"
    )
    val birdY by infiniteTransition.animateFloat(
        initialValue = 80f,
        targetValue = 130f,
        animationSpec = infiniteRepeatable(
            animation = tween(14000, easing = EaseInOutSine),
            repeatMode = RepeatMode.Reverse
        ),
        label = "BirdY"
    )

    Box(
        modifier = modifier
            .fillMaxSize()
    ) {
        // Fullscreen Rich Graphic Background
        Image(
            painter = painterResource(id = R.drawable.img_welcome_bg),
            contentDescription = "Farming Landscape background scenery",
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Crop
        )

        // Overlay Sunset/Sunrise light gradient booster
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            Color(0xFFFFB703).copy(alpha = 0.15f),
                            Color(0x000F1B0B),
                            Color(0xFF0F1B0B).copy(alpha = 0.85f)
                        )
                    )
                )
        )

        // ANIMATED CLOUDS (Atmospheric layer)
        Text(
            text = "☁️",
            fontSize = 55.sp,
            modifier = Modifier
                .offset { IntOffset(cloudOffset1.dp.roundToPx(), 45.dp.roundToPx()) }
                .alpha(0.35f)
        )
        Text(
            text = "☁️",
            fontSize = 70.sp,
            modifier = Modifier
                .offset { IntOffset(cloudOffset2.dp.roundToPx(), 110.dp.roundToPx()) }
                .alpha(0.24f)
        )

        // SUNLIGHT GLOW (Pulsing warm crown in the sky)
        Box(
            modifier = Modifier
                .size(160.dp)
                .align(Alignment.TopEnd)
                .offset(x = (-10).dp, y = (20).dp)
                .scale(sunGlowScale)
                .background(
                    Brush.radialGradient(
                        colors = listOf(
                            Color(0xFFFFF275).copy(alpha = 0.40f),
                            Color(0xFFFFB300).copy(alpha = 0.15f),
                            Color.Transparent
                        )
                    )
                )
        )

        // FLYING BIRDS ANIMATION
        Row(
            modifier = Modifier
                .offset { IntOffset(birdX.dp.roundToPx(), birdY.dp.roundToPx()) }
                .alpha(0.65f),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("🕊️", fontSize = 14.sp)
            Spacer(modifier = Modifier.width(22.dp))
            Text("🕊️", fontSize = 11.sp, modifier = Modifier.offset(y = (-10).dp))
        }

        // SCROLLABLE CONTAINER FOR PRIMARY INTERFACES (Full responsiveness on all mobile screens)
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
                .padding(horizontal = 20.dp, vertical = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {

            // ==================== TOP BAR STATS & TIMERS ====================
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Online Player Count Pill
                Box(
                    modifier = Modifier
                        .shadow(4.dp, RoundedCornerShape(14.dp))
                        .background(Color(0xFF0F1B0B).copy(alpha = 0.8f), RoundedCornerShape(14.dp))
                        .border(1.dp, Color(0xFF3EA02A).copy(alpha = 0.35f), RoundedCornerShape(14.dp))
                        .padding(horizontal = 10.dp, vertical = 5.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(5.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(7.dp)
                                .background(Color(0xFF3EA02A), CircleShape)
                                .border(1.dp, Color.White, CircleShape)
                        )
                        Text(
                            text = "١,٤٢٨ متصل الآن",
                            color = Color.White,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                // Server Status Indicator
                Box(
                    modifier = Modifier
                        .shadow(4.dp, RoundedCornerShape(14.dp))
                        .background(Color(0xFF0F1B0B).copy(alpha = 0.8f), RoundedCornerShape(14.dp))
                        .border(1.dp, Color(0xFFFFB700).copy(alpha = 0.35f), RoundedCornerShape(14.dp))
                        .padding(horizontal = 10.dp, vertical = 5.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(5.dp)
                    ) {
                        Text(
                            text = "سيرفر دمشق الدولي",
                            color = Color(0xFFFFB700),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Black
                        )
                    }
                }
            }

            // ==================== ANIMATED APP LOGO & TITLES ====================
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier
                    .padding(top = 10.dp, bottom = 12.dp)
                    .scale(logoScaleMultiplier)
            ) {
                Box(
                    modifier = Modifier
                        .size(68.dp)
                        .shadow(8.dp, CircleShape)
                        .background(
                            Brush.linearGradient(
                                colors = listOf(Color(0xFF3EA02A), Color(0xFF2D7A1F))
                            ),
                            CircleShape
                        )
                        .border(2.dp, Color(0xFFFFB700), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Text(text = "🌾", fontSize = 38.sp)
                }

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "مزرعة الغياث",
                    fontSize = 28.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = Color(0xFFFFD700),
                    textAlign = TextAlign.Center,
                    style = MaterialTheme.typography.titleLarge.copy(
                        shadow = Shadow(
                            color = Color.Black,
                            offset = Offset(3f, 4f),
                            blurRadius = 6f
                        )
                    )
                )

                Text(
                    text = "بوابة المزارعين الرقمية العالمية",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFFE8F5E9),
                    textAlign = TextAlign.Center,
                    style = MaterialTheme.typography.bodyMedium.copy(
                        shadow = Shadow(
                            color = Color.Black,
                            offset = Offset(1f, 2f),
                            blurRadius = 3f
                        )
                    )
                )
            }

            // ==================== CENTER HERO ILLUSTRATION ====================
            Box(
                modifier = Modifier
                    .fillMaxWidth(0.9f)
                    .aspectRatio(1.2f)
                    .padding(vertical = 8.dp),
                contentAlignment = Alignment.Center
            ) {
                // Background Glow Halo for the character
                Box(
                    modifier = Modifier
                        .fillMaxSize(0.9f)
                        .background(
                            Brush.radialGradient(
                                colors = listOf(
                                    Color(0xFFFFEE58).copy(alpha = 0.35f),
                                    Color.Transparent
                                )
                            )
                        )
                )

                // The illustrated cartoon farmer waving
                Image(
                    painter = painterResource(id = R.drawable.img_farmer_hero),
                    contentDescription = "Illustrated happy waving farmer",
                    modifier = Modifier
                        .fillMaxSize()
                        .clip(RoundedCornerShape(24.dp)),
                    contentScale = ContentScale.Fit
                )

                // Floating Crops wind sway simulation overlay
                Box(
                    modifier = Modifier
                        .align(Alignment.BottomStart)
                        .offset(x = (-12).dp, y = (10).dp)
                        .rotate(cropSwayRotation)
                        .background(Color(0xE60F1B0B).copy(alpha = 0.85f), RoundedCornerShape(12.dp))
                        .border(1.dp, Color(0xFF3EA02A).copy(alpha = 0.3f), RoundedCornerShape(12.dp))
                        .padding(6.dp)
                ) {
                    Text("🍅 طماطم بلدي", color = Color.White, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                }

                Box(
                    modifier = Modifier
                        .align(Alignment.BottomEnd)
                        .offset(x = (12).dp, y = (-25).dp)
                        .rotate(-cropSwayRotation)
                        .background(Color(0xE60F1B0B).copy(alpha = 0.85f), RoundedCornerShape(12.dp))
                        .border(1.dp, Color(0xFFFFB700).copy(alpha = 0.3f), RoundedCornerShape(12.dp))
                        .padding(6.dp)
                ) {
                    Text("🌾 قمح ذهبي", color = Color.White, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                }

                // VIP Badge Floating preview
                Box(
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .offset(x = (-15).dp, y = (-5).dp)
                        .shadow(6.dp, RoundedCornerShape(12.dp))
                        .background(
                            Brush.linearGradient(
                                colors = listOf(Color(0xFFFFB700), Color(0xFFD84315))
                            ),
                            RoundedCornerShape(12.dp)
                        )
                        .border(1.dp, Color.White.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(3.dp)
                    ) {
                        Text("👑", fontSize = 11.sp)
                        Text(
                            text = "عضوية VIP مجانية",
                            color = Color.White,
                            fontSize = 8.sp,
                            fontWeight = FontWeight.Black
                        )
                    }
                }
            }

            // ==================== DAILY REWARD PREVIEW CARD ====================
            Box(
                modifier = Modifier
                    .fillMaxWidth(0.95f)
                    .shadow(8.dp, RoundedCornerShape(18.dp))
                    .background(Color(0xF0182E11).copy(alpha = 0.9f), RoundedCornerShape(18.dp))
                    .border(1.5.dp, Color(0xFFFFD700).copy(alpha = 0.4f), RoundedCornerShape(18.dp))
                    .padding(12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Text(text = "🎁", fontSize = 28.sp)
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "هدايا التسجيل المنتظرة اليومية",
                            color = Color(0xFFFFD700),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Black
                        )
                        Text(
                            text = "احصل فورا على: ٣٥٠ ذهبة 🪙 + ١٥ جوهرة 💎",
                            color = Color.White.copy(alpha = 0.9f),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Box(
                        modifier = Modifier
                            .background(Color(0xFF3EA02A), RoundedCornerShape(10.dp))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text("جاهز 🟢", color = Color.White, fontSize = 8.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // ==================== WELCOME & DESCRIPTION CARD ====================
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .shadow(4.dp, RoundedCornerShape(20.dp)),
                colors = CardDefaults.cardColors(
                    containerColor = Color(0xFF0F1B0B).copy(alpha = 0.82f)
                ),
                shape = RoundedCornerShape(20.dp),
                border = BorderStroke(1.dp, Color(0xFF3EA02A).copy(alpha = 0.25f))
            ) {
                Column(
                    modifier = Modifier.padding(14.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "مرحباً بك في مزرعة الغياث",
                        color = Color.White,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.ExtraBold,
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "ازرع حقول القمح الشاسعة، احصد محصولات الغوطة الطازجة، تاجر في سوق الغياث الإقليمي المفتوح، ونافس آلاف اللاعبين في تجربة زراعية متكاملة ومستدامة.",
                        color = Color(0xFFECEFF1).copy(alpha = 0.85f),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Medium,
                        lineHeight = 17.sp,
                        textAlign = TextAlign.Center
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // ==================== INTERACTIVE GUEST / SOCIAL BUTTONS COLUMN ====================
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(10.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // 1. SIGN IN WITH GOOGLE
                Button(
                    onClick = {
                        viewModel.loginWithGoogle()
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                        .testTag("google_login_button"),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color.White,
                        contentColor = Color(0xFF1F2F1D)
                    ),
                    shape = RoundedCornerShape(12.dp),
                    border = BorderStroke(1.dp, Color(0xFFE0E0E0)),
                    elevation = ButtonDefaults.buttonElevation(defaultElevation = 2.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = "Ｇ",
                            color = Color(0xFFDB4437),
                            fontWeight = FontWeight.Black,
                            fontSize = 18.sp
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "تسجيل الدخول بواسطة Google",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.ExtraBold
                        )
                    }
                }

                // 2. SIGN IN WITH EMAIL
                Button(
                    onClick = { showEmailLoginDialog = true },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                        .testTag("email_login_button"),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color(0xFF3EA02A)
                    ),
                    shape = RoundedCornerShape(12.dp),
                    elevation = ButtonDefaults.buttonElevation(defaultElevation = 3.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        Icon(Icons.Default.Email, contentDescription = "EmailIcon", modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "تسجيل الدخول بالبريد الإلكتروني",
                            color = Color.White,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.ExtraBold
                        )
                    }
                }

                // 3. CREATE NEW ACCOUNT (Register)
                Button(
                    onClick = { showRegisterDialog = true },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                        .testTag("register_account_button"),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color(0xFFFFB700),
                        contentColor = Color(0xFF121F10)
                    ),
                    shape = RoundedCornerShape(12.dp),
                    elevation = ButtonDefaults.buttonElevation(defaultElevation = 3.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        Icon(Icons.Default.AccountCircle, contentDescription = "RegisterIcon", modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "إنشاء حساب ومزارع جديد 🌾",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Black
                        )
                    }
                }

                // 4. CONTINUE AS GUEST
                OutlinedButton(
                    onClick = {
                        coroutineScope.launch {
                            // Fetch default system values and log in instantly
                            onLoginSuccess(
                                "مزارع_الغياث_الضيف",
                                "تحالف الغياث الشامي",
                                "Ghaith" + (100..999).random()
                            )
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(46.dp)
                        .testTag("guest_login_button"),
                    border = BorderStroke(1.5.dp, Color(0xFF3EA02A)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text(
                        text = "متابعة كـ ضــيــف (لعب ومحاكاة فورية) 🚪",
                        color = Color(0xFF81C784),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Black
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Footer credits
            Text(
                text = "تم التطوير برعاية وإشراف المهندس محمد جهاد الغياث للجمهور الكريم.",
                color = Color.White.copy(alpha = 0.5f),
                fontSize = 8.sp,
                fontWeight = FontWeight.Medium,
                textAlign = TextAlign.Center
            )
        }

        // Loader during Auth actions
        if (authLoading) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.7f)),
                contentAlignment = Alignment.Center
            ) {
                Card(
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF162512)),
                    border = BorderStroke(1.5.dp, Color(0xFFFFB700))
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        CircularProgressIndicator(color = Color(0xFFFFB700))
                        Text(
                            text = "جاري الاتصال والتحقق الآمن...",
                            color = Color.White,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }


    // ============================================
    // DIALOG 1: EMAIL SIGN IN POPUP
    // ============================================
    if (showEmailLoginDialog) {
        Dialog(onDismissRequest = { showEmailLoginDialog = false }) {
            Card(
                shape = RoundedCornerShape(24.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .shadow(12.dp, RoundedCornerShape(24.dp)),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0F1B0B)),
                border = BorderStroke(1.5.dp, Color(0xFF3EA02A))
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Header
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "تسجيل الدخول بالبريد",
                            color = Color(0xFFFFB700),
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Black
                        )
                        IconButton(onClick = { showEmailLoginDialog = false }) {
                            Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.LightGray)
                        }
                    }

                    // Email input
                    OutlinedTextField(
                        value = emailInput,
                        onValueChange = { emailInput = it },
                        label = { Text("البريد الإلكتروني") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = Color(0xFF3EA02A),
                            unfocusedBorderColor = Color.Gray,
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.LightGray
                        )
                    )

                    // Password Input
                    OutlinedTextField(
                        value = passwordInput,
                        onValueChange = { passwordInput = it },
                        label = { Text("كلمة المرور") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        visualTransformation = PasswordVisualTransformation(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = Color(0xFF3EA02A),
                            unfocusedBorderColor = Color.Gray,
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.LightGray
                        )
                    )

                    // Action buttons
                    Button(
                        onClick = {
                            if (emailInput.length < 5 || passwordInput.length < 4) {
                                viewModel.triggerRoseShower() // minor response
                                return@Button
                            }
                            showEmailLoginDialog = false
                            // Simulating secure successful validation
                            coroutineScope.launch {
                                onLoginSuccess(
                                    emailInput.substringBefore("@") + "_مزارع",
                                    "نخبة الغياث الدولية",
                                    "Seed" + (10..99).random()
                                )
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(44.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF3EA02A))
                    ) {
                        Text("تحقق ودخول السيرفر ⚡", fontWeight = FontWeight.Black, fontSize = 12.sp)
                    }
                }
            }
        }
    }


    // ============================================
    // DIALOG 2: REGISTER NEW ACCOUNT WITH AVATAR EXQUISITE GENERATOR
    // ============================================
    if (showRegisterDialog) {
        Dialog(onDismissRequest = { showRegisterDialog = false }) {
            Card(
                shape = RoundedCornerShape(24.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .shadow(12.dp, RoundedCornerShape(24.dp)),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0F1B0B)),
                border = BorderStroke(1.5.dp, Color(0xFFFFB700))
            ) {
                Column(
                    modifier = Modifier
                        .padding(18.dp)
                        .verticalScroll(rememberScrollState()),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Header
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "بوابة المزارع - تسجيل العضوية",
                            color = Color(0xFFFFB700),
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Black
                        )
                        IconButton(onClick = { showRegisterDialog = false }) {
                            Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.LightGray)
                        }
                    }

                    // Mascot illustration in popup
                    Box(
                        modifier = Modifier
                            .size(70.dp)
                            .shadow(4.dp, CircleShape)
                            .background(Color.White.copy(alpha = 0.08f), CircleShape)
                            .border(1.dp, Color(0xFF3EA02A), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("👨‍🌾", fontSize = 38.sp)
                    }

                    // Username Input
                    Column(modifier = Modifier.fillMaxWidth()) {
                        Text(
                            text = "اسم مزارعك الفريد:",
                            color = Color.LightGray,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(bottom = 3.dp)
                        )
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            OutlinedTextField(
                                value = registerUsername,
                                onValueChange = { registerUsername = it },
                                placeholder = { Text("أدخل اسم المزارع") },
                                modifier = Modifier.weight(1f),
                                singleLine = true,
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = Color(0xFF3EA02A),
                                    unfocusedBorderColor = Color.Gray,
                                    focusedTextColor = Color.White,
                                    unfocusedTextColor = Color.LightGray
                                )
                            )
                            // Random Name Dice generate button!
                            IconButton(
                                onClick = {
                                    val prefix = listOf("مزارع_الورد", "غياث_الحقل", "حارس_القمح", "نسيم_الغوطة", "شهم_الزيتون", "أبو_رياض")
                                    val suffix = (100..999).random()
                                    registerUsername = "${prefix.random()}_$suffix"
                                },
                                modifier = Modifier
                                    .size(48.dp)
                                    .background(Color(0xFF3EA02A), RoundedCornerShape(10.dp))
                            ) {
                                Icon(Icons.Default.Refresh, contentDescription = "Randomize Name", tint = Color.White)
                            }
                        }
                    }

                    // Alliance Input
                    Column(modifier = Modifier.fillMaxWidth()) {
                        Text(
                            text = "اسم التحالف الودّي (المقاطعة):",
                            color = Color.LightGray,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(bottom = 3.dp)
                        )
                        OutlinedTextField(
                            value = registerAlliance,
                            onValueChange = { registerAlliance = it },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = Color(0xFFFFB700),
                                unfocusedBorderColor = Color.Gray,
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.LightGray
                            )
                        )
                    }

                    // Avatar Seed Generator Input
                    Column(modifier = Modifier.fillMaxWidth()) {
                        Text(
                            text = "بصمة معرّف الأفاتار الافتراضي للبطاقة المطبوعة:",
                            color = Color.LightGray,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(bottom = 3.dp)
                        )
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            OutlinedTextField(
                                value = registerAvatarSeed,
                                onValueChange = { registerAvatarSeed = it },
                                modifier = Modifier.weight(1f),
                                singleLine = true,
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = Color(0xFF3EA02A),
                                    unfocusedBorderColor = Color.Gray,
                                    focusedTextColor = Color.White,
                                    unfocusedTextColor = Color.LightGray
                                )
                            )
                            // Fresh avatar randomize refresh
                            IconButton(
                                onClick = {
                                    val seeds = listOf("Yasmin", "Zaitoon", "GhaithExpert", "HomsPride", "DamascusJoy", "TractorForce", "GoldenGrain")
                                    registerAvatarSeed = "${seeds.random()}${(10..99).random()}"
                                },
                                modifier = Modifier
                                    .size(48.dp)
                                    .background(Color(0xFFFFB700), RoundedCornerShape(10.dp))
                            ) {
                                Icon(Icons.Default.Star, contentDescription = "Refresh avatar seed", tint = Color(0xFF0F1B0B))
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    // CONFIRM REGISTER & ENTER
                    Button(
                        onClick = {
                            if (registerUsername.trim().length < 3) {
                                return@Button
                            }
                            showRegisterDialog = false
                            coroutineScope.launch {
                                // Launch success callback
                                onLoginSuccess(
                                    registerUsername.trim(),
                                    registerAlliance.trim(),
                                    registerAvatarSeed.trim()
                                )
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFFB700), contentColor = Color(0xFF0F1B0B))
                    ) {
                        Text(
                            text = "تأكيد العضوية والانضمام للتحالف! 🗺️",
                            fontWeight = FontWeight.Black,
                            fontSize = 11.sp
                        )
                    }
                }
            }
        }
    }
}
