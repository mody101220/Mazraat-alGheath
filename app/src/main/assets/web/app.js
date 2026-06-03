/**
 * Al-Ghaith Farm Game Engine (مزرعة الغياث)
 * Fully modular production-ready JavaScript architecture
 * Real-time Firebase Firestore syncing + Simulated Offline fallback
 */

// Global Game State
let gameState = {
    user: {
        id: "offline_user_" + Math.floor(Math.random() * 100000),
        name: "مزارع_الغياث_" + Math.floor(Math.random() * 900 + 100),
        avatar: "Ghaith",
        level: 1,
        xp: 0,
        coins: 1000,
        gems: 20,
        isVip: false,
        online: true,
        alliance: "تحالف الغياث الدولي"
    },
    inventory: {
        wheat: 0,
        tomato: 0,
        rose: 0,
        olive: 0
    },
    plots: [
        { id: 0, crop: null, plantedAt: 0, readyAt: 0, locked: false },
        { id: 1, crop: null, plantedAt: 0, readyAt: 0, locked: false },
        { id: 2, crop: null, plantedAt: 0, readyAt: 0, locked: false },
        { id: 3, crop: null, plantedAt: 0, readyAt: 0, locked: true }, // Locked initially
        { id: 4, crop: null, plantedAt: 0, readyAt: 0, locked: true },
        { id: 5, crop: null, plantedAt: 0, readyAt: 0, locked: true },
        { id: 6, crop: null, plantedAt: 0, readyAt: 0, locked: true },
        { id: 7, crop: null, plantedAt: 0, readyAt: 0, locked: true },
        { id: 8, crop: null, plantedAt: 0, readyAt: 0, locked: true }
    ],
    marketListings: [],
    chatMessages: [],
    quests: [
        { id: "quest_wheat", label: "حصد القمح الشامى 5 مرات", target: 5, progress: 0, rewardCoins: 150, rewardXp: 50, rewardGems: 1, completed: false, type: "plant_wheat" },
        { id: "quest_gold", label: "كسب 300 من الذهب الصافي", target: 300, progress: 0, rewardCoins: 0, rewardXp: 80, rewardGems: 2, completed: false, type: "gain_gold" },
        { id: "quest_trade", label: "نشر صفقة جديدة بالسوق", target: 1, progress: 0, rewardCoins: 100, rewardXp: 40, rewardGems: 1, completed: false, type: "market_trade" }
    ],
    selectedSeed: "wheat",
    currentTab: "farm"
};

// Crop Definitions database
const cropsDb = {
    wheat: { name: "القمح البلدي", emoji: "🌾", cost: 10, growTime: 10, rewardCoins: 18, rewardXp: 15, color: "#fbc02d" },
    tomato: { name: "طماطم الغوطة", emoji: "🍅", cost: 25, growTime: 30, rewardCoins: 45, rewardXp: 35, color: "#d32f2f" },
    rose: { name: "الوردة الشامية", emoji: "🌹", cost: 80, growTime: 60, rewardCoins: 150, rewardXp: 110, color: "#ad1457" },
    olive: { name: "الزيتون الأثري", emoji: "🫒", cost: 200, growTime: 180, rewardCoins: 420, rewardXp: 280, color: "#558b2f" }
};

// Bot database for Simulation fallback
const simulationPlayers = [
    { name: "أبو أحمد الحمصي 🌾", isVip: true, level: 12, coins: 14500, avatar: "Ahmed" },
    { name: "منار الشام 🌹", isVip: false, level: 8, coins: 5600, avatar: "Manar" },
    { name: "جهاد الذكي 🛡️", isVip: true, level: 25, coins: 78000, avatar: "GhaithBot" },
    { name: "يوسف غوطة والزيتون", isVip: false, level: 5, coins: 2100, avatar: "Youssef" },
    { name: "مزارعة ريف حلب 🍅", isVip: false, level: 9, coins: 8900, avatar: "Alep" }
];

const botChatSentences = [
    "مساكم الله بالخير يا مزارعي الغياث الكرام 👋",
    "الورد الشامي يحقق عوائد ذهبية ممتازة للجميع اليوم 😍",
    "المهندس محمد جهاد الغياث قدم تبرعات لدعم المبتدئين 👍",
    "أريد شراء زيتون معتق بكميات كبيرة، من يعرضه؟",
    "الحمد لله على بركة الأمطار اليوم، المزروعات في سرعة قصوى!",
    "تحديث ممتاز! نظام السوق التلقائي سريع جداً ⚡"
];

// Firebase Configuration & Initialization Placeholder
let db = null;
let firebaseActive = false;
let firebaseConfigSaved = null;

// Initialize on document loaded
document.addEventListener("DOMContentLoaded", () => {
    loadLocalSave();
    setupEventListeners();
    initGameLoops();
    initWeatherSystem();
    renderAll();

    // Register Service Worker for Progressive Web App (PWA)
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("sw.js")
            .then(reg => console.log("Service Worker registered with scope:", reg.scope))
            .catch(err => console.error("Service Worker registration failed:", err));
    }
});

// Load local save from LocalStorage
function loadLocalSave() {
    const savedState = localStorage.getItem("alghaith_farm_gamestate_v1");
    if (savedState) {
        try {
            const parsed = JSON.parse(savedState);
            // Deep recovery fallback
            if (parsed.user) gameState.user = { ...gameState.user, ...parsed.user };
            if (parsed.inventory) gameState.inventory = { ...gameState.inventory, ...parsed.inventory };
            if (parsed.plots) gameState.plots = parsed.plots;
            if (parsed.quests) {
                // Keep default structures but sync progress
                parsed.quests.forEach(q => {
                    const localQ = gameState.quests.find(l => l.id === q.id);
                    if (localQ) {
                        localQ.progress = q.progress;
                        localQ.completed = q.completed;
                    }
                });
            }
        } catch (e) {
            console.error("Error recovering save state, loading factory defaults", e);
        }
    }

    // Try loading Firebase config
    const savedConfig = localStorage.getItem("alghaith_farm_firebase_config");
    if (savedConfig) {
        document.getElementById("firebase-config-textarea").value = savedConfig;
        firebaseConfigSaved = JSON.parse(savedConfig);
        tryInitFirebase(firebaseConfigSaved);
    }
}

// Write gamestate to LocalStorage
function saveGame() {
    localStorage.setItem("alghaith_farm_gamestate_v1", JSON.stringify({
        user: gameState.user,
        inventory: gameState.inventory,
        plots: gameState.plots,
        quests: gameState.quests
    }));
}

