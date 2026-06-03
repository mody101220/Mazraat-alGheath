/**
 * مزرعة الغياث - Firebase Auth Module
 * نظام المصادقة مع Firebase
 */

const MarketplaceAuth = {
    auth: null,
    db: null,
    recaptchaVerifier: null,
    confirmationResult: null,
    
    // Initialize Firebase Auth
    async init() {
        try {
            // Check if Firebase is already initialized
            if (firebase.apps.length === 0) {
                firebase.initializeApp(MARKETPLACE_CONFIG.firebase);
            }
            
            this.auth = firebase.auth();
            this.db = firebase.firestore();
            
            // Set Arabic language for auth UI
            this.auth.languageCode = 'ar';
            
            // Listen for auth state changes
            this.auth.onAuthStateChanged(async (user) => {
                if (user) {
                    // Fetch additional user data from Firestore
                    const userData = await this.getUserData(user.uid);
                    const fullUser = {
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName || userData?.displayName || 'مستخدم',
                        photoURL: user.photoURL || userData?.photoURL,
                        phone: user.phoneNumber || userData?.phone,
                        userType: userData?.userType || 'buyer',
                        governorate: userData?.governorate,
                        address: userData?.address,
                        createdAt: userData?.createdAt,
                        isVerified: userData?.isVerified || false
                    };
                    
                    MarketplaceStore.setUser(fullUser);
                } else {
                    MarketplaceStore.setUser(null);
                }
            });
            
            console.log('[v0] Firebase Auth initialized successfully');
            return true;
        } catch (error) {
            console.error('[v0] Firebase Auth init error:', error);
            MarketplaceStore.setState({ authLoading: false });
            return false;
        }
    },
    
    // Get user data from Firestore
    async getUserData(uid) {
        try {
            const doc = await this.db.collection('users').doc(uid).get();
            if (doc.exists) {
                return doc.data();
            }
            return null;
        } catch (error) {
            console.error('[v0] Error fetching user data:', error);
            return null;
        }
    },
    
    // Create or update user in Firestore
    async saveUserData(uid, data) {
        try {
            await this.db.collection('users').doc(uid).set(data, { merge: true });
            return true;
        } catch (error) {
            console.error('[v0] Error saving user data:', error);
            return false;
        }
    },
    
    // ============================================
    // Google Sign In
    // ============================================
    async signInWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.setCustomParameters({
                prompt: 'select_account'
            });
            
            const result = await this.auth.signInWithPopup(provider);
            const user = result.user;
            
            // Check if new user
            if (result.additionalUserInfo?.isNewUser) {
                await this.saveUserData(user.uid, {
                    displayName: user.displayName,
                    email: user.email,
                    photoURL: user.photoURL,
                    userType: 'buyer',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    isVerified: true
                });
            }
            
            MarketplaceStore.closeModal('auth');
            showToast('تم تسجيل الدخول بنجاح! 🎉');
            return { success: true, user };
        } catch (error) {
            console.error('[v0] Google sign in error:', error);
            showToast('حدث خطأ أثناء تسجيل الدخول: ' + this.getErrorMessage(error.code));
            return { success: false, error };
        }
    },
    
    // ============================================
    // Facebook Sign In
    // ============================================
    async signInWithFacebook() {
        try {
            const provider = new firebase.auth.FacebookAuthProvider();
            provider.setCustomParameters({
                display: 'popup'
            });
            
            const result = await this.auth.signInWithPopup(provider);
            const user = result.user;
            
            // Check if new user
            if (result.additionalUserInfo?.isNewUser) {
                await this.saveUserData(user.uid, {
                    displayName: user.displayName,
                    email: user.email,
                    photoURL: user.photoURL,
                    userType: 'buyer',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    isVerified: true
                });
            }
            
            MarketplaceStore.closeModal('auth');
            showToast('تم تسجيل الدخول بنجاح! 🎉');
            return { success: true, user };
        } catch (error) {
            console.error('[v0] Facebook sign in error:', error);
            showToast('حدث خطأ أثناء تسجيل الدخول: ' + this.getErrorMessage(error.code));
            return { success: false, error };
        }
    },
    
    // ============================================
    // Phone OTP Authentication
    // ============================================
    
    // Initialize reCAPTCHA
    initRecaptcha(buttonId) {
        try {
            if (this.recaptchaVerifier) {
                this.recaptchaVerifier.clear();
            }
            
            this.recaptchaVerifier = new firebase.auth.RecaptchaVerifier(buttonId, {
                size: 'invisible',
                callback: () => {
                    console.log('[v0] reCAPTCHA verified');
                },
                'expired-callback': () => {
                    console.log('[v0] reCAPTCHA expired');
                    this.initRecaptcha(buttonId);
                }
            });
            
            return true;
        } catch (error) {
            console.error('[v0] reCAPTCHA init error:', error);
            return false;
        }
    },
    
    // Send OTP
    async sendOTP(phoneNumber) {
        try {
            // Format phone number for Syria (+963)
            let formattedPhone = phoneNumber.replace(/\D/g, '');
            if (formattedPhone.startsWith('0')) {
                formattedPhone = formattedPhone.substring(1);
            }
            if (!formattedPhone.startsWith('963')) {
                formattedPhone = '963' + formattedPhone;
            }
            formattedPhone = '+' + formattedPhone;
            
            console.log('[v0] Sending OTP to:', formattedPhone);
            
            if (!this.recaptchaVerifier) {
                this.initRecaptcha('recaptcha-container');
            }
            
            this.confirmationResult = await this.auth.signInWithPhoneNumber(
                formattedPhone,
                this.recaptchaVerifier
            );
            
            return { success: true, phone: formattedPhone };
        } catch (error) {
            console.error('[v0] Send OTP error:', error);
            
            // Reset reCAPTCHA on error
            if (this.recaptchaVerifier) {
                this.recaptchaVerifier.clear();
                this.recaptchaVerifier = null;
            }
            
            return { 
                success: false, 
                error: this.getErrorMessage(error.code) 
            };
        }
    },
    
    // Verify OTP
    async verifyOTP(code, registrationData = null) {
        try {
            if (!this.confirmationResult) {
                return { success: false, error: 'لم يتم إرسال رمز التحقق' };
            }
            
            const result = await this.confirmationResult.confirm(code);
            const user = result.user;
            
            // If new user or registration data provided, save to Firestore
            if (registrationData) {
                await this.saveUserData(user.uid, {
                    displayName: registrationData.name,
                    phone: user.phoneNumber,
                    userType: registrationData.userType || 'buyer',
                    governorate: registrationData.governorate,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    isVerified: true
                });
            } else {
                // Check if user exists
                const existingData = await this.getUserData(user.uid);
                if (!existingData) {
                    // Create basic profile
                    await this.saveUserData(user.uid, {
                        phone: user.phoneNumber,
                        userType: 'buyer',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        isVerified: true
                    });
                }
            }
            
            MarketplaceStore.closeModal('auth');
            showToast('تم التحقق بنجاح! 🎉');
            return { success: true, user };
        } catch (error) {
            console.error('[v0] Verify OTP error:', error);
            return { 
                success: false, 
                error: this.getErrorMessage(error.code) 
            };
        }
    },
    
    // ============================================
    // User Profile Update
    // ============================================
    async updateProfile(updates) {
        try {
            const user = MarketplaceStore.state.user;
            if (!user) {
                return { success: false, error: 'المستخدم غير مسجل الدخول' };
            }
            
            await this.saveUserData(user.uid, updates);
            
            // Update local state
            MarketplaceStore.setUser({
                ...user,
                ...updates
            });
            
            showToast('تم تحديث الملف الشخصي بنجاح!');
            return { success: true };
        } catch (error) {
            console.error('[v0] Update profile error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // ============================================
    // Sign Out
    // ============================================
    async signOut() {
        try {
            await this.auth.signOut();
            MarketplaceStore.logout();
            showToast('تم تسجيل الخروج');
            return { success: true };
        } catch (error) {
            console.error('[v0] Sign out error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // ============================================
    // Error Messages
    // ============================================
    getErrorMessage(code) {
        const messages = {
            'auth/invalid-phone-number': 'رقم الهاتف غير صالح',
            'auth/invalid-verification-code': 'رمز التحقق غير صحيح',
            'auth/code-expired': 'انتهت صلاحية رمز التحقق',
            'auth/too-many-requests': 'تم إرسال طلبات كثيرة، يرجى الانتظار',
            'auth/popup-closed-by-user': 'تم إغلاق نافذة تسجيل الدخول',
            'auth/account-exists-with-different-credential': 'يوجد حساب مسجل بهذا البريد الإلكتروني',
            'auth/network-request-failed': 'خطأ في الاتصال بالشبكة',
            'auth/user-disabled': 'تم تعطيل هذا الحساب',
            'auth/operation-not-allowed': 'طريقة تسجيل الدخول غير مفعلة'
        };
        
        return messages[code] || 'حدث خطأ غير متوقع';
    }
};

// Export
window.MarketplaceAuth = MarketplaceAuth;
