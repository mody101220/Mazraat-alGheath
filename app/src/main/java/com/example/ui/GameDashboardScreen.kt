package com.example.ui

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.MainViewModel
import com.example.R
import com.example.data.GameCrop
import com.example.data.GameLivestock
import com.example.data.GameProfile
import com.example.data.MarketOrder
import com.example.data.MarketProduct
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import kotlin.math.sin

// Define modern agrarian color palette matching Syrian fertile lands
val FertileGreen = Color(0xFF2E7D32)
val SunnyGold = Color(0xFFFFB300)
val DarkGround = Color(0xFF142410)
val SandClay = Color(0xFF8D6E63)
val SkyMist = Color(0xFF81D4FA)
val DeepNight = Color(0xFF0F1B0B)
val CrimsonRose = Color(0xFFE91E63)

@OptIn(ExperimentalAnimationApi::class, ExperimentalMaterial3Api::class)
@Composable
fun GameDashboardScreen(
    viewModel: MainViewModel,
    onLogout: () -> Unit
) {
    val coroutineScope = rememberCoroutineScope()
    val context = LocalContext.current

    // State bindings
    val profile by viewModel.gameProfile.collectAsState()
    val crops by viewModel.activeCrops.collectAsState()
    val livestock by viewModel.allLivestock.collectAsState()
    val marketProducts by viewModel.allProducts.collectAsState()
    val orders by viewModel.allOrders.collectAsState()

    // Local UI states
    var isWebGameplay by remember { mutableStateOf(true) }
    var activeTab by remember { mutableStateOf(0) } // 0: Farm, 1: Crops, 2: Market, 3: Quests & Ranking, 4: Settings
    var weatherState by remember { mutableStateOf("sunny") } // "sunny", "rainy", "cloudy_mist", "thunderstorm"
    var showAddProductDialog by remember { mutableStateOf(false) }
    var showBuyProductDialog by remember { mutableStateOf<MarketProduct?>(null) }
    var showProfileEditDialog by remember { mutableStateOf(false) }

    // Dynamic weather timer simulation
    LaunchedEffect(Unit) {
        val hour = java.util.Calendar.getInstance().get(java.util.Calendar.HOUR_OF_DAY)
        weatherState = if (hour in 5..7) {
            "cloudy_mist"
        } else if (hour in 8..16) {
            "sunny"
        } else if (hour in 17..19) {
            "sunny"
        } else {
            if (Math.random() > 0.5) "rainy" else "sunny"
        }
    }

    // Force RTL Arabic Layout direction
    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
        Box(modifier = Modifier.fillMaxSize()) {
            if (isWebGameplay) {
                com.example.MainAppContent()
            } else {
                Scaffold(
                    modifier = Modifier.fillMaxSize(),
                    containerColor = DeepNight,
            topBar = {
                // SECTION 1: HEADER (Top App Bar & Cash Balance)
                GameTopHeader(
                    profile = profile,
                    weatherState = weatherState,
                    onWeatherCycle = {
                        val nextWeather = when (weatherState) {
                            "sunny" -> "rainy"
                            "rainy" -> "cloudy_mist"
                            "cloudy_mist" -> "thunderstorm"
                            else -> "sunny"
                        }
                        weatherState = nextWeather
                    },
                    viewModel = viewModel
                )
            },
            bottomBar = {
                // Material 3 Responsive Bottom Navigation
                NavigationBar(
                    containerColor = Color(0xFF162B12),
                    tonalElevation = 8.dp
                ) {
                    NavigationBarItem(
                        selected = activeTab == 0,
                        onClick = { activeTab = 0 },
                        icon = { Icon(Icons.Default.Home, contentDescription = "Farm") },
                        label = { Text("المزرعة", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = SunnyGold,
                            selectedTextColor = SunnyGold,
                            unselectedIconColor = Color.White.copy(alpha = 0.6f),
                            unselectedTextColor = Color.White.copy(alpha = 0.6f),
                            indicatorColor = Color(0xFF264C1E)
                        )
                    )
                    NavigationBarItem(
                        selected = activeTab == 1,
                        onClick = { activeTab = 1 },
                        icon = { Text("🌱", fontSize = 18.sp) },
                        label = { Text("المحاصيل", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = SunnyGold,
                            selectedTextColor = SunnyGold,
                            unselectedIconColor = Color.White.copy(alpha = 0.6f),
                            unselectedTextColor = Color.White.copy(alpha = 0.6f),
                            indicatorColor = Color(0xFF264C1E)
                        )
                    )
                    NavigationBarItem(
                        selected = activeTab == 2,
                        onClick = { activeTab = 2 },
                        icon = { Icon(Icons.Default.ShoppingCart, contentDescription = "Market") },
                        label = { Text("السوق المفتوح", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = SunnyGold,
                            selectedTextColor = SunnyGold,
                            unselectedIconColor = Color.White.copy(alpha = 0.6f),
                            unselectedTextColor = Color.White.copy(alpha = 0.6f),
                            indicatorColor = Color(0xFF264C1E)
                        )
                    )
                    NavigationBarItem(
                        selected = activeTab == 3,
                        onClick = { activeTab = 3 },
                        icon = { Icon(Icons.Default.List, contentDescription = "Quests & Rank") },
                        label = { Text("المهام والنخبة", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = SunnyGold,
                            selectedTextColor = SunnyGold,
                            unselectedIconColor = Color.White.copy(alpha = 0.6f),
                            unselectedTextColor = Color.White.copy(alpha = 0.6f),
                            indicatorColor = Color(0xFF264C1E)
                        )
                    )
                    NavigationBarItem(
                        selected = activeTab == 4,
                        onClick = { activeTab = 4 },
                        icon = { Icon(Icons.Default.Settings, contentDescription = "Settings") },
                        label = { Text("الإعدادات", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = SunnyGold,
                            selectedTextColor = SunnyGold,
                            unselectedIconColor = Color.White.copy(alpha = 0.6f),
                            unselectedTextColor = Color.White.copy(alpha = 0.6f),
                            indicatorColor = Color(0xFF264C1E)
                        )
                    )
                }
            }
        ) { paddingValues ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
            ) {
                // Background farming dynamic weather effects applied globally
                DynamicWeatherEffectsLayer(weatherState = weatherState)

                // LazyColumn handles overall scrolling & items without viewport overlapping
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 14.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                    contentPadding = PaddingValues(top = 12.dp, bottom = 24.dp)
                ) {
                    
                    // Always show Profile & Banner on top
                    item {
                        // SECTION 2: PLAYER PROFILE CARD
                        PlayerProfileSection(profile = profile, onEditClick = { showProfileEditDialog = true })
                    }

                    // Render screens matching tabs cleanly
                    when (activeTab) {
                        0 -> { // Farm & Livestock Tab
                            item {
                                // SECTION 3: FARM OVERVIEW
                                FarmOverviewSection(
                                    profile = profile,
                                    weatherState = weatherState,
                                    livestockList = livestock,
                                    onBuyLivestock = { type -> viewModel.buyLivestock(type) },
                                    onCareLivestock = { animal -> viewModel.feedAndCareLivestock(animal) },
                                    onClaimDaily = { viewModel.collectDailyReward() }
                                )
                            }
                        }
                        1 -> { // Crops management Tab
                            item {
                                // SECTION 4: CROPS & SEED PLANTING
                                CropManagementSection(
                                    activeCrops = crops,
                                    onPlantCrop = { seedType -> viewModel.plantCrop(seedType) },
                                    onWaterCrop = { crop -> viewModel.waterCrop(crop) },
                                    onHarvestCrop = { crop -> viewModel.harvestCrop(crop) },
                                    weatherState = weatherState
                                )
                            }
                        }
                        2 -> { // Syrian Farmer's Market Tab
                            item {
                                // SECTION 5: MARKETPLACE
                                MarketplaceSection(
                                    products = marketProducts,
                                    orders = orders,
                                    onAddProductClick = { showAddProductDialog = true },
                                    onBuyClick = { showBuyProductDialog = it },
                                    onDeliverSimulate = { order -> 
                                        viewModel.simulateDriverDelivery(order, profile?.avatarName ?: "سائق الغياث السريع")
                                    }
                                )
                            }
                        }
                        3 -> { // Quests & Leaderboard/Alliance
                            item {
                                // SECTION 6: QUESTS
                                QuestsSection(profile = profile)
                            }
                            item {
                                // SECTION 7: LEADERBOARD
                                LeaderboardSection()
                            }
                        }
                        4 -> { // Settings
                            item {
                                // SECTION 8: SETTINGS & BACKUP CODES
                                SettingsSection(
                                    profile = profile,
                                    onLogout = {
                                        viewModel.logout()
                                        onLogout()
                                    },
                                    onToggleBotSimulation = {
                                        // Bot trading simulated action trigger
                                        viewModel.triggerRoseShower()
                                    }
                                )
                            }
                        }
                    }
                }
            }
        }

            } // closes the else { ... } block parameter of isWebGameplay

            // Dynamic floating switcher button in the bottom corner
            FloatingActionButton(
                onClick = { isWebGameplay = !isWebGameplay },
                containerColor = if (isWebGameplay) FertileGreen else SunnyGold,
                contentColor = Color.White,
                shape = CircleShape,
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .padding(16.dp)
                    .testTag("toggle_gameplay_mode")
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp),
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(if (isWebGameplay) "🚀 لوحة التحكم" else "🎮 المزرعة البصرية", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        // --- Dialogs & Popups with safe alignments and no overlap ---

        // Dialog: Edit Profile
        if (showProfileEditDialog) {
            var inputName by remember { mutableStateOf(profile?.avatarName ?: "") }
            var inputAlliance by remember { mutableStateOf(profile?.allianceName ?: "") }
            var inputTitle by remember { mutableStateOf(profile?.avatarTitle ?: "") }

            Dialog(onDismissRequest = { showProfileEditDialog = false }) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF152A11)),
                    border = BorderStroke(1.5.dp, SunnyGold)
                ) {
                    Column(
                        modifier = Modifier
                            .padding(20.dp)
                            .verticalScroll(rememberScrollState()),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Text("تعديل هوية المزارع", color = SunnyGold, fontSize = 16.sp, fontWeight = FontWeight.Bold)

                        OutlinedTextField(
                            value = inputName,
                            onValueChange = { inputName = it },
                            label = { Text("اسم المزارع", color = Color.White.copy(alpha = 0.8f)) },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = SunnyGold,
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.LightGray
                            ),
                            modifier = Modifier.fillMaxWidth()
                        )

                        OutlinedTextField(
                            value = inputAlliance,
                            onValueChange = { inputAlliance = it },
                            label = { Text("التحالف الزراعي", color = Color.White.copy(alpha = 0.8f)) },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = SunnyGold,
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.LightGray
                            ),
                            modifier = Modifier.fillMaxWidth()
                        )

                        OutlinedTextField(
                            value = inputTitle,
                            onValueChange = { inputTitle = it },
                            label = { Text("اللقب المهني", color = Color.White.copy(alpha = 0.8f)) },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = SunnyGold,
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.LightGray
                            ),
                            modifier = Modifier.fillMaxWidth()
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Button(
                                onClick = {
                                    viewModel.updateCharacterConfig(inputName, inputTitle, inputAlliance)
                                    showProfileEditDialog = false
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = FertileGreen),
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("حفظ الهوية", color = Color.White, fontWeight = FontWeight.Bold)
                            }
                            OutlinedButton(
                                onClick = { showProfileEditDialog = false },
                                border = BorderStroke(1.dp, Color.Gray),
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("إلغاء", color = Color.White)
                            }
                        }
                    }
                }
            }
        }

        // Dialog: Add Product to Marketplace
        if (showAddProductDialog) {
            var prodName by remember { mutableStateOf("") }
            var prodPrice by remember { mutableStateOf("") }
            var prodStock by remember { mutableStateOf("") }
            var prodCategory by remember { mutableStateOf("خضروات") }
            var prodDesc by remember { mutableStateOf("") }

            Dialog(onDismissRequest = { showAddProductDialog = false }) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF152A11)),
                    border = BorderStroke(1.5.dp, SunnyGold)
                ) {
                    Column(
                        modifier = Modifier
                            .padding(20.dp)
                            .verticalScroll(rememberScrollState()),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Text("طرح محصول في الحراج العام", color = SunnyGold, fontSize = 16.sp, fontWeight = FontWeight.Bold)

                        OutlinedTextField(
                            value = prodName,
                            onValueChange = { prodName = it },
                            label = { Text("اسم المنتج (مثال: تفاح بلدي طازج)", color = Color.White.copy(alpha = 0.8f)) },
                            colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = SunnyGold, focusedTextColor = Color.White),
                            modifier = Modifier.fillMaxWidth()
                        )

                        OutlinedTextField(
                            value = prodPrice,
                            onValueChange = { prodPrice = it },
                            label = { Text("السعر لكل وحدة (ل.س)", color = Color.White.copy(alpha = 0.8f)) },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = SunnyGold, focusedTextColor = Color.White),
                            modifier = Modifier.fillMaxWidth()
                        )

                        OutlinedTextField(
                            value = prodStock,
                            onValueChange = { prodStock = it },
                            label = { Text("الكمية المعروضة", color = Color.White.copy(alpha = 0.8f)) },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = SunnyGold, focusedTextColor = Color.White),
                            modifier = Modifier.fillMaxWidth()
                        )

                        OutlinedTextField(
                            value = prodDesc,
                            onValueChange = { prodDesc = it },
                            label = { Text("وصف للمشترين", color = Color.White.copy(alpha = 0.8f)) },
                            colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = SunnyGold, focusedTextColor = Color.White),
                            modifier = Modifier.fillMaxWidth()
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Button(
                                onClick = {
                                    val price = prodPrice.toDoubleOrNull() ?: 1000.0
                                    val stock = prodStock.toDoubleOrNull() ?: 10.0
                                    if (prodName.isNotEmpty()) {
                                        viewModel.addNewProduct(prodName, price, stock, "كيلو", prodCategory, prodDesc)
                                        showAddProductDialog = false
                                    }
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = FertileGreen),
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("طرح في السوق", color = Color.White)
                            }
                            OutlinedButton(
                                onClick = { showAddProductDialog = false },
                                border = BorderStroke(1.dp, Color.Gray),
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("إلغاء", color = Color.White)
                            }
                        }
                    }
                }
            }
        }

        // Dialog: Buy Product from Market
        showBuyProductDialog?.let { prod ->
            var buyQty by remember { mutableStateOf("10") }
            var buyerAddress by remember { mutableStateOf("حي الشعلان، دمشق") }

            Dialog(onDismissRequest = { showBuyProductDialog = null }) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF152A11)),
                    border = BorderStroke(1.5.dp, SunnyGold)
                ) {
                    Column(
                        modifier = Modifier
                            .padding(20.dp)
                            .verticalScroll(rememberScrollState()),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Text("تجهيز صفقة شراء", color = SunnyGold, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                        Text(prod.name, color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                        Text("البائع: ${prod.farmerName}", color = Color.LightGray, fontSize = 12.sp)

                        OutlinedTextField(
                            value = buyQty,
                            onValueChange = { buyQty = it },
                            label = { Text("الكمية المطلوبة للشراء", color = Color.White.copy(alpha = 0.8f)) },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = SunnyGold, focusedTextColor = Color.White),
                            modifier = Modifier.fillMaxWidth()
                        )

                        OutlinedTextField(
                            value = buyerAddress,
                            onValueChange = { buyerAddress = it },
                            label = { Text("عنوان التوصيل وخط الإمداد", color = Color.White.copy(alpha = 0.8f)) },
                            colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = SunnyGold, focusedTextColor = Color.White),
                            modifier = Modifier.fillMaxWidth()
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Button(
                                onClick = {
                                    val qty = buyQty.toDoubleOrNull() ?: 1.0
                                    viewModel.buyProduct(
                                        product = prod,
                                        quantity = qty,
                                        buyerName = profile?.avatarName ?: "التاجر المحلي",
                                        paymentMethod = "الدفع كاش عند الاستلام",
                                        address = buyerAddress
                                    )
                                    showBuyProductDialog = null
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = FertileGreen),
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("تأكيد الصفقة", color = Color.White)
                            }
                            OutlinedButton(
                                onClick = { showBuyProductDialog = null },
                                border = BorderStroke(1.dp, Color.Gray),
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("إلغاء", color = Color.White)
                            }
                        }
                    }
                }
            }
        }
    }
}