// Setup Dom Interaction Events
function setupEventListeners() {
    // Navigation bar tabs triggers
    const navButtons = {
        farm: document.getElementById("nav-btn-farm"),
        market: document.getElementById("nav-btn-market"),
        chat: document.getElementById("nav-btn-chat"),
        leaderboard: document.getElementById("nav-btn-leaderboard"),
        profile: document.getElementById("nav-btn-profile")
    };

    Object.keys(navButtons).forEach(tabKey => {
        navButtons[tabKey].addEventListener("click", () => switchTab(tabKey));
    });

    // Theme switcher
    const btnThemeToggle = document.getElementById("btn-theme-toggle");
    let isNight = false;
    btnThemeToggle.addEventListener("click", () => {
        isNight = !isNight;
        window.isFarmNight = isNight;
        const bodyTag = document.body;
        const themeIcon = document.getElementById("theme-icon");
        if (isNight) {
            bodyTag.style.backgroundColor = "#070c07";
            themeIcon.className = "fas fa-moon text-blue-300";
            showToast("تم تحويل القرية إلى التوقيت الليلي الهادئ 🌙");
        } else {
            bodyTag.style.backgroundColor = "#121212";
            themeIcon.className = "fas fa-sun text-yellow-400";
            showToast("شروق الشمس الساطعة على حقول الغياث ☀️");
        }
        if (typeof applyWeatherEffects === "function") {
            applyWeatherEffects();
        }
    });

    // Expand Plots
    document.getElementById("btn-expand-farm").addEventListener("click", expandPlotsArea);

    // Watch video-ad (monetization)
    document.getElementById("btn-watch-ad").addEventListener("click", simulateAdWatch);

    // Save client profile username updates
    document.getElementById("btn-save-username").addEventListener("click", () => {
        const value = document.getElementById("profile-username-input").value.trim();
        if (value.length >= 3) {
            gameState.user.name = value;
            showToast("تم تحديث اسم مزارعك بنجاح!");
            saveGame();
            renderAll();
            if (firebaseActive) {
                syncUserToFirebase();
            }
        } else {
            showToast("الرجاء إدخال اسم صحيح بأكثر من 3 حروف.");
        }
    });

    // Avatar Randomizer Click
    document.getElementById("btn-change-avatar").addEventListener("click", () => {
        const randomSeeds = ["AlGhaith", "Homs", "Damascus", "Yasmin", "FarmExpert", "Jehad", "Zaitoon"];
        const chosen = randomSeeds[Math.floor(Math.random() * randomSeeds.length)] + Math.floor(Math.random() * 99);
        gameState.user.avatar = chosen;
        document.getElementById("hud-avatar").src = `https://api.dicebear.com/7.x/bottts/svg?seed=${chosen}`;
        document.getElementById("profile-avatar-img").src = `https://api.dicebear.com/7.x/bottts/svg?seed=${chosen}`;
        saveGame();
        showToast("تم استخراج رمز تجسيدي مزارع جديد 👨‍🌾");
        if (firebaseActive) {
            syncUserToFirebase();
        }
    });

    // Claim daily reward trigger
    document.getElementById("btn-claim-daily").addEventListener("click", () => {
        const lastClaim = localStorage.getItem("alghaith_farm_last_claim") || "0";
        const now = Date.now();
        // Allow once per 30 seconds for easier presentation, or 24h
        if (now - parseInt(lastClaim) > 30000) {
            localStorage.setItem("alghaith_farm_last_claim", now.toString());
            gameState.user.coins += 200;
            gameState.user.gems += 5;
            triggerRoseShower();
            showToast("مبروك! استلمت 200 ذهب و 5 جواهر مجانية 🎁");
            gainXp(30);
            saveGame();
            renderAll();
        } else {
            const leftMs = 30000 - (now - parseInt(lastClaim));
            showToast(`المكافأة قيد التحضير! انتظر بضع ثوانٍ: ${Math.ceil(leftMs/1000)}ث`);
        }
    });

    // Chat post message press keys
    document.getElementById("btn-send-chat").addEventListener("click", sendChatMessage);
    document.getElementById("chat-input-text").addEventListener("keydown", (e) => {
        if (e.key === "Enter") sendChatMessage();
    });

    // VIP Button Toggle
    document.getElementById("btn-toggle-vip").addEventListener("click", () => {
        gameState.user.isVip = !gameState.user.isVip;
        if (gameState.user.isVip) {
            document.getElementById("btn-toggle-vip").innerText = "تعطيل اشتراك VIP";
            document.getElementById("btn-toggle-vip").className = "bg-red-700 text-white font-extrabold text-[10px] px-3.5 py-2 rounded-xl shadow-lg";
            document.getElementById("hud-vip-badge").classList.remove("hidden");
            document.getElementById("profile-account-type-text").innerHTML = `<span class="text-yellow-400 font-extrabold font-serif">شرفي VIP 👑</span>`;
            showToast("تهانينا! تم تفعيل عضوية VIP الشرفية: نمو أسرع وحصاد مضاعف!");
        } else {
            document.getElementById("btn-toggle-vip").innerText = "تفعيل اشتراك VIP مجاني";
            document.getElementById("btn-toggle-vip").className = "bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-extrabold text-[10px] px-3.5 py-2 rounded-xl shadow-lg";
            document.getElementById("hud-vip-badge").classList.add("hidden");
            document.getElementById("profile-account-type-text").innerText = "مزارع حر";
            showToast("تم العودة للحساب الأساسي.");
        }
        saveGame();
        renderAll();
        if (firebaseActive) {
            syncUserToFirebase();
        }
    });

    // Firebase custom config updater
    document.getElementById("btn-save-firebase-config").addEventListener("click", () => {
        const textValue = document.getElementById("firebase-config-textarea").value.trim();
        if (!textValue) return;
        try {
            const configObj = JSON.parse(textValue);
            localStorage.setItem("alghaith_farm_firebase_config", JSON.stringify(configObj));
            showToast("تم حفظ هيكل ملف Firebase، جاري الاتصال المباشر...");
            tryInitFirebase(configObj);
        } catch (e) {
            showToast("خطأ: صيغة JSON غير صحيحة. يرجى مراجعة المدخلات.");
        }
    });

    document.getElementById("btn-clear-firebase-config").addEventListener("click", () => {
        localStorage.removeItem("alghaith_farm_firebase_config");
        document.getElementById("firebase-config-textarea").value = "";
        showToast("تم قطع الاتصال وشطب إعدادات السيرفر. العودة إلى المحاكاة المحلية.");
        setTimeout(() => location.reload(), 1000);
    });

    // ============================================
    // WELCOME GATE & ONBOARDING / LOGIN MANAGEMENT
    // ============================================
    const welcomeGate = document.getElementById("welcome-gate");
    const onboarded = localStorage.getItem("alghaith_farm_onboarded_v2");
    
    // Check initial onboarding gate state
    if (onboarded === "true") {
        if (welcomeGate) welcomeGate.style.display = "none";
    } else {
        if (welcomeGate) {
            welcomeGate.style.display = "flex";
            welcomeGate.style.opacity = "1";
            document.getElementById("welcome-username-input").value = gameState.user.name;
            document.getElementById("welcome-avatar-seed-text").innerText = gameState.user.avatar || "Ghaith";
            document.getElementById("welcome-avatar-img").src = `https://api.dicebear.com/7.x/bottts/svg?seed=${gameState.user.avatar || 'Ghaith'}`;
            document.getElementById("welcome-alliance-input").value = gameState.user.alliance || "تحالف الغياث الدولي";
        }
    }

    // Onboarding random name generator
    const btnWelcomeRandomName = document.getElementById("btn-welcome-random-name");
    if (btnWelcomeRandomName) {
        btnWelcomeRandomName.addEventListener("click", () => {
            const prefix = ["مزارع_الورد_الشامي", "مالك_الزيتون", "حارس_الغمام", "غياث_الخير", "أبو_أحمد_الحمصي", "شهم_الشهباء", "مزارع_الغوطة", "مزارع_سريعة", "سفير_الزيتون"];
            const suffix = Math.floor(Math.random() * 900 + 100);
            const randomName = prefix[Math.floor(Math.random() * prefix.length)] + "_" + suffix;
            document.getElementById("welcome-username-input").value = randomName;
        });
    }

    // Onboarding change avatar seed
    const btnWelcomeChangeAvatar = document.getElementById("btn-welcome-change-avatar");
    if (btnWelcomeChangeAvatar) {
        btnWelcomeChangeAvatar.addEventListener("click", () => {
            const seeds = ["AlGhaith", "Homs", "Damascus", "Yasmin", "FarmExpert", "Jehad", "Zaitoon", "Tractor", "SunRise", "GoldenSoil"];
            const randomSeed = seeds[Math.floor(Math.random() * seeds.length)] + Math.floor(Math.random() * 99);
            document.getElementById("welcome-avatar-seed-text").innerText = randomSeed;
            document.getElementById("welcome-avatar-img").src = `https://api.dicebear.com/7.x/bottts/svg?seed=${randomSeed}`;
        });
    }

    // Save and enter farm action
    const btnWelcomeEnterGame = document.getElementById("btn-welcome-enter-game");
    if (btnWelcomeEnterGame) {
        btnWelcomeEnterGame.addEventListener("click", () => {
            const nameVal = document.getElementById("welcome-username-input").value.trim();
            const allianceVal = document.getElementById("welcome-alliance-input").value.trim();
            const avatarVal = document.getElementById("welcome-avatar-seed-text").innerText.trim();
            
            if (nameVal.length < 3) {
                showToast("الرجاء إدخال لقب مزارع صحيح مكون من 3 أحرف على الأقل 🌾");
                return;
            }
            
            gameState.user.name = nameVal;
            gameState.user.alliance = allianceVal || "تحالف الغياث الدولي";
            gameState.user.avatar = avatarVal || "Ghaith";
            
            localStorage.setItem("alghaith_farm_onboarded_v2", "true");
            
            if (welcomeGate) {
                welcomeGate.style.opacity = "0";
                setTimeout(() => {
                    welcomeGate.style.display = "none";
                }, 300);
            }
            
            saveGame();
            renderAll();
            triggerRoseShower();
            showToast("أهلاً بك في حقول الغياث المباركة! بالتوفيق والنجاح 🌾");
            
            if (firebaseActive) {
                syncUserToFirebase();
            }
        });
    }

    // Expose switch profile & welcome gate screen trigger
    const btnTriggerWelcomeGate = document.getElementById("btn-trigger-welcome-gate");
    if (btnTriggerWelcomeGate) {
        btnTriggerWelcomeGate.addEventListener("click", () => {
            localStorage.removeItem("alghaith_farm_onboarded_v2");
            if (welcomeGate) {
                welcomeGate.style.display = "flex";
                welcomeGate.style.opacity = "1";
                document.getElementById("welcome-username-input").value = gameState.user.name;
                document.getElementById("welcome-avatar-seed-text").innerText = gameState.user.avatar || "Ghaith";
                document.getElementById("welcome-avatar-img").src = `https://api.dicebear.com/7.x/bottts/svg?seed=${gameState.user.avatar || 'Ghaith'}`;
                document.getElementById("welcome-alliance-input").value = gameState.user.alliance || "تحالف الغياث الدولي";
            }
            switchTab("farm");
            showToast("قم بتعديل هويتك أو تبديل حسابك الآن 🚪");
        });
    }
}

