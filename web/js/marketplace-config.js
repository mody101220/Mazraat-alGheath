/**
 * مزرعة الغياث - Marketplace Configuration
 * إعدادات المنصة التجارية والسوق الحقيقي
 */

// Firebase Configuration for Marketplace
const MARKETPLACE_CONFIG = {
    // Firebase Project Config
    firebase: {
        apiKey: "AIzaSyCX_GhaithSys_7721_Znd882bf",
        authDomain: "alghaith-farm.firebaseapp.com",
        projectId: "alghaith-farm",
        storageBucket: "alghaith-farm.appspot.com",
        messagingSenderId: "388738184376",
        appId: "1:388738184376:web:91a7e2b1008d"
    },
    
    // Stripe Configuration (will be set via environment)
    stripe: {
        publishableKey: null, // Set from server
        currency: 'usd',
        localCurrency: 'SYP'
    },
    
    // Commission and Fees
    fees: {
        platformCommission: 0.05, // 5% commission
        deliveryBaseFee: 5000, // 5000 SYP base
        deliveryPerKm: 500, // 500 SYP per km
        minOrderAmount: 10000 // Minimum order 10,000 SYP
    },
    
    // User Types
    userTypes: {
        buyer: {
            id: 'buyer',
            nameAr: 'مشتري',
            icon: '🛒',
            permissions: ['browse', 'order', 'review', 'chat']
        },
        farmer: {
            id: 'farmer',
            nameAr: 'مزارع',
            icon: '🌾',
            permissions: ['browse', 'order', 'review', 'chat', 'sell', 'dashboard']
        },
        restaurant: {
            id: 'restaurant',
            nameAr: 'مطعم/متجر',
            icon: '🍽️',
            permissions: ['browse', 'order', 'review', 'chat', 'sell', 'dashboard', 'bulk_order']
        },
        driver: {
            id: 'driver',
            nameAr: 'سائق توصيل',
            icon: '🚚',
            permissions: ['browse', 'deliver', 'chat', 'dashboard']
        },
        admin: {
            id: 'admin',
            nameAr: 'مشرف',
            icon: '🛡️',
            permissions: ['all']
        }
    },
    
    // Product Categories
    categories: [
        { id: 'vegetables', nameAr: 'خضروات', icon: '🥬', color: '#22c55e' },
        { id: 'fruits', nameAr: 'فواكه', icon: '🍎', color: '#ef4444' },
        { id: 'grains', nameAr: 'حبوب', icon: '🌾', color: '#eab308' },
        { id: 'dairy', nameAr: 'ألبان وأجبان', icon: '🧀', color: '#fbbf24' },
        { id: 'meat', nameAr: 'لحوم ودواجن', icon: '🍖', color: '#dc2626' },
        { id: 'oils', nameAr: 'زيوت', icon: '🫒', color: '#84cc16' },
        { id: 'honey', nameAr: 'عسل ومربيات', icon: '🍯', color: '#f59e0b' },
        { id: 'herbs', nameAr: 'أعشاب وتوابل', icon: '🌿', color: '#10b981' }
    ],
    
    // Order Statuses
    orderStatuses: {
        pending: { id: 'pending', nameAr: 'قيد الانتظار', color: '#f59e0b', icon: '⏳' },
        confirmed: { id: 'confirmed', nameAr: 'تم التأكيد', color: '#3b82f6', icon: '✓' },
        preparing: { id: 'preparing', nameAr: 'قيد التحضير', color: '#8b5cf6', icon: '📦' },
        ready: { id: 'ready', nameAr: 'جاهز للتوصيل', color: '#06b6d4', icon: '✅' },
        picked_up: { id: 'picked_up', nameAr: 'تم الاستلام', color: '#6366f1', icon: '🚚' },
        delivering: { id: 'delivering', nameAr: 'قيد التوصيل', color: '#8b5cf6', icon: '🛵' },
        delivered: { id: 'delivered', nameAr: 'تم التوصيل', color: '#22c55e', icon: '✅' },
        cancelled: { id: 'cancelled', nameAr: 'ملغي', color: '#ef4444', icon: '❌' }
    },
    
    // Payment Methods
    paymentMethods: [
        { id: 'cod', nameAr: 'الدفع عند الاستلام', icon: '💵', enabled: true },
        { id: 'sham_cash', nameAr: 'شام كاش', icon: '💳', enabled: true },
        { id: 'mtn_cash', nameAr: 'MTN Cash', icon: '📱', enabled: true },
        { id: 'stripe', nameAr: 'بطاقة ائتمان (Stripe)', icon: '💳', enabled: true }
    ],
    
    // Syrian Governorates
    governorates: [
        { id: 'damascus', nameAr: 'دمشق' },
        { id: 'damascus_countryside', nameAr: 'ريف دمشق' },
        { id: 'aleppo', nameAr: 'حلب' },
        { id: 'homs', nameAr: 'حمص' },
        { id: 'hama', nameAr: 'حماة' },
        { id: 'latakia', nameAr: 'اللاذقية' },
        { id: 'tartus', nameAr: 'طرطوس' },
        { id: 'idlib', nameAr: 'إدلب' },
        { id: 'deir_ez_zor', nameAr: 'دير الزور' },
        { id: 'hasaka', nameAr: 'الحسكة' },
        { id: 'raqqa', nameAr: 'الرقة' },
        { id: 'daraa', nameAr: 'درعا' },
        { id: 'suwayda', nameAr: 'السويداء' },
        { id: 'quneitra', nameAr: 'القنيطرة' }
    ],
    
    // Units of Measurement
    units: [
        { id: 'kg', nameAr: 'كيلوغرام', shortAr: 'كغ' },
        { id: 'gram', nameAr: 'غرام', shortAr: 'غ' },
        { id: 'piece', nameAr: 'قطعة', shortAr: 'قطعة' },
        { id: 'box', nameAr: 'صندوق', shortAr: 'صندوق' },
        { id: 'liter', nameAr: 'لتر', shortAr: 'ل' },
        { id: 'dozen', nameAr: 'درزن', shortAr: 'درزن' }
    ]
};

