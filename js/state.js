/* ═══════════════════════════════════════════════════════════
   HEARTS OF LIFE — State Management
   Manages game state, save/load from localStorage
   ═══════════════════════════════════════════════════════════ */

const State = {
    SAVE_KEY: 'hearts_of_life_save',

    // Default initial state
    createDefault() {
        return {
            version: 1,
            profile: {
                name: 'Komutan',
                title: 'Hayatının Lideri',
                ideology: 'Demokratik',
                monthlyIncome: 10000,
                freeHoursPerDay: 8
            },
            // Real-time date system — today is day 0
            startDate: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
            lastProcessedDate: null, // last date that was processed
            totalDaysProcessed: 0,
            resources: {
                politicalPower: 0,
                stability: 0,
                warSupport: 0,
                energy: 0,
                money: 0,
                health: 0,
                socialEnergy: 0
            },
            dailyGains: {
                politicalPower: 0,
                energy: 0,
                money: 0,
                health: 0,
                socialEnergy: 0
            },
            factories: {
                civilian: 0,
                military: 0
            },
            researchSlots: 0,
            researchSpeed: 0, // percentage

            // Focus tree state
            focus: {
                current: null,       // focus id
                daysRemaining: 0,
                completed: []        // array of completed focus ids
            },

            // Research state
            research: {
                active: [],          // [{techId, daysRemaining}]
                completed: []        // array of completed tech ids
            },

            // Production lines
            production: {
                lines: [],           // [{itemId, factories, output, active}]
                construction: []     // [{itemId, daysRemaining}]
            },

            // Divisions (routines)
            divisions: [],           // [{id, templateId, name, battalions, active, effects}]

            // Diplomacy
            diplomacy: [],           // [{id, name, avatar, relation, opinion, type}]

            // National spirits
            spirits: [],             // array of spirit ids

            // Decision cooldowns
            decisionCooldowns: {},   // {decisionId: daysRemaining}

            // Event history
            eventHistory: [],        // [{eventId, optionChosen, day}]

            // XP & Level
            xp: 0,
            level: 1,
            totalXpEarned: 0,

            // Achievements
            achievements: [],

            // Daily Objectives
            dailyObjectives: [],

            // Journal
            journal: [],

            // Pomodoro
            pomodoro: {
                active: false,
                type: 'work',
                startedAt: null,
                duration: 25 * 60,
                completedToday: 0,
                totalCompleted: 0,
                linkedItem: null     // {type: 'focus'|'research'|'challenge'|'objective', id, name}
            },

            // Challenges
            challenges: [],

            // Weekly progress tracking
            weeklyProgress: {
                startDay: 0,
                focusesCompleted: 0,
                techsCompleted: 0,
                decisionsExecuted: 0,
                pomodorosCompleted: 0,
                xpEarned: 0,
                objectivesCompleted: 0,
                journalEntries: 0,
                daysActive: 0
            },

            // Weekly Reports
            weeklyReports: [],

            // Stats
            stats: {
                daysPlayed: 0,
                focusesCompleted: 0,
                techsResearched: 0,
                decisionsExecuted: 0,
                eventsHandled: 0,
                totalMoneyEarned: 0,
                totalMoneySpent: 0,
                bestStability: 0,
                bestHealth: 0,
                provincesConquered: 0,
                campaignsWon: 0,
                bestStreak: 0,
                totalPomodoros: 0,
                journalEntries: 0,
                challengesCompleted: 0
            },

            // War campaigns
            wars: {
                activeCampaigns: [],  // [{campaignId, conquered: [provinceIds], assignedDivisions: [divIds], currentTarget: null, battleProgress: 0, started: dayNum}]
                totalConquered: 0
            },

            // Alerts
            alerts: [],

            // Pending event (shown on next tick)
            pendingEvent: null,

            // Onboarding completed
            onboardingDone: false,

            // Resource history (for charts)
            resourceHistory: [],  // [{date, resources: {…}}]

            // Streak tracking
            streak: {
                current: 0,
                best: 0,
                lastActiveDate: null
            },

            // Sound effects enabled
            soundEnabled: true,

            // Browser notifications enabled
            notificationsEnabled: false,

            // Undo stack (state snapshots)
            undoStack: [],

            // User-defined game content
            userData: {
                focusBranches: [],
                techCategories: [],
                events: [],
                decisionCategories: [],
                spirits: [],
                divisionTemplates: [],
                productionItems: [],
                constructionItems: [],
                warCampaigns: []
            }
        };
    },

    // Current state reference
    current: null,

    // Initialize state (load or create new)
    init() {
        const saved = this.load();
        if (saved) {
            this.current = this.migrate(saved);
        } else {
            this.current = this.createDefault();
        }
        return this.current;
    },

    // Load from localStorage
    load() {
        try {
            const data = localStorage.getItem(this.SAVE_KEY);
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            console.warn('Failed to load save:', e);
        }
        return null;
    },

    // Save to localStorage (+ cloud sync)
    save() {
        try {
            localStorage.setItem(this.SAVE_KEY, JSON.stringify(this.current));
            // Trigger debounced cloud save
            if (typeof Auth !== 'undefined' && Auth.scheduleSave) {
                Auth.scheduleSave();
            }
        } catch (e) {
            console.warn('Failed to save:', e);
        }
    },

    // Migrate old saves to new version
    migrate(save) {
        if (!save.version) save.version = 1;
        // v1 → v2: real-time date system
        if (save.date && typeof save.date === 'object') {
            // Old save had date: {day, month, year, totalDays, weekDay}
            save.startDate = new Date().toISOString().slice(0, 10);
            save.totalDaysProcessed = save.date.totalDays || 0;
            save.lastProcessedDate = save.startDate;
            delete save.date;
            delete save.speed;
            delete save.paused;
        }
        if (!save.startDate) {
            save.startDate = new Date().toISOString().slice(0, 10);
        }
        if (save.totalDaysProcessed === undefined) {
            save.totalDaysProcessed = 0;
        }
        if (!save.wars) {
            save.wars = { activeCampaigns: [], totalConquered: 0 };
        }
        if (!save.stats.provincesConquered) save.stats.provincesConquered = 0;
        if (!save.stats.campaignsWon) save.stats.campaignsWon = 0;
        if (!save.userData) {
            save.userData = {
                focusBranches: [],
                techCategories: [],
                events: [],
                decisionCategories: [],
                spirits: [],
                divisionTemplates: [],
                productionItems: [],
                constructionItems: [],
                warCampaigns: []
            };
        }
        // New features migration
        if (save.xp === undefined) save.xp = 0;
        if (save.level === undefined) save.level = 1;
        if (save.totalXpEarned === undefined) save.totalXpEarned = 0;
        if (!save.achievements) save.achievements = [];
        if (!save.dailyObjectives) save.dailyObjectives = [];
        if (!save.journal) save.journal = [];
        if (!save.pomodoro) save.pomodoro = { active: false, type: 'work', startedAt: null, duration: 25*60, completedToday: 0, totalCompleted: 0, linkedItem: null };
        if (save.pomodoro && save.pomodoro.linkedItem === undefined) save.pomodoro.linkedItem = null;
        if (!save.challenges) save.challenges = [];
        if (!save.weeklyProgress) save.weeklyProgress = { startDay: 0, focusesCompleted: 0, techsCompleted: 0, decisionsExecuted: 0, pomodorosCompleted: 0, xpEarned: 0, objectivesCompleted: 0, journalEntries: 0, daysActive: 0 };
        if (!save.weeklyReports) save.weeklyReports = [];
        if (!save.stats.bestStreak) save.stats.bestStreak = 0;
        if (!save.stats.totalPomodoros) save.stats.totalPomodoros = 0;
        if (!save.stats.journalEntries) save.stats.journalEntries = 0;
        if (!save.stats.challengesCompleted) save.stats.challengesCompleted = 0;
        if (save.onboardingDone === undefined) save.onboardingDone = false;
        // New: resource history, streak, sound, notifications, undo
        if (!save.resourceHistory) save.resourceHistory = [];
        if (!save.streak) save.streak = { current: 0, best: 0, lastActiveDate: null };
        if (save.soundEnabled === undefined) save.soundEnabled = true;
        if (save.notificationsEnabled === undefined) save.notificationsEnabled = false;
        if (!save.undoStack) save.undoStack = [];
        return save;
    },

    // Reset to default
    reset() {
        this.current = this.createDefault();
        this.save();
    },

    // Export save as JSON string
    export() {
        return JSON.stringify(this.current, null, 2);
    },

    // Import save from JSON string
    import(jsonStr) {
        try {
            const data = JSON.parse(jsonStr);
            if (data && data.resources && (data.startDate || data.date)) {
                this.current = this.migrate(data);
                State.syncGameData();
                this.save();
                return true;
            }
        } catch (e) {
            console.warn('Invalid save data:', e);
        }
        return false;
    },

    // ── Resource helpers ──

    getResource(key) {
        return this.current.resources[key] || 0;
    },

    setResource(key, value) {
        const clamped = this.clampResource(key, value);
        this.current.resources[key] = clamped;
    },

    addResource(key, amount) {
        const current = this.getResource(key);
        this.setResource(key, current + amount);
    },

    clampResource(key, value) {
        const caps = {
            stability: [0, 100],
            warSupport: [0, 100],
            health: [0, 100],
            energy: [0, 200],
            socialEnergy: [0, 200],
            politicalPower: [0, 999],
            money: [-9999, 999999]
        };
        const [min, max] = caps[key] || [-Infinity, Infinity];
        return Math.max(min, Math.min(max, Math.round(value)));
    },

    // Apply a set of effects like {money: 100, health: -5, stability: 10}
    applyEffects(effects) {
        if (!effects) return;
        for (const [key, value] of Object.entries(effects)) {
            if (key === 'civFactory') {
                this.current.factories.civilian += value;
            } else if (key === 'milFactory') {
                this.current.factories.military += value;
            } else if (key === 'researchSlot') {
                this.current.researchSlots += 1;
            } else if (key === 'researchSpeed') {
                this.current.researchSpeed += value;
            } else if (key === 'spirit') {
                if (!this.current.spirits.includes(value)) {
                    this.current.spirits.push(value);
                }
            } else if (this.current.resources.hasOwnProperty(key)) {
                this.addResource(key, value);
            }
        }
    },

    // Check if player can afford costs
    canAfford(costs) {
        if (!costs) return true;
        for (const [key, value] of Object.entries(costs)) {
            if (value > 0 && this.getResource(key) < value) {
                return false;
            }
        }
        return true;
    },

    // Pay costs (deduct resources)
    payCosts(costs) {
        if (!costs) return;
        for (const [key, value] of Object.entries(costs)) {
            if (value > 0) {
                this.addResource(key, -value);
            }
        }
    },

    // ── Sync user data from state into GameData runtime ──
    syncGameData() {
        const ud = this.current.userData;
        if (!ud) return;
        GameData.focusTree.branches = ud.focusBranches || [];
        GameData.technologies.categories = ud.techCategories || [];
        GameData.events = ud.events || [];
        GameData.decisions.categories = ud.decisionCategories || [];
        GameData.defaultSpirits = ud.spirits || [];
        GameData.divisionTemplates = ud.divisionTemplates || [];
        GameData.productionItems = ud.productionItems || [];
        GameData.constructionItems = ud.constructionItems || [];
        GameData.warCampaigns = ud.warCampaigns || [];
    },

    // ── Real-time date helpers ──

    // Get today's JS Date
    getToday() {
        return new Date();
    },

    // Get start date as JS Date
    getStartDate() {
        return new Date(this.current.startDate + 'T00:00:00');
    },

    // How many days since start (day 0 = start day)
    getTotalDays() {
        const start = this.getStartDate();
        const today = this.getToday();
        const diff = today.getTime() - start.getTime();
        return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
    },

    // Format today's real date
    getDateString() {
        const today = this.getToday();
        const day = today.getDate();
        const month = GameData.months[today.getMonth()];
        const year = today.getFullYear();
        return `${day} ${month} ${year}`;
    },

    getWeekDay() {
        const dayIdx = (this.getToday().getDay() + 6) % 7; // Mon=0
        return GameData.weekDays[dayIdx];
    },

    // Get today as YYYY-MM-DD string
    getTodayString() {
        return this.getToday().toISOString().slice(0, 10);
    }
};