// Core Simulation & growth ticking threads
function initGameLoops() {
    // 1. Growth cycle update (1-second tick)
    setInterval(() => {
        const now = Date.now();
        let changed = false;
        gameState.plots.forEach(plot => {
            if (!plot.locked && plot.crop && plot.readyAt > 0) {
                if (now >= plot.readyAt) {
                    // Ready to harvest! Let UI know
                    changed = true;
                }
            }
        });
        if (changed) {
            renderPlots();
        }
        updateActivePlotsTimers();
    }, 1000);

    // 2. Simulated Multiplayers events (15-seconds tick in local fallback)
    setInterval(() => {
        if (!firebaseActive) {
            simulateBotChat();
            simulateBotMarketActions();
        }
    }, 12000);
}

// Switch navigation tabs
function switchTab(tabId) {
    if (typeof GameAudio !== "undefined") GameAudio.playClick();
    gameState.currentTab = tabId;
    
    // Toggle active styles on footer items
    const navKeys = ["farm", "market", "chat", "leaderboard", "profile"];
    navKeys.forEach(k => {
        const btn = document.getElementById(`nav-btn-${k}`);
        if (k === tabId) {
            btn.className = "flex flex-col items-center flex-1 py-1 text-green-500 transition scale-110 duration-200";
        } else {
            btn.className = "flex flex-col items-center flex-1 py-1 text-zinc-400 transition";
        }
        
        // Hide/Show tab contents
        const pane = document.getElementById(`tab-${k}`);
        if (pane) {
            if (k === tabId) pane.classList.remove("hidden");
            else pane.classList.add("hidden");
        }
    });

    // Dynamic initial tasks if specific tabs are shown
    if (tabId === "leaderboard") {
        renderLeaderboard();
    } else if (tabId === "market") {
        renderMarketListings();
    } else if (tabId === "chat") {
        scrollToBottomChat();
    }
}

// Seed selections
function selectSeed(seedId) {
    if (typeof GameAudio !== "undefined") GameAudio.playClick();
    gameState.selectedSeed = seedId;
    const seeds = ["wheat", "tomato", "rose", "olive"];
    seeds.forEach(s => {
        const item = document.getElementById(`seed-${s}`);
        if (s === seedId) {
            item.className = "seed-item active flex flex-col items-center p-2 rounded-xl bg-green-900/40 border-2 border-emerald-500 shadow-lg scale-102 transition";
        } else {
            item.className = "seed-item flex flex-col items-center p-2 rounded-xl bg-zinc-900/60 border border-zinc-800 transition hover:bg-zinc-850";
        }
    });
}

// Plant seed action triggers
function clickSoilPlot(plotId) {
    const plot = gameState.plots.find(p => p.id === plotId);
    if (!plot) return;

    if (plot.locked) {
        if (typeof GameAudio !== "undefined") GameAudio.playClick();
        showToast("هذه التربة مقفلة! يجب توسيع الحقل أولاً.");
        return;
    }

    const now = Date.now();

    // 1. Plant seed if empty
    if (!plot.crop) {
        const seedInfo = cropsDb[gameState.selectedSeed];
        if (gameState.user.coins < seedInfo.cost) {
            showToast("ليس لديك عملات ذهبية كافية لشراء البذرة 🪙");
            return;
        }

        // Apply seed cost
        gameState.user.coins -= seedInfo.cost;
        let growSec = seedInfo.growTime;
        // VIP Benefit: 2x speedier growth (takes 50% time)
        if (gameState.user.isVip) {
            growSec = Math.ceil(growSec / 2);
        }

        // Climate Advantage: Rainy weather speeds up crop growth by 25% (takes 75% time)
        if (window.currentWeather === "rainy" || window.currentWeather === "thunderstorm") {
            growSec = Math.ceil(growSec * 0.75);
        }

        plot.crop = gameState.selectedSeed;
        plot.plantedAt = now;
        plot.readyAt = now + (growSec * 1000);

        if (typeof GameAudio !== "undefined") GameAudio.playSuccess();
        if (window.currentWeather === "rainy" || window.currentWeather === "thunderstorm") {
            showToast(`🌧️ تم زرع ${seedInfo.name} تحت مياه المطر التفاعلي (نمو أسرع 25%!)`);
        } else {
            showToast(`تم زرع ${seedInfo.name} بنجاح في الحقل.`);
        }
        trackQuestProgress("plant_wheat", gameState.selectedSeed === "wheat" ? 1 : 0);
        saveGame();
        renderAll();
    } 
    // 2. Harvest if fully mature and grown
    else if (now >= plot.readyAt) {
        harvestPlot(plot);
    } 
    // 3. User taps crop early -> display remaining time info
    else {
        const leftSec = Math.ceil((plot.readyAt - now) / 1000);
        if (typeof GameAudio !== "undefined") GameAudio.playClick();
        if (window.currentWeather === "rainy" || window.currentWeather === "thunderstorm") {
            showToast(`🌧️ قطرات المطر تغذي النبات حالياً! متبقي ${leftSec} ثانية ⏳`);
        } else {
            showToast(`هذا النبات ينمو بشكل رائع. متبقي ${leftSec} ثانية لحصاده ⏳`);
        }
    }
}

// Harvest action completion
function harvestPlot(plot) {
    const cropInfo = cropsDb[plot.crop];
    if (!cropInfo) return;

    if (typeof GameAudio !== "undefined") GameAudio.playHarvest();
    let earnedGold = cropInfo.rewardCoins;
    let earnedXp = cropInfo.rewardXp;

    // VIP Double gold benefit
    if (gameState.user.isVip) {
        earnedGold *= 2;
    }

    // Add reward
    gameState.user.coins += earnedGold;
    gameState.inventory[plot.crop] += 1;

    // Visual animation confetti effect
    triggerCoinAnimation(plot.id, `+${earnedGold} 🪙`, cropInfo.emoji);

    showToast(`تم حصاد ${cropInfo.name} بنجاح! كسبت ${earnedGold} عملة و +1 في المخزون 🎉`);
    
    // Clear crop on plot
    plot.crop = null;
    plot.plantedAt = 0;
    plot.readyAt = 0;

    gainXp(earnedXp);
    trackQuestProgress("gain_gold", earnedGold);
    saveGame();
    renderAll();
}

// Interactive graphic float animation effect
function triggerCoinAnimation(plotId, msg, emoji) {
    const plotDom = document.getElementById(`plot-card-${plotId}`);
    if (!plotDom) return;

    const rect = plotDom.getBoundingClientRect();
    const floating = document.createElement("div");
    floating.className = "absolute text-xs font-black text-yellow-400 bg-black/75 px-2 py-1 rounded-full border border-yellow-500 z-40 animate-bounce pointer-events-none";
    floating.style.left = `${rect.left + window.scrollX + 20}px`;
    floating.style.top = `${rect.top + window.scrollY - 20}px`;
    floating.innerHTML = `${emoji} ${msg}`;

    document.body.appendChild(floating);

    // Fade out and remove
    setTimeout(() => {
        floating.style.transition = "all 0.8s ease";
        floating.style.transform = "translateY(-50px)";
        floating.style.opacity = "0";
        setTimeout(() => floating.remove(), 800);
    }, 400);
}

