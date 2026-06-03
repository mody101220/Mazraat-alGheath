/**
 * مزرعة الغياث - Marketplace UI Module
 * واجهة المستخدم للمنصة التجارية
 */

const MarketplaceUI = {
    // Current view
    currentView: 'home',
    
    // Initialize UI
    init() {
        this.setupNavigation();
        this.render();
        
        // Subscribe to store changes
        MarketplaceStore.subscribe(() => this.render());
    },
    
    // Setup navigation
    setupNavigation() {
        // Bottom nav clicks
        document.querySelectorAll('[data-marketplace-nav]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const view = e.currentTarget.dataset.marketplaceNav;
                this.navigateTo(view);
            });
        });
    },
    
    // Navigate to view
    navigateTo(view) {
        this.currentView = view;
        MarketplaceStore.setView(view);
        this.render();
        this.updateActiveNav(view);
    },
    
    // Update active nav button
    updateActiveNav(view) {
        document.querySelectorAll('[data-marketplace-nav]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.marketplaceNav === view);
        });
    },
    
    // Main render function
    render() {
        const { user, isAuthenticated, cart } = MarketplaceStore.state;
        
        // Update cart badge
        const cartBadge = document.getElementById('marketplace-cart-badge');
        if (cartBadge) {
            const count = MarketplaceStore.getCartItemCount();
            cartBadge.textContent = count;
            cartBadge.style.display = count > 0 ? 'flex' : 'none';
        }
        
        // Update user info in header
        this.updateUserHeader(user);
        
        // Render current view
        const mainContent = document.getElementById('marketplace-main-content');
        if (mainContent) {
            switch (this.currentView) {
                case 'home':
                    this.renderHome(mainContent);
                    break;
                case 'marketplace':
                    this.renderMarketplace(mainContent);
                    break;
                case 'orders':
                    this.renderOrders(mainContent);
                    break;
                case 'dashboard':
                    this.renderDashboard(mainContent);
                    break;
                case 'profile':
                    this.renderProfile(mainContent);
                    break;
                default:
                    this.renderHome(mainContent);
            }
        }
    },
    
    // Update user header
    updateUserHeader(user) {
        const userSection = document.getElementById('marketplace-user-section');
        if (!userSection) return;
        
        if (user) {
            userSection.innerHTML = `
                <div class="flex items-center gap-2">
                    <img src="${user.photoURL || MarketplaceUtils.generateAvatarUrl(user.uid)}" 
                         alt="Avatar" class="w-8 h-8 rounded-full border-2 border-emerald-500">
                    <div class="hidden sm:block">
                        <p class="text-xs font-bold text-white truncate max-w-[100px]">${user.displayName || 'مستخدم'}</p>
                        <p class="text-[10px] text-emerald-300">${MARKETPLACE_CONFIG.userTypes[user.userType]?.nameAr || 'مشتري'}</p>
                    </div>
                </div>
            `;
        } else {
            userSection.innerHTML = `
                <button onclick="MarketplaceUI.showAuthModal()" 
                        class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 px-4 rounded-xl transition">
                    تسجيل الدخول
                </button>
            `;
        }
    },
    
    // ============================================
    // Home View
    // ============================================
    renderHome(container) {
        container.innerHTML = `
            <div class="p-4 space-y-4">
                <!-- Hero Section -->
                <div class="glass-card-accent p-6 rounded-3xl text-center relative overflow-hidden">
                    <div class="absolute -right-10 -top-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl"></div>
                    <div class="absolute -left-10 -bottom-10 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl"></div>
                    <div class="relative z-10">
                        <span class="text-5xl mb-3 block">🌾</span>
                        <h1 class="text-xl font-black text-yellow-400 mb-2">مزرعة الغياث</h1>
                        <p class="text-sm text-zinc-200 mb-4">سوق زراعي متكامل يربط المزارعين بالمطاعم والمتاجر</p>
                        <div class="flex gap-2 justify-center">
                            <button onclick="MarketplaceUI.navigateTo('marketplace')" 
                                    class="bg-gradient-to-r from-emerald-600 to-green-500 text-white font-bold text-sm py-2.5 px-6 rounded-xl shadow-lg hover:shadow-emerald-500/20 transition">
                                تصفح المنتجات
                            </button>
                            <button onclick="MarketplaceUI.showAuthModal('register')" 
                                    class="bg-zinc-800/80 text-white font-bold text-sm py-2.5 px-6 rounded-xl border border-zinc-700 hover:bg-zinc-700 transition">
                                انضم كبائع
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Categories -->
                <div>
                    <h2 class="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
                        <i class="fa fa-th-large"></i> الأقسام
                    </h2>
                    <div class="grid grid-cols-4 gap-2">
                        ${MARKETPLACE_CONFIG.categories.map(cat => `
                            <button onclick="MarketplaceUI.browseCategory('${cat.id}')" 
                                    class="glass-card p-3 rounded-xl flex flex-col items-center gap-1 hover:border-emerald-500/30 transition active:scale-95">
                                <span class="text-2xl">${cat.icon}</span>
                                <span class="text-[10px] font-bold text-zinc-200">${cat.nameAr}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Featured Products -->
                <div>
                    <div class="flex justify-between items-center mb-3">
                        <h2 class="text-sm font-bold text-emerald-400 flex items-center gap-2">
                            <i class="fa fa-fire"></i> منتجات مميزة
                        </h2>
                        <button onclick="MarketplaceUI.navigateTo('marketplace')" 
                                class="text-[10px] text-yellow-400 font-bold">عرض الكل</button>
                    </div>
                    <div id="featured-products" class="grid grid-cols-2 gap-3">
                        ${this.renderProductsGrid(this.getSampleProducts().slice(0, 4))}
                    </div>
                </div>
                
                <!-- User Types Info -->
                <div class="glass-card p-4 rounded-2xl">
                    <h2 class="text-sm font-bold text-yellow-400 mb-3 text-center">انضم إلينا كـ</h2>
                    <div class="grid grid-cols-2 gap-3">
                        <div class="bg-black/30 p-3 rounded-xl text-center border border-emerald-500/10">
                            <span class="text-2xl block mb-1">🌾</span>
                            <h3 class="text-xs font-bold text-white">مزارع</h3>
                            <p class="text-[9px] text-zinc-400 mt-1">بِع منتجاتك مباشرة للمطاعم والمتاجر</p>
                        </div>
                        <div class="bg-black/30 p-3 rounded-xl text-center border border-emerald-500/10">
                            <span class="text-2xl block mb-1">🍽️</span>
                            <h3 class="text-xs font-bold text-white">مطعم/متجر</h3>
                            <p class="text-[9px] text-zinc-400 mt-1">احصل على منتجات طازجة بأسعار الجملة</p>
                        </div>
                        <div class="bg-black/30 p-3 rounded-xl text-center border border-emerald-500/10">
                            <span class="text-2xl block mb-1">🚚</span>
                            <h3 class="text-xs font-bold text-white">سائق توصيل</h3>
                            <p class="text-[9px] text-zinc-400 mt-1">اربح من توصيل الطلبات في منطقتك</p>
                        </div>
                        <div class="bg-black/30 p-3 rounded-xl text-center border border-emerald-500/10">
                            <span class="text-2xl block mb-1">🛒</span>
                            <h3 class="text-xs font-bold text-white">مشتري</h3>
                            <p class="text-[9px] text-zinc-400 mt-1">اشترِ منتجات طازجة من مزارعين محليين</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    // ============================================
    // Marketplace View
    // ============================================
    renderMarketplace(container) {
        const { products, selectedCategory, searchQuery } = MarketplaceStore.state;
        const filteredProducts = MarketplaceStore.getFilteredProducts();
        
        container.innerHTML = `
            <div class="p-4 space-y-4">
                <!-- Search Bar -->
                <div class="relative">
                    <input type="text" 
                           id="marketplace-search"
                           value="${searchQuery}"
                           placeholder="ابحث عن منتج..."
                           class="w-full bg-black/50 text-white placeholder-zinc-500 border border-emerald-900/40 rounded-xl px-4 py-3 pr-10 text-sm outline-none focus:border-emerald-500 transition"
                           oninput="MarketplaceStore.setSearchQuery(this.value)">
                    <i class="fa fa-search absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"></i>
                </div>
                
                <!-- Categories Filter -->
                <div class="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    <button onclick="MarketplaceStore.setSelectedCategory(null)" 
                            class="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition
                                   ${!selectedCategory ? 'bg-emerald-600 text-white' : 'bg-black/40 text-zinc-300 border border-zinc-700'}">
                        الكل
                    </button>
                    ${MARKETPLACE_CONFIG.categories.map(cat => `
                        <button onclick="MarketplaceStore.setSelectedCategory('${cat.id}')" 
                                class="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition flex items-center gap-1
                                       ${selectedCategory === cat.id ? 'bg-emerald-600 text-white' : 'bg-black/40 text-zinc-300 border border-zinc-700'}">
                            <span>${cat.icon}</span>
                            <span>${cat.nameAr}</span>
                        </button>
                    `).join('')}
                </div>
                
                <!-- Products Grid -->
                <div class="grid grid-cols-2 gap-3" id="products-grid">
                    ${filteredProducts.length > 0 
                        ? this.renderProductsGrid(filteredProducts)
                        : this.renderProductsGrid(this.getSampleProducts())
                    }
                </div>
                
                ${filteredProducts.length === 0 && products.length === 0 ? `
                    <div class="text-center py-8">
                        <span class="text-4xl block mb-3">📦</span>
                        <p class="text-zinc-400 text-sm">لا توجد منتجات حالياً</p>
                        <p class="text-zinc-500 text-xs mt-1">جاري تحميل البيانات التجريبية...</p>
                    </div>
                ` : ''}
            </div>
        `;
    },
    
    // Render products grid
    renderProductsGrid(products) {
        return products.map(product => `
            <div class="glass-card rounded-2xl overflow-hidden border border-emerald-900/20 hover:border-emerald-500/30 transition">
                <div class="relative h-28 bg-black/30 flex items-center justify-center">
                    ${product.image 
                        ? `<img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover">`
                        : `<span class="text-4xl">${MARKETPLACE_CONFIG.categories.find(c => c.id === product.category)?.icon || '📦'}</span>`
                    }
                    ${product.stock <= 5 && product.stock > 0 ? `
                        <span class="absolute top-2 right-2 bg-orange-500/90 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                            آخر ${product.stock} قطع
                        </span>
                    ` : ''}
                    ${product.stock === 0 ? `
                        <div class="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span class="text-red-400 text-xs font-bold">نفذت الكمية</span>
                        </div>
                    ` : ''}
                </div>
                <div class="p-3">
                    <h3 class="text-xs font-bold text-white truncate">${product.name}</h3>
                    <p class="text-[10px] text-zinc-400 mt-0.5">${product.sellerName || 'مزارع الغياث'}</p>
                    <div class="flex items-center justify-between mt-2">
                        <div>
                            <span class="text-sm font-black text-yellow-400">${MarketplaceUtils.formatSYP(product.price)}</span>
                            <span class="text-[9px] text-zinc-500">/${product.unit || 'كغ'}</span>
                        </div>
                        ${product.rating ? `
                            <div class="flex items-center gap-0.5">
                                <i class="fa fa-star text-yellow-400 text-[10px]"></i>
                                <span class="text-[10px] text-zinc-300">${product.rating.toFixed(1)}</span>
                            </div>
                        ` : ''}
                    </div>
                    <button onclick="MarketplaceUI.addToCart('${product.id}')" 
                            ${product.stock === 0 ? 'disabled' : ''}
                            class="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:cursor-not-allowed
                                   text-white text-[10px] font-bold py-2 rounded-lg transition flex items-center justify-center gap-1">
                        <i class="fa fa-cart-plus text-[10px]"></i>
                        <span>إضافة للسلة</span>
                    </button>
                </div>
            </div>
        `).join('');
    },
    
    // ============================================
    // Orders View
    // ============================================
    renderOrders(container) {
        const { orders, isAuthenticated } = MarketplaceStore.state;
        
        if (!isAuthenticated) {
            container.innerHTML = this.renderLoginRequired('لعرض طلباتك');
            return;
        }
        
        container.innerHTML = `
            <div class="p-4 space-y-4">
                <h2 class="text-sm font-bold text-emerald-400 flex items-center gap-2">
                    <i class="fa fa-clipboard-list"></i> طلباتي
                </h2>
                
                ${orders.length > 0 ? `
                    <div class="space-y-3">
                        ${orders.map(order => this.renderOrderCard(order)).join('')}
                    </div>
                ` : `
                    <div class="text-center py-12">
                        <span class="text-5xl block mb-3">📋</span>
                        <p class="text-zinc-400 text-sm">لا توجد طلبات بعد</p>
                        <button onclick="MarketplaceUI.navigateTo('marketplace')" 
                                class="mt-4 bg-emerald-600 text-white text-xs font-bold py-2 px-4 rounded-xl">
                            تصفح المنتجات
                        </button>
                    </div>
                `}
            </div>
        `;
    },
    
    // Render order card
    renderOrderCard(order) {
        const status = MARKETPLACE_CONFIG.orderStatuses[order.status];
        return `
            <div class="glass-card p-4 rounded-2xl border border-emerald-900/20">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <p class="text-xs font-bold text-white">#${order.orderId}</p>
                        <p class="text-[10px] text-zinc-400">${MarketplaceUtils.formatRelativeTime(order.createdAt)}</p>
                    </div>
                    <span class="px-2 py-1 rounded-full text-[10px] font-bold"
                          style="background-color: ${status.color}20; color: ${status.color}">
                        ${status.icon} ${status.nameAr}
                    </span>
                </div>
                <div class="border-t border-white/5 pt-3 mt-3">
                    <p class="text-[10px] text-zinc-400 mb-1">${order.items.length} منتج من ${order.sellerName}</p>
                    <div class="flex justify-between items-center">
                        <span class="text-sm font-bold text-yellow-400">${MarketplaceUtils.formatSYP(order.total)}</span>
                        <button onclick="MarketplaceUI.showOrderDetail('${order.id}')"
                                class="text-emerald-400 text-[10px] font-bold">
                            عرض التفاصيل <i class="fa fa-chevron-left text-[8px]"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },
    
    // ============================================
    // Dashboard View (for sellers/drivers)
    // ============================================
    renderDashboard(container) {
        const { user, isAuthenticated, dashboard } = MarketplaceStore.state;
        
        if (!isAuthenticated) {
            container.innerHTML = this.renderLoginRequired('للوصول للوحة التحكم');
            return;
        }
        
        if (!MarketplaceUtils.hasPermission(user.userType, 'dashboard')) {
            container.innerHTML = `
                <div class="p-4 text-center py-12">
                    <span class="text-5xl block mb-3">🔒</span>
                    <p class="text-zinc-400 text-sm">هذه الصفحة متاحة للمزارعين والمطاعم والسائقين فقط</p>
                </div>
            `;
            return;
        }
        
        if (user.userType === 'driver') {
            this.renderDriverDashboard(container, dashboard);
        } else {
            this.renderSellerDashboard(container, dashboard);
        }
    },
    
    // Seller Dashboard
    renderSellerDashboard(container, dashboard) {
        const { stats } = dashboard;
        container.innerHTML = `
            <div class="p-4 space-y-4">
                <h2 class="text-sm font-bold text-emerald-400 flex items-center gap-2">
                    <i class="fa fa-chart-line"></i> لوحة تحكم البائع
                </h2>
                
                <!-- Stats Grid -->
                <div class="grid grid-cols-2 gap-3">
                    <div class="glass-card p-4 rounded-xl text-center">
                        <i class="fa fa-coins text-2xl text-yellow-400 mb-2"></i>
                        <p class="text-lg font-black text-white">${MarketplaceUtils.formatSYP(stats.totalRevenue)}</p>
                        <p class="text-[10px] text-zinc-400">إجمالي الأرباح</p>
                    </div>
                    <div class="glass-card p-4 rounded-xl text-center">
                        <i class="fa fa-shopping-cart text-2xl text-emerald-400 mb-2"></i>
                        <p class="text-lg font-black text-white">${stats.totalSales}</p>
                        <p class="text-[10px] text-zinc-400">إجمالي الطلبات</p>
                    </div>
                    <div class="glass-card p-4 rounded-xl text-center">
                        <i class="fa fa-clock text-2xl text-orange-400 mb-2"></i>
                        <p class="text-lg font-black text-white">${stats.pendingOrders}</p>
                        <p class="text-[10px] text-zinc-400">طلبات معلقة</p>
                    </div>
                    <div class="glass-card p-4 rounded-xl text-center">
                        <i class="fa fa-check-circle text-2xl text-green-400 mb-2"></i>
                        <p class="text-lg font-black text-white">${stats.completedOrders}</p>
                        <p class="text-[10px] text-zinc-400">طلبات مكتملة</p>
                    </div>
                </div>
                
                <!-- Quick Actions -->
                <div class="glass-card p-4 rounded-2xl">
                    <h3 class="text-xs font-bold text-yellow-400 mb-3">إجراءات سريعة</h3>
                    <div class="grid grid-cols-2 gap-2">
                        <button onclick="MarketplaceUI.showAddProductModal()"
                                class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                            <i class="fa fa-plus"></i> إضافة منتج
                        </button>
                        <button onclick="MarketplaceUI.showMyProducts()"
                                class="bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                            <i class="fa fa-boxes"></i> منتجاتي
                        </button>
                        <button onclick="MarketplaceUI.showSellerOrders()"
                                class="bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                            <i class="fa fa-clipboard-list"></i> الطلبات الواردة
                        </button>
                        <button onclick="MarketplaceUI.showWithdraw()"
                                class="bg-yellow-600 hover:bg-yellow-500 text-black text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                            <i class="fa fa-wallet"></i> سحب الأرباح
                        </button>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Driver Dashboard
    renderDriverDashboard(container, dashboard) {
        container.innerHTML = `
            <div class="p-4 space-y-4">
                <h2 class="text-sm font-bold text-emerald-400 flex items-center gap-2">
                    <i class="fa fa-truck"></i> لوحة تحكم السائق
                </h2>
                
                <!-- Stats -->
                <div class="grid grid-cols-3 gap-2">
                    <div class="glass-card p-3 rounded-xl text-center">
                        <p class="text-lg font-black text-yellow-400">${dashboard.stats.totalDeliveries || 0}</p>
                        <p class="text-[9px] text-zinc-400">إجمالي التوصيلات</p>
                    </div>
                    <div class="glass-card p-3 rounded-xl text-center">
                        <p class="text-lg font-black text-emerald-400">${dashboard.stats.activeDeliveries || 0}</p>
                        <p class="text-[9px] text-zinc-400">توصيلات نشطة</p>
                    </div>
                    <div class="glass-card p-3 rounded-xl text-center">
                        <p class="text-lg font-black text-white">${MarketplaceUtils.formatSYP(dashboard.stats.totalEarnings || 0)}</p>
                        <p class="text-[9px] text-zinc-400">الأرباح</p>
                    </div>
                </div>
                
                <!-- Available Deliveries -->
                <div>
                    <h3 class="text-xs font-bold text-yellow-400 mb-3">طلبات جاهزة للتوصيل</h3>
                    <div id="available-deliveries" class="space-y-2">
                        ${dashboard.availableDeliveries.length > 0 
                            ? dashboard.availableDeliveries.map(order => this.renderDeliveryCard(order)).join('')
                            : `<div class="text-center py-8 text-zinc-500 text-xs">لا توجد طلبات متاحة حالياً</div>`
                        }
                    </div>
                </div>
            </div>
        `;
    },
    
    // ============================================
    // Profile View
    // ============================================
    renderProfile(container) {
        const { user, isAuthenticated } = MarketplaceStore.state;
        
        if (!isAuthenticated) {
            container.innerHTML = this.renderLoginRequired('لعرض ملفك الشخصي');
            return;
        }
        
        container.innerHTML = `
            <div class="p-4 space-y-4">
                <!-- Profile Header -->
                <div class="glass-card-accent p-4 rounded-2xl text-center">
                    <img src="${user.photoURL || MarketplaceUtils.generateAvatarUrl(user.uid)}" 
                         alt="Avatar" class="w-20 h-20 rounded-full border-4 border-emerald-500 mx-auto mb-3">
                    <h2 class="text-lg font-black text-white">${user.displayName || 'مستخدم'}</h2>
                    <p class="text-xs text-emerald-400">${MARKETPLACE_CONFIG.userTypes[user.userType]?.nameAr || 'مشتري'} ${MARKETPLACE_CONFIG.userTypes[user.userType]?.icon || ''}</p>
                    ${user.governorate ? `
                        <p class="text-[10px] text-zinc-400 mt-1">
                            <i class="fa fa-map-marker-alt"></i> ${MARKETPLACE_CONFIG.governorates.find(g => g.id === user.governorate)?.nameAr || user.governorate}
                        </p>
                    ` : ''}
                </div>
                
                <!-- Profile Actions -->
                <div class="glass-card p-4 rounded-2xl space-y-2">
                    <button onclick="MarketplaceUI.showEditProfile()" 
                            class="w-full flex items-center gap-3 p-3 rounded-xl bg-black/30 hover:bg-black/50 transition">
                        <i class="fa fa-user-edit text-emerald-400 w-6"></i>
                        <span class="text-sm text-white">تعديل الملف الشخصي</span>
                        <i class="fa fa-chevron-left text-zinc-500 mr-auto text-xs"></i>
                    </button>
                    <button onclick="MarketplaceUI.showAddresses()" 
                            class="w-full flex items-center gap-3 p-3 rounded-xl bg-black/30 hover:bg-black/50 transition">
                        <i class="fa fa-map-marker-alt text-emerald-400 w-6"></i>
                        <span class="text-sm text-white">عناوين التوصيل</span>
                        <i class="fa fa-chevron-left text-zinc-500 mr-auto text-xs"></i>
                    </button>
                    <button onclick="MarketplaceUI.showPaymentMethods()" 
                            class="w-full flex items-center gap-3 p-3 rounded-xl bg-black/30 hover:bg-black/50 transition">
                        <i class="fa fa-credit-card text-emerald-400 w-6"></i>
                        <span class="text-sm text-white">طرق الدفع</span>
                        <i class="fa fa-chevron-left text-zinc-500 mr-auto text-xs"></i>
                    </button>
                    <button onclick="MarketplaceUI.showSettings()" 
                            class="w-full flex items-center gap-3 p-3 rounded-xl bg-black/30 hover:bg-black/50 transition">
                        <i class="fa fa-cog text-emerald-400 w-6"></i>
                        <span class="text-sm text-white">الإعدادات</span>
                        <i class="fa fa-chevron-left text-zinc-500 mr-auto text-xs"></i>
                    </button>
                </div>
                
                <!-- Game Link -->
                <div class="glass-card p-4 rounded-2xl">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <span class="text-3xl">🎮</span>
                            <div>
                                <h3 class="text-sm font-bold text-yellow-400">لعبة مزرعة الغياث</h3>
                                <p class="text-[10px] text-zinc-400">العب واربح جواهر ومكافآت</p>
                            </div>
                        </div>
                        <button onclick="switchToGame()" 
                                class="bg-gradient-to-r from-yellow-500 to-amber-600 text-black text-xs font-bold py-2 px-4 rounded-xl">
                            العب الآن
                        </button>
                    </div>
                </div>
                
                <!-- Logout -->
                <button onclick="MarketplaceAuth.signOut()" 
                        class="w-full bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 font-bold py-3 rounded-xl transition">
                    <i class="fa fa-sign-out-alt ml-2"></i> تسجيل الخروج
                </button>
            </div>
        `;
    },
    
    // ============================================
    // Helper Methods
    // ============================================
    
    renderLoginRequired(action) {
        return `
            <div class="p-4 flex flex-col items-center justify-center h-full min-h-[300px]">
                <span class="text-5xl mb-4">🔐</span>
                <p class="text-zinc-400 text-sm mb-4">يجب تسجيل الدخول ${action}</p>
                <button onclick="MarketplaceUI.showAuthModal()" 
                        class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl transition">
                    تسجيل الدخول
                </button>
            </div>
        `;
    },
    
    // Sample products for demo
    getSampleProducts() {
        return [
            { id: 'p1', name: 'طماطم بلدية طازجة', category: 'vegetables', price: 15000, unit: 'كغ', stock: 50, rating: 4.8, sellerName: 'مزارع أبو أحمد' },
            { id: 'p2', name: 'خيار غوطة ممتاز', category: 'vegetables', price: 12000, unit: 'كغ', stock: 30, rating: 4.5, sellerName: 'مزارع الغوطة' },
            { id: 'p3', name: 'تفاح سوري أحمر', category: 'fruits', price: 25000, unit: 'كغ', stock: 100, rating: 4.9, sellerName: 'بستان الشام' },
            { id: 'p4', name: 'زيت زيتون بكر', category: 'oils', price: 150000, unit: 'لتر', stock: 20, rating: 5.0, sellerName: 'معصرة الغياث' },
            { id: 'p5', name: 'عسل جبلي طبيعي', category: 'honey', price: 200000, unit: 'كغ', stock: 10, rating: 4.7, sellerName: 'منحل الجبل' },
            { id: 'p6', name: 'جبنة بلدية', category: 'dairy', price: 80000, unit: 'كغ', stock: 15, rating: 4.6, sellerName: 'ألبان حمص' },
            { id: 'p7', name: 'قمح بلدي محصود', category: 'grains', price: 8000, unit: 'كغ', stock: 200, rating: 4.4, sellerName: 'حقول السهل' },
            { id: 'p8', name: 'نعناع طازج', category: 'herbs', price: 5000, unit: 'ربطة', stock: 40, rating: 4.8, sellerName: 'حديقة الأعشاب' }
        ];
    },
    
    // Browse category
    browseCategory(categoryId) {
        MarketplaceStore.setSelectedCategory(categoryId);
        this.navigateTo('marketplace');
    },
    
    // Add to cart
    addToCart(productId) {
        const products = MarketplaceStore.state.products.length > 0 
            ? MarketplaceStore.state.products 
            : this.getSampleProducts();
        const product = products.find(p => p.id === productId);
        
        if (product) {
            const result = MarketplaceStore.addToCart(product);
            if (result.success) {
                showToast('تمت الإضافة للسلة ✓');
            } else {
                showToast(result.message);
            }
        }
    },
    
    // Show auth modal
    showAuthModal(view = 'login') {
        // Use existing auth modal or create marketplace-specific one
        const modal = document.getElementById('auth-modal') || document.getElementById('marketplace-auth-modal');
        if (modal) {
            modal.classList.add('active');
            MarketplaceStore.openModal('auth');
        }
    },
    
    // Show add product modal
    showAddProductModal() {
        showToast('سيتم إضافة نموذج إضافة المنتجات قريباً');
    },
    
    // Show order detail
    showOrderDetail(orderId) {
        showToast('سيتم إضافة تفاصيل الطلب قريباً');
    },
    
    // Placeholder methods
    showMyProducts() { showToast('سيتم إضافة إدارة المنتجات قريباً'); },
    showSellerOrders() { showToast('سيتم إضافة الطلبات الواردة قريباً'); },
    showWithdraw() { showToast('سيتم إضافة سحب الأرباح قريباً'); },
    showEditProfile() { showToast('سيتم إضافة تعديل الملف قريباً'); },
    showAddresses() { showToast('سيتم إضافة إدارة العناوين قريباً'); },
    showPaymentMethods() { showToast('سيتم إضافة طرق الدفع قريباً'); },
    showSettings() { showToast('سيتم إضافة الإعدادات قريباً'); }
};

// Export
window.MarketplaceUI = MarketplaceUI;
