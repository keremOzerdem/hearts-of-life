/* ═══════════════════════════════════════════════════════════
   HEARTS OF LIFE — Game Engine
   Core game loop: day progression, resource calculation,
   focus/research progress, event triggering
   ═══════════════════════════════════════════════════════════ */

const Engine = {

    // ═══════════════ AUTO-BALANCE SYSTEM ═══════════════
    // Keyword-based automatic effect/cost/duration calculation
    autoBalance: {
        keywords: {
            health: ['sağlık','spor','egzersiz','doktor','yürüyüş','koşu','uyku','diyet','fitness','jimnastik','yoga','beslenme','vitamin','tedavi','ilaç','fizik','vücut','antrenman','kas','kilo','zayıfla','hastane','sağlıklı','su','hidrasyon','muayene','check','tıp','kalp','nefes','bağışıklık'],
            energy: ['enerji','kahve','dinlenme','mola','uyku','istirahat','güç','tazeleme','şekerleme','uyuma','erken','sabah','uyanma','canlanma','gün','akşam','gece','uyumak','kalk','dinlen','mola'],
            stability: ['meditasyon','düzen','plan','rutin','temizlik','organize','disiplin','denge','huzur','sakin','terapi','günlük','journal','planlama','intizam','tertip','toparlama','ev','oda','derli','program','takvim','düzenli','alışkanlık','mindfulness'],
            money: ['para','gelir','iş','maaş','tasarruf','yatırım','bütçe','ekonomi','finans','kazanç','freelance','proje','müşteri','satış','ticaret','borsa','kariyer','terfi','zam','fatura','harcama','kâr','şirket','maliyet','çalışma','ofis','staj'],
            socialEnergy: ['arkadaş','sosyal','aile','toplantı','etkinlik','buluşma','parti','ilişki','network','tanışma','sohbet','eğlence','gezi','seyahat','tatil','davet','misafir','sevgili','dostluk','insanlar','telefon','arama','ziyaret','akraba'],
            politicalPower: ['liderlik','karar','yönetim','kontrol','strateji','vizyon','irade','odak','konsantrasyon','verimlilik','produktivite','hedef','öncelik','analiz','düşünce','beyin','zeka','öğrenme','okuma','kitap','kurs','eğitim','ders','sınav','araştırma','bilgi'],
            warSupport: ['motivasyon','cesaret','azim','mücadele','challenge','yarışma','rekabet','başarı','zafer','kazanma','test','deneme','meydan','engel','aşmak','güçlü','savaş','direnç','kararlılık','sebat','inat','dayan']
        },
        scales: {
            1: { days: 3,  tier: 0, primary: 3,  secondary: 1, cost: 1, cooldown: 3  },
            2: { days: 7,  tier: 0, primary: 5,  secondary: 2, cost: 2, cooldown: 5  },
            3: { days: 14, tier: 1, primary: 8,  secondary: 3, cost: 3, cooldown: 7  },
            4: { days: 21, tier: 2, primary: 12, secondary: 5, cost: 5, cooldown: 14 },
            5: { days: 30, tier: 3, primary: 18, secondary: 7, cost: 8, cooldown: 21 }
        },

        _score(text) {
            const lower = (text || '').toLocaleLowerCase('tr');
            const scores = {};
            for (const [res, kws] of Object.entries(this.keywords)) {
                scores[res] = 0;
                for (const kw of kws) {
                    if (lower.includes(kw)) scores[res]++;
                }
            }
            return Object.entries(scores)
                .filter(([_, s]) => s > 0)
                .sort((a, b) => b[1] - a[1]);
        },

        // Main calculation: returns { days, tier, effects, cost, cooldown }
        calculate(text, power) {
            const pl = Math.max(1, Math.min(5, power || 3));
            const scale = this.scales[pl];
            const scored = this._score(text);
            const effects = {};

            if (scored.length > 0) {
                effects[scored[0][0]] = scale.primary;
                for (let i = 1; i < scored.length && i <= 2; i++) {
                    effects[scored[i][0]] = scale.secondary;
                }
            } else {
                effects.stability = Math.ceil(scale.primary * 0.6);
                effects.energy = Math.ceil(scale.primary * 0.4);
            }

            const cost = {};
            const costRes = ['energy', 'money', 'politicalPower'].find(r => !effects[r]);
            if (costRes) cost[costRes] = scale.cost;

            return { days: scale.days, tier: scale.tier, effects, cost, cooldown: scale.cooldown };
        },

        // Spirit-specific: returns array of { stat, value, text }
        calculateSpirit(text, type, power) {
            const result = this.calculate(text, power || 3);
            const mul = type === 'negative' ? -1 : 1;
            const arr = [];
            for (const [stat, value] of Object.entries(result.effects)) {
                const v = value * mul;
                arr.push({ stat, value: v, text: `${UI.resourceLabel(stat)}: ${v > 0 ? '+' : ''}${v}` });
            }
            if (type === 'negative' && arr.length > 0) {
                const upRes = Object.keys(this.keywords).find(k => !result.effects[k]);
                if (upRes) {
                    const v = Math.ceil(Math.abs(arr[0].value) * 0.25);
                    arr.push({ stat: upRes, value: v, text: `${UI.resourceLabel(upRes)}: +${v}` });
                }
            }
            return arr;
        },

        // Event option auto-generation: returns array of option objects
        calculateEventOptions(text, power) {
            const pl = Math.max(1, Math.min(5, power || 3));
            const scale = this.scales[pl];
            const scored = this._score(text);
            const primary = scored.length > 0 ? scored[0][0] : 'stability';
            const secondary = scored.length > 1 ? scored[1][0] : 'energy';

            return [
                {
                    text: 'Kabul et',
                    effects: { [primary]: scale.secondary },
                    effectText: `${UI.resourceLabel(primary)}: +${scale.secondary}`
                },
                {
                    text: 'Reddet',
                    effects: { [secondary]: Math.ceil(scale.secondary * 0.5) },
                    effectText: `${UI.resourceLabel(secondary)}: +${Math.ceil(scale.secondary * 0.5)}`
                }
            ];
        },

        // Format effects as display text
        formatEffects(effects) {
            return Object.entries(effects || {})
                .map(([k, v]) => {
                    const label = UI.resourceLabel(k);
                    return `<span class="ab-tag ${v > 0 ? 'positive' : 'negative'}">${label} ${v > 0 ? '+' : ''}${v}</span>`;
                }).join(' ');
        },

        formatCost(cost) {
            return Object.entries(cost || {})
                .map(([k, v]) => {
                    const label = UI.resourceLabel(k);
                    return `<span class="ab-tag negative">${label} -${v}</span>`;
                }).join(' ');
        }
    },

    // ── Real-Time Day Processing ──

    // Check if there are unprocessed days and process them (fully automatic)
    checkAndProcessDays() {
        const s = State.current;
        const todayStr = State.getTodayString();

        // If never processed, this is first load — process day 0
        if (!s.lastProcessedDate) {
            s.lastProcessedDate = todayStr;
            this.processDay();
            State.save();
            UI.updateAll();
            return;
        }

        // If already processed today, nothing to do
        if (s.lastProcessedDate === todayStr) return;

        // Calculate missed days
        const lastDate = new Date(s.lastProcessedDate + 'T00:00:00');
        const today = new Date(todayStr + 'T00:00:00');
        const missedDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        if (missedDays <= 0) return;

        // Process each missed day (cap at 30 to prevent lag)
        const daysToProcess = Math.min(missedDays, 30);
        if (missedDays > 30) {
            UI.toast(`⚠ ${missedDays} gün uzaktaydınız! Son 30 gün işlendi.`, 'warning');
        } else if (missedDays > 1) {
            UI.toast(`📅 ${missedDays} gün uzaktaydınız, günler işleniyor...`, 'info');
        } else {
            UI.toast('☀ Yeni gün başladı!', 'info');
            this.playSound('day');
        }

        for (let i = 0; i < daysToProcess; i++) {
            this.processDay();
        }

        s.lastProcessedDate = todayStr;
        State.save();
        UI.updateAll();

        // Show reminders for incomplete areas
        this.showDailyReminders();
    },

    // Show reminders for unfilled/incomplete areas (non-blocking)
    showDailyReminders() {
        const s = State.current;
        const reminders = [];

        // No active focus
        if (!s.focus.current && GameData.focusTree.branches.length > 0) {
            const hasUncompleted = GameData.focusTree.branches.some(b =>
                b.focuses.some(f => !s.focus.completed.includes(f.id))
            );
            if (hasUncompleted) {
                reminders.push({ icon: '🎯', text: 'Aktif bir odak seçmelisin!', tab: 'focus' });
            }
        }

        // Empty research slots
        if (s.research.active.length < s.researchSlots && GameData.technologies.categories.length > 0) {
            const hasUnresearched = GameData.technologies.categories.some(c =>
                c.techs.some(t => !s.research.completed.includes(t.id) && !s.research.active.some(a => a.techId === t.id))
            );
            if (hasUnresearched) {
                reminders.push({ icon: '🔬', text: `Boş araştırma slotu var (${s.research.active.length}/${s.researchSlots})`, tab: 'research' });
            }
        }

        // Incomplete daily objectives
        const uncompletedObjs = s.dailyObjectives.filter(o => !o.completedToday);
        if (uncompletedObjs.length > 0) {
            reminders.push({ icon: '✅', text: `${uncompletedObjs.length} günlük görev tamamlanmadı!`, tab: 'dashboard' });
        }

        // No journal entry today
        const todayStr = State.getTodayString();
        const hasJournalToday = s.journal.some(j => j.date === todayStr);
        if (!hasJournalToday && s.totalDaysProcessed > 0) {
            reminders.push({ icon: '📓', text: 'Bugünün günlüğünü yazmadın!', tab: 'journal' });
        }

        if (reminders.length > 0) {
            UI.showMandatoryBlockerModal(reminders);
        }
    },

    // ═══════════════ PROCESS DAY — Main Game Tick ═══════════════
    processDay() {
        const s = State.current;

        // 1. Advance day counter
        s.totalDaysProcessed++;

        // 2. Calculate daily resource gains
        this.calculateDailyGains();

        // 3. Apply daily resources
        this.applyDailyResources();

        // 4. Progress focus
        this.progressFocus();

        // 5. Progress research
        this.progressResearch();

        // 6. Progress construction
        this.progressConstruction();

        // 7. Apply division effects
        this.applyDivisionEffects();

        // 8. Tick decision cooldowns
        this.tickCooldowns();

        // 9. Apply national spirit effects
        this.applySpiritEffects();

        // 10. Progress war campaigns
        this.progressWar();

        // 11. Check for random events
        this.checkForEvents();

        // 12. Generate alerts
        this.checkAlerts();

        // 13. Update stats
        this.updateStats();

        // 14. Award daily XP
        this.addXP(GameData.xpRewards.dayProcessed, 'Günlük');

        // 15. Check daily objectives reset
        this.tickDailyObjectives();

        // 16. Progress challenges
        this.tickChallenges();

        // 17. Check achievements
        this.checkAchievements();

        // 18. Check weekly report
        this.checkWeeklyReport();

        // 19. Track weekly progress
        s.weeklyProgress.daysActive++;

        // 20. Record resource history (for charts)
        this.recordResourceHistory();

        // 21. Update streak
        this.updateStreak();

        // 22. Record productivity score
        this.recordProductivity();

        // 23. Check weekly goals reset
        this.checkWeeklyGoalsReset();

        // 24. Save
        State.save();

        // 21. Update UI
        UI.updateAll();

        // 22. Show pending event if any
        if (s.pendingEvent) {
            UI.showEvent(s.pendingEvent);
            s.pendingEvent = null;
        }
    },

    // ── Date info helper (for weekend detection etc.) ──
    isWeekend() {
        const dayIdx = (State.getToday().getDay() + 6) % 7; // Mon=0, Sun=6
        return dayIdx >= 5;
    },

    // ── Daily Gains Calculation ──
    calculateDailyGains() {
        const s = State.current;
        const gains = {
            politicalPower: 2,
            energy: 0,
            money: 0,
            health: 0,
            socialEnergy: 0
        };

        // Base political power from ideology
        const ideology = GameData.ideologies[s.profile.ideology];
        if (ideology && ideology.bonus.politicalPower) {
            gains.politicalPower += ideology.bonus.politicalPower;
        }

        // Monthly income distributed daily (approx 30 days)
        gains.money = Math.round(s.profile.monthlyIncome / 30);

        // Energy regeneration based on health
        gains.energy = Math.round(s.resources.health / 10);

        // Social energy passive decay/regen
        gains.socialEnergy = -2; // slight daily decay

        // Health passive regen/decay based on stability
        if (s.resources.stability >= 60) {
            gains.health = 1;
        } else if (s.resources.stability < 30) {
            gains.health = -2;
        }

        // Civilian factories boost money
        gains.money += s.factories.civilian * 20;

        // Military factories boost energy restoration
        gains.energy += s.factories.military * 3;

        // Weekend bonus
        if (this.isWeekend()) {
            gains.energy += 10;
            gains.socialEnergy += 5;
            gains.stability_bonus = 2;
        }

        s.dailyGains = gains;
    },

    // ── Apply Daily Resources ──
    applyDailyResources() {
        const s = State.current;
        const g = s.dailyGains;

        State.addResource('politicalPower', g.politicalPower);
        State.addResource('energy', g.energy);
        State.addResource('money', g.money);
        State.addResource('health', g.health);
        State.addResource('socialEnergy', g.socialEnergy);

        if (g.stability_bonus) {
            State.addResource('stability', g.stability_bonus);
        }

        // Track money
        if (g.money > 0) s.stats.totalMoneyEarned += g.money;
        if (g.money < 0) s.stats.totalMoneySpent += Math.abs(g.money);
    },

    // ── Focus Progress ──
    progressFocus() {
        const s = State.current;
        if (!s.focus.current) return;

        s.focus.daysRemaining--;
        if (s.focus.daysRemaining <= 0) {
            // Complete focus
            const focusId = s.focus.current;
            s.focus.completed.push(focusId);
            s.focus.current = null;
            s.focus.daysRemaining = 0;
            s.stats.focusesCompleted++;
            s.weeklyProgress.focusesCompleted++;
            this.addXP(GameData.xpRewards.focusCompleted, 'Odak');
            this.incrementChallengeProgress('focuses');

            // Find focus data and apply effects
            const focusData = this.findFocus(focusId);
            if (focusData) {
                State.applyEffects(focusData.effects);
                UI.toast(`🎯 Odak Tamamlandı: ${focusData.name}`, 'success');
                this.playSound('success');
                this.sendNotification('Odak Tamamlandı!', focusData.name);
            }
        }
    },

    findFocus(id) {
        for (const branch of GameData.focusTree.branches) {
            for (const f of branch.focuses) {
                if (f.id === id) return f;
            }
        }
        return null;
    },

    canSelectFocus(focus) {
        const s = State.current;
        if (s.focus.current) return false;
        if (s.focus.completed.includes(focus.id)) return false;
        for (const req of focus.requires) {
            if (!s.focus.completed.includes(req)) return false;
        }
        return true;
    },

    selectFocus(focusId) {
        const focus = this.findFocus(focusId);
        if (!focus || !this.canSelectFocus(focus)) return false;
        State.current.focus.current = focusId;
        State.current.focus.daysRemaining = focus.days;
        State.save();
        UI.updateAll();
        UI.toast(`🎯 Odak Seçildi: ${focus.name} (${focus.days} gün)`, 'info');
        return true;
    },

    cancelFocus() {
        this.pushUndo('Odak iptal');
        State.current.focus.current = null;
        State.current.focus.daysRemaining = 0;
        State.save();
        UI.updateAll();
    },

    // ── Research Progress ──
    progressResearch() {
        const s = State.current;
        const speedMod = s.researchSpeed / 100;
        const toRemove = [];

        for (let i = 0; i < s.research.active.length; i++) {
            s.research.active[i].daysRemaining -= speedMod;
            if (s.research.active[i].daysRemaining <= 0) {
                const techId = s.research.active[i].techId;
                s.research.completed.push(techId);
                toRemove.push(i);
                s.stats.techsResearched++;
                s.weeklyProgress.techsCompleted++;
                this.addXP(GameData.xpRewards.techCompleted, 'Araştırma');
                this.incrementChallengeProgress('techs');

                const tech = this.findTech(techId);
                if (tech) {
                    State.applyEffects(tech.effects);
                    UI.toast(`🔬 Araştırma Tamamlandı: ${tech.name}`, 'success');
                }
            }
        }

        // Remove completed (reverse order)
        for (let i = toRemove.length - 1; i >= 0; i--) {
            s.research.active.splice(toRemove[i], 1);
        }
    },

    findTech(id) {
        for (const cat of GameData.technologies.categories) {
            for (const t of cat.techs) {
                if (t.id === id) return t;
            }
        }
        return null;
    },

    canResearchTech(tech) {
        const s = State.current;
        if (s.research.completed.includes(tech.id)) return false;
        if (s.research.active.some(a => a.techId === tech.id)) return false;
        if (s.research.active.length >= s.researchSlots) return false;
        for (const req of tech.requires) {
            if (!s.research.completed.includes(req)) return false;
        }
        return true;
    },

    startResearch(techId) {
        const tech = this.findTech(techId);
        if (!tech || !this.canResearchTech(tech)) return false;
        State.current.research.active.push({
            techId: techId,
            daysRemaining: tech.days,
            totalDays: tech.days
        });
        State.save();
        UI.updateAll();
        UI.toast(`🔬 Araştırma Başladı: ${tech.name}`, 'info');
        return true;
    },

    cancelResearch(techId) {
        const s = State.current;
        const idx = s.research.active.findIndex(a => a.techId === techId);
        if (idx >= 0) {
            s.research.active.splice(idx, 1);
            State.save();
            UI.updateAll();
        }
    },

    // ── Construction Progress ──
    progressConstruction() {
        const s = State.current;
        const toRemove = [];

        for (let i = 0; i < s.production.construction.length; i++) {
            s.production.construction[i].daysRemaining--;
            if (s.production.construction[i].daysRemaining <= 0) {
                const item = s.production.construction[i];
                toRemove.push(i);

                const data = GameData.constructionItems.find(c => c.id === item.itemId);
                if (data) {
                    if (data.type === 'civilian') {
                        s.factories.civilian++;
                        UI.toast('🏭 Sivil Fabrika Tamamlandı! (+1)', 'success');
                    } else if (data.type === 'military') {
                        s.factories.military++;
                        UI.toast('🏗 Askeri Fabrika Tamamlandı! (+1)', 'success');
                    } else if (data.type === 'infra') {
                        State.addResource('stability', 5);
                        UI.toast('🛤 Altyapı Tamamlandı! (İstikrar +5%)', 'success');
                    }
                }
            }
        }

        for (let i = toRemove.length - 1; i >= 0; i--) {
            s.production.construction.splice(toRemove[i], 1);
        }
    },

    startConstruction(itemId) {
        const item = GameData.constructionItems.find(c => c.id === itemId);
        if (!item) return false;
        State.current.production.construction.push({
            itemId: itemId,
            daysRemaining: item.days,
            totalDays: item.days
        });
        State.save();
        UI.updateAll();
        UI.toast(`🏗 İnşaat Başladı: ${item.name}`, 'info');
        return true;
    },

    // ── Division Effects ──
    applyDivisionEffects() {
        const s = State.current;
        for (const div of s.divisions) {
            if (div.active) {
                State.applyEffects(div.effects);
            }
        }
    },

    addDivision(templateId, customName) {
        const template = GameData.divisionTemplates.find(t => t.id === templateId);
        if (!template) return false;
        const div = {
            id: 'div_' + Date.now(),
            templateId: templateId,
            name: customName || template.name,
            type: template.type,
            icon: template.icon,
            battalions: [...template.battalions],
            effects: { ...template.effects },
            active: true
        };
        State.current.divisions.push(div);
        State.save();
        UI.updateAll();
        UI.toast(`🎖 Tümen Oluşturuldu: ${div.name}`, 'success');
        return true;
    },

    removeDivision(divId) {
        const s = State.current;
        const idx = s.divisions.findIndex(d => d.id === divId);
        if (idx >= 0) {
            s.divisions.splice(idx, 1);
            State.save();
            UI.updateAll();
        }
    },

    toggleDivision(divId) {
        const div = State.current.divisions.find(d => d.id === divId);
        if (div) {
            div.active = !div.active;
            State.save();
            UI.updateAll();
        }
    },

    // ── Decisions ──
    tickCooldowns() {
        const cd = State.current.decisionCooldowns;
        for (const key of Object.keys(cd)) {
            cd[key]--;
            if (cd[key] <= 0) delete cd[key];
        }
    },

    canExecuteDecision(decision) {
        const s = State.current;
        if (s.decisionCooldowns[decision.id]) return false;
        if (!State.canAfford(decision.cost)) return false;
        if (decision.conditions) {
            if (decision.conditions.minStability && s.resources.stability < decision.conditions.minStability) return false;
            if (decision.conditions.minWarSupport && s.resources.warSupport < decision.conditions.minWarSupport) return false;
        }
        return true;
    },

    executeDecision(decisionId) {
        let decision = null;
        for (const cat of GameData.decisions.categories) {
            decision = cat.decisions.find(d => d.id === decisionId);
            if (decision) break;
        }
        if (!decision || !this.canExecuteDecision(decision)) return false;

        this.pushUndo('Karar: ' + decision.name);

        State.payCosts(decision.cost);
        State.applyEffects(decision.effects);
        State.current.decisionCooldowns[decision.id] = decision.cooldown;
        State.current.stats.decisionsExecuted++;
        State.current.weeklyProgress.decisionsExecuted++;
        this.addXP(GameData.xpRewards.decisionExecuted, 'Karar');
        this.incrementChallengeProgress('decisions');
        State.save();
        UI.updateAll();
        UI.toast(`📜 Karar Uygulandı: ${decision.name}`, 'success');
        return true;
    },

    // ── Diplomacy ──
    addRelation(name, avatar, type) {
        const rel = {
            id: 'rel_' + Date.now(),
            name: name,
            avatar: avatar || '👤',
            relation: type || 'Arkadaş',
            opinion: 50,
            type: type
        };
        State.current.diplomacy.push(rel);
        State.save();
        UI.updateAll();
        return true;
    },

    removeRelation(relId) {
        const idx = State.current.diplomacy.findIndex(r => r.id === relId);
        if (idx >= 0) {
            State.current.diplomacy.splice(idx, 1);
            State.save();
            UI.updateAll();
        }
    },

    improveRelation(relId) {
        const rel = State.current.diplomacy.find(r => r.id === relId);
        if (rel && State.getResource('socialEnergy') >= 10) {
            State.addResource('socialEnergy', -10);
            rel.opinion = Math.min(100, rel.opinion + 10);
            State.save();
            UI.updateAll();
            UI.toast(`💞 ${rel.name} ile ilişki iyileşti!`, 'success');
        }
    },

    // ── Spirits ──
    addSpirit(spiritId) {
        if (!State.current.spirits.includes(spiritId)) {
            State.current.spirits.push(spiritId);
            State.save();
            UI.updateAll();
        }
    },

    removeSpirit(spiritId) {
        const idx = State.current.spirits.indexOf(spiritId);
        if (idx >= 0) {
            State.current.spirits.splice(idx, 1);
            State.save();
            UI.updateAll();
        }
    },

    applySpiritEffects() {
        // Spirit effects are factored into daily gains calculation
        // This is called separately for one-time per-day effects
    },

    getSpiritData(spiritId) {
        // Check default spirits
        let spirit = GameData.defaultSpirits.find(s => s.id === spiritId);
        if (spirit) return spirit;
        // Check focus-granted spirits
        if (GameData.spiritsFromFocuses[spiritId]) {
            return GameData.spiritsFromFocuses[spiritId];
        }
        return null;
    },

    // ── Events ──
    checkForEvents() {
        const s = State.current;
        // 25% chance per day for an event
        if (Math.random() > 0.25) return;

        // Filter eligible events
        const eligible = GameData.events.filter(e => {
            if (e.conditions.minMoney && s.resources.money < e.conditions.minMoney) return false;
            if (e.conditions.maxStability && s.resources.stability > e.conditions.maxStability) return false;
            if (e.conditions.minStability && s.resources.stability < e.conditions.minStability) return false;
            return true;
        });

        if (eligible.length === 0) return;

        // Weighted random selection
        const totalWeight = eligible.reduce((sum, e) => sum + e.weight, 0);
        let rand = Math.random() * totalWeight;
        let selected = eligible[0];
        for (const e of eligible) {
            rand -= e.weight;
            if (rand <= 0) {
                selected = e;
                break;
            }
        }

        s.pendingEvent = selected;
    },

    handleEventOption(eventId, optionIndex) {
        const event = GameData.events.find(e => e.id === eventId);
        if (!event || !event.options[optionIndex]) return;

        const option = event.options[optionIndex];
        State.applyEffects(option.effects);
        State.current.stats.eventsHandled++;
        this.addXP(GameData.xpRewards.eventHandled, 'Olay');
        State.current.eventHistory.push({
            eventId: eventId,
            optionChosen: optionIndex,
            day: State.current.totalDaysProcessed
        });
        State.save();
        UI.updateAll();
    },

    // ── Production Lines ──
    addProductionLine(itemId) {
        const item = GameData.productionItems.find(p => p.id === itemId);
        if (!item) return false;
        State.current.production.lines.push({
            itemId: itemId,
            factories: 1,
            active: true
        });
        State.save();
        UI.updateAll();
        UI.toast(`⚙ Üretim Hattı Eklendi: ${item.name}`, 'info');
        return true;
    },

    removeProductionLine(index) {
        State.current.production.lines.splice(index, 1);
        State.save();
        UI.updateAll();
    },

    // ── Alerts ──
    checkAlerts() {
        const s = State.current;
        const alerts = [];
        const todayStr = State.getTodayString();

        // ── Kritik Kaynak Uyarıları ──
        if (s.resources.health < 30) alerts.push({ icon: '❤', text: 'Sağlık kritik seviyede!', type: 'danger', tab: 'dashboard' });
        if (s.resources.stability < 20) alerts.push({ icon: '⚖', text: 'İstikrar çok düşük!', type: 'danger', tab: 'dashboard' });
        if (s.resources.energy < 10) alerts.push({ icon: '⚡', text: 'Enerji tükeniyor!', type: 'warning', tab: 'dashboard' });
        if (s.resources.money < 0) alerts.push({ icon: '💰', text: 'Bütçe açığı!', type: 'danger', tab: 'settings' });
        if (s.resources.socialEnergy < 10) alerts.push({ icon: '🤝', text: 'Sosyal enerji düşük', type: 'warning', tab: 'diplomacy' });

        // ── Boş/Eksik Alan Yönlendirmeleri ──
        if (!s.focus.current) {
            if (GameData.focusTree.branches.length === 0) {
                alerts.push({ icon: '🎯', text: 'Odak dalı oluştur!', type: 'action', tab: 'focus' });
            } else {
                alerts.push({ icon: '🎯', text: 'Odak seçilmedi — hemen seç!', type: 'action', tab: 'focus' });
            }
        }

        if (s.research.active.length < s.researchSlots) {
            if (GameData.technologies.categories.length === 0) {
                alerts.push({ icon: '🔬', text: 'Araştırma kategorisi oluştur!', type: 'action', tab: 'research' });
            } else {
                alerts.push({ icon: '🔬', text: `Boş araştırma slotu — doldur! (${s.research.active.length}/${s.researchSlots})`, type: 'action', tab: 'research' });
            }
        }

        if (s.divisions.length === 0) {
            if (GameData.divisionTemplates.length === 0) {
                alerts.push({ icon: '🎖', text: 'Tümen şablonu oluştur!', type: 'action', tab: 'military' });
            } else {
                alerts.push({ icon: '🎖', text: 'Hiç tümen yok — oluştur!', type: 'action', tab: 'military' });
            }
        }

        if (s.production.lines.length === 0) {
            if (GameData.productionItems.length === 0) {
                alerts.push({ icon: '⚙', text: 'Üretim öğesi tanımla!', type: 'action', tab: 'production' });
            } else {
                alerts.push({ icon: '⚙', text: 'Üretim hattı yok — ekle!', type: 'action', tab: 'production' });
            }
        }

        // ── Günlük Görevler ──
        if (s.dailyObjectives.length === 0) {
            alerts.push({ icon: '✅', text: 'Günlük görev ekle!', type: 'action', tab: 'dashboard' });
        } else {
            const uncompleted = s.dailyObjectives.filter(o => !o.completedToday);
            if (uncompleted.length > 0) {
                alerts.push({ icon: '✅', text: `${uncompleted.length} günlük görev bekliyor!`, type: 'warning', tab: 'dashboard' });
            }
        }

        // ── Günlük ──
        const hasJournal = s.journal.some(j => j.date === todayStr);
        if (!hasJournal) {
            alerts.push({ icon: '📓', text: 'Bugünün günlüğünü yaz!', type: 'action', tab: 'journal' });
        }

        // ── Pomodoro ──
        if (s.pomodoro.completedToday === 0 && !s.pomodoro.active) {
            alerts.push({ icon: '🍅', text: 'Bugün henüz pomodoro yapmadın!', type: 'info', tab: 'dashboard' });
        }

        // ── Meydan Okumalar ──
        const activeChallenges = s.challenges.filter(c => !c.completed && !c.failed);
        if (activeChallenges.length === 0) {
            alerts.push({ icon: '🏋', text: 'Meydan okuma oluştur!', type: 'info', tab: 'achievements' });
        } else {
            const expiring = activeChallenges.filter(c => {
                const daysLeft = c.deadlineDays - (s.totalDaysProcessed - c.startDay);
                return daysLeft <= 2 && daysLeft > 0;
            });
            if (expiring.length > 0) {
                alerts.push({ icon: '⏰', text: `${expiring.length} meydan okuma bitmek üzere!`, type: 'warning', tab: 'achievements' });
            }
        }

        // ── Savaş ──
        if (s.wars && s.wars.activeCampaigns.length > 0) {
            const noDivCamps = s.wars.activeCampaigns.filter(c => c.assignedDivisions.length === 0);
            if (noDivCamps.length > 0) {
                alerts.push({ icon: '⚔', text: `${noDivCamps.length} sefere tümen ata!`, type: 'warning', tab: 'war' });
            }
            const noTarget = s.wars.activeCampaigns.filter(c => !c.currentTarget && c.assignedDivisions.length > 0);
            if (noTarget.length > 0) {
                alerts.push({ icon: '⚔', text: `${noTarget.length} seferde hedef seç!`, type: 'warning', tab: 'war' });
            }
        }

        // ── Diplomasi ──
        if (s.diplomacy.length === 0) {
            alerts.push({ icon: '🤝', text: 'Diplomasi ağına kişi ekle!', type: 'info', tab: 'diplomacy' });
        }

        // ── Ruhlar ──
        if (s.spirits.length === 0 && GameData.defaultSpirits.length > 0) {
            alerts.push({ icon: '✨', text: 'Ulusal ruh ekle!', type: 'info', tab: 'spirits' });
        }

        s.alerts = alerts;
    },

    // ── Stats ──
    updateStats() {
        const s = State.current;
        s.stats.daysPlayed = s.totalDaysProcessed;
        if (s.resources.stability > s.stats.bestStability) s.stats.bestStability = s.resources.stability;
        if (s.resources.health > s.stats.bestHealth) s.stats.bestHealth = s.resources.health;
    },

    // ═══════════════ WAR / CAMPAIGNS ═══════════════

    // Calculate total attack power from assigned divisions
    getAttackPower(campaign) {
        let power = 0;
        const s = State.current;
        for (const divId of (campaign.assignedDivisions || [])) {
            const div = s.divisions.find(d => d.id === divId);
            if (div && div.active) {
                // Each battalion adds 2 power, active division base = 5
                power += 5 + (div.battalions ? div.battalions.length * 2 : 0);
            }
        }
        // Bonus from campaign's attack resource
        const campData = GameData.warCampaigns.find(c => c.id === campaign.campaignId);
        if (campData && campData.attackBonus) {
            const res = s.resources[campData.attackBonus] || 0;
            power += Math.floor(res / 20); // Every 20 of the resource = +1 attack
        }
        // Terrain modifier
        if (campData) {
            const tMod = GameData.terrainMods[campData.terrain] || { mod: 1 };
            power = Math.floor(power * tMod.mod);
        }
        return Math.max(1, power);
    },

    // Progress all active war campaigns
    progressWar() {
        const s = State.current;
        if (!s.wars || !s.wars.activeCampaigns) return;

        for (const camp of s.wars.activeCampaigns) {
            if (!camp.currentTarget) continue;
            if (camp.assignedDivisions.length === 0) continue;

            const campData = GameData.warCampaigns.find(c => c.id === camp.campaignId);
            if (!campData) continue;

            const province = campData.provinces.find(p => p.id === camp.currentTarget);
            if (!province) continue;

            // Calculate daily attack progress
            const attack = this.getAttackPower(camp);
            camp.battleProgress += attack;

            // Check if province is conquered
            if (camp.battleProgress >= province.defense) {
                camp.conquered.push(province.id);
                camp.currentTarget = null;
                camp.battleProgress = 0;
                s.wars.totalConquered++;
                s.stats.provincesConquered++;
                this.addXP(GameData.xpRewards.provinceConquered, 'Fetih');
                this.incrementChallengeProgress('provinces');

                // Apply province reward
                if (province.reward) {
                    const effects = { ...province.reward };
                    const spiritId = effects.spirit;
                    delete effects.spirit;
                    State.applyEffects(effects);
                    if (spiritId) {
                        this.addSpirit(spiritId);
                    }
                }

                UI.toast(`⚔ Bölge Fethedildi: ${province.name}!`, 'success');

                // Check if campaign is won (capital conquered)
                const capital = campData.provinces.find(p => p.type === 'capital');
                if (capital && camp.conquered.includes(capital.id)) {
                    s.stats.campaignsWon++;
                    this.addXP(GameData.xpRewards.campaignWon, 'Sefer');
                    UI.toast(`🏆 SEFER KAZANILDI: ${campData.name}!`, 'success');
                }
            }
        }
    },

    // Start a new campaign
    startCampaign(campaignId) {
        const s = State.current;
        if (!s.wars) s.wars = { activeCampaigns: [], totalConquered: 0 };
        
        // Check if already active
        if (s.wars.activeCampaigns.some(c => c.campaignId === campaignId)) {
            UI.toast('Bu sefer zaten aktif!', 'warning');
            return false;
        }

        const campData = GameData.warCampaigns.find(c => c.id === campaignId);
        if (!campData) return false;

        // Cost to start: 20 political power, 10 war support
        if (s.resources.politicalPower < 20 || s.resources.warSupport < 10) {
            UI.toast('Yetersiz kaynak! (20 İrade + 10 Motivasyon)', 'warning');
            return false;
        }
        State.addResource('politicalPower', -20);
        State.addResource('warSupport', -10);

        s.wars.activeCampaigns.push({
            campaignId: campaignId,
            conquered: [],
            assignedDivisions: [],
            currentTarget: null,
            battleProgress: 0,
            started: s.totalDaysProcessed
        });

        State.save();
        UI.updateAll();
        UI.toast(`⚔ Sefer Başladı: ${campData.name}`, 'success');
        return true;
    },

    // Assign a division to a campaign front
    assignDivisionToCampaign(campaignId, divId) {
        const s = State.current;
        const camp = s.wars.activeCampaigns.find(c => c.campaignId === campaignId);
        if (!camp) return false;

        // Remove from other campaigns first
        for (const c of s.wars.activeCampaigns) {
            const idx = c.assignedDivisions.indexOf(divId);
            if (idx >= 0) c.assignedDivisions.splice(idx, 1);
        }

        camp.assignedDivisions.push(divId);
        State.save();
        UI.updateAll();
        return true;
    },

    // Unassign a division from a campaign
    unassignDivisionFromCampaign(campaignId, divId) {
        const s = State.current;
        const camp = s.wars.activeCampaigns.find(c => c.campaignId === campaignId);
        if (!camp) return false;
        const idx = camp.assignedDivisions.indexOf(divId);
        if (idx >= 0) camp.assignedDivisions.splice(idx, 1);
        State.save();
        UI.updateAll();
        return true;
    },

    // Set attack target province
    attackProvince(campaignId, provinceId) {
        const s = State.current;
        const camp = s.wars.activeCampaigns.find(c => c.campaignId === campaignId);
        if (!camp) return false;

        const campData = GameData.warCampaigns.find(c => c.id === campaignId);
        if (!campData) return false;

        // Check if province exists and is not conquered
        const province = campData.provinces.find(p => p.id === provinceId);
        if (!province || camp.conquered.includes(provinceId)) return false;

        // Check if province is reachable (adjacent to conquered or is first province)
        if (!this.isProvinceReachable(campData, camp, provinceId)) {
            UI.toast('Bu bölgeye henüz ulaşılamaz! Önce komşu bölgeleri fethedin.', 'warning');
            return false;
        }

        // Check for assigned divisions
        if (camp.assignedDivisions.length === 0) {
            UI.toast('Saldırı için cepheye tümen atayın!', 'warning');
            return false;
        }

        camp.currentTarget = provinceId;
        camp.battleProgress = 0;
        State.save();
        UI.updateAll();
        UI.toast(`⚔ Saldırı: ${province.name} (Savunma: ${province.defense})`, 'info');
        return true;
    },

    // Check if a province is reachable (adjacent to conquered or starting province)
    isProvinceReachable(campData, camp, provinceId) {
        const province = campData.provinces.find(p => p.id === provinceId);
        if (!province) return false;

        // If nothing conquered, only col=0 provinces are reachable
        if (camp.conquered.length === 0) {
            return province.col === 0;
        }

        // A province is reachable if adjacent (within 1 row and 1 col) to any conquered province
        for (const cid of camp.conquered) {
            const cp = campData.provinces.find(p => p.id === cid);
            if (!cp) continue;
            const rowDiff = Math.abs(province.row - cp.row);
            const colDiff = Math.abs(province.col - cp.col);
            if (rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0)) {
                return true;
            }
        }
        return false;
    },

    // Cancel a campaign
    cancelCampaign(campaignId) {
        const s = State.current;
        const idx = s.wars.activeCampaigns.findIndex(c => c.campaignId === campaignId);
        if (idx >= 0) {
            s.wars.activeCampaigns.splice(idx, 1);
            State.save();
            UI.updateAll();
            UI.toast('Sefer iptal edildi', 'info');
        }
    },

    // ═══════════════ XP & LEVEL SYSTEM ═══════════════

    addXP(amount, source) {
        if (!amount || amount <= 0) return;
        const s = State.current;
        s.xp += amount;
        s.totalXpEarned += amount;
        s.weeklyProgress.xpEarned += amount;

        // Check level up
        const oldLevel = s.level;
        for (let i = GameData.levels.length - 1; i >= 0; i--) {
            if (s.totalXpEarned >= GameData.levels[i].xpNeeded) {
                s.level = GameData.levels[i].level;
                break;
            }
        }
        if (s.level > oldLevel) {
            const lvl = GameData.levels.find(l => l.level === s.level);
            UI.toast(`⭐ SEVİYE ATLADIN! Lv.${s.level} — ${lvl.title}`, 'success');
            this.playSound('levelup');
            this.sendNotification('Seviye Atladın!', `Lv.${s.level} — ${lvl.title}`);
        }
    },

    getLevelInfo() {
        const s = State.current;
        const current = GameData.levels.find(l => l.level === s.level) || GameData.levels[0];
        const next = GameData.levels.find(l => l.level === s.level + 1);
        const xpForCurrent = current.xpNeeded;
        const xpForNext = next ? next.xpNeeded : current.xpNeeded;
        const xpInLevel = s.totalXpEarned - xpForCurrent;
        const xpNeeded = xpForNext - xpForCurrent;
        const pct = next ? Math.min(100, Math.round((xpInLevel / xpNeeded) * 100)) : 100;
        return { level: s.level, title: current.title, xp: s.totalXpEarned, xpInLevel, xpNeeded, pct, isMax: !next };
    },

    // ═══════════════ ACHIEVEMENTS ═══════════════

    checkAchievements() {
        const s = State.current;
        for (const ach of GameData.achievements) {
            if (s.achievements.some(a => a.id === ach.id)) continue;

            let value = 0;
            if (ach.check === 'level') {
                value = s.level;
            } else if (ach.check === 'bestStreak') {
                value = s.stats.bestStreak;
            } else if (ach.check === 'totalPomodoros') {
                value = s.stats.totalPomodoros;
            } else if (ach.check === 'journalEntries') {
                value = s.stats.journalEntries;
            } else if (ach.check === 'challengesCompleted') {
                value = s.stats.challengesCompleted;
            } else if (s.stats[ach.check] !== undefined) {
                value = s.stats[ach.check];
            }

            if (value >= ach.target) {
                s.achievements.push({ id: ach.id, unlockedDay: s.totalDaysProcessed });
                this.addXP(GameData.xpRewards.achievementUnlocked, 'Başarım');
                UI.toast(`🏆 Başarım Açıldı: ${ach.icon} ${ach.name}`, 'success');
            }
        }
    },

    // ═══════════════ DAILY OBJECTIVES ═══════════════

    addDailyObjective(name, icon) {
        const obj = {
            id: 'obj_' + Date.now(),
            name: name,
            icon: icon || '✅',
            streakCurrent: 0,
            streakBest: 0,
            lastCompletedDate: null,
            completedToday: false
        };
        State.current.dailyObjectives.push(obj);
        State.save();
        UI.updateAll();
        return obj;
    },

    removeDailyObjective(objId) {
        const idx = State.current.dailyObjectives.findIndex(o => o.id === objId);
        if (idx >= 0) {
            State.current.dailyObjectives.splice(idx, 1);
            State.save();
            UI.updateAll();
        }
    },

    completeDailyObjective(objId) {
        const s = State.current;
        const obj = s.dailyObjectives.find(o => o.id === objId);
        if (!obj || obj.completedToday) return;

        const todayStr = State.getTodayString();
        obj.completedToday = true;
        obj.lastCompletedDate = todayStr;

        // Update streak
        obj.streakCurrent++;
        if (obj.streakCurrent > obj.streakBest) {
            obj.streakBest = obj.streakCurrent;
        }
        if (obj.streakBest > s.stats.bestStreak) {
            s.stats.bestStreak = obj.streakBest;
        }

        // XP reward
        this.addXP(GameData.xpRewards.dailyObjectiveCompleted, 'Günlük Görev');
        s.weeklyProgress.objectivesCompleted++;

        State.save();
        UI.updateAll();
        UI.toast(`✅ ${obj.name} tamamlandı! (Seri: ${obj.streakCurrent} 🔥)`, 'success');
    },

    tickDailyObjectives() {
        const s = State.current;
        const todayStr = State.getTodayString();

        for (const obj of s.dailyObjectives) {
            if (obj.completedToday && obj.lastCompletedDate === todayStr) continue;

            // If yesterday wasn't completed, break streak
            if (obj.lastCompletedDate) {
                const last = new Date(obj.lastCompletedDate + 'T00:00:00');
                const today = new Date(todayStr + 'T00:00:00');
                const diff = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
                if (diff > 1) {
                    obj.streakCurrent = 0;
                }
            }
            obj.completedToday = false;
        }
    },

    // ═══════════════ JOURNAL ═══════════════

    addJournalEntry(text, mood) {
        const s = State.current;
        const todayStr = State.getTodayString();

        // Check if already wrote today
        const existing = s.journal.findIndex(j => j.date === todayStr);
        if (existing >= 0) {
            s.journal[existing].text = text;
            s.journal[existing].mood = mood;
        } else {
            s.journal.push({ date: todayStr, text: text, mood: mood, day: s.totalDaysProcessed });
            s.stats.journalEntries++;
            s.weeklyProgress.journalEntries++;
            this.addXP(GameData.xpRewards.journalEntry, 'Günlük');
        }

        State.save();
        UI.updateAll();
        UI.toast('📓 Günlük kaydedildi!', 'success');
    },

    // ═══════════════ POMODORO ═══════════════

    startPomodoro(type, linkedItem) {
        const s = State.current;
        const cfg = GameData.pomodoroConfig;
        let duration;

        if (type === 'work') {
            duration = cfg.workDuration;
        } else if (type === 'longBreak') {
            duration = cfg.longBreak;
        } else {
            duration = cfg.shortBreak;
        }

        s.pomodoro.active = true;
        s.pomodoro.type = type || 'work';
        s.pomodoro.startedAt = new Date().toISOString();
        s.pomodoro.duration = duration;
        s.pomodoro.linkedItem = linkedItem || null;
        State.save();
    },

    stopPomodoro() {
        const s = State.current;
        s.pomodoro.active = false;
        s.pomodoro.startedAt = null;
        s.pomodoro.linkedItem = null;
        State.save();
    },

    completePomodoro() {
        const s = State.current;
        if (s.pomodoro.type === 'work') {
            s.pomodoro.completedToday++;
            s.pomodoro.totalCompleted++;
            s.stats.totalPomodoros++;
            s.weeklyProgress.pomodorosCompleted++;
            this.addXP(GameData.xpRewards.pomodoroCompleted, 'Pomodoro');

            // Game rewards for completing a pomodoro
            State.addResource('energy', 5);
            State.addResource('stability', 1);

            // Increment challenge progress
            this.incrementChallengeProgress('pomodoros');

            // Bonus progress for linked item
            const linked = s.pomodoro.linkedItem;
            if (linked) {
                if (linked.type === 'focus' && s.focus.current === linked.id) {
                    // Extra focus progress: reduce 1 day
                    if (s.focus.daysRemaining > 1) {
                        s.focus.daysRemaining--;
                        UI.toast(`🍅🎯 Pomodoro tamamlandı! "${linked.name}" odağına +1 gün ilerleme!`, 'success');
                    } else {
                        UI.toast(`🍅 Pomodoro tamamlandı! (+${GameData.xpRewards.pomodoroCompleted} XP)`, 'success');
                    }
                } else if (linked.type === 'research') {
                    // Extra research progress
                    const activeRes = s.research.active.find(r => r.techId === linked.id);
                    if (activeRes && activeRes.daysRemaining > 1) {
                        activeRes.daysRemaining--;
                        UI.toast(`🍅🔬 Pomodoro tamamlandı! "${linked.name}" araştırmasına +1 gün ilerleme!`, 'success');
                    } else {
                        UI.toast(`🍅 Pomodoro tamamlandı! (+${GameData.xpRewards.pomodoroCompleted} XP)`, 'success');
                    }
                } else if (linked.type === 'challenge') {
                    this.incrementManualChallenge(linked.id);
                    UI.toast(`🍅🏋 Pomodoro tamamlandı! "${linked.name}" challenge ilerletildi!`, 'success');
                } else if (linked.type === 'objective') {
                    const obj = s.dailyObjectives.find(o => o.id === linked.id && !o.completedToday);
                    if (obj) {
                        this.completeDailyObjective(linked.id);
                        UI.toast(`🍅✅ Pomodoro tamamlandı! "${linked.name}" görevi tamamlandı!`, 'success');
                    } else {
                        UI.toast(`🍅 Pomodoro tamamlandı! (+${GameData.xpRewards.pomodoroCompleted} XP)`, 'success');
                    }
                } else {
                    UI.toast(`🍅 Pomodoro tamamlandı! (+${GameData.xpRewards.pomodoroCompleted} XP)`, 'success');
                }
            } else {
                UI.toast(`🍅 Pomodoro tamamlandı! (+${GameData.xpRewards.pomodoroCompleted} XP)`, 'success');
            }
        } else {
            UI.toast('☕ Mola bitti! Çalışmaya hazır mısın?', 'info');
        }
        s.pomodoro.active = false;
        s.pomodoro.startedAt = null;
        s.pomodoro.linkedItem = null;
        this.playSound('notification');
        this.sendNotification('🍅 Pomodoro Tamamlandı!', s.pomodoro.type === 'work' ? 'Çalışma süresi bitti. Tebrikler!' : 'Mola bitti. Çalışmaya devam!');
        State.save();
        UI.updateAll();
    },

    getPomodoroRemaining() {
        const s = State.current;
        if (!s.pomodoro.active || !s.pomodoro.startedAt) return 0;
        const started = new Date(s.pomodoro.startedAt).getTime();
        const now = Date.now();
        const elapsed = Math.floor((now - started) / 1000);
        return Math.max(0, s.pomodoro.duration - elapsed);
    },

    // ═══════════════ CHALLENGES ═══════════════

    addChallenge(name, desc, icon, type, target, deadlineDays, reward) {
        const s = State.current;
        const ch = {
            id: 'ch_' + Date.now(),
            name: name,
            desc: desc || '',
            icon: icon || '🏋',
            type: type || 'manual',
            target: target || 1,
            current: 0,
            startDay: s.totalDaysProcessed,
            deadlineDays: deadlineDays || 7,
            reward: reward || {},
            completed: false,
            failed: false
        };
        s.challenges.push(ch);
        State.save();
        UI.updateAll();
        UI.toast(`🏋 Meydan Okuma Başladı: ${name}`, 'info');
        return ch;
    },

    removeChallenge(chId) {
        const idx = State.current.challenges.findIndex(c => c.id === chId);
        if (idx >= 0) {
            State.current.challenges.splice(idx, 1);
            State.save();
            UI.updateAll();
        }
    },

    incrementChallengeProgress(type, amount) {
        const s = State.current;
        for (const ch of s.challenges) {
            if (ch.completed || ch.failed) continue;
            if (ch.type === type) {
                ch.current += (amount || 1);
                if (ch.current >= ch.target) {
                    this.completeChallenge(ch);
                }
            }
        }
    },

    incrementManualChallenge(chId) {
        const s = State.current;
        const ch = s.challenges.find(c => c.id === chId);
        if (!ch || ch.completed || ch.failed) return;
        ch.current++;
        if (ch.current >= ch.target) {
            this.completeChallenge(ch);
        }
        State.save();
        UI.updateAll();
    },

    completeChallenge(ch) {
        ch.completed = true;
        const s = State.current;
        s.stats.challengesCompleted++;
        s.weeklyProgress.objectivesCompleted++;

        // Apply rewards
        if (ch.reward) {
            if (ch.reward.xp) {
                this.addXP(ch.reward.xp, 'Meydan Okuma');
            }
            const effects = { ...ch.reward };
            delete effects.xp;
            if (Object.keys(effects).length > 0) {
                State.applyEffects(effects);
            }
        }

        this.addXP(GameData.xpRewards.challengeCompleted, 'Meydan Okuma');
        UI.toast(`🏆 Meydan Okuma Tamamlandı: ${ch.name}!`, 'success');
    },

    tickChallenges() {
        const s = State.current;
        for (const ch of s.challenges) {
            if (ch.completed || ch.failed) continue;
            // Auto-increment day-based challenges
            if (ch.type === 'days') {
                ch.current++;
                if (ch.current >= ch.target) {
                    this.completeChallenge(ch);
                }
            }
            // Check deadline
            const elapsed = s.totalDaysProcessed - ch.startDay;
            if (elapsed > ch.deadlineDays && !ch.completed) {
                ch.failed = true;
                UI.toast(`❌ Meydan Okuma Başarısız: ${ch.name}`, 'warning');
            }
        }
    },

    // ═══════════════ WEEKLY REPORT ═══════════════

    checkWeeklyReport() {
        const s = State.current;
        if (s.totalDaysProcessed > 0 && s.totalDaysProcessed % 7 === 0) {
            this.generateWeeklyReport();
        }
    },

    generateWeeklyReport() {
        const s = State.current;
        const wp = s.weeklyProgress;
        const weekNum = Math.floor(s.totalDaysProcessed / 7);

        // Calculate grade
        let score = 0;
        score += wp.daysActive * 3;
        score += wp.focusesCompleted * 15;
        score += wp.techsCompleted * 10;
        score += wp.decisionsExecuted * 5;
        score += wp.pomodorosCompleted * 4;
        score += wp.objectivesCompleted * 3;
        score += wp.journalEntries * 2;

        let grade = 'F';
        if (score >= 100) grade = 'S';
        else if (score >= 80) grade = 'A';
        else if (score >= 60) grade = 'B';
        else if (score >= 40) grade = 'C';
        else if (score >= 20) grade = 'D';

        const report = {
            weekNumber: weekNum,
            startDay: wp.startDay,
            endDay: s.totalDaysProcessed,
            date: State.getTodayString(),
            ...wp,
            score: score,
            grade: grade
        };

        s.weeklyReports.push(report);

        // Reset weekly progress
        s.weeklyProgress = {
            startDay: s.totalDaysProcessed,
            focusesCompleted: 0,
            techsCompleted: 0,
            decisionsExecuted: 0,
            pomodorosCompleted: 0,
            xpEarned: 0,
            objectivesCompleted: 0,
            journalEntries: 0,
            daysActive: 0
        };

        UI.toast(`📊 Haftalık Rapor #${weekNum} — Not: ${grade}`, 'info');
    },

    // ═══════════════ AI GENERAL — STRATEGIC ADVISOR ═══════════════

    getAdvisorBriefing() {
        const s = State.current;
        const advices = [];
        const todayStr = State.getTodayString();

        // ── ACIL DURUMLAR (Öncelik 1) ──
        if (s.resources.health < 20) {
            advices.push({ priority: 1, icon: '🚨', category: 'Acil', title: 'Sağlık kritik!', text: 'Komutan, sağlığın alarm veriyor. Stabiliteyi %60 üzerine çıkar ki iyileşme başlasın. Pomodoro tamamla (+1 stabilite).', action: 'dashboard' });
        }
        if (s.resources.stability < 15) {
            advices.push({ priority: 1, icon: '🚨', category: 'Acil', title: 'İstikrar çöküyor!', text: 'Stabilite %15 altında — sağlığın günde -2 düşecek. Altyapı inşa et veya stabilite artıran kararları uygula.', action: 'production' });
        }
        if (s.resources.energy < 5) {
            advices.push({ priority: 1, icon: '🚨', category: 'Acil', title: 'Enerji tükendi!', text: 'Enerjin çok düşük. Askeri fabrika ekle (+3/gün) veya sağlığını artır (enerji = sağlık/10).', action: 'production' });
        }

        // ── STRATEJİK ÖNERİLER (Öncelik 2) ──

        // Odak seçilmemiş
        if (!s.focus.current) {
            if (GameData.focusTree.branches.length === 0) {
                advices.push({ priority: 2, icon: '🎯', category: 'Strateji', title: 'Odak ağacı boş!', text: 'Komutanım, henüz bir odak dalı oluşturmadın. Hedeflerini dallar ve odaklar olarak tanımla. Her tamamlanan odak sana fabrika, kaynak ve XP kazandırır.', action: 'focus' });
            } else {
                advices.push({ priority: 2, icon: '🎯', category: 'Strateji', title: 'Odak seç!', text: 'Aktif odağın yok. Boş geçen her gün ilerleme kaybıdır. Hemen bir odak seç — pomodoro ile bağlarsan ekstra hızlanırsın.', action: 'focus' });
            }
        }

        // Araştırma slotları
        if (s.researchSlots > 0 && s.research.active.length < s.researchSlots) {
            const empty = s.researchSlots - s.research.active.length;
            if (GameData.technologies.categories.length === 0) {
                advices.push({ priority: 2, icon: '🔬', category: 'Strateji', title: 'Araştırma kategorisi oluştur!', text: `${s.researchSlots} araştırma slotun var ama teknoloji yok. Öğrenmek istediğin alanları kategoriler ve teknolojiler olarak tanımla.`, action: 'research' });
            } else {
                advices.push({ priority: 2, icon: '🔬', category: 'Strateji', title: `${empty} boş araştırma slotu!`, text: 'Boş slot = israf edilen zaman. Tüm slotları doldur. Araştırma hızını artırmak için researchSpeed efektli odak/araştırma tamamla.', action: 'research' });
            }
        }

        // Fabrika durumu
        if (s.factories.civilian === 0 && s.factories.military === 0) {
            advices.push({ priority: 2, icon: '🏭', category: 'Ekonomi', title: 'Fabrika yok!', text: 'Hiç fabrikan yok. Sivil fabrika = +20₺/gün, Askeri fabrika = +3 enerji/gün. İnşaat başlat veya efektli odak tamamla.', action: 'production' });
        } else if (s.factories.civilian < 3) {
            advices.push({ priority: 3, icon: '🏭', category: 'Ekonomi', title: 'Daha fazla sivil fabrika!', text: `Sivil fabrikan: ${s.factories.civilian}. Her biri günde +20₺ kazandırır. Ekonomini büyütmek için inşaat başlat.`, action: 'production' });
        }

        // Para durumu
        const dailyMoney = s.dailyGains.money || 0;
        if (s.resources.money < 500 && dailyMoney < 100) {
            advices.push({ priority: 2, icon: '💰', category: 'Ekonomi', title: 'Bütçe sıkıntısı', text: `Günlük gelirin ${dailyMoney}₺. Sivil fabrika inşa et (+20₺/fabrika/gün) veya ayarlardan aylık gelirini güncelle.`, action: 'settings' });
        }

        // Tümen durumu
        if (s.divisions.length === 0) {
            if (GameData.divisionTemplates.length === 0) {
                advices.push({ priority: 3, icon: '🎖', category: 'Askeri', title: 'Tümen şablonu oluştur!', text: 'Günlük rutinlerini tümen şablonları olarak tanımla. Tümenler savaşlarda ve disiplinde kullanılır.', action: 'military' });
            } else {
                advices.push({ priority: 3, icon: '🎖', category: 'Askeri', title: 'Tümen oluştur!', text: 'Şablonların var ama tümen yok. Tümenler aktif rutinlerin — onlarsız savaş açamazsın.', action: 'military' });
            }
        }

        // ── GÜNLÜK GÖREVLER (Öncelik 3) ──

        if (s.dailyObjectives.length === 0) {
            advices.push({ priority: 3, icon: '✅', category: 'Günlük', title: 'Günlük görev ekle!', text: 'Günlük görevler streak sistemiyle çalışır. Her gün tamamladıkça XP kazanırsın. Küçük, yapılabilir görevlerle başla.', action: 'dashboard' });
        } else {
            const uncompleted = s.dailyObjectives.filter(o => !o.completedToday);
            if (uncompleted.length > 0) {
                advices.push({ priority: 3, icon: '✅', category: 'Günlük', title: `${uncompleted.length} görev bekliyor`, text: `Tamamlanmamış görevler: ${uncompleted.map(o => o.name).join(', ')}. Pomodoro ile bağlayarak tamamla!`, action: 'dashboard' });
            }
        }

        // Günlük yazılmamış
        const hasJournal = s.journal.some(j => j.date === todayStr);
        if (!hasJournal) {
            advices.push({ priority: 3, icon: '📓', category: 'Günlük', title: 'Günlüğünü yaz!', text: 'Bugünün kaydını tut. Ruh halini seç ve notlarını yaz. Düzenli günlük tutmak +5 XP ve farkındalık kazandırır.', action: 'journal' });
        }

        // Pomodoro
        if (s.pomodoro.completedToday === 0 && !s.pomodoro.active) {
            advices.push({ priority: 3, icon: '🍅', category: 'Verimlilik', title: 'Pomodoro başlat!', text: 'Bugün hiç pomodoro yapmadın. Her pomodoro: +5 enerji, +1 stabilite, +15 XP. Odağına veya araştırmana bağla = ekstra ilerleme.', action: 'dashboard' });
        }

        // ── GELİŞİM ÖNERİLERİ (Öncelik 4) ──

        // Challenge yoksa
        const activeChallenges = s.challenges.filter(c => !c.completed && !c.failed);
        if (activeChallenges.length === 0) {
            advices.push({ priority: 4, icon: '🏋', category: 'Gelişim', title: 'Meydan okuma oluştur!', text: 'Kendine haftalık hedefler koy. Challenge tamamlamak +40 XP kazandırır.', action: 'achievements' });
        }

        // Diplomasi boş
        if (s.diplomacy.length === 0) {
            advices.push({ priority: 4, icon: '🤝', category: 'Sosyal', title: 'Diplomasi ağını kur!', text: 'Sosyal enerji sürekli düşer (-2/gün). Kişiler ekleyip ilişkileri yönet.', action: 'diplomacy' });
        }

        // Savaş önerisi
        if (s.wars && s.wars.activeCampaigns.length === 0 && GameData.warCampaigns.length > 0 && s.divisions.length > 0) {
            advices.push({ priority: 4, icon: '⚔', category: 'Askeri', title: 'Sefer başlat!', text: 'Tümenlerin hazır, savaş açabilirsin. Bölge fethi +25 XP, sefer kazanma +100 XP. Maliyet: 20 İrade + 10 Motivasyon.', action: 'war' });
        }

        // Ruh önerisi
        if (s.spirits.length === 0) {
            advices.push({ priority: 4, icon: '✨', category: 'Karakter', title: 'Ulusal ruh ekle!', text: 'Kişisel özelliklerini ruhlar olarak tanımla. Pasif bonuslar sağlarlar.', action: 'spirits' });
        }

        // ── STRATEJİK ANALİZ (her zaman) ──
        const lvl = this.getLevelInfo();
        const focusDone = s.stats.focusesCompleted || 0;
        const techDone = s.stats.techsResearched || 0;
        const pomoDone = s.pomodoro.completedToday || 0;

        // Level bazlı tavsiye
        if (s.level < 3) {
            advices.push({ priority: 5, icon: '⭐', category: 'İlerleme', title: 'Seviye atla!', text: `Seviye ${s.level} (${lvl.name}). Hızlı XP kaynakları: Pomodoro (+15), Günlük görev (+10), Araştırma (+30), Odak (+50). Günlüğünü yaz (+5).`, action: 'dashboard' });
        }

        // Hafta sonu stratejisi
        if (this.isWeekend()) {
            advices.push({ priority: 5, icon: '🌴', category: 'Strateji', title: 'Hafta sonu avantajı!', text: 'Hafta sonu: +10 enerji, +5 sosyal, +2 stabilite. Bu ekstra kaynakları kullanarak zor kararları bugün uygula.', action: 'decisions' });
        }

        // Sıralama
        advices.sort((a, b) => a.priority - b.priority);
        return advices;
    },

    getAdvisorSummary() {
        const s = State.current;
        const lines = [];
        const lvl = this.getLevelInfo();

        // Genel durum değerlendirmesi
        const avgResources = (s.resources.stability + s.resources.energy + s.resources.health + s.resources.socialEnergy) / 4;
        let mood;
        if (avgResources >= 70) mood = 'Mükemmel durumdasın, Komutan! 💪';
        else if (avgResources >= 50) mood = 'İdare eder, ama daha iyisini yapabilirsin.';
        else if (avgResources >= 30) mood = 'Durum kritik. Hemen aksiyon al!';
        else mood = 'Alarm! Kaynakların çökmek üzere. Acil müdahale gerekli!';

        lines.push(mood);

        // Temel metrikleri özetle
        lines.push(`Rütbe: ${lvl.name} (Lv.${s.level}) | Günlük gelir: ${s.dailyGains.money || 0}₺ | Fabrikalar: ${s.factories.civilian}S/${s.factories.military}A`);

        const focusStatus = s.focus.current ? `Aktif (${s.focus.daysRemaining} gün kaldı)` : '❌ Boş';
        const researchStatus = `${s.research.active.length}/${s.researchSlots} slot`;
        lines.push(`Odak: ${focusStatus} | Araştırma: ${researchStatus}`);

        return lines.join('\n');
    },

    // ═══════════════ RESOURCE HISTORY (for charts) ═══════════════
    recordResourceHistory() {
        const s = State.current;
        const today = State.getTodayString();
        // Avoid duplicate entries for same date
        if (s.resourceHistory.length > 0 && s.resourceHistory[s.resourceHistory.length - 1].date === today) return;
        s.resourceHistory.push({
            date: today,
            resources: { ...s.resources }
        });
        // Keep last 90 days
        if (s.resourceHistory.length > 90) {
            s.resourceHistory = s.resourceHistory.slice(-90);
        }
    },

    // ═══════════════ STREAK TRACKING ═══════════════
    updateStreak() {
        const s = State.current;
        const today = State.getTodayString();
        if (!s.streak) s.streak = { current: 0, best: 0, lastActiveDate: null };

        if (s.streak.lastActiveDate === today) return; // Already counted today

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().slice(0, 10);

        if (s.streak.lastActiveDate === yesterdayStr) {
            s.streak.current++;
        } else if (s.streak.lastActiveDate && s.streak.lastActiveDate !== today) {
            // Streak broken
            s.streak.current = 1;
        } else {
            s.streak.current = 1;
        }

        s.streak.lastActiveDate = today;
        if (s.streak.current > s.streak.best) {
            s.streak.best = s.streak.current;
            s.stats.bestStreak = s.streak.best;
        }

        // Streak bonus: every 7 consecutive days, bonus XP
        if (s.streak.current > 0 && s.streak.current % 7 === 0) {
            this.addXP(25, 'Haftalık Seri Bonusu');
            UI.toast(`🔥 ${s.streak.current} günlük seri! +25 XP bonus`, 'success');
        }
    },

    // ═══════════════ SOUND EFFECTS ═══════════════
    playSound(type) {
        if (!State.current.soundEnabled) return;
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            gain.gain.value = 0.15;

            const sounds = {
                success: { freq: 880, dur: 0.15, type: 'sine', freq2: 1100 },
                click: { freq: 600, dur: 0.05, type: 'square' },
                warning: { freq: 440, dur: 0.2, type: 'sawtooth' },
                levelup: { freq: 523, dur: 0.1, type: 'sine', freq2: 659, freq3: 784 },
                day: { freq: 330, dur: 0.12, type: 'sine', freq2: 440 },
                notification: { freq: 700, dur: 0.1, type: 'sine', freq2: 900 },
                undo: { freq: 500, dur: 0.08, type: 'triangle', freq2: 350 }
            };

            const s = sounds[type] || sounds.click;
            osc.type = s.type;
            osc.frequency.setValueAtTime(s.freq, ctx.currentTime);
            if (s.freq2) osc.frequency.setValueAtTime(s.freq2, ctx.currentTime + s.dur);
            if (s.freq3) osc.frequency.setValueAtTime(s.freq3, ctx.currentTime + s.dur * 2);
            const totalDur = s.freq3 ? s.dur * 3 : s.freq2 ? s.dur * 2 : s.dur;
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + totalDur + 0.05);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + totalDur + 0.1);
        } catch (e) { /* Audio not supported */ }
    },

    // ═══════════════ BROWSER NOTIFICATIONS ═══════════════
    sendNotification(title, body, icon) {
        if (!State.current.notificationsEnabled) return;
        if (!('Notification' in window)) return;
        if (Notification.permission === 'granted') {
            new Notification(title, { body: body, icon: icon || '⚔' });
        }
    },

    requestNotificationPermission() {
        if (!('Notification' in window)) {
            UI.toast('Tarayıcınız bildirimleri desteklemiyor', 'warning');
            return;
        }
        Notification.requestPermission().then(perm => {
            if (perm === 'granted') {
                State.current.notificationsEnabled = true;
                State.save();
                UI.toast('🔔 Bildirimler açıldı!', 'success');
            } else {
                UI.toast('Bildirim izni reddedildi', 'warning');
            }
        });
    },

    // ═══════════════ UNDO SYSTEM ═══════════════
    pushUndo(label) {
        const s = State.current;
        if (!s.undoStack) s.undoStack = [];
        // Deep copy current state (exclude undoStack itself to save space)
        const snapshot = JSON.parse(JSON.stringify(s));
        delete snapshot.undoStack;
        s.undoStack.push({ label: label, timestamp: Date.now(), snapshot: snapshot });
        // Keep max 10 snapshots
        if (s.undoStack.length > 10) s.undoStack.shift();
    },

    undo() {
        const s = State.current;
        if (!s.undoStack || s.undoStack.length === 0) {
            UI.toast('Geri alınacak işlem yok', 'warning');
            return;
        }
        const last = s.undoStack.pop();
        const undoStack = [...s.undoStack]; // preserve remaining stack
        // Restore snapshot
        Object.assign(State.current, last.snapshot);
        State.current.undoStack = undoStack;
        State.save();
        State.syncGameData();
        UI.updateAll();
        this.playSound('undo');
        UI.toast(`↩ Geri alındı: ${last.label}`, 'info');
    },

    // ═══════════════ TEMPLATE SYSTEM ═══════════════
    applyTemplate(templateId) {
        const tmpl = GameData.templates.find(t => t.id === templateId);
        if (!tmpl) return;

        this.pushUndo('Şablon uygulamadan önce');

        const s = State.current;

        // Set ideology
        if (tmpl.ideology) s.profile.ideology = tmpl.ideology;

        // Add focus branches
        if (tmpl.focusBranches) {
            for (const branch of tmpl.focusBranches) {
                if (!s.userData.focusBranches.some(b => b.id === branch.id)) {
                    s.userData.focusBranches.push(JSON.parse(JSON.stringify(branch)));
                }
            }
        }

        // Add tech categories
        if (tmpl.techCategories) {
            for (const cat of tmpl.techCategories) {
                if (!s.userData.techCategories.some(c => c.id === cat.id)) {
                    s.userData.techCategories.push(JSON.parse(JSON.stringify(cat)));
                }
            }
        }

        // Add decision categories
        if (tmpl.decisionCategories) {
            for (const cat of tmpl.decisionCategories) {
                if (!s.userData.decisionCategories.some(c => c.id === cat.id)) {
                    s.userData.decisionCategories.push(JSON.parse(JSON.stringify(cat)));
                }
            }
        }

        // Add daily objectives
        if (tmpl.dailyObjectives) {
            for (const obj of tmpl.dailyObjectives) {
                if (!s.dailyObjectives.some(o => o.name === obj.name)) {
                    this.addDailyObjective(obj.name, obj.icon);
                }
            }
        }

        State.syncGameData();
        this.calculateDailyGains();
        State.save();
        UI.updateAll();
        this.playSound('success');
        UI.toast(`🏁 "${tmpl.name}" şablonu uygulandı!`, 'success');
    },

    // ═══════════════ PRODUCTIVITY SCORE ═══════════════
    calculateProductivityScore() {
        const s = State.current;
        const todayStr = State.getTodayString();
        let score = 0;
        const breakdown = {};

        // Pomodoros completed today (max 25pts for 5 pomodoros)
        const pomos = s.pomodoro.completedToday || 0;
        breakdown.pomodoro = Math.min(25, pomos * 5);
        score += breakdown.pomodoro;

        // Daily objectives completed (max 25pts)
        const totalObj = s.dailyObjectives.length || 1;
        const doneObj = s.dailyObjectives.filter(o => o.completedToday).length;
        breakdown.objectives = Math.round((doneObj / totalObj) * 25);
        score += breakdown.objectives;

        // Journal entry today (10pts)
        const hasJournal = s.journal.some(j => j.date === todayStr);
        breakdown.journal = hasJournal ? 10 : 0;
        score += breakdown.journal;

        // Active focus running (10pts)
        breakdown.focus = s.focus.current ? 10 : 0;
        score += breakdown.focus;

        // Research slots filled (max 10pts)
        const researchFill = s.researchSlots > 0 ? (s.research.active.length / s.researchSlots) : 0;
        breakdown.research = Math.round(researchFill * 10);
        score += breakdown.research;

        // Streak bonus (max 10pts)
        breakdown.streak = Math.min(10, (s.streak.current || 0));
        score += breakdown.streak;

        // Resource health: avg of stability + health + energy (max 10pts)
        const avg = (s.resources.stability + s.resources.health + Math.min(100, s.resources.energy)) / 3;
        breakdown.resources = Math.round(avg / 10);
        score += breakdown.resources;

        // Weekly goals done bonus (max 10pts)
        const weekGoals = s.weeklyGoals || [];
        const goalsDone = weekGoals.filter(g => g.done).length;
        const totalGoals = weekGoals.length || 1;
        breakdown.weeklyGoals = Math.round((goalsDone / totalGoals) * 10);
        score += breakdown.weeklyGoals;

        return { score: Math.min(100, score), breakdown };
    },

    // Record daily productivity
    recordProductivity() {
        const s = State.current;
        const todayStr = State.getTodayString();
        const result = this.calculateProductivityScore();

        // Update activity log for heatmap
        s.activityLog[todayStr] = result.score;

        // Save to history (keep last 90 days)
        const existing = s.productivityHistory.findIndex(p => p.date === todayStr);
        if (existing >= 0) {
            s.productivityHistory[existing] = { date: todayStr, score: result.score, breakdown: result.breakdown };
        } else {
            s.productivityHistory.push({ date: todayStr, score: result.score, breakdown: result.breakdown });
        }
        if (s.productivityHistory.length > 90) {
            s.productivityHistory = s.productivityHistory.slice(-90);
        }

        // Trim activity log (keep last 365 days)
        const keys = Object.keys(s.activityLog).sort();
        if (keys.length > 365) {
            for (let i = 0; i < keys.length - 365; i++) {
                delete s.activityLog[keys[i]];
            }
        }
    },

    // ═══════════════ WEEKLY GOALS ═══════════════
    getCurrentWeekStr() {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        const diff = (now - start + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60000)) / 86400000;
        const weekNum = Math.ceil((diff + start.getDay() + 1) / 7);
        return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
    },

    checkWeeklyGoalsReset() {
        const s = State.current;
        const currentWeek = this.getCurrentWeekStr();
        if (s.weeklyGoalsWeek !== currentWeek) {
            // Archive old goals if they exist
            if (s.weeklyGoals.length > 0 && s.weeklyGoalsWeek) {
                // Just reset — old goals are lost (could archive in future)
            }
            s.weeklyGoals = [];
            s.weeklyGoalsWeek = currentWeek;
        }
    },

    addWeeklyGoal(text) {
        const s = State.current;
        this.checkWeeklyGoalsReset();
        s.weeklyGoals.push({
            id: Date.now(),
            text: text.trim(),
            done: false,
            createdDate: State.getTodayString()
        });
        State.save();
    },

    toggleWeeklyGoal(id) {
        const s = State.current;
        const goal = s.weeklyGoals.find(g => g.id === id);
        if (goal) {
            goal.done = !goal.done;
            if (goal.done) {
                this.addXP(10, 'Haftalık hedef tamamlandı');
                this.playSound('success');
            }
            State.save();
        }
    },

    removeWeeklyGoal(id) {
        const s = State.current;
        s.weeklyGoals = s.weeklyGoals.filter(g => g.id !== id);
        State.save();
    },

    // ═══════════════ FOCUS MODE ═══════════════
    toggleFocusMode() {
        const s = State.current;
        s.focusModeActive = !s.focusModeActive;
        document.body.classList.toggle('focus-mode', s.focusModeActive);

        if (s.focusModeActive) {
            UI.toast('🧘 Odak Modu açıldı — dikkat dağıtıcılar gizlendi', 'info');
            this.playSound('click');
        } else {
            UI.toast('Odak Modu kapatıldı', 'info');
        }
        State.save();
    },

    // ═══════════════ QUICK NOTES ═══════════════
    saveQuickNotes(text) {
        State.current.quickNotes = text;
        State.save();
    },

    // ═══════════════ MORNING BRIEFING ═══════════════
    shouldShowBriefing() {
        const s = State.current;
        if (!s.onboardingDone) return false;
        const todayStr = State.getTodayString();
        return s.lastBriefingDate !== todayStr;
    },

    markBriefingShown() {
        State.current.lastBriefingDate = State.getTodayString();
        State.save();
    }
};