// Floating rose confetti system triggered upon premium rewards
function triggerRoseShower() {
    const container = document.getElementById("rose-shower-container");
    if (!container) return;

    for (let i = 0; i < 20; i++) {
        const p = document.createElement("div");
        p.className = "confetti-particle";
        p.innerText = "🌹";
        p.style.fontSize = `${Math.random() * 16 + 12}px`;
        p.style.left = `${Math.random() * 100}vw`;
        p.style.top = `-${Math.random() * 20}vh`;
        p.style.transition = "all 3.5s cubic-bezier(0.1, 0.8, 0.3, 1)";
        p.style.transform = `rotate(${Math.random() * 360}deg)`;

        container.appendChild(p);

        // Animate downward falling
        setTimeout(() => {
            p.style.transform = `translateY(110vh) rotate(${Math.random() * 720}deg) translateX(${Math.random() * 100 - 50}px)`;
            p.style.opacity = "0";
            // cleanup after finish
            setTimeout(() => p.remove(), 4000);
        }, 50);
    }
}

// XP Progression Level Engine
function gainXp(amount) {
    gameState.user.xp += amount;
    const requiredXp = gameState.user.level * 150;
    if (gameState.user.xp >= requiredXp) {
        gameState.user.xp -= requiredXp;
        gameState.user.level += 1;
        gameState.user.gems += 5; // Level up gems
        triggerRoseShower();
        showToast(`رائع! لقد ترفعت إلى المستوى ${gameState.user.level} والمزيد من الأراضي متاحة لك الآن 🏆`);
    }
}

// Quest progression validation
function trackQuestProgress(type, count) {
    gameState.quests.forEach(q => {
        if (!q.completed && q.type === type) {
            q.progress += count;
            if (q.progress >= q.target) {
                q.progress = q.target;
                q.completed = true;
                // Give user reward automatically or display claiming button
                gameState.user.coins += q.rewardCoins;
                gameState.user.gems += q.rewardGems;
                showToast(`اكتملت المهمة: "${q.label}"! كسبت مكافآت ممتازة.`);
                gainXp(q.rewardXp);
                triggerRoseShower();
            }
        }
    });
}

// Farm expansion handler
function expandPlotsArea() {
    const nextLockedPlot = gameState.plots.find(p => p.locked);
    if (!nextLockedPlot) {
        showToast("لقد قمت بفتح جميع مساحات الحقل المتاحة حالياً بالكامل! ممتاز 🌟");
        return;
    }

    if (gameState.user.coins < 500) {
        showToast("لا تمتلك عملات كافية للشراء وتوسيع الحقل (المطلوب 500 قطعة ذهب) 🪙");
        return;
    }

    gameState.user.coins -= 500;
    nextLockedPlot.locked = false;
    showToast("تهانينا! قمت بالتوسعة وامتلاك قطعة أرض زراعية إضافية جاهزة للبذر 🎉");
    saveGame();
    renderAll();
}

// Toast notification widget helper
function showToast(msg) {
    const toast = document.getElementById("game-toast");
    toast.innerText = msg;
    toast.style.opacity = "1";
    toast.style.transform = "translate(-50%, 0) translateY(0)";

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translate(-50%, 0) translateY(-20px)";
    }, 2800);
}

// Display timer counts on growing cards
function updateActivePlotsTimers() {
    const now = Date.now();
    gameState.plots.forEach(plot => {
        if (!plot.locked && plot.crop && plot.readyAt > 0) {
            const labelDom = document.getElementById(`plot-timer-${plot.id}`);
            if (labelDom) {
                if (now < plot.readyAt) {
                    const sec = Math.ceil((plot.readyAt - now) / 1000);
                    labelDom.innerText = `${sec}ثانية`;
                } else {
                    labelDom.innerText = "جاهز للحصاد!🌾";
                    labelDom.className = "text-[9px] bg-yellow-500 text-black px-1 py-0.5 rounded-full font-bold animate-pulse mt-1";
                }
            }
        }
    });
}

// -------------------------------------------------------------
// USER INTERFACES REDRAW ENGINE (Pure responsive updates)
// -------------------------------------------------------------
function renderAll() {
    // 1. Render global top HUD basic info
    document.getElementById("hud-username").innerText = gameState.user.name;
    document.getElementById("hud-level").innerText = gameState.user.level;
    document.getElementById("hud-coins").innerText = Number(gameState.user.coins).toLocaleString();
    document.getElementById("hud-gems").innerText = gameState.user.gems;
    
    // Manage XP HUD calculation bar progress
    const requiredXp = gameState.user.level * 150;
    const progressPercent = Math.min(100, (gameState.user.xp / requiredXp) * 100);
    document.getElementById("hud-xp-bar").style.width = `${progressPercent}%`;
    document.getElementById("hud-xp-text").innerText = `${gameState.user.xp} / ${requiredXp}`;

    document.getElementById("profile-username-input").value = gameState.user.name;

    // Sync Avatar image representation dynamically 
    if (gameState.user.avatar) {
        document.getElementById("hud-avatar").src = `https://api.dicebear.com/7.x/bottts/svg?seed=${gameState.user.avatar}`;
        document.getElementById("profile-avatar-img").src = `https://api.dicebear.com/7.x/bottts/svg?seed=${gameState.user.avatar}`;
    }
    // Sync Alliance representation dynamically
    if (gameState.user.alliance) {
        document.getElementById("hud-alliance").innerText = gameState.user.alliance;
    }

    // 2. Refresh lists and grids
    renderPlots();
    renderQuests();
    renderInventoryShopSelectors();
}

// Grid of plots render
function renderPlots() {
    const gridDom = document.getElementById("farm-plots-grid");
    if (!gridDom) return;

    gridDom.innerHTML = "";
    gameState.plots.forEach(plot => {
        const plotCard = document.createElement("div");
        plotCard.id = `plot-card-${plot.id}`;
        plotCard.className = `soil-plot w-full rounded-2xl relative flex flex-col justify-center items-center p-2 min-h-[90px] aspect-square transition ${plot.locked ? 'bg-zinc-900 border border-zinc-800 opacity-60' : 'bg-amber-950/70 border-2 border-amber-800'}`;
        plotCard.onclick = () => clickSoilPlot(plot.id);

        if (plot.locked) {
            plotCard.innerHTML = `
                <i class="fas fa-lock text-zinc-600 text-lg"></i>
                <span class="text-[9px] text-zinc-500 font-bold mt-1">مغلق</span>
            `;
        } else if (plot.crop) {
            const cropInfo = cropsDb[plot.crop];
            const isReady = Date.now() >= plot.readyAt;

            plotCard.innerHTML = `
                <span class="text-3xl ${isReady ? 'growing-crop animate-bounce' : 'growing-crop'}">${cropInfo.emoji}</span>
                <span id="plot-timer-${plot.id}" class="text-[9px] ${isReady ? 'bg-yellow-500 text-black px-1 py-0.5 rounded-full font-bold animate-pulse mt-1' : 'text-zinc-300 mt-1'}">
                    تحديث...
                </span>
            `;
        } else {
            plotCard.innerHTML = `
                <span class="text-zinc-600 text-xs font-semibold">بذرة الخصب</span>
                <span class="text-[9px] text-zinc-500 mt-1 border border-zinc-800/40 px-1 py-0.5 rounded-full bg-zinc-900/60">+ بذر</span>
            `;
        }

        gridDom.appendChild(plotCard);
    });
}

function renderQuests() {
    const container = document.getElementById("quests-list-container");
    if (!container) return;

    container.innerHTML = "";
    let compCount = 0;

    gameState.quests.forEach(q => {
        if (q.completed) compCount++;
        const item = document.createElement("div");
        item.className = `p-3 rounded-xl flex justify-between items-center bg-zinc-950 border ${q.completed ? 'border-green-800/40 bg-green-950/20' : 'border-zinc-850'}`;
        
        const progPct = Math.min(100, (q.progress / q.target) * 100);

        item.innerHTML = `
            <div class="flex-1 pr-1">
                <div class="flex justify-between items-center mb-1 text-xs font-bold">
                    <span class="${q.completed ? 'text-green-400 line-through' : 'text-zinc-200'}">${q.label}</span>
                    <span class="text-[10px] text-zinc-400">${q.progress}/${q.target}</span>
                </div>
                <div class="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                    <div class="bg-green-500 h-full" style="width: ${progPct}%"></div>
                </div>
            </div>
            
            <div class="mr-4 text-left flex flex-col items-center">
                <span class="text-[9px] text-yellow-400 font-bold">+${q.rewardCoins} ذهب</span>
                <span class="text-[9px] text-blue-400 font-bold">+${q.rewardGems} 💎</span>
                ${q.completed ? '<span class="text-[10px] text-green-400 font-extrabold mt-1">✓ مكتملة</span>' : '<span class="text-[9px] text-zinc-500 font-bold mt-1">جارية</span>'}
            </div>
        `;
        container.appendChild(item);
    });

    document.getElementById("quests-completed-count").innerText = `مكتمل: ${compCount}/3`;
}

