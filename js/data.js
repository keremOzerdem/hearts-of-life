/* ═══════════════════════════════════════════════════════════
   HEARTS OF LIFE — Game Data
   Static config only — all content is user-defined
   ═══════════════════════════════════════════════════════════ */

const GameData = {

    // ═══════════════ USER CONTENT (loaded from save) ═══════════════
    focusTree: { branches: [] },
    technologies: { categories: [] },
    events: [],
    decisions: { categories: [] },
    defaultSpirits: [],
    spiritsFromFocuses: {},
    divisionTemplates: [],
    productionItems: [],
    constructionItems: [],
    warCampaigns: [],

    // ═══════════════ STATIC CONFIG ═══════════════

    ideologies: {
        'Demokratik': { color: '#3a7bd5', bonus: { stability: 10, politicalPower: 1 }, description: 'Dengeli ve özgür bir yaşam tarzı' },
        'Komünist': { color: '#e53935', bonus: { civFactory: 2, stability: -5 }, description: 'Eşitlikçi ve kolektif yaşam' },
        'Faşist': { color: '#424242', bonus: { milFactory: 2, warSupport: 10, stability: -10 }, description: 'Disiplinli ve otoriter yaşam' },
        'Tarafsız': { color: '#78909c', bonus: { stability: 5, money: 100 }, description: 'Sakin ve bağımsız yaşam' }
    },

    weekDays: ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'],

    months: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
             'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],

    provinceTypes: {
        village:  { size: 42, border: 1, label: 'Köy' },
        town:     { size: 48, border: 2, label: 'Kasaba' },
        city:     { size: 54, border: 2, label: 'Şehir' },
        fortress: { size: 50, border: 3, label: 'Kale' },
        capital:  { size: 60, border: 3, label: 'Başkent' }
    },

    terrainMods: {
        plains:   { mod: 1.0, label: 'Ova', icon: '🌾' },
        forest:   { mod: 0.85, label: 'Orman', icon: '🌲' },
        mountain: { mod: 0.7, label: 'Dağ', icon: '⛰' },
        urban:    { mod: 0.9, label: 'Şehir', icon: '🏙' },
        hills:    { mod: 0.8, label: 'Tepe', icon: '⛰' }
    },

    // ═══════════════ ACHIEVEMENT DEFINITIONS ═══════════════
    achievements: [
        // Gün bazlı
        { id: 'day_1', name: 'İlk Adım', desc: 'İlk gününü tamamla', icon: '🏅', check: 'daysPlayed', target: 1 },
        { id: 'day_7', name: 'Bir Hafta', desc: '7 gün oyna', icon: '📅', check: 'daysPlayed', target: 7 },
        { id: 'day_30', name: 'Bir Ay', desc: '30 gün oyna', icon: '🗓', check: 'daysPlayed', target: 30 },
        { id: 'day_100', name: 'Yüzüncü Gün', desc: '100 gün oyna', icon: '💯', check: 'daysPlayed', target: 100 },
        { id: 'day_365', name: 'Bir Yıl', desc: '365 gün oyna', icon: '👑', check: 'daysPlayed', target: 365 },
        // Odak
        { id: 'focus_1', name: 'Odaklanmış', desc: 'İlk odağını tamamla', icon: '🎯', check: 'focusesCompleted', target: 1 },
        { id: 'focus_5', name: 'Çok Yönlü', desc: '5 odak tamamla', icon: '🎯', check: 'focusesCompleted', target: 5 },
        { id: 'focus_20', name: 'Odak Ustası', desc: '20 odak tamamla', icon: '🎯', check: 'focusesCompleted', target: 20 },
        // Araştırma
        { id: 'tech_1', name: 'Kaşif', desc: 'İlk araştırmayı tamamla', icon: '🔬', check: 'techsResearched', target: 1 },
        { id: 'tech_10', name: 'Bilim İnsanı', desc: '10 araştırma tamamla', icon: '🔬', check: 'techsResearched', target: 10 },
        // Karar
        { id: 'dec_1', name: 'Karar Verici', desc: 'İlk kararını al', icon: '📜', check: 'decisionsExecuted', target: 1 },
        { id: 'dec_25', name: 'Stratejist', desc: '25 karar al', icon: '📜', check: 'decisionsExecuted', target: 25 },
        // Savaş
        { id: 'prov_1', name: 'İlk Fetih', desc: 'İlk bölgeyi fethet', icon: '⚔', check: 'provincesConquered', target: 1 },
        { id: 'prov_10', name: 'Fatih', desc: '10 bölge fethet', icon: '⚔', check: 'provincesConquered', target: 10 },
        { id: 'camp_1', name: 'Zafer', desc: 'İlk seferi kazan', icon: '🏆', check: 'campaignsWon', target: 1 },
        // Kaynak
        { id: 'stab_90', name: 'Denge Ustası', desc: 'İstikrarı %90\'a çıkar', icon: '⚖', check: 'bestStability', target: 90 },
        { id: 'health_95', name: 'Sağlıklı Yaşam', desc: 'Sağlığı %95\'e çıkar', icon: '❤', check: 'bestHealth', target: 95 },
        { id: 'money_50k', name: 'Zengin', desc: '50.000₺ kazan', icon: '💰', check: 'totalMoneyEarned', target: 50000 },
        // XP / Level
        { id: 'level_5', name: 'Tecrübeli', desc: 'Seviye 5\'e ulaş', icon: '⭐', check: 'level', target: 5 },
        { id: 'level_10', name: 'Kıdemli', desc: 'Seviye 10\'a ulaş', icon: '⭐', check: 'level', target: 10 },
        // Seri
        { id: 'streak_7', name: 'Disiplinli', desc: '7 günlük seri yap', icon: '🔥', check: 'bestStreak', target: 7 },
        { id: 'streak_30', name: 'Alışkanlık', desc: '30 günlük seri yap', icon: '🔥', check: 'bestStreak', target: 30 },
        // Pomodoro
        { id: 'pomo_1', name: 'İlk Pomodoro', desc: 'İlk pomodoro\'nu tamamla', icon: '🍅', check: 'totalPomodoros', target: 1 },
        { id: 'pomo_50', name: 'Odak Makinesi', desc: '50 pomodoro tamamla', icon: '🍅', check: 'totalPomodoros', target: 50 },
        // Günlük
        { id: 'journal_1', name: 'İlk Kayıt', desc: 'İlk günlük girişini yaz', icon: '📓', check: 'journalEntries', target: 1 },
        { id: 'journal_30', name: 'Yazar', desc: '30 günlük girişi yaz', icon: '📓', check: 'journalEntries', target: 30 },
        // Meydan Okuma
        { id: 'challenge_1', name: 'Meydan Okuyan', desc: 'İlk meydan okumayı tamamla', icon: '🏋', check: 'challengesCompleted', target: 1 },
        { id: 'challenge_5', name: 'Şampiyon', desc: '5 meydan okuma tamamla', icon: '🏋', check: 'challengesCompleted', target: 5 }
    ],

    // ═══════════════ LEVEL / RANK DEFINITIONS ═══════════════
    levels: [
        { level: 1, title: 'Er', xpNeeded: 0 },
        { level: 2, title: 'Onbaşı', xpNeeded: 50 },
        { level: 3, title: 'Çavuş', xpNeeded: 150 },
        { level: 4, title: 'Üstçavuş', xpNeeded: 300 },
        { level: 5, title: 'Asteğmen', xpNeeded: 500 },
        { level: 6, title: 'Teğmen', xpNeeded: 800 },
        { level: 7, title: 'Üsteğmen', xpNeeded: 1200 },
        { level: 8, title: 'Yüzbaşı', xpNeeded: 1800 },
        { level: 9, title: 'Binbaşı', xpNeeded: 2600 },
        { level: 10, title: 'Yarbay', xpNeeded: 3600 },
        { level: 11, title: 'Albay', xpNeeded: 5000 },
        { level: 12, title: 'Tuğgeneral', xpNeeded: 7000 },
        { level: 13, title: 'Tümgeneral', xpNeeded: 9500 },
        { level: 14, title: 'Korgeneral', xpNeeded: 13000 },
        { level: 15, title: 'Orgeneral', xpNeeded: 17000 },
        { level: 16, title: 'Mareşal', xpNeeded: 22000 },
        { level: 17, title: 'Başkomutan', xpNeeded: 30000 }
    ],

    // ═══════════════ XP REWARDS ═══════════════
    xpRewards: {
        dayProcessed: 5,
        focusCompleted: 50,
        techCompleted: 30,
        decisionExecuted: 10,
        eventHandled: 5,
        provinceConquered: 25,
        campaignWon: 100,
        dailyObjectiveCompleted: 10,
        pomodoroCompleted: 15,
        challengeCompleted: 40,
        achievementUnlocked: 20,
        journalEntry: 5
    },

    // ═══════════════ POMODORO CONFIG ═══════════════
    pomodoroConfig: {
        workDuration: 25 * 60,
        shortBreak: 5 * 60,
        longBreak: 15 * 60,
        longBreakInterval: 4
    },

    // ═══════════════ READY TEMPLATES ═══════════════
    templates: [
        {
            id: 'university',
            name: '🎓 Üniversite Öğrencisi',
            desc: 'Dersler, sınavlar ve sosyal hayat dengesi',
            ideology: 'Demokratik',
            focusBranches: [
                { id: 'akademik', name: '📚 Akademik', icon: '📚', focuses: [
                    { id: 'ders_calis', name: 'Düzenli Ders Çalış', days: 7, effects: { politicalPower: 5, stability: 5 }, cost: { energy: 3 }, requires: [] },
                    { id: 'sinav_hazirlik', name: 'Sınava Hazırlan', days: 14, effects: { politicalPower: 10, stability: 8 }, cost: { energy: 5 }, requires: ['ders_calis'] },
                    { id: 'proje_teslim', name: 'Proje Teslimi', days: 21, effects: { politicalPower: 15, money: 200 }, cost: { energy: 8 }, requires: ['sinav_hazirlik'] }
                ]},
                { id: 'sosyal_uni', name: '🎉 Sosyal Hayat', icon: '🎉', focuses: [
                    { id: 'kulup_katil', name: 'Kulübe Katıl', days: 5, effects: { socialEnergy: 10, stability: 3 }, cost: { politicalPower: 2 }, requires: [] },
                    { id: 'etkinlik_duzle', name: 'Etkinlik Düzenle', days: 10, effects: { socialEnergy: 15, warSupport: 5 }, cost: { money: 100 }, requires: ['kulup_katil'] }
                ]}
            ],
            techCategories: [
                { id: 'beceriler', name: '🧠 Kişisel Beceriler', icon: '🧠', techs: [
                    { id: 'hizli_oku', name: 'Hızlı Okuma', days: 7, effects: { politicalPower: 3 }, tier: 0 },
                    { id: 'not_alma', name: 'Etkili Not Alma', days: 10, effects: { stability: 5 }, tier: 0 },
                    { id: 'zaman_yon', name: 'Zaman Yönetimi', days: 14, effects: { energy: 5, stability: 5 }, tier: 1 }
                ]}
            ],
            decisionCategories: [
                { id: 'gunluk_uni', name: '📋 Günlük Kararlar', icon: '📋', decisions: [
                    { id: 'kutuphane', name: 'Kütüphaneye Git', icon: '📖', effects: { politicalPower: 3, energy: -2 }, cost: {}, cooldown: 1 },
                    { id: 'spor_yap', name: 'Spora Git', icon: '🏃', effects: { health: 5, energy: -3 }, cost: {}, cooldown: 1 }
                ]}
            ],
            dailyObjectives: [
                { name: 'Ders Çalış', icon: '📚' },
                { name: 'Kitap Oku', icon: '📖' },
                { name: 'Egzersiz Yap', icon: '🏃' }
            ]
        },
        {
            id: 'fitness',
            name: '💪 Fitness & Sağlık',
            desc: 'Spor, beslenme ve sağlıklı yaşam odaklı',
            ideology: 'Faşist',
            focusBranches: [
                { id: 'antrenman', name: '🏋 Antrenman', icon: '🏋', focuses: [
                    { id: 'baslangic_spor', name: 'Spora Başla', days: 7, effects: { health: 5, energy: 3 }, cost: { warSupport: 2 }, requires: [] },
                    { id: 'duzgun_beslen', name: 'Beslenme Düzeni', days: 14, effects: { health: 10, stability: 5 }, cost: { money: 50 }, requires: ['baslangic_spor'] },
                    { id: 'ileri_program', name: 'İleri Antrenman', days: 21, effects: { health: 15, warSupport: 10 }, cost: { energy: 5 }, requires: ['duzgun_beslen'] }
                ]},
                { id: 'recovery', name: '🧘 Toparlanma', icon: '🧘', focuses: [
                    { id: 'uyku_duzeni', name: 'Uyku Düzeni Kur', days: 10, effects: { energy: 10, health: 5 }, cost: {}, requires: [] },
                    { id: 'meditasyon', name: 'Meditasyon Alışkanlığı', days: 14, effects: { stability: 10, socialEnergy: 5 }, cost: {}, requires: ['uyku_duzeni'] }
                ]}
            ],
            techCategories: [
                { id: 'bilgi_fitness', name: '📊 Spor Bilimi', icon: '📊', techs: [
                    { id: 'makro_beslen', name: 'Makro Besin Hesabı', days: 7, effects: { health: 3 }, tier: 0 },
                    { id: 'antrenman_plan', name: 'Program Planlama', days: 10, effects: { warSupport: 5 }, tier: 0 }
                ]}
            ],
            decisionCategories: [
                { id: 'fitness_karar', name: '🏃 Fitness Kararları', icon: '🏃', decisions: [
                    { id: 'salona_git', name: 'Salona Git', icon: '🏋', effects: { health: 5, energy: -4 }, cost: {}, cooldown: 1 },
                    { id: 'protein_ic', name: 'Protein Shake', icon: '🥤', effects: { health: 2, money: -15 }, cost: {}, cooldown: 1 }
                ]}
            ],
            dailyObjectives: [
                { name: 'Antrenman Yap', icon: '🏋' },
                { name: '2L Su İç', icon: '💧' },
                { name: '7+ Saat Uyu', icon: '😴' }
            ]
        },
        {
            id: 'career',
            name: '💼 Kariyer Odaklı',
            desc: 'İş, freelance ve profesyonel gelişim',
            ideology: 'Demokratik',
            focusBranches: [
                { id: 'kariyer', name: '💼 Kariyer', icon: '💼', focuses: [
                    { id: 'cv_guncelle', name: 'CV Güncelle', days: 3, effects: { politicalPower: 5 }, cost: {}, requires: [] },
                    { id: 'network_genisle', name: 'Network Genişlet', days: 10, effects: { socialEnergy: 10, money: 100 }, cost: { socialEnergy: 3 }, requires: ['cv_guncelle'] },
                    { id: 'terfi_hedefle', name: 'Terfi Hedefle', days: 30, effects: { money: 500, politicalPower: 15 }, cost: { energy: 10 }, requires: ['network_genisle'] }
                ]},
                { id: 'yan_gelir', name: '💰 Yan Gelir', icon: '💰', focuses: [
                    { id: 'freelance_basla', name: 'Freelance Başla', days: 14, effects: { money: 300, politicalPower: 5 }, cost: { energy: 5 }, requires: [] },
                    { id: 'musteri_bul', name: 'Düzenli Müşteri Bul', days: 21, effects: { money: 500, stability: 5 }, cost: { socialEnergy: 5 }, requires: ['freelance_basla'] }
                ]}
            ],
            techCategories: [
                { id: 'prof_beceri', name: '🛠 Profesyonel Beceriler', icon: '🛠', techs: [
                    { id: 'sunum_beceri', name: 'Sunum Becerileri', days: 7, effects: { socialEnergy: 5 }, tier: 0 },
                    { id: 'proje_yonetim', name: 'Proje Yönetimi', days: 14, effects: { stability: 5, politicalPower: 5 }, tier: 1 }
                ]}
            ],
            decisionCategories: [
                { id: 'is_karari', name: '📊 İş Kararları', icon: '📊', decisions: [
                    { id: 'toplanti_yap', name: 'Toplantıya Katıl', icon: '🤝', effects: { socialEnergy: -3, politicalPower: 3 }, cost: {}, cooldown: 1 },
                    { id: 'egitim_al', name: 'Online Eğitim Al', icon: '💻', effects: { politicalPower: 5, energy: -3 }, cost: { money: 50 }, cooldown: 3 }
                ]}
            ],
            dailyObjectives: [
                { name: 'İş Planı Yaz', icon: '📋' },
                { name: 'Yeni Beceri Öğren', icon: '💡' },
                { name: '1 Saat Odaklı Çalış', icon: '🎯' }
            ]
        },
        {
            id: 'balanced',
            name: '⚖ Dengeli Yaşam',
            desc: 'Her alandan biraz — genel denge paketi',
            ideology: 'Tarafsız',
            focusBranches: [
                { id: 'denge', name: '⚖ Yaşam Dengesi', icon: '⚖', focuses: [
                    { id: 'rutin_kur', name: 'Günlük Rutin Kur', days: 7, effects: { stability: 8, energy: 3 }, cost: {}, requires: [] },
                    { id: 'hobby_bul', name: 'Hobi Edinme', days: 10, effects: { socialEnergy: 5, health: 3 }, cost: {}, requires: ['rutin_kur'] },
                    { id: 'hedef_belirle', name: 'Uzun Vadeli Hedef', days: 14, effects: { politicalPower: 10, warSupport: 5 }, cost: {}, requires: ['hobby_bul'] }
                ]}
            ],
            techCategories: [
                { id: 'yasam_bec', name: '🌱 Yaşam Becerileri', icon: '🌱', techs: [
                    { id: 'butce_yonetim', name: 'Bütçe Yönetimi', days: 7, effects: { money: 50 }, tier: 0 },
                    { id: 'stres_yonetim', name: 'Stres Yönetimi', days: 10, effects: { stability: 5, health: 3 }, tier: 0 }
                ]}
            ],
            decisionCategories: [
                { id: 'denge_karar', name: '🌿 Günlük', icon: '🌿', decisions: [
                    { id: 'dogada_yuru', name: 'Doğa Yürüyüşü', icon: '🌿', effects: { health: 3, stability: 3, energy: -2 }, cost: {}, cooldown: 1 },
                    { id: 'kitap_oku_d', name: 'Kitap Oku', icon: '📚', effects: { politicalPower: 3, stability: 2 }, cost: {}, cooldown: 1 }
                ]}
            ],
            dailyObjectives: [
                { name: 'Sabah Rutini', icon: '☀' },
                { name: 'Bir Şeyler Öğren', icon: '📖' },
                { name: 'Hareket Et', icon: '🚶' }
            ]
        }
    ]
};
