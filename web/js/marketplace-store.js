/**
 * مزرعة الغياث - Marketplace Store (State Management)
 * إدارة حالة المنصة التجارية
 */

// Marketplace State
const MarketplaceStore = {
    // Current state
    state: {
        // User state
        user: null,
        isAuthenticated: false,
        authLoading: true,
        
        // Products state
        products: [],
        productsLoading: false,
        selectedCategory: null,
        searchQuery: '',
        
        // Cart state
        cart: {
            items: [],
            sellerId: null,
            sellerName: ''
        },
        
        // Orders state
        orders: [],
        ordersLoading: false,
        
        // Dashboard state (for sellers/drivers)
        dashboard: {
            stats: {
                totalSales: 0,
                pendingOrders: 0,
                completedOrders: 0,
                totalRevenue: 0
            },
            myProducts: [],
            myOrders: [],
            availableDeliveries: []
        },
        
        // UI state
        currentView: 'home', // home, marketplace, orders, dashboard, game, profile
        modals: {
            auth: false,
            productDetail: null,
            checkout: false,
            orderDetail: null,
            addProduct: false,
            editProduct: null
        },
        
        // Notifications
        notifications: [],
        unreadNotifications: 0
    },
    
    // Subscribers for state changes
    subscribers: [],
    
    // Subscribe to state changes
    subscribe(callback) {
        this.subscribers.push(callback);
        return () => {
            this.subscribers = this.subscribers.filter(sub => sub !== callback);
        };
    },
    
    // Notify all subscribers
    notify() {
        this.subscribers.forEach(callback => callback(this.state));
    },
    
    // Update state
    setState(updates) {
        this.state = { ...this.state, ...updates };
        this.notify();
        this.persistState();
    },
    
    // Deep update for nested objects
    setNestedState(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let obj = this.state;
        
        for (const key of keys) {
            if (!obj[key]) obj[key] = {};
            obj = obj[key];
        }
        
        obj[lastKey] = value;
        this.notify();
        this.persistState();
    },
    
    // Persist state to localStorage
    persistState() {
        try {
            const stateToPersist = {
                cart: this.state.cart,
                user: this.state.user ? {
                    uid: this.state.user.uid,
                    displayName: this.state.user.displayName,
                    email: this.state.user.email,
                    phone: this.state.user.phone,
                    photoURL: this.state.user.photoURL,
                    userType: this.state.user.userType,
                    governorate: this.state.user.governorate
                } : null
            };
            localStorage.setItem('alghaith_marketplace_state', JSON.stringify(stateToPersist));
        } catch (e) {
            console.error('Error persisting state:', e);
        }
    },
    
    // Load state from localStorage
    loadPersistedState() {
        try {
            const saved = localStorage.getItem('alghaith_marketplace_state');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.cart) {
                    this.state.cart = parsed.cart;
                }
            }
        } catch (e) {
            console.error('Error loading persisted state:', e);
        }
    },
    
    // ============================================
    // User Actions
    // ============================================
    
    setUser(user) {
        this.setState({
            user,
            isAuthenticated: !!user,
            authLoading: false
        });
    },
    
    logout() {
        this.setState({
            user: null,
            isAuthenticated: false,
            cart: { items: [], sellerId: null, sellerName: '' },
            orders: [],
            dashboard: {
                stats: { totalSales: 0, pendingOrders: 0, completedOrders: 0, totalRevenue: 0 },
                myProducts: [],
                myOrders: [],
                availableDeliveries: []
            }
        });
        localStorage.removeItem('alghaith_marketplace_state');
    },
    
    // ============================================
    // Cart Actions
    // ============================================
    
    addToCart(product, quantity = 1) {
        const { cart } = this.state;
        
        // Check if adding from different seller
        if (cart.sellerId && cart.sellerId !== product.sellerId) {
            return {
                success: false,
                message: 'لا يمكنك إضافة منتجات من بائعين مختلفين في نفس الطلب. يرجى إتمام الطلب الحالي أولاً أو إفراغ السلة.'
            };
        }
        
        const existingIndex = cart.items.findIndex(item => item.productId === product.id);
        
        if (existingIndex >= 0) {
            // Update quantity
            const updatedItems = [...cart.items];
            updatedItems[existingIndex].quantity += quantity;
            
            // Check stock
            if (updatedItems[existingIndex].quantity > product.stock) {
                updatedItems[existingIndex].quantity = product.stock;
            }
            
            this.setNestedState('cart.items', updatedItems);
        } else {
            // Add new item
            const newItems = [...cart.items, {
                productId: product.id,
                name: product.name,
                price: product.price,
                unit: product.unit,
                image: product.image,
                quantity: Math.min(quantity, product.stock),
                sellerId: product.sellerId,
                sellerName: product.sellerName
            }];
            
            this.setState({
                cart: {
                    items: newItems,
                    sellerId: product.sellerId,
                    sellerName: product.sellerName
                }
            });
        }
        
        return { success: true, message: 'تمت الإضافة إلى السلة' };
    },
    
    updateCartItemQuantity(productId, quantity) {
        const { cart } = this.state;
        const updatedItems = cart.items.map(item => {
            if (item.productId === productId) {
                return { ...item, quantity: Math.max(1, quantity) };
            }
            return item;
        });
        
        this.setNestedState('cart.items', updatedItems);
    },
    
    removeFromCart(productId) {
        const { cart } = this.state;
        const updatedItems = cart.items.filter(item => item.productId !== productId);
        
        if (updatedItems.length === 0) {
            // Reset cart completely
            this.setState({
                cart: { items: [], sellerId: null, sellerName: '' }
            });
        } else {
            this.setNestedState('cart.items', updatedItems);
        }
    },
    
    clearCart() {
        this.setState({
            cart: { items: [], sellerId: null, sellerName: '' }
        });
    },
    
    getCartTotal() {
        return this.state.cart.items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    },
    
    getCartItemCount() {
        return this.state.cart.items.reduce((count, item) => count + item.quantity, 0);
    },
    
    // ============================================
    // Products Actions
    // ============================================
    
    setProducts(products) {
        this.setState({ products, productsLoading: false });
    },
    
    addProduct(product) {
        this.setState({
            products: [product, ...this.state.products]
        });
    },
    
    updateProduct(productId, updates) {
        const updatedProducts = this.state.products.map(p => {
            if (p.id === productId) {
                return { ...p, ...updates };
            }
            return p;
        });
        this.setState({ products: updatedProducts });
    },
    
    removeProduct(productId) {
        this.setState({
            products: this.state.products.filter(p => p.id !== productId)
        });
    },
    
    setSelectedCategory(categoryId) {
        this.setState({ selectedCategory: categoryId });
    },
    
    setSearchQuery(query) {
        this.setState({ searchQuery: query });
    },
    
    getFilteredProducts() {
        let { products, selectedCategory, searchQuery } = this.state;
        
        if (selectedCategory) {
            products = products.filter(p => p.category === selectedCategory);
        }
        
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            products = products.filter(p => 
                p.name.toLowerCase().includes(query) ||
                p.description?.toLowerCase().includes(query)
            );
        }
        
        return products;
    },
    
    // ============================================
    // Orders Actions
    // ============================================
    
    setOrders(orders) {
        this.setState({ orders, ordersLoading: false });
    },
    
    addOrder(order) {
        this.setState({
            orders: [order, ...this.state.orders]
        });
    },
    
    updateOrder(orderId, updates) {
        const updatedOrders = this.state.orders.map(o => {
            if (o.id === orderId) {
                return { ...o, ...updates };
            }
            return o;
        });
        this.setState({ orders: updatedOrders });
    },
    
    // ============================================
    // Dashboard Actions (for sellers/drivers)
    // ============================================
    
    setDashboardStats(stats) {
        this.setNestedState('dashboard.stats', stats);
    },
    
    setMyProducts(products) {
        this.setNestedState('dashboard.myProducts', products);
    },
    
    setMyOrders(orders) {
        this.setNestedState('dashboard.myOrders', orders);
    },
    
    setAvailableDeliveries(deliveries) {
        this.setNestedState('dashboard.availableDeliveries', deliveries);
    },
    
    // ============================================
    // Notifications Actions
    // ============================================
    
    addNotification(notification) {
        const newNotification = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            read: false,
            ...notification
        };
        
        this.setState({
            notifications: [newNotification, ...this.state.notifications],
            unreadNotifications: this.state.unreadNotifications + 1
        });
    },
    
    markNotificationRead(notificationId) {
        const updatedNotifications = this.state.notifications.map(n => {
            if (n.id === notificationId && !n.read) {
                return { ...n, read: true };
            }
            return n;
        });
        
        const unreadCount = updatedNotifications.filter(n => !n.read).length;
        
        this.setState({
            notifications: updatedNotifications,
            unreadNotifications: unreadCount
        });
    },
    
    markAllNotificationsRead() {
        const updatedNotifications = this.state.notifications.map(n => ({
            ...n,
            read: true
        }));
        
        this.setState({
            notifications: updatedNotifications,
            unreadNotifications: 0
        });
    },
    
    // ============================================
    // View/Navigation Actions
    // ============================================
    
    setView(view) {
        this.setState({ currentView: view });
    },
    
    openModal(modalName, data = true) {
        this.setNestedState(`modals.${modalName}`, data);
    },
    
    closeModal(modalName) {
        this.setNestedState(`modals.${modalName}`, modalName === 'productDetail' || modalName === 'orderDetail' || modalName === 'editProduct' ? null : false);
    },
    
    closeAllModals() {
        this.setState({
            modals: {
                auth: false,
                productDetail: null,
                checkout: false,
                orderDetail: null,
                addProduct: false,
                editProduct: null
            }
        });
    }
};

// Initialize store
MarketplaceStore.loadPersistedState();

// Export
window.MarketplaceStore = MarketplaceStore;