function renderInventoryShopSelectors() {
    const categories = ["wheat", "tomato", "rose", "olive"];
    categories.forEach(cat => {
        const optionNode = document.querySelector(`#sell-crop-select option[value="${cat}"]`);
        if (optionNode) {
            const count = gameState.inventory[cat] || 0;
            const emoji = cropsDb[cat].emoji;
            optionNode.innerText = `${cropsDb[cat].name} (متوفر في مخزنك: ${count} ${emoji})`;
        }
    });
}

// -------------------------------------------------------------
// ADVERTISING INTEGRATION & GEM CONVERSION
// -------------------------------------------------------------
function simulateAdWatch() {
    const adModal = document.getElementById("ad-modal");
    const progress = document.getElementById("ad-progress-bar");
    const counter = document.getElementById("ad-timer-countdown");
    
    adModal.classList.remove("hidden");
    progress.style.width = "0%";
    
    let left = 8;
    counter.innerText = `الانتظار: ${left}ث`;

    const interval = setInterval(() => {
        left--;
        counter.innerText = `الانتظار: ${left}ث`;
        progress.style.width = `${((8 - left) / 8) * 100}%`;
        
        if (left <= 0) {
            clearInterval(interval);
            adModal.classList.add("hidden");
            gameState.user.gems += 3;
            showToast("تهانينا! كسبت +3 جواهر لطلبك الإعلاني الممتاز 💎");
            saveGame();
            renderAll();
            triggerRoseShower();
        }
    }, 1000);
}

function buyCoinsWithGems(gemCost, goldBonus) {
    if (gameState.user.gems < gemCost) {
        showToast("جواهرك المتاحة غير كافية لإجراء الشراء 💎");
        return;
    }

    gameState.user.gems -= gemCost;
    gameState.user.coins += goldBonus;
    showToast(`تم صرف الجواهر بنجاح والحصول على +${goldBonus} قطعة ذهب 🪙`);
    saveGame();
    renderAll();
    triggerRoseShower();
}

// -------------------------------------------------------------
// GLOBAL MARKET SYSTEM WITH MUTABLE LISTINGS
// -------------------------------------------------------------
let marketTabFilter = "buy";

function filterMarketView(mode) {
    marketTabFilter = mode;
    document.getElementById("btn-market-buy").className = mode === "buy" ? "flex-1 py-2 text-center rounded-lg bg-green-700 text-white shadow" : "flex-1 py-1 px-2 text-zinc-400 hover:text-white";
    document.getElementById("btn-market-sell").className = mode === "sell" ? "flex-1 py-2 text-center rounded-lg bg-green-700 text-white shadow" : "flex-1 py-1 px-2 text-zinc-400 hover:text-white";
    renderMarketListings();
}

function openSellModal() {
    document.getElementById("sell-modal").classList.remove("hidden");
}

function closeSellModal() {
    document.getElementById("sell-modal").classList.add("hidden");
}

function publishListing() {
    const cropId = document.getElementById("sell-crop-select").value;
    const quantity = parseInt(document.getElementById("sell-crop-quantity").value);
    const price = parseInt(document.getElementById("sell-crop-price").value);

    // Validate inventory availability
    const available = gameState.inventory[cropId] || 0;
    if (quantity <= 0 || price <= 0) {
        showToast("الرجاء إدخال كمية وأسعار صحيحة!");
        return;
    }

    if (available < quantity) {
        showToast("ليس لديك كمية كافية من هذا المحصول في مخزن المزرعة لعرضه 🌾");
        return;
    }

    // Deduct stock
    gameState.inventory[cropId] -= quantity;
    const newListing = {
        id: "listing_" + Date.now() + "_" + Math.floor(Math.random() * 100),
        sellerId: gameState.user.id,
        sellerName: gameState.user.name,
        isVip: gameState.user.isVip,
        itemType: cropId,
        quantity: quantity,
        price: price,
        timestamp: Date.now()
    };

    if (firebaseActive) {
        // Publish to real Firebase DB
        db.collection("market").doc(newListing.id).set(newListing)
            .then(() => {
                if (typeof GameAudio !== "undefined") GameAudio.playSuccess();
                showToast("تم نشر محصولك بنجاح في سوق الغياث الحقيقي!");
                trackQuestProgress("market_trade", 1);
                closeSellModal();
                saveGame();
                renderAll();
            })
            .catch(err => showToast("تعذر النشر في السيرفر: " + err.message));
    } else {
        // Fallback simulation mode
        gameState.marketListings.unshift(newListing);
        if (typeof GameAudio !== "undefined") GameAudio.playSuccess();
        showToast("تم نشر محصولك بنجاح في سوق المزرعة التفاعلي!");
        trackQuestProgress("market_trade", 1);
        closeSellModal();
        saveGame();
        renderAll();

        // Simulate automatic buyer (bot purchase user listing)
        setTimeout(() => {
            simulateBotPurchaseUserItem(newListing.id);
        }, Math.floor(Math.random() * 8000) + 5000);
    }
}

function renderMarketListings() {
    const container = document.getElementById("market-listings-container");
    if (!container) return;

    container.innerHTML = "";
    
    // Fallback populated listings if list empty during simulation
    if (!firebaseActive && gameState.marketListings.length === 0) {
        // Setup initial bot listings
        simulationPlayers.forEach((bot, index) => {
            const types = ["wheat", "tomato", "rose", "olive"];
            const t = types[index % types.length];
            gameState.marketListings.push({
                id: "listing_bot_" + index + "_" + Math.floor(Math.random()*100),
                sellerId: "bot_" + index,
                sellerName: bot.name,
                isVip: bot.isVip,
                itemType: t,
                quantity: Math.floor(Math.random() * 8) + 2,
                price: Math.floor(cropsDb[t].rewardCoins * (0.8 + Math.random() * 0.4)),
                timestamp: Date.now() - index * 60000
            });
        });
    }

    const currentList = gameState.marketListings;
    const filtered = currentList.filter(l => {
        if (marketTabFilter === "buy") {
            return l.sellerId !== gameState.user.id;
        } else {
            return l.sellerId === gameState.user.id;
        }
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 text-zinc-500 text-xs">
                <i class="fa fa-shopping-basket text-4xl text-zinc-700 block mb-3"></i>
                لا يوجد صفقات معلنة لعرضها في هذه الفئة حالياً.
            </div>
        `;
        return;
    }

    filtered.forEach(listing => {
        const info = cropsDb[listing.itemType];
        const card = document.createElement("div");
        card.className = `p-3.5 rounded-2xl flex justify-between items-center border ${listing.isVip ? 'vip-card-glow' : 'bg-zinc-900 border-zinc-800'}`;
        
        const total = listing.quantity * listing.price;

        card.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="text-3.5xl">${info ? info.emoji : "🌾"}</span>
                <div>
                    <h4 class="text-xs font-bold text-zinc-200">
                        ${info ? info.name : listing.itemType} x ${listing.quantity}
                    </h4>
                    <p class="text-[9px] text-zinc-500 mt-1">
                        البائع: ${listing.isVip ? '<span class="text-yellow-400 font-semibold">' + listing.sellerName + ' 👑</span>' : listing.sellerName}
                    </p>
                </div>
            </div>
            
            <div class="text-left flex flex-col items-end">
                <span class="text-xs font-bold text-yellow-400">إجمالي: ${total} <img src="https://cdn-icons-png.flaticon.com/512/272/272525.png" class="w-3.5 h-3.5 inline"></span>
                <span class="text-[9px] text-zinc-500 mt-0.5">(${listing.price} للقطعة)</span>
                
                ${marketTabFilter === "buy" ? `
                    <button class="mt-2 bg-green-700 hover:bg-green-600 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-lg transition" onclick="buyMarketItem('${listing.id}')">
                        شراء الصفقة
                    </button>
                ` : `
                    <button class="mt-2 bg-red-900/60 hover:bg-red-800/80 text-zinc-300 text-[10px] px-3.5 py-1.5 rounded-lg transition" onclick="cancelUserListing('${listing.id}')">
                        سحب وإلغاء
                    </button>
                `}
            </div>
        `;
        container.appendChild(card);
    });
}