// Utility Functions
const MarketplaceUtils = {
    // Format Syrian Pounds
    formatSYP(amount) {
        return new Intl.NumberFormat('ar-SY', {
            style: 'decimal',
            maximumFractionDigits: 0
        }).format(amount) + ' ل.س';
    },
    
    // Format USD for Stripe
    formatUSD(cents) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(cents / 100);
    },
    
    // Calculate delivery fee
    calculateDeliveryFee(distanceKm) {
        const { deliveryBaseFee, deliveryPerKm } = MARKETPLACE_CONFIG.fees;
        return deliveryBaseFee + (distanceKm * deliveryPerKm);
    },
    
    // Calculate platform commission
    calculateCommission(orderTotal) {
        return Math.round(orderTotal * MARKETPLACE_CONFIG.fees.platformCommission);
    },
    
    // Generate order ID
    generateOrderId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 6);
        return `GH-${timestamp}-${random}`.toUpperCase();
    },
    
    // Get category by ID
    getCategoryById(id) {
        return MARKETPLACE_CONFIG.categories.find(c => c.id === id);
    },
    
    // Get order status by ID
    getOrderStatusById(id) {
        return MARKETPLACE_CONFIG.orderStatuses[id];
    },
    
    // Get user type by ID
    getUserTypeById(id) {
        return MARKETPLACE_CONFIG.userTypes[id];
    },
    
    // Check user permission
    hasPermission(userType, permission) {
        const type = MARKETPLACE_CONFIG.userTypes[userType];
        if (!type) return false;
        return type.permissions.includes('all') || type.permissions.includes(permission);
    },
    
    // Format date in Arabic
    formatDateAr(date) {
        return new Intl.DateTimeFormat('ar-SY', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    },
    
    // Format relative time in Arabic
    formatRelativeTime(date) {
        const now = new Date();
        const then = new Date(date);
        const diffMs = now - then;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffMins < 1) return 'الآن';
        if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
        if (diffHours < 24) return `منذ ${diffHours} ساعة`;
        if (diffDays < 7) return `منذ ${diffDays} يوم`;
        return this.formatDateAr(date);
    },
    
    // Validate phone number (Syrian format)
    validateSyrianPhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        return /^9\d{8}$/.test(cleaned);
    },
    
    // Generate random avatar URL
    generateAvatarUrl(seed) {
        return `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
    }
};

// Export for use in other modules
window.MARKETPLACE_CONFIG = MARKETPLACE_CONFIG;
window.MarketplaceUtils = MarketplaceUtils;