// --------------------------------------------------------------------------
// SECTION 1: TOP HEADER SUB-COMPOSABLE
// --------------------------------------------------------------------------
@Composable
fun GameTopHeader(
    profile: GameProfile?,
    weatherState: String,
    onWeatherCycle: () -> Unit,
    viewModel: MainViewModel
) {
    Surface(
        color = Color(0xFF132310),
        shadowElevation = 4.dp,
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier
                .statusBarsPadding()
                .padding(horizontal = 14.dp, vertical = 10.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Game Title & Emoji branding
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Text("🌾", fontSize = 24.sp)
                    Column {
                        Text(
                            text = "مزرعة الغياث",
                            color = SunnyGold,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Black
                        )
                        Text(
                            text = "سيرفر دمشق الدولي",
                            color = Color.Green.copy(alpha = 0.7f),
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                // Balance Counters (Coins & Gems)
                Row(
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Gold Coin Counter
                    Row(
                        modifier = Modifier
                            .background(Color.Black.copy(alpha = 0.4f), RoundedCornerShape(12.dp))
                            .border(1.dp, SunnyGold.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
                            .padding(horizontal = 8.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Text("🪙", fontSize = 14.sp)
                        Text(
                            text = "${profile?.goldCoins ?: 1000}",
                            color = Color.White,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Black
                        )
                    }

                    // Gem Counter
                    Row(
                        modifier = Modifier
                            .background(Color.Black.copy(alpha = 0.4f), RoundedCornerShape(12.dp))
                            .border(1.dp, SkyMist.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
                            .padding(horizontal = 8.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Text("💎", fontSize = 14.sp)
                        Text(
                            text = "${profile?.gems ?: 50}",
                            color = SkyMist,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Black
                        )
                    }
                }
            }

            // Weather Ambiance HUD widget
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF1F351A), RoundedCornerShape(10.dp))
                    .clickable { onWeatherCycle() }
                    .padding(horizontal = 10.dp, vertical = 6.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    val weatherIcon = when (weatherState) {
                        "rainy" -> "🌧️"
                        "cloudy_mist" -> "🌫️"
                        "thunderstorm" -> "⛈️"
                        else -> "☀️"
                    }
                    val weatherText = when (weatherState) {
                        "rainy" -> "مطر دافئ (سرعة نمو البذور +٢٥٪)"
                        "cloudy_mist" -> "ضباب صباحي بارد"
                        "thunderstorm" -> "عاصفة رعدية تغذي التربة"
                        else -> "شمس ساطعة تنور سنابل القمح"
                    }
                    Text(weatherIcon, fontSize = 14.sp)
                    Text(weatherText, color = Color.White.copy(alpha = 0.9f), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                }

                Text("تبديل ⚙️", color = SunnyGold, fontSize = 9.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

// --------------------------------------------------------------------------
// SECTION 2: PLAYER PROFILE CARD
// --------------------------------------------------------------------------
@Composable
fun PlayerProfileSection(profile: GameProfile?, onEditClick: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF162A11)),
        border = BorderStroke(1.dp, Color(0xFF325A20).copy(alpha = 0.4f))
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Avatar Box
                Box(
                    modifier = Modifier
                        .size(46.dp)
                        .background(SunnyGold.copy(alpha = 0.1f), CircleShape)
                        .border(1.5.dp, SunnyGold, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Text("👨‍🌾", fontSize = 24.sp)
                }

                Column(modifier = Modifier.weight(1f)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Text(
                            text = profile?.avatarName ?: "مزارع غياث ناشط",
                            color = Color.White,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.ExtraBold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        if (profile?.verifiedMerchantBadge == 1) {
                            Text("🛡️", fontSize = 12.sp)
                        }
                    }
                    
                    Text(
                        text = "${profile?.avatarTitle ?: "مزارع رائد"} • ${profile?.allianceName ?: "تحالف الغوطة الخضراء"}",
                        color = Color.White.copy(alpha = 0.7f),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }

                IconButton(
                    onClick = onEditClick,
                    modifier = Modifier
                        .size(34.dp)
                        .background(Color.White.copy(alpha = 0.08f), CircleShape)
                ) {
                    Icon(Icons.Default.Edit, contentDescription = "Edit Profile", tint = SunnyGold, modifier = Modifier.size(16.dp))
                }
            }

            // XP and Level Progress bar
            val currentXp = profile?.xp ?: 0
            val currentLvl = profile?.level ?: 1
            val nextLevelThreshold = currentLvl * 150
            val progress = (currentXp.toFloat() / nextLevelThreshold.toFloat()).coerceIn(0f, 1f)

            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("المستوى ${currentLvl}", color = SunnyGold, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    Text("نقاط الخبرة: ${currentXp}/${nextLevelThreshold}", color = Color.White.copy(alpha = 0.8f), fontSize = 10.sp)
                }

                LinearProgressIndicator(
                    progress = progress,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(8.dp)
                        .clip(RoundedCornerShape(4.dp)),
                    color = SunnyGold,
                    trackColor = Color.Black.copy(alpha = 0.3f)
                )
            }
        }
    }
}

// --------------------------------------------------------------------------
// SECTION 3: FARM OVERVIEW SECTION
// --------------------------------------------------------------------------
@Composable
fun FarmOverviewSection(
    profile: GameProfile?,
    weatherState: String,
    livestockList: List<GameLivestock>,
    onBuyLivestock: (String) -> Unit,
    onCareLivestock: (GameLivestock) -> Unit,
    onClaimDaily: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF142410)),
        border = BorderStroke(1.dp, Color(0xFF2E5124))
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Farm Soil Moisture HUD
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "🚜 إدارة حظيرة وموارد الغياث",
                    color = Color.White,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.ExtraBold
                )

                // Dynamic Moisture display
                val moistureText = when (weatherState) {
                    "rainy" -> "رطوبة التربة ممتازة: ١٠٠٪ 💧"
                    "thunderstorm" -> "إشباع فائق: ١٠٠٪ ⛈️"
                    "cloudy_mist" -> "التربة ندية: ٩٠٪ 🌫️"
                    else -> "التربة دافئة: ٧٥٪ ☀️"
                }

                Box(
                    modifier = Modifier
                        .background(Color(0xFF1A3816), RoundedCornerShape(20.dp))
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Text(moistureText, color = Color(0xFF81C784), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                }
            }

            // Claim daily prize
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF332005), RoundedCornerShape(12.dp))
                    .border(1.dp, SunnyGold.copy(alpha = 0.4f), RoundedCornerShape(12.dp))
                    .clickable { onClaimDaily() }
                    .padding(10.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Text("🎁", fontSize = 24.sp)
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            "صندوق العطايا اليومية المضمونة",
                            color = SunnyGold,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Black
                        )
                        Text(
                            "احصل على ٣٥٠ ذهبة و ١٥ جوهرة دورياً كل ٢٤ ساعة",
                            color = Color.White.copy(alpha = 0.8f),
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Box(
                        modifier = Modifier
                            .background(SunnyGold, RoundedCornerShape(8.dp))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text("استلام 🟢", color = DeepNight, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            Text("حظيرة الأنعام الحية 🐑", color = SunnyGold, fontSize = 12.sp, fontWeight = FontWeight.Bold)

            // Horizontal scrolling layout of livestock
            LazyRow(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                contentPadding = PaddingValues(horizontal = 2.dp)
            ) {
                items(livestockList) { animal ->
                    Card(
                        modifier = Modifier.width(130.dp),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF1D3517)),
                        border = BorderStroke(1.dp, Color(0xFF3E6F34))
                    ) {
                        Column(
                            modifier = Modifier.padding(10.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            val emoji = when (animal.animalType) {
                                "أغنام" -> "🐑"
                                "ماعز" -> "🐐"
                                else -> "🐓"
                            }
                            Text(emoji, fontSize = 28.sp)
                            Text(
                                "${animal.animalType} (${animal.count} رؤوس)",
                                color = Color.White,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text("الصحة: ${animal.health}%", color = Color.Green, fontSize = 9.sp)

                            Button(
                                onClick = { onCareLivestock(animal) },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(28.dp),
                                contentPadding = PaddingValues(0.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = FertileGreen)
                            ) {
                                Text("إطعام ورعاية", fontSize = 9.sp, color = Color.White)
                            }
                        }
                    }
                }

                // Append constant buy selectors
                item {
                    LivestockPurchaseCard(name = "أغنام لبانية", count = "🐑", price = 500, onClick = { onBuyLivestock("أغنام") })
                }
                item {
                    LivestockPurchaseCard(name = "ماعز شامية", count = "🐐", price = 350, onClick = { onBuyLivestock("ماعز") })
                }
                item {
                    LivestockPurchaseCard(name = "دواجن بلدي", count = "🐓", price = 120, onClick = { onBuyLivestock("دواجن") })
                }
            }
        }
    }
}

