package com.example

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.AppDatabase
import com.example.data.AppRepository
import com.example.data.GameCrop
import com.example.data.GameLivestock
import com.example.data.GameProfile
import com.example.data.MarketOrder
import com.example.data.MarketProduct
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class MainViewModel(application: Application) : AndroidViewModel(application) {
    private val repository: AppRepository

    // Base flows
    val allProducts: StateFlow<List<MarketProduct>>
    val allOrders: StateFlow<List<MarketOrder>>
    val gameProfile: StateFlow<GameProfile?>
    val activeCrops: StateFlow<List<GameCrop>>
    val allLivestock: StateFlow<List<GameLivestock>>

    // Auth Screen UI configurations
    private val _isAuthenticated = MutableStateFlow(false)
    val isAuthenticated: StateFlow<Boolean> = _isAuthenticated.asStateFlow()

    private val _authLoading = MutableStateFlow(false)
    val authLoading: StateFlow<Boolean> = _authLoading.asStateFlow()

    private val _phoneInput = MutableStateFlow("")
    val phoneInput: StateFlow<String> = _phoneInput.asStateFlow()

    private val _otpInput = MutableStateFlow("")
    val otpInput: StateFlow<String> = _otpInput.asStateFlow()

    private val _otpSent = MutableStateFlow(false)
    val otpSent: StateFlow<Boolean> = _otpSent.asStateFlow()

    private val _otpTimer = MutableStateFlow(60)
    val otpTimer: StateFlow<Int> = _otpTimer.asStateFlow()

    private val _otpError = MutableStateFlow(false)
    val otpError: StateFlow<Boolean> = _otpError.asStateFlow()

    // Screen selection
    private val _currentTab = MutableStateFlow(0) // 0: Market, 1: Orders/Deliveries, 2: Game, 3: Founder
    val currentTab: StateFlow<Int> = _currentTab.asStateFlow()

    // Events (like showing rose confetti or alerts)
    private val _roseShowerEvent = MutableSharedFlow<Unit>()
    val roseShowerEvent: SharedFlow<Unit> = _roseShowerEvent.asSharedFlow()

    private val _toastMessage = MutableSharedFlow<String>()
    val toastMessage: SharedFlow<String> = _toastMessage.asSharedFlow()

    init {
        val database = AppDatabase.getDatabase(application)
        repository = AppRepository(database)

        allProducts = repository.allProducts.stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

        allOrders = repository.allOrders.stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

        gameProfile = repository.gameProfile.stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = null
        )

        activeCrops = repository.activeCrops.stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

        allLivestock = repository.allLivestock.stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

        // Populate database with Syrian agriculture seeds and initialize Game Profile
        viewModelScope.launch(Dispatchers.IO) {
            repository.populateInitialDataIfEmpty()
            repository.getProfileDirect() // ensures profile exists
        }

        // Start SMS otp timer tick if active
        viewModelScope.launch {
            while (true) {
                delay(1000)
                if (_otpSent.value && _otpTimer.value > 0) {
                    _otpTimer.value -= 1
                }
            }
        }
    }

    // AUTH METHODS
    fun setPhone(phone: String) {
        _phoneInput.value = phone
    }

    fun setOtp(otp: String) {
        _otpInput.value = otp
        _otpError.value = false
    }

    fun sendOtp() {
        if (_phoneInput.value.length < 8) {
            sendToast("الرجاء إدخال رقم هاتف سوري صحيح")
            return
        }
        viewModelScope.launch {
            _authLoading.value = true
            delay(1500) // Simulated network secure handshake
            _otpSent.value = true
            _otpTimer.value = 60
            _authLoading.value = false
            sendToast("تم إرسال رمز التحقق OTP بنجاح إلى الرقم +964 ${_phoneInput.value}")
        }
    }

    fun verifyOtp() {
        if (_otpInput.value == "123456" || _otpInput.value == "7777") { // standard bypass codes
            viewModelScope.launch {
                _authLoading.value = true
                delay(1200)
                _isAuthenticated.value = true
                _authLoading.value = false
                sendToast("أهلاً بك بكود محقق عبر شبكة الغياث الآمنة")
            }
        } else {
            _otpError.value = true
            viewModelScope.launch {
                sendToast("رمز التحقق غير صحيح! جرب الكود الاحتياطي (123456)")
                delay(1000)
                _otpError.value = false
            }
        }
    }

    fun loginWithGoogle() {
        viewModelScope.launch {
            _authLoading.value = true
            delay(1500)
            _isAuthenticated.value = true
            _authLoading.value = false
            sendToast("تم تسجيل الدخول الآمن بنجاح عبر حساب Google Workspace")
        }
    }

    fun loginWithFacebook() {
        viewModelScope.launch {
            _authLoading.value = true
            delay(1500)
            _isAuthenticated.value = true
            _authLoading.value = false
            sendToast("تم تسجيل الدخول الآمن بنجاح عبر حساب Facebook Identity")
        }
    }

    fun logout() {
        viewModelScope.launch {
            _isAuthenticated.value = false
            _otpSent.value = false
            _phoneInput.value = ""
            _otpInput.value = ""
            sendToast("تم تسجيل الخروج بسلام")
        }
    }

    fun switchTab(index: Int) {
        _currentTab.value = index
    }

    // MARKETPLACE METHODS
    fun buyProduct(product: MarketProduct, quantity: Double, buyerName: String, paymentMethod: String, address: String) {
        viewModelScope.launch(Dispatchers.IO) {
            if (product.stockLeft < quantity) {
                sendToast("الكمية المتاحة في المخزن غير كافية!")
                return@launch
            }

            // Deduct stock
            val updatedProduct = product.copy(stockLeft = product.stockLeft - quantity)
            repository.updateProduct(updatedProduct)

            // Calculate total price
            val price = product.pricePerUnit * quantity

            // Create Order
            val order = MarketOrder(
                productName = product.name,
                quantity = quantity,
                totalPrice = price,
                buyerName = buyerName,
                status = "قيد الانتظار",
                paymentMethod = paymentMethod,
                deliveryAddress = address,
                xpAwarded = (quantity * 25).toInt().coerceAtLeast(30)
            )
            repository.insertOrder(order)

            // Gamification logic: buyer (Restaurant/Store) orders fresh produce, increasing profile XP!
            val profile = repository.getProfileDirect()
            val totalXp = profile.xp + 40
            val levelUpReward = checkLevelUp(profile.level, totalXp)
            
            repository.updateProfile(profile.copy(
                xp = levelUpReward.newXp,
                level = levelUpReward.newLevel,
                goldCoins = profile.goldCoins + 20 // minor buyer bonus
            ))

            sendToast("تم إرسال طلب الشراء! تم الربط مع بوابة $paymentMethod بنجاح 💸")
        }
    }

    fun addNewProduct(name: String, price: Double, stock: Double, unit: String, category: String, desc: String) {
        viewModelScope.launch(Dispatchers.IO) {
            val product = MarketProduct(
                name = name,
                description = desc,
                farmerName = "مزرعة العضو المحلي (أنت)",
                pricePerUnit = price,
                unitType = unit,
                stockLeft = stock,
                category = category,
                imageUrlIndex = (1..5).random()
            )
            repository.insertProduct(product)

            // Gamification: adding product as a Farmer unlocks progress
            val profile = repository.getProfileDirect()
            val updatedProfile = profile.copy(
                xp = profile.xp + 30,
                completedSalesCount = profile.completedSalesCount + 1
            )
            
            val levelUp = checkLevelUp(updatedProfile.level, updatedProfile.xp)
            repository.updateProfile(updatedProfile.copy(
                xp = levelUp.newXp,
                level = levelUp.newLevel
            ))

            sendToast("تمت إضافة منتجك الزراعي بنجاح إلى منصة السوق! 🥕")
        }
    }

    // COMMISSIONS & DELIVERY SIMULATOR FOR DRIVERS
    fun simulateDriverDelivery(order: MarketOrder, driverName: String) {
        viewModelScope.launch(Dispatchers.IO) {
            // Step 1: Assign driver and mark as "جاري التجهيز"
            var updatedOrder = order.copy(driverName = driverName, status = "جاري التجهيز")
            repository.updateOrder(updatedOrder)
            sendToast("السائق $driverName استلم الطلب وهو قيد التحضير والتجهيز حالياً 📦")
            delay(4000)

            // Step 2: Out for delivery
            updatedOrder = updatedOrder.copy(status = "قيد التوصيل")
            repository.updateOrder(updatedOrder)
            sendToast("الشحنة انطلقت الآن وقيد التوصيل إلى العنوان المحدد 🚚")
            delay(4000)

            // Step 3: Completed
            updatedOrder = updatedOrder.copy(status = "تم التسليم")
            repository.updateOrder(updatedOrder)

            // Reward Driver in Game Economy (Gamification Linkage!)
            val profile = repository.getProfileDirect()
            val rewardGold = 150
            val rewardGems = 5
            val newXp = profile.xp + order.xpAwarded + 50
            val levelUp = checkLevelUp(profile.level, newXp)

            repository.updateProfile(profile.copy(
                goldCoins = profile.goldCoins + rewardGold,
                gems = profile.gems + rewardGems,
                xp = levelUp.newXp,
                level = levelUp.newLevel,
                completionsCount = profile.completionsCount + 1
            ))

            sendToast("تم إيصال الطلب بنجاح! كسبت كمندوب: 🪙 +$rewardGold ذهبة و 💎 +$rewardGems جواهر!")
        }
    }

    // GAME: PLANT CROPS
    fun plantCrop(type: String) {
        viewModelScope.launch(Dispatchers.IO) {
            val cost = when (type) {
                "طماطم" -> 40
                "خيار" -> 60
                "ذرة" -> 80
                "بطاطا" -> 100
                "بطيخ" -> 150
                else -> 30
            }

            val profile = repository.getProfileDirect()
            if (profile.goldCoins < cost) {
                sendToast("رصيدك من الذهب غير كافٍ لشراء بذور الـ $type (التكلفة $cost)")
                return@launch
            }

            val duration = when (type) {
                "طماطم" -> 20
                "خيار" -> 30
                "ذرة" -> 40
                "بطاطا" -> 50
                "بطيخ" -> 60
                else -> 15
            }

            // Deduct Gold and plant
            repository.updateProfile(profile.copy(goldCoins = profile.goldCoins - cost))
            
            val crop = GameCrop(
                cropType = type,
                plantedAt = System.currentTimeMillis(),
                durationSeconds = duration
            )
            repository.insertCrop(crop)
            sendToast("تمت زراعة بذور $type الفاخرة بنجاح 🌱")
        }
    }

    fun waterCrop(crop: GameCrop) {
        viewModelScope.launch(Dispatchers.IO) {
            // Watering halves remaining duration or gives a huge efficiency boost
            val updated = crop.copy(
                isWatered = 1,
                plantedAt = crop.plantedAt - (crop.durationSeconds * 1000L / 3) // cheat time backward to accelerate
            )
            repository.updateCrop(updated)
            sendToast("تم سقاية $crop.cropType بماء نقي، تسارع النمو! 💧")
        }
    }

    fun harvestCrop(crop: GameCrop) {
        viewModelScope.launch(Dispatchers.IO) {
            repository.deleteCrop(crop.id)

            val profile = repository.getProfileDirect()
            val rewardGold = when (crop.cropType) {
                "طماطم" -> 80
                "خيار" -> 120
                "ذرة" -> 160
                "بطاطا" -> 220
                "بطيخ" -> 350
                else -> 50
            }
            val rewardGems = if ((1..100).random() > 80) 2 else 0 // 20% chance of gem

            val newXp = profile.xp + 25
            val levelUp = checkLevelUp(profile.level, newXp)

            repository.updateProfile(profile.copy(
                goldCoins = profile.goldCoins + rewardGold,
                gems = profile.gems + rewardGems,
                xp = levelUp.newXp,
                level = levelUp.newLevel
            ))

            sendToast("تم حصاد المحصول 🌾 كسبت: 🪙 +$rewardGold ذهبة" + (if (rewardGems > 0) " و 💎 +$rewardGems جواهر!" else ""))
        }
    }

    // GAME: LIVESTOCK MANAGEMENT
    fun buyLivestock(animalType: String) {
        viewModelScope.launch(Dispatchers.IO) {
            val cost = when (animalType) {
                "أغنام" -> 500
                "ماعز" -> 350
                "دواجن" -> 120
                else -> 100
            }

            val profile = repository.getProfileDirect()
            if (profile.goldCoins < cost) {
                sendToast("رصيدك من الذهب غير كافٍ لشراء $animalType (التكلفة $cost)")
                return@launch
            }

            // Deduct cost and add livestock
            repository.updateProfile(profile.copy(goldCoins = profile.goldCoins - cost))
            repository.insertLivestock(GameLivestock(animalType = animalType, count = 1, health = 100))
            sendToast("مبروك! تم شراء رأس $animalType متميزة لحظيرتك الممتازة 🐓")
        }
    }

    fun feedAndCareLivestock(livestock: GameLivestock) {
        viewModelScope.launch(Dispatchers.IO) {
            val profile = repository.getProfileDirect()
            val animalName = livestock.animalType

            // Feeding yields products to sell instantly
            val feedCost = 15
            if (profile.goldCoins < feedCost) {
                sendToast("لا تملك ذهباً كافياً لشراء طعام ومكملات مغذية (التكلفة $feedCost)")
                return@launch
            }

            val rewardGold = when (animalName) {
                "أغنام" -> 60 // sells wool & butter
                "ماعز" -> 45  // sells fresh organic milk
                "دواجن" -> 25 // sells farm eggs
                else -> 15
            }

            // Care logic
            val updated = livestock.copy(
                health = (livestock.health + 10).coerceAtMost(100),
                lastFedTime = System.currentTimeMillis()
            )
            repository.updateLivestock(updated)

            val newXp = profile.xp + 15
            val levelUp = checkLevelUp(profile.level, newXp)

            repository.updateProfile(profile.copy(
                goldCoins = profile.goldCoins - feedCost + rewardGold,
                xp = levelUp.newXp,
                level = levelUp.newLevel
            ))

            sendToast("تم إطعام ورعاية الـ $animalName! أنتجت مواد مباعة بقيمة 🪙 +$rewardGold ذهب!")
        }
    }

    fun deleteLivestockState(id: Int) {
        viewModelScope.launch(Dispatchers.IO) {
            repository.deleteLivestock(id)
            sendToast("تم بيع رأس الماشية لتوليد سيولة")
        }
    }

    // GAME: OTHER FEATURES
    fun collectDailyReward() {
        viewModelScope.launch(Dispatchers.IO) {
            val profile = repository.getProfileDirect()
            val now = System.currentTimeMillis()
            
            // Check if 24 hours passed or never collected
            if (now - profile.lastDailyRewardTime < 24 * 60 * 60 * 1000L) {
                val remSeconds = (24 * 60 * 60 * 1000L - (now - profile.lastDailyRewardTime)) / 1000L
                val remHours = remSeconds / 3600
                sendToast("لقد جمعت هديتك اليومية بالفعل! يرجى الانتظار $remHours ساعة.")
                return@launch
            }

            val updatedProfile = profile.copy(
                goldCoins = profile.goldCoins + 350,
                gems = profile.gems + 15,
                lastDailyRewardTime = now
            )
            repository.updateProfile(updatedProfile)
            
            viewModelScope.launch {
                _roseShowerEvent.emit(Unit) // activate Rose Confetti dynamic animation as celebration!
            }
            sendToast("🎁 مبروك! فتحت صندوق الغياث اليومي: ربحت 🪙 +350 ذهبة و 💎 +15 جوهرة مذهلة!")
        }
    }

    fun updateCharacterConfig(name: String, title: String, alliance: String) {
        viewModelScope.launch(Dispatchers.IO) {
            val profile = repository.getProfileDirect()
            repository.updateProfile(profile.copy(
                avatarName = name.ifEmpty { profile.avatarName },
                avatarTitle = title.ifEmpty { profile.avatarTitle },
                allianceName = alliance.ifEmpty { profile.allianceName }
            ))
            sendToast("تم تحديث بطاقة شخصية المزارع وتحالفك بنجاح! 🎖️")
        }
    }

    fun triggerRoseShower() {
        viewModelScope.launch {
            _roseShowerEvent.emit(Unit)
        }
    }

    // HELPERS
    private fun sendToast(msg: String) {
        viewModelScope.launch {
            _toastMessage.emit(msg)
        }
    }

    data class LevelResult(val newLevel: Int, val newXp: Int)
    private fun checkLevelUp(currentLevel: Int, currentXp: Int): LevelResult {
        var lvl = currentLevel
        var xp = currentXp
        var nextLevelThreshold = lvl * 150
        while (xp >= nextLevelThreshold) {
            xp -= nextLevelThreshold
            lvl += 1
            nextLevelThreshold = lvl * 150
            viewModelScope.launch {
                sendToast("🎉 رائع! لقد ارتفع مستواك المهني إلى المستوى [$lvl]! مبروك الترقيات!")
            }
        }
        return LevelResult(lvl, xp)
    }
}