function buyMarketItem(listingId) {
    const listing = gameState.marketListings.find(l => l.id === listingId);
    if (!listing) return;

    const totalCost = listing.quantity * listing.price;
    if (gameState.user.coins < totalCost) {
        showToast("نقودك الذهبية لا تكفي لشراء هذه الصفقة 🪙");
        return;
    }

    if (firebaseActive) {
        // Execute atomic Firestore transaction for atomic safe buying
        const ref = db.collection("market").doc(listingId);
        db.runTransaction((transaction) => {
            return transaction.get(ref).then((doc) => {
                if (!doc.exists) {
                    throw "هذه الصفقة لم تعد متوفرة!";
                }
                // Complete trade
                transaction.delete(ref);
                return true;
            });
        }).then(() => {
            gameState.user.coins -= totalCost;
            gameState.inventory[listing.itemType] += listing.quantity;
            if (typeof GameAudio !== "undefined") GameAudio.playSuccess();
            showToast(`اكتمل الشراء! تم خصم ${totalCost} ذهب وإضافة المحاصيل للمخزن 🛒`);
            saveGame();
            renderAll();
        }).catch(err => {
            showToast("خطأ بالمعاملة الشراية: " + err);
        });
    } else {
        // Local simulation state updates
        gameState.user.coins -= totalCost;
        gameState.inventory[listing.itemType] += listing.quantity;
        
        // Remove item from listings database
        gameState.marketListings = gameState.marketListings.filter(l => l.id !== listingId);
        if (typeof GameAudio !== "undefined") GameAudio.playSuccess();
        showToast(`اكتمل الشراء التفاعلي! تم امتلاك ${listing.quantity} حبات من ${cropsDb[listing.itemType].name}.`);
        saveGame();
        renderAll();
        renderMarketListings();
    }
}

function cancelUserListing(listingId) {
    const listing = gameState.marketListings.find(l => l.id === listingId);
    if (!listing) return;

    if (firebaseActive) {
        db.collection("market").doc(listingId).delete().then(() => {
            gameState.inventory[listing.itemType] += listing.quantity;
            showToast("تم إلغاء واسترداد البضاعة إلى مخازن المزرعة.");
            saveGame();
            renderAll();
        });
    } else {
        gameState.inventory[listing.itemType] += listing.quantity;
        gameState.marketListings = gameState.marketListings.filter(l => l.id !== listingId);
        showToast("تم إلغاء عرضه في المعرض المحلي وإرجاع السلع للمخزن.");
        saveGame();
        renderAll();
        renderMarketListings();
    }
}

// -------------------------------------------------------------
// CHAT & CONVERSATION SYNCRONIZATIONS
// -------------------------------------------------------------
function sendChatMessage() {
    const input = document.getElementById("chat-input-text");
    const text = input.value.trim();
    if (!text) return;

    const msg = {
        id: "msg_" + Date.now() + "_" + Math.floor(Math.random()*100),
        senderName: gameState.user.name,
        senderAvatar: gameState.user.avatar,
        text: text,
        isVip: gameState.user.isVip,
        timestamp: Date.now()
    };

    if (firebaseActive) {
        db.collection("chat").doc(msg.id).set(msg)
            .then(() => {
                input.value = "";
            })
            .catch(err => showToast("عطب اتصال الدردشة: " + err.message));
    } else {
        // Simulation Chat mode push
        gameState.chatMessages.push(msg);
        input.value = "";
        renderChatMessages();
        scrollToBottomChat();
    }
}

// Support fast chat sends
function sendQuickMessage(text) {
    document.getElementById("chat-input-text").value = text;
    sendChatMessage();
}

function renderChatMessages() {
    const box = document.getElementById("chat-messages-box");
    if (!box) return;

    box.innerHTML = "";
    
    if (!firebaseActive && gameState.chatMessages.length === 0) {
        // Setup initial welcome logs
        gameState.chatMessages.push({
            id: "system_welcome",
            senderName: "مشرف قرية الغياث 🛡️",
            senderAvatar: "system_host",
            text: "أهلاً ومرحباً بكم جميعاً في دردشة مزرعة الغياث المشتركة التفاعلية! نذكركم بالتعاون وشراء المنتجات من المزارعين الجدد 👍",
            isVip: true,
            timestamp: Date.now() - 300000
        });
    }

    gameState.chatMessages.forEach(msg => {
        const isMe = msg.senderName === gameState.user.name;
        const msgBlock = document.createElement("div");
        msgBlock.className = `flex gap-2 flex-row max-w-[85%] ${isMe ? 'self-end flex-row-reverse' : 'self-start'}`;

        const isVip = msg.isVip;

        msgBlock.innerHTML = `
            <img src="https://api.dicebear.com/7.x/bottts/svg?seed=${msg.senderAvatar === 'system_host' ? 'JehadSystem' : msg.senderAvatar}" class="w-8 h-8 rounded-full bg-zinc-850 border border-zinc-700 mt-1" alt="Chat avatar">
            <div>
                <div class="text-[9px] text-zinc-500 flex gap-1 items-center mb-0.5 font-bold ${isMe ? 'justify-end' : ''}">
                    <span class="${isVip ? 'text-yellow-400 font-extrabold' : 'text-zinc-400'}">${msg.senderName}</span>
                    ${isVip ? '<span class="bg-yellow-500 text-black text-[7px] font-extrabold px-1 rounded">VIP</span>' : ''}
                    <span>• ${new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div class="p-2.5 rounded-xl text-xs leading-relaxed ${isMe ? 'bg-[#2e7d32] text-white rounded-tr-none' : 'bg-zinc-900 border border-zinc-850 text-zinc-200 rounded-tl-none'}">
                    ${msg.text}
                </div>
            </div>
        `;
        box.appendChild(msgBlock);
    });
}

function scrollToBottomChat() {
    const box = document.getElementById("chat-messages-box");
    if (box) box.scrollTop = box.scrollHeight;
}

// -------------------------------------------------------------
// LEADERBOARD UPDATES
// -------------------------------------------------------------
let leaderboardFilter = "coins";

function filterLeaderboard(filter) {
    leaderboardFilter = filter;
    document.getElementById("btn-leaderboard-coins").className = filter === "coins" ? "flex-1 py-1.5 text-center rounded-lg bg-[#222] text-yellow-400 border border-yellow-600/30 font-bold" : "flex-1 py-1.5 text-center text-zinc-400 font-bold";
    document.getElementById("btn-leaderboard-level").className = filter === "level" ? "flex-1 py-1.5 text-center rounded-lg bg-[#222] text-yellow-400 border border-yellow-600/30 font-bold" : "flex-1 py-1.5 text-center text-zinc-400 font-bold";
    renderLeaderboard();
}