@Composable
fun LivestockPurchaseCard(name: String, count: String, price: Int, onClick: () -> Unit) {
    Card(
        modifier = Modifier.width(130.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF23190E)),
        border = BorderStroke(1.dp, SunnyGold.copy(alpha = 0.3f))
    ) {
        Column(
            modifier = Modifier.padding(10.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Text(count, fontSize = 28.sp)
            Text(name, color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
            Text("${price} 🪙", color = SunnyGold, fontSize = 9.sp, fontWeight = FontWeight.Bold)

            Button(
                onClick = onClick,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(28.dp),
                contentPadding = PaddingValues(0.dp),
                colors = ButtonDefaults.buttonColors(containerColor = SunnyGold)
            ) {
                Text("شراء ودعم", fontSize = 9.sp, color = DeepNight, fontWeight = FontWeight.Bold)
            }
        }
    }
}

// --------------------------------------------------------------------------
// SECTION 4: CROPS AND SEED PLANTING
// --------------------------------------------------------------------------
@Composable
fun CropManagementSection(
    activeCrops: List<GameCrop>,
    onPlantCrop: (String) -> Unit,
    onWaterCrop: (GameCrop) -> Unit,
    onHarvestCrop: (GameCrop) -> Unit,
    weatherState: String
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF142410)),
        border = BorderStroke(1.dp, Color(0xFF2E5124))
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text("🌱 غرس البذور وحصاد المحاصيل", color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.ExtraBold)

            // Seeds shop selectors
            Text("شراء بذور ممتازة:", color = SunnyGold, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            
            LazyRow(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                val seedPresets = listOf(
                    Triple("طماطم", "🍅", 40),
                    Triple("خيار", "🥒", 60),
                    Triple("ذرة", "🌽", 80),
                    Triple("بطاطا", "🥔", 100),
                    Triple("بطيخ", "🍉", 150)
                )
                items(seedPresets) { item ->
                    Card(
                        modifier = Modifier
                            .width(85.dp)
                            .clickable { onPlantCrop(item.first) },
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF1D3517)),
                        border = BorderStroke(1.dp, Color(0xFF38662E))
                    ) {
                        Column(
                            modifier = Modifier.padding(8.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Text(item.second, fontSize = 22.sp)
                            Text(item.first, color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            Text("${item.third} 🪙", color = SunnyGold, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            // Realtime growing Crops lists
            Text("حقولك الزراعية الحالية (${activeCrops.size}/٩):", color = SunnyGold, fontSize = 11.sp, fontWeight = FontWeight.Bold)

            if (activeCrops.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color.Black.copy(alpha = 0.2f), RoundedCornerShape(12.dp))
                        .padding(24.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("حقولك شاغرة الآن! اضغط على البذور أعلاه لتبدأ زراعة حقل الغياث 🌾", color = Color.LightGray, fontSize = 10.sp, textAlign = TextAlign.Center)
                }
            } else {
                activeCrops.forEach { crop ->
                    // Calculate remaining time
                    val now = System.currentTimeMillis()
                    val totalSec = crop.durationSeconds.toLong()
                    val elapsedSec = (now - crop.plantedAt) / 1000
                    val remaining = (totalSec - elapsedSec).coerceAtLeast(0)

                    val isReady = remaining <= 0
                    val progressValue = if (totalSec > 0) {
                        ((totalSec - remaining).toFloat() / totalSec.toFloat()).coerceIn(0f, 1f)
                    } else 1f

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color(0xFF1D3517), RoundedCornerShape(12.dp))
                            .border(1.dp, if (isReady) SunnyGold else Color.Transparent, RoundedCornerShape(12.dp))
                            .padding(10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        val cropEmoji = when (crop.cropType) {
                            "طماطم" -> "🍅"
                            "خيار" -> "🥒"
                            "ذرة" -> "🌽"
                            "بطاطا" -> "🥔"
                            "بطيخ" -> "🍉"
                            else -> "🌱"
                        }

                        Text(cropEmoji, fontSize = 24.sp)

                        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(crop.cropType, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                if (isReady) {
                                    Text("جاهز للحصاد! ⭐", color = SunnyGold, fontSize = 10.sp, fontWeight = FontWeight.Black)
                                } else {
                                    Text("متبقي ${remaining}ث", color = Color.LightGray, fontSize = 9.sp)
                                }
                            }

                            LinearProgressIndicator(
                                progress = progressValue,
                                color = if (isReady) Color.Green else Color(0xFF64B5F6),
                                trackColor = Color.Black.copy(alpha = 0.3f),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(6.dp)
                                    .clip(RoundedCornerShape(3.dp))
                            )
                        }

                        if (isReady) {
                            Button(
                                onClick = { onHarvestCrop(crop) },
                                colors = ButtonDefaults.buttonColors(containerColor = SunnyGold),
                                contentPadding = PaddingValues(horizontal = 8.dp),
                                modifier = Modifier.height(34.dp)
                            ) {
                                Text("حصاد 🌾", color = DeepNight, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                        } else {
                            // If not watered, allow watering to cheat duration down!
                            if (crop.isWatered == 0) {
                                Button(
                                    onClick = { onWaterCrop(crop) },
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1976D2)),
                                    contentPadding = PaddingValues(horizontal = 8.dp),
                                    modifier = Modifier.height(34.dp)
                                ) {
                                    Text("سقاية 💧", color = Color.White, fontSize = 10.sp)
                                }
                            } else {
                                Box(
                                    modifier = Modifier
                                        .background(Color.White.copy(alpha = 0.08f), RoundedCornerShape(8.dp))
                                        .padding(horizontal = 8.dp, vertical = 4.dp)
                                ) {
                                    Text("مرتوي ✅", color = Color.LightGray, fontSize = 9.sp)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// --------------------------------------------------------------------------
// SECTION 5: SYRIAN OPEN FARMERS MARKETPLACE
// --------------------------------------------------------------------------
@Composable
fun MarketplaceSection(
    products: List<MarketProduct>,
    orders: List<MarketOrder>,
    onAddProductClick: () -> Unit,
    onBuyClick: (MarketProduct) -> Unit,
    onDeliverSimulate: (MarketOrder) -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF142410)),
        border = BorderStroke(1.dp, Color(0xFF2E5124))
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("🍎 حراج سوق الغياث الإقليمي", color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.ExtraBold)

                Button(
                    onClick = onAddProductClick,
                    colors = ButtonDefaults.buttonColors(containerColor = SunnyGold),
                    contentPadding = PaddingValues(horizontal = 10.dp),
                    modifier = Modifier.height(30.dp)
                ) {
                    Text("+ اعرض محصولك", color = DeepNight, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                }
            }

            Text("العروض الطازجة المتاحة بالسوق لشراء بالجملة:", color = SunnyGold, fontSize = 11.sp, fontWeight = FontWeight.Bold)

            products.forEach { prod ->
                // Custom design market row
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0xFF1D3517), RoundedCornerShape(12.dp))
                        .padding(10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    val catEmoji = when (prod.category) {
                        "خضروات" -> "🥬"
                        "فواكه" -> "🍉"
                        "مواشي" -> "🐑"
                        else -> "🌾"
                    }
                    Text(catEmoji, fontSize = 24.sp)

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            prod.name,
                            color = Color.White,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Text("البائع: ${prod.farmerName}", color = Color.LightGray, fontSize = 9.sp)
                        Text(
                            "${prod.pricePerUnit} ل.س / ${prod.unitType} (متاح: ${prod.stockLeft})",
                            color = SunnyGold,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Button(
                        onClick = { onBuyClick(prod) },
                        colors = ButtonDefaults.buttonColors(containerColor = FertileGreen),
                        contentPadding = PaddingValues(horizontal = 10.dp),
                        modifier = Modifier.height(32.dp)
                    ) {
                        Text("شراء", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            Spacer(modifier = Modifier.height(6.dp))

            // Log of orders & delivery statuses
            Text("شحنات التوريد وطلبات الوكلاء المنسقة:", color = SunnyGold, fontSize = 11.sp, fontWeight = FontWeight.Bold)

            if (orders.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color.Black.copy(alpha = 0.15f), RoundedCornerShape(12.dp))
                        .padding(16.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("لا يوجد شحنات جارية حالياً 📦", color = Color.LightGray, fontSize = 10.sp)
                }
            } else {
                orders.forEach { order ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF1D2F16)),
                        border = BorderStroke(1.dp, Color(0xFF385A2A))
                    ) {
                        Column(
                            modifier = Modifier.padding(10.dp),
                            verticalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    "شحنة: ${order.productName}",
                                    color = Color.White,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold
                                )

                                val statusColor = when (order.status) {
                                    "تم التسليم" -> Color.Green
                                    "قيد التوصيل" -> Color(0xFF4FC3F7)
                                    else -> SunnyGold
                                }
                                Text(order.status, color = statusColor, fontSize = 10.sp, fontWeight = FontWeight.Black)
                            }

                            Text(
                                "المستورد: ${order.buyerName} • الوجهة: ${order.deliveryAddress}",
                                color = Color.White.copy(alpha = 0.7f),
                                fontSize = 9.sp
                            )
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    "القيمة: ${order.totalPrice} ل.س • الأرباح: +${order.xpAwarded} XP",
                                    color = SunnyGold,
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Bold
                                )

                                if (order.status == "قيد الانتظار" || order.status == "جاري التجهيز") {
                                    Button(
                                        onClick = { onDeliverSimulate(order) },
                                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFD84315)),
                                        contentPadding = PaddingValues(horizontal = 8.dp),
                                        modifier = Modifier.height(28.dp)
                                    ) {
                                        Text("تفعيل التوصيل 🚚", color = Color.White, fontSize = 9.sp)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// --------------------------------------------------------------------------
// SECTION 6: QUESTS MANAGEMENT (المهام اليومية)
// --------------------------------------------------------------------------
@Composable
fun QuestsSection(profile: GameProfile?) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF142410)),
        border = BorderStroke(1.dp, Color(0xFF2E5124))
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Text("🏅 مهام التنمية المستدامة اليومية", color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.ExtraBold)

            QuestRow(
                title = "تصدير محاصيل العروة التشرينية",
                desc = "غرس وحصاد طماطم طازجة من حجر الأساس",
                progress = "١/٣",
                reward = "🪙 +١٥٠ ذهبة • +٥٠ خبرة",
                isDone = false
            )

            QuestRow(
                title = "تأمين مخزون الأعلاف الصيفية",
                desc = "إطعام ورعاية الماشية والأغنام لزيادة إنتاج الحليب",
                progress = "كاملة ✅",
                reward = "🪙 +٢٥٠ ذهبة • +٨٠ خبرة",
                isDone = true
            )

            QuestRow(
                title = "الشراكة التجارية الإقليمية",
                desc = "طرح أو شراء ٢ صفقات زراعية في حراج دمشق المفتوح",
                progress = "${profile?.completedSalesCount ?: 0}/٢",
                reward = "💎 +٥ جواهر • +٧٥ خبرة",
                isDone = (profile?.completedSalesCount ?: 0) >= 2
            )
        }
    }
}

@Composable
fun QuestRow(title: String, desc: String, progress: String, reward: String, isDone: Boolean) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xFF1D3517), RoundedCornerShape(12.dp))
            .border(1.dp, if (isDone) Color.Green.copy(alpha = 0.4f) else Color.Transparent, RoundedCornerShape(12.dp))
            .padding(10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        Text(if (isDone) "✅" else "🏹", fontSize = 20.sp)

        Column(modifier = Modifier.weight(1f)) {
            Text(title, color = if (isDone) Color.LightGray else Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            Text(desc, color = Color.White.copy(alpha = 0.6f), fontSize = 9.sp)
            Text("الجائزة: ${reward}", color = SunnyGold, fontSize = 9.sp, fontWeight = FontWeight.SemiBold)
        }

        Box(
            modifier = Modifier
                .background(if (isDone) Color(0xFF1B5E20) else Color(0xFF37474F), RoundedCornerShape(8.dp))
                .padding(horizontal = 8.dp, vertical = 4.dp)
        ) {
            Text(progress, color = Color.White, fontSize = 9.sp, fontWeight = FontWeight.Bold)
        }
    }
}

// --------------------------------------------------------------------------
// SECTION 7: LEADERBOARD SHOWCASE
// --------------------------------------------------------------------------
@Composable
fun LeaderboardSection() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF142410)),
        border = BorderStroke(1.dp, Color(0xFF2E5124))
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Text("🏆 قائمة النخبة لكبار مزارعي الشام", color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.ExtraBold)

            LeaderboardRow(rank = "١", name = "محمد جهاد الغياث 👑", details = "مستوى ٤٥ • تحالف دمشق الموحد", score = "١٢,٤٥٠ ل.س")
            LeaderboardRow(rank = "٢", name = "مزارع القمح الحوراني", details = "مستوى ٣٩ • مزارعو حوران", score = "٩,٨٢٠ ل.س")
            LeaderboardRow(rank = "٣", name = "نسيم الغوطة الخضراء", details = "مستوى ٣٢ • تحالف السيدة زينب", score = "٨,١٤٠ ل.س")
            LeaderboardRow(rank = "٤", name = "مزارع حمص الفاخر", details = "مستوى ٢٨ • اتحاد سهول حمص", score = "٧,٥٠٠ ل.س")
        }
    }
}

