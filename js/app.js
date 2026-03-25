/* ═══════════════════════════════════════════════════════════
   HEARTS OF LIFE — Application Bootstrap
   Initializes the game, sets up event listeners
   ═══════════════════════════════════════════════════════════ */

const App = {

    pomodoroInterval: null,

    init() {
        console.log('⚔ Hearts of Life — Başlatılıyor...');

        // Initialize state
        State.init();

        // Sync user-defined content to GameData
        State.syncGameData();

        // Set up tab navigation
        this.setupNavigation();

        // Set up keyboard shortcuts
        this.setupKeyboard();

        // Set up modal close on overlay click
        document.getElementById('modal-overlay').addEventListener('click', (e) => {
            if (e.target.id === 'modal-overlay') UI.closeModal();
        });

        // Set up event popup close on overlay click
        document.getElementById('event-popup').addEventListener('click', (e) => {
            // Don't close event popup on overlay click — must choose an option
        });

        // Set up journal mood buttons
        this.setupJournalMoods();

        // Load settings into settings form
        this.loadSettingsForm();

        // Initial UI render
        UI.updateAll();

        // Update real date display
        const dateEl = document.getElementById('real-date-display');
        if (dateEl) dateEl.textContent = State.getDateString();

        // Show onboarding wizard on first launch
        if (!State.current.onboardingDone) {
            UI.showOnboardingWizard();
        } else {
            // Process any missed days (real-time catch-up)
            Engine.checkAndProcessDays();
        }

        // Resume pomodoro if active
        if (State.current.pomodoro.active) {
            this.startPomodoroTimer();
        }

        // Check every minute for date changes (midnight rollover)
        setInterval(() => {
            const dateEl = document.getElementById('real-date-display');
            if (dateEl) dateEl.textContent = State.getDateString();
            if (State.current.onboardingDone) Engine.checkAndProcessDays();
        }, 60000);

        console.log('✅ Hearts of Life — Hazır!');
        if (State.current.onboardingDone) {
            UI.toast('⚔ Hearts of Life başlatıldı! İyi oyunlar, Komutan!', 'success');
        }
    },

    // ── Pomodoro Timer ──
    startPomodoroTimer() {
        if (this.pomodoroInterval) clearInterval(this.pomodoroInterval);
        this.pomodoroInterval = setInterval(() => {
            const remaining = Engine.getPomodoroRemaining();
            if (remaining <= 0 && State.current.pomodoro.active) {
                Engine.completePomodoro();
                clearInterval(this.pomodoroInterval);
                this.pomodoroInterval = null;
                // Play notification sound
                try { new Audio('data:audio/wav;base64,UklGRl9vT19teleQA').play().catch(()=>{}); } catch(e){}
            }
            UI.updatePomodoroWidget();
        }, 1000);
    },

    // ── Journal Mood Buttons ──
    setupJournalMoods() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('mood-btn')) {
                document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
                e.target.classList.add('selected');
            }
        });
    },

    // ── Tab Navigation ──
    setupNavigation() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                
                // Remove active from all
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));

                // Activate selected
                btn.classList.add('active');
                const tabEl = document.getElementById(`tab-${tab}`);
                if (tabEl) tabEl.classList.add('active');

                // Update that tab's content
                UI.updateAll();
            });
        });
    },

    // ── Keyboard Shortcuts ──
    setupKeyboard() {
        document.addEventListener('keydown', (e) => {
            // Don't capture if in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

            // Ctrl+Z for undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                Engine.undo();
                return;
            }

            switch (e.key) {
                case 'Escape':
                    UI.closeModal();
                    document.getElementById('event-popup').classList.add('hidden');
                    break;
                case 'q': case 'Q': this.switchTab('dashboard'); break;
                case 'w': case 'W': this.switchTab('focus'); break;
                case 'e': case 'E': this.switchTab('research'); break;
                case 'r': case 'R': this.switchTab('production'); break;
                case 't': case 'T': this.switchTab('military'); break;
                case 'y': case 'Y': this.switchTab('diplomacy'); break;
            }
        });
    },

    switchTab(tabName) {
        const btn = document.querySelector(`.nav-btn[data-tab="${tabName}"]`);
        if (btn) btn.click();
        // Close mobile menu if open
        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.classList.contains('open')) {
            this.toggleMobileMenu();
        }
    },

    toggleMobileMenu() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (sidebar) sidebar.classList.toggle('open');
        if (overlay) overlay.classList.toggle('active');
    },

    // ── Settings ──
    loadSettingsForm() {
        const p = State.current.profile;
        const nameEl = document.getElementById('setting-name');
        const titleEl = document.getElementById('setting-title');
        const ideoEl = document.getElementById('setting-ideology');
        const incomeEl = document.getElementById('setting-income');
        const hoursEl = document.getElementById('setting-free-hours');
        const soundEl = document.getElementById('setting-sound');
        const notifEl = document.getElementById('setting-notif');
        const undoCountEl = document.getElementById('undo-count');

        if (nameEl) nameEl.value = p.name;
        if (titleEl) titleEl.value = p.title;
        if (ideoEl) ideoEl.value = p.ideology;
        if (incomeEl) incomeEl.value = p.monthlyIncome;
        if (hoursEl) hoursEl.value = p.freeHoursPerDay;
        if (soundEl) soundEl.checked = State.current.soundEnabled !== false;
        if (notifEl) notifEl.checked = State.current.notificationsEnabled === true;
        if (undoCountEl) undoCountEl.textContent = `${(State.current.undoStack || []).length} geri alma noktası`;
    },

    toggleSound(enabled) {
        State.current.soundEnabled = enabled;
        State.save();
        if (enabled) Engine.playSound('click');
        UI.toast(enabled ? '🎵 Ses efektleri açık' : '🔇 Ses efektleri kapalı', 'info');
    },

    toggleNotifications(enabled) {
        if (enabled) {
            Engine.requestNotificationPermission();
        } else {
            State.current.notificationsEnabled = false;
            State.save();
            UI.toast('🔕 Bildirimler kapatıldı', 'info');
        }
    },

    saveSettings() {
        const p = State.current.profile;
        p.name = document.getElementById('setting-name').value || 'Komutan';
        p.title = document.getElementById('setting-title').value || 'Hayatının Lideri';
        p.ideology = document.getElementById('setting-ideology').value;
        p.monthlyIncome = parseInt(document.getElementById('setting-income').value) || 0;
        p.freeHoursPerDay = parseInt(document.getElementById('setting-free-hours').value) || 8;

        // Recalculate daily gains with new income
        Engine.calculateDailyGains();

        State.save();
        UI.updateAll();
        UI.toast('💾 Ayarlar kaydedildi!', 'success');
    },

    confirmReset() {
        UI.showModal({
            title: '⚠ Oyunu Sıfırla',
            body: '<p style="color:var(--accent-red)">Tüm ilerlemeniz silinecek! Bu işlem geri alınamaz.</p><p>Devam etmek istiyor musunuz?</p>',
            buttons: [
                { text: 'Evet, Sıfırla', class: 'danger', action: () => {
                    State.reset();
                    State.syncGameData();
                    UI.closeModal();
                    UI.updateAll();
                    this.loadSettingsForm();
                    UI.toast('🗑 Oyun sıfırlandı', 'warning');
                }},
                { text: 'İptal', class: '', action: () => UI.closeModal() }
            ]
        });
    },

    exportSave() {
        const data = State.export();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hearts_of_life_save_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        UI.toast('📤 Kayıt dışa aktarıldı', 'success');
    },

    importSave() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (State.import(ev.target.result)) {
                    UI.updateAll();
                    this.loadSettingsForm();
                    UI.toast('📥 Kayıt içe aktarıldı!', 'success');
                } else {
                    UI.toast('❌ Geçersiz kayıt dosyası', 'error');
                }
            };
            reader.readAsText(file);
        });
        input.click();
    }
};

// ── Start when DOM is ready ──
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
