/* ═══════════════════════════════════════════════════════════
   HEARTS OF LIFE — Authentication & Cloud Sync
   Firebase Auth + Firestore for per-user cloud storage
   ═══════════════════════════════════════════════════════════ */

const Auth = {
    db: null,
    user: null,
    _saveTimeout: null,
    _initialized: false,

    // Initialize Firebase
    init() {
        if (typeof firebase === 'undefined') {
            console.warn('Firebase SDK not loaded');
            return;
        }

        const firebaseConfig = {
            apiKey: "AIzaSyCqxNPB8nRgOJFHlHFl7n0cKJCMoJ9HTOQ",
            authDomain: "hearts-of-life-app.firebaseapp.com",
            projectId: "hearts-of-life-app",
            storageBucket: "hearts-of-life-app.firebasestorage.app",
            messagingSenderId: "586153428619",
            appId: "1:586153428619:web:a1b2c3d4e5f6a7b8c9d0e1"
        };

        try {
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            this.db = firebase.firestore();
            this._initialized = true;
            console.log('🔥 Firebase initialized');

            // Listen for auth state changes
            firebase.auth().onAuthStateChanged((user) => {
                this.user = user;
                this._updateAuthUI();
                if (user) {
                    console.log('👤 Logged in:', user.email);
                    this.loadFromCloud();
                }
            });
        } catch (e) {
            console.warn('Firebase init error:', e);
        }
    },

    // ═══════════════ AUTH METHODS ═══════════════

    async register(email, password) {
        try {
            const cred = await firebase.auth().createUserWithEmailAndPassword(email, password);
            UI.toast(`✅ Hesap oluşturuldu: ${cred.user.email}`, 'success');
            Engine.playSound('success');
            UI.closeModal();
            // Save current local state to cloud for new user
            await this.saveToCloud();
            return true;
        } catch (e) {
            const msg = this._errorMessage(e.code);
            UI.toast(`❌ ${msg}`, 'danger');
            return false;
        }
    },

    async login(email, password) {
        try {
            const cred = await firebase.auth().signInWithEmailAndPassword(email, password);
            UI.toast(`✅ Giriş yapıldı: ${cred.user.email}`, 'success');
            Engine.playSound('success');
            UI.closeModal();
            return true;
        } catch (e) {
            const msg = this._errorMessage(e.code);
            UI.toast(`❌ ${msg}`, 'danger');
            return false;
        }
    },

    async loginWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            const result = await firebase.auth().signInWithPopup(provider);
            UI.toast(`✅ Google ile giriş yapıldı: ${result.user.email}`, 'success');
            Engine.playSound('success');
            UI.closeModal();
            return true;
        } catch (e) {
            if (e.code !== 'auth/popup-closed-by-user') {
                UI.toast(`❌ Google giriş hatası`, 'danger');
            }
            return false;
        }
    },

    async logout() {
        try {
            // Save before logout
            await this.saveToCloud();
            await firebase.auth().signOut();
            this.user = null;
            this._updateAuthUI();
            UI.toast('👋 Çıkış yapıldı', 'info');
        } catch (e) {
            console.warn('Logout error:', e);
        }
    },

    // ═══════════════ CLOUD STORAGE ═══════════════

    async saveToCloud() {
        if (!this.user || !this.db) return;
        try {
            const data = JSON.parse(JSON.stringify(State.current));
            // Don't save undoStack to cloud (too large)
            delete data.undoStack;
            await this.db.collection('saves').doc(this.user.uid).set({
                data: data,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                email: this.user.email
            });
            console.log('☁ Saved to cloud');
        } catch (e) {
            console.warn('Cloud save error:', e);
        }
    },

    async loadFromCloud() {
        if (!this.user || !this.db) return;
        try {
            const doc = await this.db.collection('saves').doc(this.user.uid).get();
            if (doc.exists) {
                const cloudData = doc.data().data;
                const cloudDays = cloudData.totalDaysProcessed || 0;
                const localDays = State.current.totalDaysProcessed || 0;

                // If cloud has more progress, use cloud data
                if (cloudDays > localDays) {
                    State.current = State.migrate(cloudData);
                    State.current.undoStack = [];
                    State.syncGameData();
                    State.save(); // Also update localStorage
                    UI.updateAll();
                    UI.toast('☁ Bulut kaydı yüklendi', 'success');
                    console.log('☁ Loaded from cloud (cloud had more progress)');
                } else if (localDays > cloudDays) {
                    // Local is ahead — push to cloud
                    await this.saveToCloud();
                    console.log('☁ Local ahead, pushed to cloud');
                } else {
                    console.log('☁ Local and cloud in sync');
                }
            } else {
                // No cloud save yet — upload local
                await this.saveToCloud();
                console.log('☁ First cloud save created');
            }
        } catch (e) {
            console.warn('Cloud load error:', e);
        }
    },

    // Debounced cloud save (called after State.save)
    scheduleSave() {
        if (!this.user || !this.db) return;
        if (this._saveTimeout) clearTimeout(this._saveTimeout);
        this._saveTimeout = setTimeout(() => {
            this.saveToCloud();
        }, 5000); // Save to cloud 5 seconds after last local save
    },

    // ═══════════════ UI ═══════════════

    _updateAuthUI() {
        const loginBtn = document.getElementById('auth-login-btn');
        const userInfo = document.getElementById('auth-user-info');
        const userName = document.getElementById('auth-user-name');
        const cloudStatus = document.getElementById('cloud-status');

        if (this.user) {
            if (loginBtn) loginBtn.style.display = 'none';
            if (userInfo) userInfo.style.display = 'flex';
            if (userName) userName.textContent = this.user.email.split('@')[0];
            if (cloudStatus) cloudStatus.textContent = '☁ Senkronize';
        } else {
            if (loginBtn) loginBtn.style.display = '';
            if (userInfo) userInfo.style.display = 'none';
            if (cloudStatus) cloudStatus.textContent = '💾 Yerel';
        }
    },

    showLoginModal() {
        const body = `
            <div class="auth-tabs">
                <button class="auth-tab active" onclick="Auth._switchAuthTab('login', this)">Giriş Yap</button>
                <button class="auth-tab" onclick="Auth._switchAuthTab('register', this)">Kayıt Ol</button>
            </div>
            <div id="auth-form-login" class="auth-form">
                <label class="form-label">E-posta: <input type="email" id="auth-email-login" placeholder="mail@örnek.com"></label>
                <label class="form-label">Şifre: <input type="password" id="auth-pass-login" placeholder="••••••" minlength="6"></label>
                <button class="hoi-btn primary" onclick="Auth.login(document.getElementById('auth-email-login').value, document.getElementById('auth-pass-login').value)" style="width:100%;margin-top:8px">🔑 Giriş Yap</button>
            </div>
            <div id="auth-form-register" class="auth-form" style="display:none">
                <label class="form-label">E-posta: <input type="email" id="auth-email-reg" placeholder="mail@örnek.com"></label>
                <label class="form-label">Şifre: <input type="password" id="auth-pass-reg" placeholder="En az 6 karakter" minlength="6"></label>
                <label class="form-label">Şifre Tekrar: <input type="password" id="auth-pass-reg2" placeholder="Tekrar girin" minlength="6"></label>
                <button class="hoi-btn primary" onclick="Auth._doRegister()" style="width:100%;margin-top:8px">📝 Kayıt Ol</button>
            </div>
            <div class="auth-divider"><span>veya</span></div>
            <button class="hoi-btn secondary" onclick="Auth.loginWithGoogle()" style="width:100%">
                <span style="font-size:16px">G</span> Google ile Giriş
            </button>
            <p style="color:var(--text-dim);font-size:11px;margin-top:10px;text-align:center">
                Giriş yaparak verileriniz bulutta güvenle saklanır.<br>Farklı cihazlardan aynı hesapla erişebilirsiniz.
            </p>
        `;

        UI.showModal({
            title: '🔐 Hesap Girişi',
            body: body,
            buttons: [
                { text: 'Kapat', class: 'secondary', action: () => UI.closeModal() }
            ]
        });
    },

    _switchAuthTab(tab, btn) {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('auth-form-login').style.display = tab === 'login' ? '' : 'none';
        document.getElementById('auth-form-register').style.display = tab === 'register' ? '' : 'none';
    },

    _doRegister() {
        const email = document.getElementById('auth-email-reg').value.trim();
        const pass = document.getElementById('auth-pass-reg').value;
        const pass2 = document.getElementById('auth-pass-reg2').value;
        if (!email) { UI.toast('E-posta girin', 'warning'); return; }
        if (pass.length < 6) { UI.toast('Şifre en az 6 karakter olmalı', 'warning'); return; }
        if (pass !== pass2) { UI.toast('Şifreler eşleşmiyor', 'warning'); return; }
        this.register(email, pass);
    },

    // ═══════════════ ERROR MESSAGES ═══════════════
    _errorMessage(code) {
        const messages = {
            'auth/email-already-in-use': 'Bu e-posta zaten kayıtlı',
            'auth/invalid-email': 'Geçersiz e-posta adresi',
            'auth/weak-password': 'Şifre çok zayıf (en az 6 karakter)',
            'auth/user-not-found': 'Kullanıcı bulunamadı',
            'auth/wrong-password': 'Yanlış şifre',
            'auth/too-many-requests': 'Çok fazla deneme. Biraz bekleyin',
            'auth/invalid-credential': 'Geçersiz giriş bilgileri',
            'auth/network-request-failed': 'İnternet bağlantısı yok'
        };
        return messages[code] || 'Bir hata oluştu';
    }
};
