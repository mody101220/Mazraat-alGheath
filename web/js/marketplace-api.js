/**
 * مزرعة الغياث - Marketplace API Module
 * عمليات Firestore وStripe
 */

const MarketplaceAPI = {
    db: null,
    stripe: null,
    
    // Initialize
    init() {
        if (firebase.apps.length > 0) {
            this.db = firebase.firestore();
        }
        
        // Initialize Stripe if key is available
        if (window.Stripe && MARKETPLACE_CONFIG.stripe.publishableKey) {
            this.stripe = Stripe(MARKETPLACE_CONFIG.stripe.publishableKey);
        }
    },
    
    // ============================================
    // Products API
    // ============================================
    
    // Get all products
    async getProducts(options = {}) {
        try {
            let query = this.db.collection('products').where('isActive', '==', true);
            
            if (options.category) {
                query = query.where('category', '==', options.category);
            }
            
            if (options.sellerId) {
                query = query.where('sellerId', '==', options.sellerId);
            }
            
            if (options.governorate) {
                query = query.where('governorate', '==', options.governorate);
            }
            
            query = query.orderBy('createdAt', 'desc');
            
            if (options.limit) {
                query = query.limit(options.limit);
            }
            
            const snapshot = await query.get();
            const products = [];
            
            snapshot.forEach(doc => {
                products.push({ id: doc.id, ...doc.data() });
            });
            
            return { success: true, products };
        } catch (error) {
            console.error('[v0] Get products error:', error);
            return { success: false, error: error.message, products: [] };
        }
    },
    
    // Get single product
    async getProduct(productId) {
        try {
            const doc = await this.db.collection('products').doc(productId).get();
            
            if (doc.exists) {
                return { success: true, product: { id: doc.id, ...doc.data() } };
            }
            
            return { success: false, error: 'المنتج غير موجود' };
        } catch (error) {
            console.error('[v0] Get product error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Create product (for sellers)
    async createProduct(productData) {
        try {
            const user = MarketplaceStore.state.user;
            if (!user) {
                return { success: false, error: 'يجب تسجيل الدخول أولاً' };
            }
            
            if (!MarketplaceUtils.hasPermission(user.userType, 'sell')) {
                return { success: false, error: 'ليس لديك صلاحية إضافة منتجات' };
            }
            
            const product = {
                ...productData,
                sellerId: user.uid,
                sellerName: user.displayName,
                sellerPhoto: user.photoURL,
                sellerPhone: user.phone,
                governorate: user.governorate,
                isActive: true,
                soldCount: 0,
                rating: 0,
                reviewCount: 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            const docRef = await this.db.collection('products').add(product);
            
            return { success: true, productId: docRef.id, product: { id: docRef.id, ...product } };
        } catch (error) {
            console.error('[v0] Create product error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Update product
    async updateProduct(productId, updates) {
        try {
            const user = MarketplaceStore.state.user;
            if (!user) {
                return { success: false, error: 'يجب تسجيل الدخول أولاً' };
            }
            
            // Verify ownership
            const productDoc = await this.db.collection('products').doc(productId).get();
            if (!productDoc.exists || productDoc.data().sellerId !== user.uid) {
                return { success: false, error: 'ليس لديك صلاحية تعديل هذا المنتج' };
            }
            
            await this.db.collection('products').doc(productId).update({
                ...updates,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return { success: true };
        } catch (error) {
            console.error('[v0] Update product error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Delete product
    async deleteProduct(productId) {
        try {
            const user = MarketplaceStore.state.user;
            if (!user) {
                return { success: false, error: 'يجب تسجيل الدخول أولاً' };
            }
            
            // Verify ownership
            const productDoc = await this.db.collection('products').doc(productId).get();
            if (!productDoc.exists || productDoc.data().sellerId !== user.uid) {
                return { success: false, error: 'ليس لديك صلاحية حذف هذا المنتج' };
            }
            
            // Soft delete
            await this.db.collection('products').doc(productId).update({
                isActive: false,
                deletedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return { success: true };
        } catch (error) {
            console.error('[v0] Delete product error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // ============================================
    // Orders API
    // ============================================
    
    // Create order
    async createOrder(orderData) {
        try {
            const user = MarketplaceStore.state.user;
            if (!user) {
                return { success: false, error: 'يجب تسجيل الدخول أولاً' };
            }
            
            const cart = MarketplaceStore.state.cart;
            if (cart.items.length === 0) {
                return { success: false, error: 'السلة فارغة' };
            }
            
            // Calculate totals
            const subtotal = MarketplaceStore.getCartTotal();
            const deliveryFee = orderData.deliveryFee || MARKETPLACE_CONFIG.fees.deliveryBaseFee;
            const commission = MarketplaceUtils.calculateCommission(subtotal);
            const total = subtotal + deliveryFee;
            
            const order = {
                orderId: MarketplaceUtils.generateOrderId(),
                buyerId: user.uid,
                buyerName: user.displayName,
                buyerPhone: user.phone,
                sellerId: cart.sellerId,
                sellerName: cart.sellerName,
                items: cart.items,
                subtotal,
                deliveryFee,
                commission,
                total,
                paymentMethod: orderData.paymentMethod,
                paymentStatus: orderData.paymentMethod === 'cod' ? 'pending' : 'processing',
                status: 'pending',
                deliveryAddress: orderData.address,
                deliveryGovernorate: orderData.governorate,
                deliveryNotes: orderData.notes,
                driverId: null,
                driverName: null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                statusHistory: [{
                    status: 'pending',
                    timestamp: new Date().toISOString(),
                    note: 'تم إنشاء الطلب'
                }]
            };
            
            const docRef = await this.db.collection('orders').add(order);
            
            // Update product stock
            for (const item of cart.items) {
                await this.db.collection('products').doc(item.productId).update({
                    stock: firebase.firestore.FieldValue.increment(-item.quantity),
                    soldCount: firebase.firestore.FieldValue.increment(item.quantity)
                });
            }
            
            // Clear cart
            MarketplaceStore.clearCart();
            
            // Send notification to seller
            await this.createNotification(cart.sellerId, {
                type: 'new_order',
                title: 'طلب جديد!',
                message: `لديك طلب جديد من ${user.displayName} بقيمة ${MarketplaceUtils.formatSYP(total)}`,
                orderId: docRef.id
            });
            
            return { success: true, orderId: docRef.id, order: { id: docRef.id, ...order } };
        } catch (error) {
            console.error('[v0] Create order error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Get user orders (as buyer)
    async getMyOrders() {
        try {
            const user = MarketplaceStore.state.user;
            if (!user) {
                return { success: false, error: 'يجب تسجيل الدخول', orders: [] };
            }
            
            const snapshot = await this.db.collection('orders')
                .where('buyerId', '==', user.uid)
                .orderBy('createdAt', 'desc')
                .get();
            
            const orders = [];
            snapshot.forEach(doc => {
                orders.push({ id: doc.id, ...doc.data() });
            });
            
            return { success: true, orders };
        } catch (error) {
            console.error('[v0] Get my orders error:', error);
            return { success: false, error: error.message, orders: [] };
        }
    },
    
    // Get seller orders
    async getSellerOrders() {
        try {
            const user = MarketplaceStore.state.user;
            if (!user) {
                return { success: false, error: 'يجب تسجيل الدخول', orders: [] };
            }
            
            const snapshot = await this.db.collection('orders')
                .where('sellerId', '==', user.uid)
                .orderBy('createdAt', 'desc')
                .get();
            
            const orders = [];
            snapshot.forEach(doc => {
                orders.push({ id: doc.id, ...doc.data() });
            });
            
            return { success: true, orders };
        } catch (error) {
            console.error('[v0] Get seller orders error:', error);
            return { success: false, error: error.message, orders: [] };
        }
    },
    
    // Get available deliveries (for drivers)
    async getAvailableDeliveries(governorate) {
        try {
            const user = MarketplaceStore.state.user;
            if (!user || user.userType !== 'driver') {
                return { success: false, error: 'غير مصرح', orders: [] };
            }
            
            let query = this.db.collection('orders')
                .where('status', '==', 'ready')
                .where('driverId', '==', null);
            
            if (governorate) {
                query = query.where('deliveryGovernorate', '==', governorate);
            }
            
            const snapshot = await query.orderBy('createdAt', 'desc').get();
            
            const orders = [];
            snapshot.forEach(doc => {
                orders.push({ id: doc.id, ...doc.data() });
            });
            
            return { success: true, orders };
        } catch (error) {
            console.error('[v0] Get available deliveries error:', error);
            return { success: false, error: error.message, orders: [] };
        }
    },
    
    // Update order status
    async updateOrderStatus(orderId, newStatus, note = '') {
        try {
            const user = MarketplaceStore.state.user;
            if (!user) {
                return { success: false, error: 'يجب تسجيل الدخول' };
            }
            
            const statusConfig = MARKETPLACE_CONFIG.orderStatuses[newStatus];
            if (!statusConfig) {
                return { success: false, error: 'حالة غير صالحة' };
            }
            
            const orderDoc = await this.db.collection('orders').doc(orderId).get();
            if (!orderDoc.exists) {
                return { success: false, error: 'الطلب غير موجود' };
            }
            
            const order = orderDoc.data();
            
            // Verify permission
            const canUpdate = 
                order.sellerId === user.uid ||
                order.buyerId === user.uid ||
                order.driverId === user.uid ||
                user.userType === 'admin';
            
            if (!canUpdate) {
                return { success: false, error: 'ليس لديك صلاحية تحديث هذا الطلب' };
            }
            
            const statusEntry = {
                status: newStatus,
                timestamp: new Date().toISOString(),
                note: note || statusConfig.nameAr,
                updatedBy: user.uid
            };
            
            await this.db.collection('orders').doc(orderId).update({
                status: newStatus,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                statusHistory: firebase.firestore.FieldValue.arrayUnion(statusEntry)
            });
            
            // Send notifications
            if (order.buyerId !== user.uid) {
                await this.createNotification(order.buyerId, {
                    type: 'order_update',
                    title: 'تحديث الطلب',
                    message: `طلبك #${order.orderId} ${statusConfig.nameAr}`,
                    orderId
                });
            }
            
            return { success: true };
        } catch (error) {
            console.error('[v0] Update order status error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Accept delivery (for drivers)
    async acceptDelivery(orderId) {
        try {
            const user = MarketplaceStore.state.user;
            if (!user || user.userType !== 'driver') {
                return { success: false, error: 'غير مصرح' };
            }
            
            const orderDoc = await this.db.collection('orders').doc(orderId).get();
            if (!orderDoc.exists) {
                return { success: false, error: 'الطلب غير موجود' };
            }
            
            const order = orderDoc.data();
            if (order.driverId) {
                return { success: false, error: 'تم قبول هذا الطلب من سائق آخر' };
            }
            
            await this.db.collection('orders').doc(orderId).update({
                driverId: user.uid,
                driverName: user.displayName,
                driverPhone: user.phone,
                status: 'picked_up',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                statusHistory: firebase.firestore.FieldValue.arrayUnion({
                    status: 'picked_up',
                    timestamp: new Date().toISOString(),
                    note: `تم استلام الطلب من قبل السائق ${user.displayName}`,
                    updatedBy: user.uid
                })
            });
            
            // Notify buyer and seller
            await this.createNotification(order.buyerId, {
                type: 'delivery_accepted',
                title: 'جاري توصيل طلبك',
                message: `السائق ${user.displayName} في طريقه إليك`,
                orderId
            });
            
            await this.createNotification(order.sellerId, {
                type: 'delivery_accepted',
                title: 'تم استلام الطلب',
                message: `السائق ${user.displayName} استلم الطلب #${order.orderId}`,
                orderId
            });
            
            return { success: true };
        } catch (error) {
            console.error('[v0] Accept delivery error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // ============================================
    // Reviews API
    // ============================================
    
    async createReview(productId, orderId, rating, comment) {
        try {
            const user = MarketplaceStore.state.user;
            if (!user) {
                return { success: false, error: 'يجب تسجيل الدخول' };
            }
            
            // Check if order is delivered and belongs to user
            const orderDoc = await this.db.collection('orders').doc(orderId).get();
            if (!orderDoc.exists || orderDoc.data().buyerId !== user.uid) {
                return { success: false, error: 'لا يمكنك تقييم هذا المنتج' };
            }
            
            if (orderDoc.data().status !== 'delivered') {
                return { success: false, error: 'يمكنك التقييم فقط بعد استلام الطلب' };
            }
            
            const review = {
                productId,
                orderId,
                userId: user.uid,
                userName: user.displayName,
                userPhoto: user.photoURL,
                rating,
                comment,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await this.db.collection('reviews').add(review);
            
            // Update product rating
            const reviewsSnapshot = await this.db.collection('reviews')
                .where('productId', '==', productId)
                .get();
            
            let totalRating = 0;
            reviewsSnapshot.forEach(doc => {
                totalRating += doc.data().rating;
            });
            
            const avgRating = totalRating / reviewsSnapshot.size;
            
            await this.db.collection('products').doc(productId).update({
                rating: avgRating,
                reviewCount: reviewsSnapshot.size
            });
            
            return { success: true };
        } catch (error) {
            console.error('[v0] Create review error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // ============================================
    // Notifications API
    // ============================================
    
    async createNotification(userId, notification) {
        try {
            await this.db.collection('notifications').add({
                userId,
                ...notification,
                read: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            console.error('[v0] Create notification error:', error);
            return { success: false };
        }
    },
    
    async getMyNotifications() {
        try {
            const user = MarketplaceStore.state.user;
            if (!user) {
                return { success: false, notifications: [] };
            }
            
            const snapshot = await this.db.collection('notifications')
                .where('userId', '==', user.uid)
                .orderBy('createdAt', 'desc')
                .limit(50)
                .get();
            
            const notifications = [];
            snapshot.forEach(doc => {
                notifications.push({ id: doc.id, ...doc.data() });
            });
            
            return { success: true, notifications };
        } catch (error) {
            console.error('[v0] Get notifications error:', error);
            return { success: false, notifications: [] };
        }
    },
    
    // ============================================
    // Stripe Payment API
    // ============================================
    
    async createStripeCheckout(orderId, amount) {
        try {
            // This would call your backend API to create Stripe checkout session
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    orderId,
                    amount, // in cents
                    currency: MARKETPLACE_CONFIG.stripe.currency
                })
            });
            
            const data = await response.json();
            
            if (data.sessionId && this.stripe) {
                const result = await this.stripe.redirectToCheckout({
                    sessionId: data.sessionId
                });
                
                if (result.error) {
                    return { success: false, error: result.error.message };
                }
            }
            
            return { success: true };
        } catch (error) {
            console.error('[v0] Stripe checkout error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // ============================================
    // Dashboard Stats API
    // ============================================
    
    async getSellerStats() {
        try {
            const user = MarketplaceStore.state.user;
            if (!user) {
                return { success: false };
            }
            
            const ordersSnapshot = await this.db.collection('orders')
                .where('sellerId', '==', user.uid)
                .get();
            
            let totalRevenue = 0;
            let pendingOrders = 0;
            let completedOrders = 0;
            
            ordersSnapshot.forEach(doc => {
                const order = doc.data();
                if (order.status === 'delivered') {
                    totalRevenue += order.subtotal;
                    completedOrders++;
                } else if (['pending', 'confirmed', 'preparing', 'ready'].includes(order.status)) {
                    pendingOrders++;
                }
            });
            
            const productsSnapshot = await this.db.collection('products')
                .where('sellerId', '==', user.uid)
                .where('isActive', '==', true)
                .get();
            
            return {
                success: true,
                stats: {
                    totalSales: ordersSnapshot.size,
                    pendingOrders,
                    completedOrders,
                    totalRevenue,
                    activeProducts: productsSnapshot.size
                }
            };
        } catch (error) {
            console.error('[v0] Get seller stats error:', error);
            return { success: false };
        }
    },
    
    async getDriverStats() {
        try {
            const user = MarketplaceStore.state.user;
            if (!user || user.userType !== 'driver') {
                return { success: false };
            }
            
            const ordersSnapshot = await this.db.collection('orders')
                .where('driverId', '==', user.uid)
                .get();
            
            let totalEarnings = 0;
            let completedDeliveries = 0;
            let activeDeliveries = 0;
            
            ordersSnapshot.forEach(doc => {
                const order = doc.data();
                if (order.status === 'delivered') {
                    totalEarnings += order.deliveryFee;
                    completedDeliveries++;
                } else if (['picked_up', 'delivering'].includes(order.status)) {
                    activeDeliveries++;
                }
            });
            
            return {
                success: true,
                stats: {
                    totalDeliveries: ordersSnapshot.size,
                    completedDeliveries,
                    activeDeliveries,
                    totalEarnings
                }
            };
        } catch (error) {
            console.error('[v0] Get driver stats error:', error);
            return { success: false };
        }
    }
};

// Export
window.MarketplaceAPI = MarketplaceAPI;