@Composable
fun LeaderboardRow(rank: String, name: String, details: String, score: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xFF1D3517), RoundedCornerShape(12.dp))
            .padding(10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        val medal = when (rank) {
            "١" -> "🥇"
            "٢" -> "🥈"
            "٣" -> "🥉"
            else -> "🎖️"
        }
        Text(medal, fontSize = 18.sp)

        Column(modifier = Modifier.weight(1f)) {
            Text(name, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            Text(details, color = Color.White.copy(alpha = 0.6f), fontSize = 9.sp)
        }

        Text(score, color = SunnyGold, fontSize = 10.sp, fontWeight = FontWeight.Black)
    }
}

// --------------------------------------------------------------------------
// SECTION 8: SETTINGS & BACKUP CODES PANEL
// --------------------------------------------------------------------------
@Composable
fun SettingsSection(
    profile: GameProfile?,
    onLogout: () -> Unit,
    onToggleBotSimulation: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF142410)),
        border = BorderStroke(1.dp, Color(0xFF2E5124))
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Text("⚙️ لوحة التحكم والإعدادات الفنية", color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.ExtraBold)

            // Live Simulated Bot actions
            Button(
                onClick = onToggleBotSimulation,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF37474F)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("محاكاة صفقات روبوتات التداول التلقائي 🤖", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }

            // Secure backup info card
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF241410)),
                border = BorderStroke(1.dp, CrimsonRose.copy(alpha = 0.3f))
            ) {
                Column(
                    modifier = Modifier.padding(10.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Text("💡 معلومات الحماية والوصول الآمن", color = CrimsonRose, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    Text(
                        "الحساب مربوط بنجاح بنظام Google Workspace ودرع الغياث للمقاطعات السورية الآمنة. يمكنك استعادة تقدمك باستخدام رخص وحسابات الهاتف المحققة.",
                        color = Color.White.copy(alpha = 0.8f),
                        fontSize = 9.sp,
                        lineHeight = 14.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Logout Button
            Button(
                onClick = onLogout,
                colors = ButtonDefaults.buttonColors(containerColor = CrimsonRose),
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(10.dp)
            ) {
                Text("تسجيل الخروج الآمن 🚪", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Black)
            }
        }
    }
}

// --------------------------------------------------------------------------
// DYNAMIC WEATHER EFFECTS CANVAS LAYER
// --------------------------------------------------------------------------
@Composable
fun DynamicWeatherEffectsLayer(weatherState: String) {
    val infiniteTransition = rememberInfiniteTransition(label = "DashboardWeather")
    
    // Animate falling rain drop heights
    val rainY by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 600f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "RainYOff"
    )

    // Sun beam orange/yellow pulsing
    val sunBeamPulse by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 0.65f,
        animationSpec = infiniteRepeatable(
            animation = tween(4000, easing = EaseInOutSine),
            repeatMode = RepeatMode.Reverse
        ),
        label = "SunBeamPulse"
    )

    // Mist sway translation
    val mistX by infiniteTransition.animateFloat(
        initialValue = -50f,
        targetValue = 50f,
        animationSpec = infiniteRepeatable(
            animation = tween(8000, easing = EaseInOutQuad),
            repeatMode = RepeatMode.Reverse
        ),
        label = "MistSway"
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .alpha(0.3f) // Keep weather graphics secondary & unobtrusive
    ) {
        when (weatherState) {
            "rainy", "thunderstorm" -> {
                Canvas(modifier = Modifier.fillMaxSize()) {
                    // Rain droplets
                    repeat(25) { idx ->
                        val startX = (idx * 40f + 120f) % size.width
                        val offsetRain = (idx * 15f) % size.height
                        val currentY = (rainY + offsetRain) % size.height
                        
                        // Draw angled soft blue line representing falling rain
                        drawLine(
                            color = Color(0xFF64B5F6),
                            start = androidx.compose.ui.geometry.Offset(startX, currentY),
                            end = androidx.compose.ui.geometry.Offset(startX + 6f, currentY + 30f),
                            strokeWidth = 3f
                        )
                    }
                }
            }
            "cloudy_mist" -> {
                // Soft gradient layout that sways representing moving mist
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .offset(x = mistX.dp)
                        .background(
                            Brush.linearGradient(
                                colors = listOf(
                                    Color.White.copy(alpha = 0.05f),
                                    Color.LightGray.copy(alpha = 0.08f),
                                    Color.Transparent
                                )
                            )
                        )
                )
            }
            "sunny" -> {
                // Radial golden beam on top
                Box(
                    modifier = Modifier
                        .size(300.dp)
                        .align(Alignment.TopStart)
                        .scale(sunBeamPulse + 0.8f)
                        .background(
                            Brush.radialGradient(
                                colors = listOf(
                                    Color(0xFFFFEE58).copy(alpha = 0.08f),
                                    Color.Transparent
                                )
                            )
                        )
                )
            }
        }
    }
}