function renderLeaderboard() {
    const listDom = document.getElementById("leaderboard-players-rows");
    if (!listDom) return;

    listDom.innerHTML = "";

    let mockList = [
        { name: "جهاد الغياث 🛡️ (راعي الحفل)", coins: 95000, level: 32, isVip: true, avatar: "GhaithMain" },
        { name: gameState.user.name + " (أنت)", coins: gameState.user.coins, level: gameState.user.level, isVip: gameState.user.isVip, avatar: gameState.user.avatar },
        ...simulationPlayers
    ];

    // Sort by filter
    if (leaderboardFilter === "coins") {
        mockList.sort((a,b) => b.coins - a.coins);
    } else {
        mockList.sort((a,b) => b.level - a.level);
    }

    mockList.forEach((player, pos) => {
        const row = document.createElement("div");
        const isCurrentPlayer = player.name.includes("(أنت)");
        row.className = `p-3 rounded-xl flex justify-between items-center ${isCurrentPlayer ? 'bg-green-950/30 border-2 border-green-700/50' : 'bg-zinc-900 border border-zinc-850'}`;
        
        let medal = "";
        if (pos === 0) medal = "🥇";
        else if (pos === 1) medal = "🥈";
        else if (pos === 2) medal = "🥉";
        else medal = `#${pos + 1}`;

        row.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="w-6 font-bold text-center text-xs text-zinc-400">${medal}</span>
                <img src="https://api.dicebear.com/7.x/bottts/svg?seed=${player.avatar}" class="w-8 h-8 rounded-full bg-zinc-800" alt="Avatar table">
                <div>
                    <h4 class="text-xs font-bold text-zinc-200 flex items-center gap-1">
                        <span class="${player.isVip ? 'text-yellow-400 font-extrabold' : ''}">${player.name}</span>
                        ${player.isVip ? '👑' : ''}
                    </h4>
                    <p class="text-[9px] text-zinc-500 font-semibold">تحالف المزارعين الأحرار</p>
                </div>
            </div>
            
            <div class="text-left font-bold text-xs">
                <span class="text-yellow-400 block">${Number(player.coins).toLocaleString()} <img src="https://cdn-icons-png.flaticon.com/512/272/272525.png" class="w-3.5 h-3.5 inline"></span>
                <span class="text-[10px] text-zinc-400">المستوى ${player.level}</span>
            </div>
        `;
        listDom.appendChild(row);
    });
}

// -------------------------------------------------------------
// SECURE BOT SIMULATIONS (keeps offline world active and engaging)
// -------------------------------------------------------------
function simulateBotChat() {
    const num = Math.random();
    if (num < 0.4) return; // Chance to output chat

    const bot = simulationPlayers[Math.floor(Math.random() * simulationPlayers.length)];
    const sentence = botChatSentences[Math.floor(Math.random() * botChatSentences.length)];

    const msg = {
        id: "msg_bot_" + Date.now(),
        senderName: bot.name,
        senderAvatar: bot.avatar,
        text: sentence,
        isVip: bot.isVip,
        timestamp: Date.now()
    };

    gameState.chatMessages.push(msg);
    // Keep list clean (cap at 25 comments)
    if (gameState.chatMessages.length > 25) {
        gameState.chatMessages.shift();
    }
    
    if (gameState.currentTab === "chat") {
        renderChatMessages();
        scrollToBottomChat();
    }
}

function simulateBotMarketActions() {
    // Add bot new offers periodically to the market
    const types = ["wheat", "tomato", "rose", "olive"];
    const product = types[Math.floor(Math.random() * types.length)];
    const bot = simulationPlayers[Math.floor(Math.random() * simulationPlayers.length)];
    
    const count = Math.floor(Math.random() * 6) + 3;
    const basePrices = cropsDb[product];
    const randomizedPrice = Math.floor(basePrices.rewardCoins * (0.8 + Math.random() * 0.4));

    const newBotListing = {
        id: "listing_sim_" + Date.now(),
        sellerId: "sim_bot_" + Math.floor(Math.random()*10),
        sellerName: bot.name,
        isVip: bot.isVip,
        itemType: product,
        quantity: count,
        price: randomizedPrice,
        timestamp: Date.now()
    };

    gameState.marketListings.unshift(newBotListing);
    if (gameState.marketListings.length > 12) {
        gameState.marketListings.pop(); // Cap listings
    }

    if (gameState.currentTab === "market") {
        renderMarketListings();
    }
}

function simulateBotPurchaseUserItem(listingId) {
    const listing = gameState.marketListings.find(l => l.id === listingId);
    if (!listing) return;

    // Remove listed products and transfer coins to User
    const totalGained = listing.quantity * listing.price;
    gameState.user.coins += totalGained;
    
    // Remove listing
    gameState.marketListings = gameState.marketListings.filter(l => l.id !== listingId);
    
    showToast(`باعاجل! قام المزارع الشريك بشراء عرض معروضاتك بالكامل. كسبت +${totalGained} من الذهب 🪙`);
    saveGame();
    renderAll();
    
    if (gameState.currentTab === "market") {
        renderMarketListings();
    }
}

// -------------------------------------------------------------
// LIVE REAL-TIME FIREBASE CLIENT MODULES CONFIG
// -------------------------------------------------------------
function tryInitFirebase(config) {
    if (firebaseActive) return;

    try {
        // Safeguard to prevent crash if Firebase scripts fail
        if (typeof firebase === "undefined") {
            console.warn("Firebase SDK compat scripts not loaded correctly, falling back to local simulation mode.");
            return;
        }

        // Initialize Firebase Client App Instance if not already
        if (firebase.apps.length === 0) {
            firebase.initializeApp(config);
        }

        db = firebase.firestore();
        firebaseActive = true;

        // Visual update statuses
        const badge = document.getElementById("firebase-status-badge");
        badge.className = "flex items-center gap-1 bg-green-500 text-white font-semibold text-[10px] px-2 py-1 rounded-full animate-pulse";
        document.getElementById("firebase-status-text").innerText = "متصل بقاعدة البيانات اللاسلكية";

        // Listen for Realtime Global chat in Firestore
        db.collection("chat").orderBy("timestamp", "asc").limitToLast(20)
            .onSnapshot(snapshot => {
                const msgs = [];
                snapshot.forEach(doc => {
                    msgs.push(doc.data());
                });
                gameState.chatMessages = msgs;
                if (gameState.currentTab === "chat") {
                    renderChatMessages();
                    scrollToBottomChat();
                }
            }, error => {
                console.error("Firestore Listen error on chat:", error);
            });

        // Listen for Live Marketplace in Firestore
        db.collection("market").orderBy("timestamp", "desc").limit(30)
            .onSnapshot(snapshot => {
                const listings = [];
                snapshot.forEach(doc => {
                    listings.push(doc.data());
                });
                gameState.marketListings = listings;
                if (gameState.currentTab === "market") {
                    renderMarketListings();
                }
            }, error => {
                console.error("Firestore Listen error on listings:", error);
            });

        // Push current player identity update to firebase general list
        syncUserToFirebase();

    } catch (e) {
        console.error("Firebase init failed: ", e);
        showToast("فشل تهيئة Firebase. يرجى التحقق من المفاتيح أو الارتباط اللامركزي.");
    }
}

function syncUserToFirebase() {
    if (!firebaseActive || !db) return;
    
    db.collection("users").doc(gameState.user.id).set({
        id: gameState.user.id,
        name: gameState.user.name,
        level: gameState.user.level,
        coins: gameState.user.coins,
        gems: gameState.user.gems,
        isVip: gameState.user.isVip,
        avatar: gameState.user.avatar,
        lastLogin: Date.now()
    }).catch(err => console.error("Error syncing user metadata: ", err));
}

// ==========================================
// DYNAMIC WEATHER SYSTEM ENGINE (نظام الطقس)
// ==========================================
window.currentWeather = "sunny";

function initWeatherSystem() {
    // 1. Determine local system clock hour of the day
    const hour = new Date().getHours();
    
    // 2. Map system timezone with climatic ambiance
    if (hour >= 5 && hour < 8) {
        window.currentWeather = "cloudy_mist"; // Misty sunrise early morning
    } else if (hour >= 8 && hour < 17) {
        window.currentWeather = "sunny"; // Warm cozy sunny day
    } else if (hour >= 17 && hour < 20) {
        window.currentWeather = "sunny"; // Sunset orange glow
    } else {
        // Evening / Mid-night defaults
        window.currentWeather = Math.random() > 0.45 ? "sunny" : "rainy"; // Twinkling stars night or rainfall
    }
    
    // Set matching background night switch matching standard system hour
    const bodyTag = document.body;
    const themeIcon = document.getElementById("theme-icon");
    if (hour < 6 || hour >= 19) {
        window.isFarmNight = true;
        if (bodyTag) bodyTag.style.backgroundColor = "#070c07";
        if (themeIcon) themeIcon.className = "fas fa-moon text-blue-300";
    } else {
        window.isFarmNight = false;
        if (bodyTag) bodyTag.style.backgroundColor = "#121212";
        if (themeIcon) themeIcon.className = "fas fa-sun text-yellow-400";
    }
    
    // 3. Render animations
    applyWeatherEffects();
}

function applyWeatherEffects() {
    const overlay = document.getElementById("weather-animation-overlay");
    if (!overlay) return;
    
    // Reset overlay elements
    overlay.innerHTML = "";
    
    const weather = window.currentWeather;
    const isNight = window.isFarmNight === true;
    
    const hudIcon = document.getElementById("weather-hud-icon");
    const hudText = document.getElementById("weather-hud-text");
    const moistureEl = document.getElementById("farm-soil-moisture");
    
    if (weather === "sunny") {
        if (isNight) {
            // Starry Moonlit Night
            for (let i = 0; i < 20; i++) {
                const star = document.createElement("div");
                star.className = "star-item";
                star.style.left = Math.random() * 95 + "%";
                star.style.top = Math.random() * 85 + "%";
                star.style.width = (Math.random() * 2.5 + 1.2) + "px";
                star.style.height = star.style.width;
                star.style.animationDelay = (Math.random() * 3) + "s";
                star.style.animationDuration = (Math.random() * 2 + 2) + "s";
                overlay.appendChild(star);
            }
            if (hudIcon) hudIcon.innerHTML = '<i class="fas fa-moon text-blue-300 animate-pulse"></i>';
            if (hudText) hudText.innerText = "سماء النجوم";
            if (moistureEl) {
                moistureEl.innerHTML = "رطوبة ليلية: 80% 💧🌙";
                moistureEl.className = "text-[10px] text-indigo-300 bg-black/50 border border-indigo-500/20 px-2.5 py-1 rounded-full font-bold shadow";
            }
        } else {
            // Sunny Warm Day (Light pollen solar flares)
            const ray = document.createElement("div");
            ray.className = "sun-ray-effect";
            overlay.appendChild(ray);
            
            for (let i = 0; i < 15; i++) {
                const spark = document.createElement("div");
                spark.className = "sparkle-ember";
                spark.style.left = Math.random() * 100 + "%";
                spark.style.width = (Math.random() * 4 + 2) + "px";
                spark.style.height = spark.style.width;
                spark.style.animationDelay = (Math.random() * 7) + "s";
                spark.style.animationDuration = (Math.random() * 5 + 6) + "s";
                overlay.appendChild(spark);
            }
            
            if (hudIcon) hudIcon.innerHTML = '<i class="fas fa-sun text-yellow-400 animate-spin" style="animation-duration: 20s"></i>';
            if (hudText) hudText.innerText = "شمس دافئة";
            if (moistureEl) {
                moistureEl.innerHTML = "تربة دافئة: 75% ☀️";
                moistureEl.className = "text-[10px] text-yellow-300 bg-black/50 border border-yellow-500/20 px-2.5 py-1 rounded-full font-bold shadow";
            }
        }
    } 
    else if (weather === "rainy") {
        // Falling raindrops
        const rainCount = isNight ? 45 : 35;
        for (let i = 0; i < rainCount; i++) {
            const drop = document.createElement("div");
            drop.className = "rain-drop";
            drop.style.left = Math.random() * 100 + "%";
            drop.style.top = (Math.random() * -15) + "%";
            drop.style.animationDelay = (Math.random() * 0.9) + "s";
            drop.style.animationDuration = (Math.random() * 0.4 + 0.7) + "s";
            overlay.appendChild(drop);
        }
        
        // Splashing rain ripples
        for (let i = 0; i < 6; i++) {
            const ripple = document.createElement("div");
            ripple.className = "rain-ripple";
            ripple.style.left = Math.random() * 80 + 10 + "%";
            ripple.style.top = Math.random() * 80 + 10 + "%";
            ripple.style.width = (Math.random() * 20 + 12) + "px";
            ripple.style.height = (Math.random() * 6 + 3) + "px";
            ripple.style.animationDelay = (Math.random() * 1.5) + "s";
            ripple.style.animationDuration = (Math.random() * 0.4 + 0.5) + "s";
            overlay.appendChild(ripple);
        }
        
        if (hudIcon) hudIcon.innerHTML = '<i class="fas fa-cloud-showers-heavy text-blue-300"></i>';
        if (hudText) hudText.innerText = ltrConvertWeatherText("rainy");
        if (moistureEl) {
            moistureEl.innerHTML = "رطوبة مثالية: 100% 🌧️";
            moistureEl.className = "text-[10px] text-blue-200 bg-black/50 border border-blue-500/20 px-2.5 py-1 rounded-full font-bold shadow";
        }
    } 
    else if (weather === "cloudy_mist") {
        // Thin layer of fog/mist
        const mist = document.createElement("div");
        mist.className = "fog-mist-layer";
        overlay.appendChild(mist);
        
        // Moving cloud icons
        for (let i = 0; i < 2; i++) {
            const cloud = document.createElement("div");
            cloud.innerText = "☁️";
            cloud.className = "absolute text-zinc-100 opacity-20 text-3xl pointer-events-none";
            cloud.style.top = (Math.random() * 40 + 10) + "px";
            cloud.style.left = (Math.random() * 80) + "%";
            cloud.style.animation = "fogSwayAnimation 25s ease-in-out infinite alternate";
            if (i === 1) cloud.style.animationDelay = "5s";
            overlay.appendChild(cloud);
        }
        
        if (hudIcon) hudIcon.innerHTML = '<i class="fas fa-cloud text-slate-300"></i>';
        if (hudText) hudText.innerText = "ضباب وغيوم";
        if (moistureEl) {
            moistureEl.innerHTML = "تربة رطبة: 90% 🌫️";
            moistureEl.className = "text-[10px] text-zinc-300 bg-black/50 border border-zinc-500/20 px-2.5 py-1 rounded-full font-bold shadow";
        }
    } 
    else if (weather === "thunderstorm") {
        // Heavy vertical thunderstorms
        for (let i = 0; i < 50; i++) {
            const drop = document.createElement("div");
            drop.className = "rain-drop";
            drop.style.left = Math.random() * 100 + "%";
            drop.style.top = (Math.random() * -15) + "%";
            drop.style.animationDelay = (Math.random() * 0.9) + "s";
            drop.style.animationDuration = (Math.random() * 0.3 + 0.4) + "s";
            overlay.appendChild(drop);
        }
        
        if (hudIcon) hudIcon.innerHTML = '<i class="fas fa-bolt text-amber-300 animate-pulse"></i>';
        if (hudText) hudText.innerText = "عاصفة رعدية";
        if (moistureEl) {
            moistureEl.innerHTML = "إشباع فائق: 100% ⛈️";
            moistureEl.className = "text-[10px] text-teal-200 bg-black/50 border border-teal-500/20 px-2.5 py-1 rounded-full font-bold shadow";
        }
    }
}

function ltrConvertWeatherText(type) {
    if (type === "rainy") {
        return window.isFarmNight ? "ليل ممطر" : "مطر منعش";
    }
    return "مطر منعش";
}

function cycleWeatherState() {
    const states = ["sunny", "rainy", "cloudy_mist", "thunderstorm"];
    let currentIndex = states.indexOf(window.currentWeather);
    let nextIndex = (currentIndex + 1) % states.length;
    window.currentWeather = states[nextIndex];
    
    applyWeatherEffects();
    
    const isNight = window.isFarmNight === true;
    const messages = {
        sunny: isNight ? "بزوغ سماء ليل القرية الصافية المليئة بالنجوم المتلألئة ✨🌙" : "شمس ساطعة تنير سنابل القمح الذهبية ☀️",
        rainy: isNight ? "زخات مطر ليلية دافئة تداعب تربة المزرعة 🌧️🌙" : "أمطار دافئة تروي المزروعات (سرعة نمو البذور +25%) 🌧️🌾",
        cloudy_mist: "ضباب صباحي مريح يغطي ربوع المحاصيل 🌫️🌿",
        thunderstorm: "عاصفة رعدية تغذي المياه الجوفية وحقول المزرعة! ⛈️🌱"
    };
    
    showToast(messages[window.currentWeather]);
}

// ==========================================
// DYNAMIC SOUND EFFECTS SYNTHESIZER ENGINE
// ==========================================
const GameAudio = {
    ctx: null,

    init() {
        if (!this.ctx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                this.ctx = new AudioContextClass();
            }
        }
        if (this.ctx && this.ctx.state === "suspended") {
            this.ctx.resume();
        }
    },

    playClick() {
        this.init();
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.type = "sine";
            osc.frequency.setValueAtTime(550, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.08);
            
            gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
            
            osc.start();
            osc.stop(this.ctx.currentTime + 0.08);
        } catch (e) {
            console.error("Audio error:", e);
        }
    },

    playSuccess() {
        this.init();
        if (!this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const notes = [261.63, 329.63, 392.00, 523.25]; // Melodic C-E-G-C major chord
            
            notes.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                
                osc.type = "triangle";
                osc.frequency.setValueAtTime(freq, now + idx * 0.07);
                
                gain.gain.setValueAtTime(0.06, now + idx * 0.07);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.15);
                
                osc.start(now + idx * 0.07);
                osc.stop(now + idx * 0.07 + 0.15);
            });
        } catch (e) {
            console.error("Audio error:", e);
        }
    },

    playHarvest() {
        this.init();
        if (!this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const notes = [440.00, 554.37, 659.25, 880.00]; // Energetic A-C#-E-A sweep
            
            notes.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                
                osc.type = "sine";
                osc.frequency.setValueAtTime(freq, now + idx * 0.05);
                
                gain.gain.setValueAtTime(0.05, now + idx * 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.12);
                
                osc.start(now + idx * 0.05);
                osc.stop(now + idx * 0.05 + 0.12);
            });
        } catch (e) {
            console.error("Audio error:", e);
        }
    }
};

// Global click interaction trigger to unlock Audio context safely on Android/Web platforms
document.addEventListener("click", () => {
    GameAudio.init();
});
