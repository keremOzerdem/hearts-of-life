/* ═══════════════════════════════════════════════════════════
   HEARTS OF LIFE — UI Renderer
   All DOM updates and UI interactions
   ═══════════════════════════════════════════════════════════ */

const UI = {

    // ── Master Update ──
    updateAll() {
        this.updateTopBar();
        this.updateTimeControls();
        this.updateDashboard();
        this.updateFocusTree();
        this.updateResearch();
        this.updateProduction();
        this.updateMilitary();
        this.updateDiplomacy();
        this.updateDecisions();
        this.updateSpirits();
        this.updateWar();
        this.updateStats();
        this.updateJournal();
        this.updateAchievements();
        this.updateAdvisor();
        this.updateProductivityScore();
        this.updateWeeklyGoals();
        this.updateQuickNotes();
        this.renderActivityHeatmap();
        this.updateFocusModeBtn();
    },

    // ═══════════════ TOP BAR ═══════════════
    updateTopBar() {
        const s = State.current;
        const r = s.resources;

        document.getElementById('date-display').textContent = State.getDateString();
        document.getElementById('res-political-power').textContent = r.politicalPower;
        document.getElementById('res-stability').textContent = r.stability + '%';
        document.getElementById('res-war-support').textContent = r.warSupport + '%';
        document.getElementById('res-manpower').textContent = r.energy;
        document.getElementById('res-money').textContent = r.money + '₺';
        document.getElementById('res-health').textContent = r.health + '%';
        document.getElementById('res-social').textContent = r.socialEnergy;
        document.getElementById('res-civ-factories').textContent = s.factories.civilian;
        document.getElementById('res-mil-factories').textContent = s.factories.military;

        const ppDaily = s.dailyGains ? s.dailyGains.politicalPower : 2;
        document.getElementById('res-pp-daily').textContent = `+${ppDaily}/gün`;

        // XP bar
        const lvl = Engine.getLevelInfo();
        document.getElementById('xp-level').textContent = `Lv.${lvl.level}`;
        document.getElementById('xp-rank').textContent = lvl.title;
        document.getElementById('xp-bar-fill').style.width = lvl.pct + '%';
    },

    // ═══════════════ TIME CONTROLS ═══════════════
    updateTimeControls() {
        const s = State.current;
        const totalDays = State.getTotalDays();
        
        document.getElementById('day-counter').textContent = `Gün: ${totalDays}`;
        document.getElementById('week-day').textContent = State.getWeekDay();

        // Show status
        const pendingEl = document.getElementById('pending-days');
        if (pendingEl) {
            pendingEl.textContent = 'Güncel ✓';
            pendingEl.style.color = 'var(--accent-green)';
        }

        // Bottom bar alerts
        this.updateBottomAlerts();
    },

    // ═══════════════ DASHBOARD ═══════════════
    updateDashboard() {
        const s = State.current;

        // Profile
        document.getElementById('player-name').textContent = s.profile.name;
        document.getElementById('player-title').textContent = s.profile.title;
        document.getElementById('player-ideology').textContent = s.profile.ideology;

        // Summary
        const focusData = s.focus.current ? Engine.findFocus(s.focus.current) : null;
        document.getElementById('summary-focus').textContent = focusData ? `${focusData.name} (${s.focus.daysRemaining} gün)` : 'Seçilmedi';
        document.getElementById('summary-research').textContent = `${s.research.active.length}/${s.researchSlots} slot dolu`;
        document.getElementById('summary-production').textContent = `${s.production.lines.length} aktif`;
        document.getElementById('summary-divisions').textContent = s.divisions.filter(d => d.active).length;
        document.getElementById('summary-decisions').textContent = this.countAvailableDecisions();

        // Spirits preview
        const spiritsEl = document.getElementById('spirits-list-preview');
        spiritsEl.innerHTML = '';
        if (s.spirits.length === 0) {
            spiritsEl.innerHTML = '<span style="color:var(--text-dim);font-size:12px">Henüz ulusal ruh yok</span>';
        } else {
            s.spirits.forEach(sid => {
                const sp = Engine.getSpiritData(sid);
                if (sp) {
                    const badge = document.createElement('div');
                    badge.className = `spirit-badge ${sp.type}`;
                    badge.innerHTML = `${sp.icon} ${sp.name}`;
                    badge.title = sp.description;
                    spiritsEl.appendChild(badge);
                }
            });
        }

        // Recent events
        const eventsEl = document.getElementById('recent-events-list');
        const recent = s.eventHistory.slice(-5).reverse();
        if (recent.length === 0) {
            eventsEl.innerHTML = '<div class="empty-state"><p>Henüz olay yok</p></div>';
        } else {
            eventsEl.innerHTML = recent.map(eh => {
                const ev = GameData.events.find(e => e.id === eh.eventId);
                return `<div class="summary-row"><span>${ev ? ev.icon : '📰'} ${ev ? ev.title : eh.eventId}</span><span>Gün ${eh.day}</span></div>`;
            }).join('');
        }

        // Alerts
        const alertsEl = document.getElementById('alerts-list');
        if (s.alerts.length === 0) {
            alertsEl.innerHTML = '<div style="color:var(--text-dim);font-size:13px;padding:8px">Uyarı yok ✓</div>';
        } else {
            alertsEl.innerHTML = s.alerts.map(a => {
                const typeIcon = a.type === 'danger' ? '🔴' : a.type === 'warning' ? '🟡' : a.type === 'action' ? '🟠' : '🔵';
                const clickAttr = a.tab ? ` onclick="App.switchTab('${a.tab}')" style="cursor:pointer"` : '';
                const cls = a.tab ? 'alert-row clickable' : 'alert-row';
                return `<div class="${cls}"${clickAttr}>
                    <span>${a.icon} ${a.text}</span>
                    <span>${typeIcon}${a.tab ? ' →' : ''}</span>
                </div>`;
            }).join('');
        }

        // Progress bars
        const progressEl = document.getElementById('progress-bars');
        progressEl.innerHTML = [
            this.renderProgressRow('İstikrar', s.resources.stability, 100, 'green'),
            this.renderProgressRow('Motivasyon', s.resources.warSupport, 100, 'yellow'),
            this.renderProgressRow('Sağlık', s.resources.health, 100, 'red'),
            this.renderProgressRow('Enerji', s.resources.energy, 200, 'blue'),
            this.renderProgressRow('Sosyal', s.resources.socialEnergy, 200, 'purple')
        ].join('');

        // Daily Objectives
        this.updateDailyObjectives();

        // Pomodoro
        this.updatePomodoroWidget();

        // XP Widget
        this.updateXPWidget();
    },

    renderProgressRow(label, value, max, color) {
        const pct = Math.round((value / max) * 100);
        return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
            <span style="width:70px;font-size:12px;color:var(--text-secondary)">${label}</span>
            <div class="progress-bar-sm"><div class="fill ${color}" style="width:${pct}%"></div></div>
            <span style="width:40px;font-size:12px;text-align:right;color:var(--text-white)">${value}</span>
        </div>`;
    },

    countAvailableDecisions() {
        let count = 0;
        for (const cat of GameData.decisions.categories) {
            for (const d of cat.decisions) {
                if (Engine.canExecuteDecision(d)) count++;
            }
        }
        return count;
    },

    // ═══════════════ FOCUS TREE ═══════════════
    updateFocusTree() {
        const s = State.current;
        const container = document.getElementById('focus-tree-container');

        // Header info
        const focusData = s.focus.current ? Engine.findFocus(s.focus.current) : null;
        document.getElementById('current-focus-name').textContent = focusData ? focusData.name : 'Yok';
        document.getElementById('focus-days-left').textContent = focusData ? s.focus.daysRemaining + ' gün' : '—';

        let html = '';
        if (GameData.focusTree.branches.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-icon">🎯</div><p>Henüz odak dalı yok.</p><p style="color:var(--text-dim)">Yukarıdaki butonlarla dal ve odak ekleyin!</p></div>';
            return;
        }
        for (const branch of GameData.focusTree.branches) {
            html += `<div class="focus-branch">`;
            html += `<div class="focus-branch-title"><span>${branch.name}</span><button class="hoi-btn danger small" style="font-size:10px;padding:2px 6px;margin-left:8px" onclick="event.stopPropagation();UI.deleteBranch('${branch.id}')" title="Dalı Sil">🗑</button></div>`;
            
            // Group by tier
            const tiers = {};
            for (const f of branch.focuses) {
                if (!tiers[f.tier]) tiers[f.tier] = [];
                tiers[f.tier].push(f);
            }

            for (const tier of Object.keys(tiers).sort()) {
                html += `<div class="focus-row">`;
                for (const focus of tiers[tier]) {
                    const completed = s.focus.completed.includes(focus.id);
                    const active = s.focus.current === focus.id;
                    const canSelect = Engine.canSelectFocus(focus);
                    const locked = !completed && !active && !canSelect;

                    let cls = 'focus-node';
                    if (completed) cls += ' completed';
                    if (active) cls += ' active';
                    if (locked) cls += ' locked';

                    html += `<div class="${cls}" onclick="UI.onFocusClick('${focus.id}')" title="${this.escapeHtml(focus.description)}">`;
                    html += `<button class="item-delete-btn" onclick="event.stopPropagation();UI.deleteFocus('${focus.id}')" title="Sil">✕</button>`;
                    if (completed) html += `<span class="focus-check">✅</span>`;
                    html += `<span class="focus-icon">${focus.icon}</span>`;
                    html += `<span class="focus-name">${focus.name}</span>`;
                    if (active) {
                        html += `<span class="focus-days">${s.focus.daysRemaining} gün kaldı</span>`;
                    } else {
                        html += `<span class="focus-days">${focus.days} gün</span>`;
                    }
                    html += `</div>`;
                }
                html += `</div>`;
            }
            html += `</div>`;
        }
        container.innerHTML = html;
    },

    onFocusClick(focusId) {
        const s = State.current;
        const focus = Engine.findFocus(focusId);
        if (!focus) return;

        if (s.focus.completed.includes(focusId)) {
            this.toast('Bu odak zaten tamamlandı', 'info');
            return;
        }

        if (s.focus.current === focusId) {
            // Show option to cancel
            this.showModal({
                title: `🎯 ${focus.name}`,
                body: `<p>${focus.description}</p><p style="margin-top:8px;color:var(--text-gold)">Kalan: ${s.focus.daysRemaining} gün</p>`,
                buttons: [
                    { text: 'İptal Et', class: 'danger', action: () => { Engine.cancelFocus(); this.closeModal(); } },
                    { text: 'Kapat', class: '', action: () => this.closeModal() }
                ]
            });
            return;
        }

        if (!Engine.canSelectFocus(focus)) {
            // Show requirements
            const reqNames = focus.requires.map(r => {
                const rf = Engine.findFocus(r);
                return rf ? rf.name : r;
            });
            this.toast(`Gereksinimler: ${reqNames.join(', ')}`, 'warning');
            return;
        }

        // Show confirmation
        let effectsHtml = '<div class="spirit-effects" style="margin-top:8px">';
        for (const [k, v] of Object.entries(focus.effects)) {
            if (k === 'spirit') continue;
            const label = this.resourceLabel(k);
            const cls = v > 0 ? 'buff' : 'debuff';
            effectsHtml += `<div class="${cls}">${label}: ${v > 0 ? '+' : ''}${v}</div>`;
        }
        effectsHtml += '</div>';

        this.showModal({
            title: `🎯 ${focus.name}`,
            body: `<p>${focus.description}</p><p style="margin-top:6px;color:var(--text-dim)">Süre: ${focus.days} gün</p>${effectsHtml}`,
            buttons: [
                { text: 'Odağı Seç', class: 'primary', action: () => { Engine.selectFocus(focusId); this.closeModal(); } },
                { text: 'İptal', class: '', action: () => this.closeModal() }
            ]
        });
    },

    // ═══════════════ RESEARCH ═══════════════
    updateResearch() {
        const s = State.current;

        document.getElementById('research-slot-count').textContent = `${s.research.active.length}/${s.researchSlots}`;

        // Active research slots
        const activeEl = document.getElementById('active-research');
        let activeHtml = '';
        for (let i = 0; i < s.researchSlots; i++) {
            const active = s.research.active[i];
            if (active) {
                const tech = Engine.findTech(active.techId);
                const pct = Math.round(((active.totalDays - active.daysRemaining) / active.totalDays) * 100);
                activeHtml += `<div class="research-slot active">
                    <div class="slot-label">Slot ${i + 1}</div>
                    <div class="slot-tech">${tech ? tech.icon : '🔬'} ${tech ? tech.name : active.techId}</div>
                    <div class="progress-bar-wrapper">
                        <div class="progress-bar-fill" style="width:${pct}%"></div>
                        <div class="progress-bar-text">${pct}% — ${Math.ceil(active.daysRemaining)} gün</div>
                    </div>
                    <button class="hoi-btn danger" style="margin-top:6px;font-size:11px" onclick="Engine.cancelResearch('${active.techId}')">İptal</button>
                </div>`;
            } else {
                activeHtml += `<div class="research-slot">
                    <div class="slot-label">Slot ${i + 1}</div>
                    <div class="slot-tech" style="color:var(--text-dim)">Boş</div>
                    <div style="font-size:12px;color:var(--text-dim)">Aşağıdan bir teknoloji seç</div>
                </div>`;
            }
        }
        activeEl.innerHTML = activeHtml;

        // Tech categories
        const catEl = document.getElementById('research-categories');
        let catHtml = '';
        if (GameData.technologies.categories.length === 0) {
            catEl.innerHTML = '<div class="empty-state"><div class="empty-icon">🔬</div><p>Henüz araştırma kategorisi yok.</p><p style="color:var(--text-dim)">Yukarıdaki butonlarla kategori ve teknoloji ekleyin!</p></div>';
        } else {
        for (const cat of GameData.technologies.categories) {
            catHtml += `<div class="research-category">
                <h3>${cat.icon} ${cat.name} <button class="hoi-btn danger small" style="font-size:10px;padding:2px 6px;margin-left:8px" onclick="UI.deleteTechCategory('${cat.id}')" title="Kategoriyi Sil">🗑</button></h3>
                <div class="tech-grid">`;
            for (const tech of cat.techs) {
                const researched = s.research.completed.includes(tech.id);
                const researching = s.research.active.some(a => a.techId === tech.id);
                const canResearch = Engine.canResearchTech(tech);
                
                let cls = 'tech-item';
                if (researched) cls += ' researched';
                if (researching) cls += ' researching';

                catHtml += `<div class="${cls}" onclick="UI.onTechClick('${tech.id}')" title="${this.escapeHtml(tech.description)}">
                    <button class="item-delete-btn" onclick="event.stopPropagation();UI.deleteTech('${tech.id}')" title="Sil">✕</button>
                    <span class="tech-icon">${tech.icon}</span>
                    <div class="tech-name">${tech.name}</div>
                    <div class="tech-year">${researched ? '✅ Tamamlandı' : researching ? '🔄 Araştırılıyor' : tech.days + ' gün'}</div>
                </div>`;
            }
            catHtml += `</div></div>`;
        }
        catEl.innerHTML = catHtml;
        } // end else
    },

    onTechClick(techId) {
        const tech = Engine.findTech(techId);
        if (!tech) return;
        const s = State.current;

        if (s.research.completed.includes(techId)) {
            this.toast('Bu teknoloji zaten araştırıldı', 'info');
            return;
        }
        if (s.research.active.some(a => a.techId === techId)) {
            this.toast('Bu teknoloji zaten araştırılıyor', 'info');
            return;
        }

        if (!Engine.canResearchTech(tech)) {
            if (s.research.active.length >= s.researchSlots) {
                this.toast('Araştırma slotu dolu', 'warning');
            } else {
                const reqNames = tech.requires.map(r => {
                    const rt = Engine.findTech(r);
                    return rt ? rt.name : r;
                });
                this.toast(`Gereksinimler: ${reqNames.join(', ')}`, 'warning');
            }
            return;
        }

        Engine.startResearch(techId);
    },

    // ═══════════════ PRODUCTION ═══════════════
    updateProduction() {
        const s = State.current;
        document.getElementById('prod-civ').textContent = s.factories.civilian;
        document.getElementById('prod-mil').textContent = s.factories.military;

        // Production lines
        const linesEl = document.getElementById('production-lines');
        if (s.production.lines.length === 0) {
            linesEl.innerHTML = '<div class="empty-state"><div class="empty-icon">⚙</div><p>Üretim hattı yok. Yeni bir üretim hattı ekleyin.</p></div>';
        } else {
            linesEl.innerHTML = s.production.lines.map((line, idx) => {
                const item = GameData.productionItems.find(p => p.id === line.itemId);
                if (!item) return '';
                return `<div class="prod-line">
                    <span class="prod-icon">${item.icon}</span>
                    <span class="prod-name">${item.name}</span>
                    <div class="progress-bar-wrapper">
                        <div class="progress-bar-fill" style="width:${Math.min(100, line.factories * 20)}%"></div>
                        <div class="progress-bar-text">${line.factories} fabrika</div>
                    </div>
                    <span class="prod-output">+${item.baseOutput * line.factories}/gün</span>
                    <button class="hoi-btn danger" style="font-size:11px;padding:3px 8px" onclick="Engine.removeProductionLine(${idx})">✕</button>
                </div>`;
            }).join('');
        }

        // Construction queue
        const constEl = document.getElementById('construction-queue');
        if (s.production.construction.length === 0) {
            constEl.innerHTML = '<div style="color:var(--text-dim);font-size:13px;padding:6px">İnşaat kuyruğu boş</div>';
        } else {
            constEl.innerHTML = s.production.construction.map((item, idx) => {
                const data = GameData.constructionItems.find(c => c.id === item.itemId);
                if (!data) return '';
                const pct = Math.round(((item.totalDays - item.daysRemaining) / item.totalDays) * 100);
                return `<div class="construction-item">
                    <span style="font-size:20px;text-align:center">${data.icon}</span>
                    <span>${data.name}</span>
                    <div class="progress-bar-wrapper">
                        <div class="progress-bar-fill" style="width:${pct}%"></div>
                        <div class="progress-bar-text">${pct}% — ${item.daysRemaining} gün</div>
                    </div>
                    <button class="hoi-btn danger small" style="font-size:10px;padding:2px 6px" onclick="UI.removeConstruction(${idx})" title="İptal Et">✕</button>
                </div>`;
            }).join('');
        }
    },

    showAddProductionModal() {
        const items = GameData.productionItems;
        if (items.length === 0) {
            this.toast('Önce bir üretim öğesi oluşturun!', 'warning');
            this.showCreateProductionItemModal();
            return;
        }
        let body = '<div style="display:flex;flex-direction:column;gap:6px">';
        for (const item of items) {
            body += `<div class="decision-item available" style="position:relative">
                <div style="flex:1;display:flex;align-items:center;gap:8px;cursor:pointer" onclick="Engine.addProductionLine('${item.id}');UI.closeModal()">
                    <span class="decision-icon">${item.icon}</span>
                    <div class="decision-info">
                        <div class="decision-title">${item.name}</div>
                        <div class="decision-desc">${item.description}</div>
                        <div class="decision-cost">Tür: ${item.type === 'civilian' ? '🏭 Sivil' : '🏗 Askeri'} | Çıktı: +${item.baseOutput}/gün</div>
                    </div>
                </div>
                <button class="hoi-btn danger small" style="font-size:10px;padding:3px 6px" onclick="UI.deleteProductionItem('${item.id}');UI.closeModal();UI.showAddProductionModal()" title="Öğeyi Sil">🗑</button>
            </div>`;
        }
        body += '</div>';

        this.showModal({
            title: '⚙ Üretim Hattı Ekle',
            body: body,
            buttons: [{ text: 'Kapat', class: '', action: () => this.closeModal() }]
        });
    },

    showAddConstructionModal() {
        const items = GameData.constructionItems;
        if (items.length === 0) {
            this.toast('Önce bir inşaat öğesi oluşturun!', 'warning');
            this.showCreateConstructionItemModal();
            return;
        }
        let body = '<div style="display:flex;flex-direction:column;gap:6px">';
        for (const item of items) {
            body += `<div class="decision-item available" style="position:relative">
                <div style="flex:1;display:flex;align-items:center;gap:8px;cursor:pointer" onclick="Engine.startConstruction('${item.id}');UI.closeModal()">
                    <span class="decision-icon">${item.icon}</span>
                    <div class="decision-info">
                        <div class="decision-title">${item.name}</div>
                        <div class="decision-desc">${item.description}</div>
                        <div class="decision-cost">Süre: ${item.days} gün</div>
                    </div>
                </div>
                <button class="hoi-btn danger small" style="font-size:10px;padding:3px 6px" onclick="UI.deleteConstructionItem('${item.id}');UI.closeModal();UI.showAddConstructionModal()" title="Öğeyi Sil">🗑</button>
            </div>`;
        }
        body += '</div>';

        this.showModal({
            title: '🏗 İnşaat Başlat',
            body: body,
            buttons: [{ text: 'Kapat', class: '', action: () => this.closeModal() }]
        });
    },

    // ═══════════════ MILITARY ═══════════════
    updateMilitary() {
        const s = State.current;
        const listEl = document.getElementById('divisions-list');

        if (s.divisions.length === 0) {
            listEl.innerHTML = '<div class="empty-state"><div class="empty-icon">🎖</div><p>Henüz tümen yok. Şablonlardan bir tümen oluşturun.</p></div>';
            return;
        }

        listEl.innerHTML = s.divisions.map(div => {
            const activeClass = div.active ? '' : ' style="opacity:0.6"';
            return `<div class="division-card"${activeClass}>
                <div class="division-header">
                    <span class="division-name">${div.icon} ${div.name}</span>
                    <div>
                        <span class="division-type">${div.type}</span>
                        <button class="hoi-btn ${div.active ? 'primary' : 'secondary'}" style="margin-left:6px;font-size:11px;padding:3px 8px" 
                            onclick="Engine.toggleDivision('${div.id}')">${div.active ? '✓ Aktif' : 'Pasif'}</button>
                        <button class="hoi-btn danger" style="font-size:11px;padding:3px 8px" 
                            onclick="Engine.removeDivision('${div.id}')">✕</button>
                    </div>
                </div>
                <div class="division-battalions">
                    ${div.battalions.map(b => `<div class="battalion"><span class="bat-icon">${b.icon}</span>${b.name}<span style="color:var(--text-dim);font-size:11px;margin-left:4px">${b.time}</span></div>`).join('')}
                </div>
                <div class="division-stats">
                    ${Object.entries(div.effects).map(([k, v]) => {
                        const label = this.resourceLabel(k);
                        return `<span>${v > 0 ? '🟢' : '🔴'} ${label}: ${v > 0 ? '+' : ''}${v}/gün</span>`;
                    }).join('')}
                </div>
            </div>`;
        }).join('');
    },

    showAddDivisionModal() {
        const templates = GameData.divisionTemplates;
        if (templates.length === 0) {
            this.toast('Önce bir şablon oluşturun!', 'warning');
            this.showCreateTemplateModal();
            return;
        }
        let body = '<div style="display:flex;flex-direction:column;gap:8px">';
        for (const t of templates) {
            const effects = Object.entries(t.effects).map(([k, v]) => {
                const label = this.resourceLabel(k);
                return `<span class="${v > 0 ? 'buff' : 'debuff'}">${label}: ${v > 0 ? '+' : ''}${v}</span>`;
            }).join(' | ');

            body += `<div class="decision-item available" style="position:relative">
                <div style="flex:1;display:flex;align-items:center;gap:8px;cursor:pointer" onclick="Engine.addDivision('${t.id}');UI.closeModal()">
                    <span class="decision-icon">${t.icon}</span>
                    <div class="decision-info">
                        <div class="decision-title">${t.name}</div>
                        <div class="decision-desc">${t.type} — ${t.battalions.length} tabur</div>
                        <div class="spirit-effects" style="margin-top:2px">${effects}</div>
                    </div>
                </div>
                <button class="hoi-btn danger small" style="font-size:10px;padding:3px 6px" onclick="UI.deleteTemplate('${t.id}');UI.closeModal();UI.showAddDivisionModal()" title="Şablonu Sil">🗑</button>
            </div>`;
        }
        body += '</div>';

        this.showModal({
            title: '🎖 Tümen Oluştur',
            body: body,
            buttons: [{ text: 'Kapat', class: '', action: () => this.closeModal() }]
        });
    },

    showTemplateEditor() {
        let body = `
            <div style="margin-bottom:10px">
                <label>Tümen Adı: <input type="text" id="custom-div-name" placeholder="Özel Rutinm" style="width:100%;margin-top:4px"></label>
            </div>
            <div style="margin-bottom:10px">
                <label>Tür: 
                    <select id="custom-div-type" style="width:100%;margin-top:4px">
                        <option value="Hafif Tümen">Hafif Tümen</option>
                        <option value="Ana Tümen">Ana Tümen</option>
                        <option value="Zırhlı Tümen">Zırhlı Tümen</option>
                        <option value="Garnizon Tümeni">Garnizon Tümeni</option>
                    </select>
                </label>
            </div>
            <h4 style="margin-bottom:6px">Taburlar (Her satıra: İsim, Saat)</h4>
            <textarea id="custom-div-battalions" rows="6" placeholder="Örnek:
Sabah Koşusu, 06:00
Kahvaltı, 07:00
Derin Çalışma, 09:00"></textarea>
        `;

        this.showModal({
            title: '📋 Özel Tümen Şablonu',
            body: body,
            buttons: [
                { text: 'Oluştur', class: 'primary', action: () => this.createCustomDivision() },
                { text: 'İptal', class: '', action: () => this.closeModal() }
            ]
        });
    },

    createCustomDivision() {
        const name = document.getElementById('custom-div-name').value || 'Özel Tümen';
        const type = document.getElementById('custom-div-type').value;
        const batsText = document.getElementById('custom-div-battalions').value;

        const battalions = batsText.split('\n').filter(l => l.trim()).map(line => {
            const parts = line.split(',').map(p => p.trim());
            return { name: parts[0] || 'Tabur', icon: '▪', time: parts[1] || '00:00' };
        });

        if (battalions.length === 0) {
            this.toast('En az bir tabur ekleyin', 'warning');
            return;
        }

        const div = {
            id: 'div_' + Date.now(),
            templateId: 'custom',
            name: name,
            type: type,
            icon: '⚔',
            battalions: battalions,
            effects: { energy: -5, stability: 3 },
            active: true
        };

        State.current.divisions.push(div);
        State.save();
        this.closeModal();
        this.updateAll();
        this.toast(`🎖 Özel Tümen Oluşturuldu: ${name}`, 'success');
    },

    // ═══════════════ DIPLOMACY ═══════════════
    updateDiplomacy() {
        const s = State.current;
        const listEl = document.getElementById('diplomacy-list');

        if (s.diplomacy.length === 0) {
            listEl.innerHTML = '<div class="empty-state"><div class="empty-icon">🤝</div><p>Henüz kimse eklenmedi. Kişi ekleyerek diplomasi ağını kur.</p></div>';
            return;
        }

        listEl.innerHTML = s.diplomacy.map(rel => {
            const opinionClass = rel.opinion >= 60 ? 'positive' : rel.opinion <= 30 ? 'negative' : 'neutral';
            return `<div class="diplo-card">
                <div class="diplo-header">
                    <div class="diplo-avatar">${rel.avatar}</div>
                    <div>
                        <div class="diplo-name">${this.escapeHtml(rel.name)}</div>
                        <div class="diplo-relation">${this.escapeHtml(rel.relation)} — Görüş: ${rel.opinion}/100</div>
                    </div>
                </div>
                <div class="opinion-bar">
                    <div class="opinion-fill ${opinionClass}" style="width:${rel.opinion}%"></div>
                </div>
                <div class="diplo-actions">
                    <button class="hoi-btn primary" onclick="Engine.improveRelation('${rel.id}')">💞 İyileştir (-10 SE)</button>
                    <button class="hoi-btn danger" onclick="Engine.removeRelation('${rel.id}')">✕ Çıkar</button>
                </div>
            </div>`;
        }).join('');
    },

    showAddRelationModal() {
        const body = `
            <label>İsim: <input type="text" id="rel-name" placeholder="Ahmet"></label>
            <label>İlişki Türü: 
                <select id="rel-type">
                    <option value="Arkadaş">Arkadaş</option>
                    <option value="Aile">Aile</option>
                    <option value="İş Arkadaşı">İş Arkadaşı</option>
                    <option value="Partner">Partner</option>
                    <option value="Mentor">Mentor</option>
                    <option value="Komşu">Komşu</option>
                </select>
            </label>
            <label>Avatar Emoji: <input type="text" id="rel-avatar" value="👤" maxlength="2"></label>
        `;

        this.showModal({
            title: '🤝 Kişi Ekle',
            body: body,
            buttons: [
                { text: 'Ekle', class: 'primary', action: () => {
                    const name = document.getElementById('rel-name').value;
                    const type = document.getElementById('rel-type').value;
                    const avatar = document.getElementById('rel-avatar').value || '👤';
                    if (name) {
                        Engine.addRelation(name, avatar, type);
                        this.closeModal();
                        this.toast(`🤝 ${name} eklendi`, 'success');
                    }
                }},
                { text: 'İptal', class: '', action: () => this.closeModal() }
            ]
        });
    },

    // ═══════════════ DECISIONS ═══════════════
    updateDecisions() {
        const s = State.current;
        const container = document.getElementById('decisions-container');

        if (GameData.decisions.categories.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-icon">📜</div><p>Henüz karar kategorisi yok.</p><p style="color:var(--text-dim)">Yukarıdaki butonlarla kategori ve karar ekleyin!</p></div>';
            return;
        }

        let html = '';
        for (let _ci = 0; _ci < GameData.decisions.categories.length; _ci++) {
            const cat = GameData.decisions.categories[_ci];
            html += `<div class="decision-category"><h3>${cat.name} <button class="hoi-btn danger small" style="font-size:10px;padding:2px 6px;margin-left:8px" onclick="UI.deleteDecisionCategory(${_ci})" title="Kategoriyi Sil">🗑</button></h3><div class="decision-list">`;
            for (const d of cat.decisions) {
                const available = Engine.canExecuteDecision(d);
                const cooldown = s.decisionCooldowns[d.id];
                
                let costText = Object.entries(d.cost).map(([k, v]) => `${this.resourceLabel(k)}: -${v}`).join(', ');
                let effectText = Object.entries(d.effects).map(([k, v]) => {
                    const label = this.resourceLabel(k);
                    return `${v > 0 ? '+' : ''}${v} ${label}`;
                }).join(', ');

                html += `<div class="decision-item ${available ? 'available' : 'unavailable'}">
                    <span class="decision-icon">${d.icon}</span>
                    <div class="decision-info">
                        <div class="decision-title">${d.name}</div>
                        <div class="decision-desc">${d.description}</div>
                        <div class="decision-cost">Maliyet: ${costText}</div>
                        <div class="spirit-effects"><span class="buff">Etki: ${effectText}</span></div>
                        ${cooldown ? `<div style="color:var(--accent-red);font-size:11px">Bekleme: ${cooldown} gün</div>` : ''}
                    </div>
                    <div style="display:flex;gap:4px;align-items:center">
                        <button class="hoi-btn primary decision-btn" ${available ? '' : 'disabled'} 
                            onclick="Engine.executeDecision('${d.id}')">Uygula</button>
                        <button class="hoi-btn danger small" style="font-size:10px;padding:3px 6px" onclick="UI.deleteDecision('${d.id}')" title="Sil">🗑</button>
                    </div>
                </div>`;
            }
            html += `</div></div>`;
        }
        container.innerHTML = html;
    },

    // ═══════════════ SPIRITS ═══════════════
    updateSpirits() {
        const s = State.current;
        const listEl = document.getElementById('spirits-full-list');

        if (s.spirits.length === 0) {
            listEl.innerHTML = '<div class="empty-state"><div class="empty-icon">✨</div><p>Henüz ulusal ruh yok. Odak ağacından veya manuel olarak ruh ekleyin.</p></div>';
            return;
        }

        listEl.innerHTML = s.spirits.map(sid => {
            const sp = Engine.getSpiritData(sid);
            if (!sp) return '';
            return `<div class="spirit-card ${sp.type}">
                <div class="spirit-icon-big">${sp.icon}</div>
                <div class="spirit-details">
                    <div class="spirit-name">${sp.name}</div>
                    <div class="spirit-desc">${sp.description}</div>
                    <div class="spirit-effects">
                        ${sp.effects.map(e => `<div class="${e.value > 0 ? 'buff' : 'debuff'}">${e.text}</div>`).join('')}
                    </div>
                </div>
                <button class="spirit-remove" onclick="Engine.removeSpirit('${sid}')" title="Ruh'u Kaldır">✕</button>
            </div>`;
        }).join('');
    },

    showAddSpiritModal() {
        const available = GameData.defaultSpirits.filter(s => !State.current.spirits.includes(s.id));
        
        if (available.length === 0) {
            this.showCreateSpiritModal();
            return;
        }

        let body = '<div style="display:flex;flex-direction:column;gap:6px">';
        for (const sp of available) {
            const effects = sp.effects.map(e => `<span class="${e.value > 0 ? 'buff' : 'debuff'}">${e.text}</span>`).join(' | ');
            body += `<div class="decision-item available" style="position:relative">
                <div style="flex:1;display:flex;align-items:center;gap:8px;cursor:pointer" onclick="Engine.addSpirit('${sp.id}');UI.closeModal()">
                    <span class="decision-icon">${sp.icon}</span>
                    <div class="decision-info">
                        <div class="decision-title">${sp.name}</div>
                        <div class="decision-desc">${sp.description}</div>
                        <div class="spirit-effects">${effects}</div>
                    </div>
                </div>
                <button class="hoi-btn danger small" style="font-size:10px;padding:3px 6px" onclick="UI.deleteSpiritDef('${sp.id}');UI.closeModal();UI.showAddSpiritModal()" title="Tanımı Sil">🗑</button>
            </div>`;
        }
        body += '</div>';

        this.showModal({
            title: '✨ Ulusal Ruh Ekle',
            body: body,
            buttons: [{ text: 'Kapat', class: '', action: () => this.closeModal() }]
        });
    },

    // ═══════════════ WAR / CAMPAIGNS ═══════════════
    updateWar() {
        const s = State.current;
        if (!s.wars) s.wars = { activeCampaigns: [], totalConquered: 0 };

        // Header stats
        document.getElementById('war-active-fronts').textContent = s.wars.activeCampaigns.length;
        document.getElementById('war-conquered').textContent = s.wars.totalConquered;

        // Total attack power across all campaigns
        let totalAttack = 0;
        for (const camp of s.wars.activeCampaigns) {
            totalAttack += Engine.getAttackPower(camp);
        }
        document.getElementById('war-attack-power').textContent = totalAttack;

        const container = document.getElementById('war-campaigns-list');
        if (s.wars.activeCampaigns.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="padding:30px">
                    <p style="font-size:16px;margin-bottom:12px">⚔ Aktif sefer yok</p>
                    <p style="color:var(--text-dim)">Bir sefer başlatarak hedeflerinize doğru ilerleyin!</p>
                    <div class="war-available-campaigns" style="margin-top:20px">${this.renderAvailableCampaigns()}</div>
                </div>`;
            return;
        }

        let html = '';
        for (const camp of s.wars.activeCampaigns) {
            const campData = GameData.warCampaigns.find(c => c.id === camp.campaignId);
            if (!campData) continue;
            html += this.renderCampaignCard(camp, campData);
        }

        // Available campaigns to start
        const unstarted = GameData.warCampaigns.filter(c =>
            !s.wars.activeCampaigns.some(ac => ac.campaignId === c.id)
        );
        if (unstarted.length > 0) {
            html += `<div class="war-new-campaigns">
                <h3 style="color:var(--text-gold);margin-bottom:10px">🗺 Başlatılabilir Seferler</h3>
                ${this.renderAvailableCampaigns()}
            </div>`;
        }

        container.innerHTML = html;
    },

    renderAvailableCampaigns() {
        const s = State.current;
        if (!s.wars) return '';
        const available = GameData.warCampaigns.filter(c =>
            !s.wars.activeCampaigns.some(ac => ac.campaignId === c.id)
        );
        if (available.length === 0) return '<p style="color:var(--text-dim)">Tüm seferler başlatıldı!</p>';

        return available.map(c => {
            const terrain = GameData.terrainMods[c.terrain] || { label: c.terrain, icon: '' };
            return `<div class="war-available-card" style="border-left: 3px solid ${c.color}">
                <div class="war-card-header">
                    <span>${c.icon} <strong>${c.name}</strong></span>
                    <span class="war-terrain">${terrain.icon} ${terrain.label}</span>
                </div>
                <p style="color:var(--text-dim);font-size:13px;margin:4px 0">${c.description}</p>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">
                    <span style="font-size:12px;color:var(--text-secondary)">${c.provinces.length} bölge</span>
                    <button class="hoi-btn primary small" onclick="Engine.startCampaign('${c.id}')">⚔ Seferi Başlat</button>
                </div>
            </div>`;
        }).join('');
    },

    renderCampaignCard(camp, campData) {
        const s = State.current;
        const conqueredCount = camp.conquered.length;
        const totalProvinces = campData.provinces.length;
        const progressPct = Math.round((conqueredCount / totalProvinces) * 100);
        const capital = campData.provinces.find(p => p.type === 'capital');
        const isWon = capital && camp.conquered.includes(capital.id);
        const attackPower = Engine.getAttackPower(camp);
        const terrain = GameData.terrainMods[campData.terrain] || { label: '', icon: '' };

        let html = `<div class="war-campaign-card ${isWon ? 'won' : ''}" style="border-color:${campData.color}">`;
        
        // Campaign header
        html += `<div class="war-campaign-header" style="border-bottom-color:${campData.color}40">
            <div>
                <h3>${campData.icon} ${campData.name} ${isWon ? '🏆' : ''}</h3>
                <span style="font-size:12px;color:var(--text-dim)">${terrain.icon} ${terrain.label} | ⚔ Saldırı: ${attackPower} | ${conqueredCount}/${totalProvinces} bölge</span>
            </div>
            <div style="display:flex;gap:6px;align-items:center">
                <div class="war-progress-circle" title="${progressPct}%">
                    <svg viewBox="0 0 36 36">
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none" stroke="var(--border)" stroke-width="3"/>
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none" stroke="${campData.color}" stroke-width="3"
                              stroke-dasharray="${progressPct}, 100"/>
                    </svg>
                    <span>${progressPct}%</span>
                </div>
                <button class="hoi-btn danger small" onclick="Engine.cancelCampaign('${campData.id}')" title="Seferi İptal Et">✕</button>
            </div>
        </div>`;

        // War Map Grid
        html += `<div class="war-map-container">`;
        html += this.renderWarMap(camp, campData);
        html += `</div>`;

        // Battle info (if attacking)
        if (camp.currentTarget) {
            const target = campData.provinces.find(p => p.id === camp.currentTarget);
            if (target) {
                const battlePct = Math.min(100, Math.round((camp.battleProgress / target.defense) * 100));
                html += `<div class="war-battle-bar">
                    <div class="war-battle-info">
                        <span>⚔ Savaş: <strong>${target.name}</strong></span>
                        <span>${camp.battleProgress}/${target.defense} (Günlük +${attackPower})</span>
                    </div>
                    <div class="progress-bar-sm"><div class="fill red" style="width:${battlePct}%;transition:width 0.5s"></div></div>
                </div>`;
            }
        }

        // Division assignment
        html += `<div class="war-divisions-section">`;
        html += `<div class="war-div-header"><span>🎖 Cephe Tümenleri</span>
            <button class="hoi-btn small secondary" onclick="UI.showAssignDivisionModal('${campData.id}')">+ Tümen Ata</button>
        </div>`;
        
        if (camp.assignedDivisions.length === 0) {
            html += `<p style="color:var(--text-dim);font-size:13px;padding:6px">Cepheye tümen atanmadı</p>`;
        } else {
            html += `<div class="war-div-list">`;
            for (const divId of camp.assignedDivisions) {
                const div = s.divisions.find(d => d.id === divId);
                if (div) {
                    const power = 5 + (div.battalions ? div.battalions.length * 2 : 0);
                    html += `<div class="war-div-chip">
                        <span>${div.icon || '🎖'} ${div.name} (⚔${power})</span>
                        <button class="war-div-remove" onclick="Engine.unassignDivisionFromCampaign('${campData.id}','${divId}')">✕</button>
                    </div>`;
                }
            }
            html += `</div>`;
        }
        html += `</div>`;

        html += `</div>`;
        return html;
    },

    renderWarMap(camp, campData) {
        // Find grid bounds
        let maxRow = 0, maxCol = 0;
        for (const p of campData.provinces) {
            if (p.row > maxRow) maxRow = p.row;
            if (p.col > maxCol) maxCol = p.col;
        }

        let html = `<div class="war-map-grid" style="grid-template-columns:repeat(${maxCol + 1}, 1fr);grid-template-rows:repeat(${maxRow + 1}, 1fr)">`;

        // Create a lookup for provinces on grid
        const grid = {};
        for (const p of campData.provinces) {
            grid[`${p.row}-${p.col}`] = p;
        }

        for (let row = 0; row <= maxRow; row++) {
            for (let col = 0; col <= maxCol; col++) {
                const p = grid[`${row}-${col}`];
                if (!p) {
                    html += `<div class="war-tile empty" style="grid-row:${row + 1};grid-column:${col + 1}"></div>`;
                    continue;
                }

                const isConquered = camp.conquered.includes(p.id);
                const isTarget = camp.currentTarget === p.id;
                const isReachable = !isConquered && Engine.isProvinceReachable(campData, camp, p.id);
                const isCapital = p.type === 'capital';

                let tileClass = 'war-tile';
                if (isConquered) tileClass += ' conquered';
                else if (isTarget) tileClass += ' attacking';
                else if (isReachable) tileClass += ' reachable';
                else tileClass += ' enemy';

                if (isCapital) tileClass += ' capital';

                const typeInfo = GameData.provinceTypes[p.type] || {};
                const clickAction = (!isConquered && isReachable && !isTarget)
                    ? `onclick="Engine.attackProvince('${camp.campaignId}','${p.id}')"`
                    : '';

                html += `<div class="${tileClass}" style="grid-row:${row + 1};grid-column:${col + 1}" ${clickAction} title="${this.escapeHtml(p.name)}&#10;${this.escapeHtml(p.task)}&#10;Savunma: ${p.defense}${isConquered ? '&#10;✅ Fethedildi' : ''}">`;
                html += `<span class="war-tile-icon">${p.icon}</span>`;
                html += `<span class="war-tile-name">${p.name}</span>`;
                if (!isConquered) {
                    html += `<span class="war-tile-defense">🛡${p.defense}</span>`;
                } else {
                    html += `<span class="war-tile-check">✅</span>`;
                }
                if (isTarget) {
                    const pct = Math.min(100, Math.round((camp.battleProgress / p.defense) * 100));
                    html += `<div class="war-tile-progress"><div style="width:${pct}%"></div></div>`;
                }
                html += `</div>`;
            }
        }

        html += `</div>`;

        // Legend
        html += `<div class="war-map-legend">
            <span class="legend-item"><span class="legend-dot conquered"></span> Fethedildi</span>
            <span class="legend-item"><span class="legend-dot attacking"></span> Saldırı</span>
            <span class="legend-item"><span class="legend-dot reachable"></span> Ulaşılabilir</span>
            <span class="legend-item"><span class="legend-dot enemy"></span> Düşman</span>
        </div>`;

        return html;
    },

    showNewCampaignModal() {
        const s = State.current;
        if (!s.wars) s.wars = { activeCampaigns: [], totalConquered: 0 };
        
        const available = GameData.warCampaigns.filter(c =>
            !s.wars.activeCampaigns.some(ac => ac.campaignId === c.id)
        );

        if (available.length === 0) {
            this.toast('Tüm seferler zaten aktif!', 'info');
            return;
        }

        let body = '<div style="display:flex;flex-direction:column;gap:10px">';
        body += `<p style="color:var(--text-dim);font-size:13px;margin-bottom:4px">Maliyet: 20 İrade + 10 Motivasyon</p>`;
        for (const c of available) {
            const terrain = GameData.terrainMods[c.terrain] || { label: '', icon: '' };
            body += `<div class="decision-item available" onclick="Engine.startCampaign('${c.id}');UI.closeModal()">
                <span class="decision-icon" style="font-size:28px">${c.icon}</span>
                <div class="decision-info">
                    <div class="decision-title">${c.name}</div>
                    <div class="decision-desc">${c.description}</div>
                    <div style="font-size:11px;color:var(--text-secondary);margin-top:2px">${terrain.icon} ${terrain.label} | ${c.provinces.length} bölge</div>
                </div>
            </div>`;
        }
        body += '</div>';

        this.showModal({
            title: '⚔ Yeni Sefer Başlat',
            body: body,
            buttons: [{ text: 'Kapat', class: '', action: () => this.closeModal() }]
        });
    },

    showCustomProvinceModal() {
        const s = State.current;
        if (!s.wars || s.wars.activeCampaigns.length === 0) {
            this.toast('Önce bir sefer başlatın!', 'warning');
            return;
        }

        let body = `<p style="color:var(--text-dim);font-size:12px;margin-bottom:10px">Aktif bir sefere özel bölge ekleyin</p>
        <div style="display:flex;flex-direction:column;gap:8px">
            <select id="custom-campaign-select" class="hoi-input">`;
        for (const camp of s.wars.activeCampaigns) {
            const cd = GameData.warCampaigns.find(c => c.id === camp.campaignId);
            body += `<option value="${camp.campaignId}">${cd ? cd.name : camp.campaignId}</option>`;
        }
        body += `</select>
            <input id="custom-province-name" class="hoi-input" placeholder="Bölge Adı" maxlength="50" />
            <input id="custom-province-task" class="hoi-input" placeholder="Görev Açıklaması" maxlength="100" />
            <input id="custom-province-defense" class="hoi-input" type="number" placeholder="Zorluk (1-50)" min="1" max="50" />
        </div>`;

        this.showModal({
            title: '🗺 Özel Bölge Ekle',
            body: body,
            buttons: [
                { text: 'Ekle', class: 'primary', action: () => this.addCustomProvince() },
                { text: 'İptal', class: '', action: () => this.closeModal() }
            ]
        });
    },

    addCustomProvince() {
        const campaignId = document.getElementById('custom-campaign-select').value;
        const name = document.getElementById('custom-province-name').value.trim();
        const task = document.getElementById('custom-province-task').value.trim();
        const defense = parseInt(document.getElementById('custom-province-defense').value) || 10;

        if (!name) { this.toast('Bölge adı girin!', 'warning'); return; }
        if (defense < 1 || defense > 50) { this.toast('Zorluk 1-50 arası olmalı!', 'warning'); return; }

        // Find the campaign data and add a new province
        const campData = GameData.warCampaigns.find(c => c.id === campaignId);
        if (!campData) return;

        // Find max col to place at the end
        let maxCol = 0, midRow = 3;
        for (const p of campData.provinces) {
            if (p.col > maxCol) maxCol = p.col;
        }

        const newProvince = {
            id: 'custom_' + Date.now(),
            name: name,
            row: midRow,
            col: maxCol + 1,
            defense: Math.max(1, Math.min(50, defense)),
            type: 'town',
            icon: '📌',
            task: task || name,
            reward: { politicalPower: Math.round(defense / 2), stability: Math.round(defense / 3) }
        };

        campData.provinces.push(newProvince);
        this.saveUserData();
        this.closeModal();
        this.updateWar();
        this.toast(`📌 Özel bölge eklendi: ${name}`, 'success');
    },

    showAssignDivisionModal(campaignId) {
        const s = State.current;
        const camp = s.wars.activeCampaigns.find(c => c.campaignId === campaignId);
        if (!camp) return;

        if (s.divisions.length === 0) {
            this.toast('Önce Askeri sekmesinden tümen oluşturun!', 'warning');
            return;
        }

        let body = '<div style="display:flex;flex-direction:column;gap:6px">';
        for (const div of s.divisions) {
            const isAssigned = camp.assignedDivisions.includes(div.id);
            const power = 5 + (div.battalions ? div.battalions.length * 2 : 0);
            const inOther = s.wars.activeCampaigns.find(c => c.campaignId !== campaignId && c.assignedDivisions.includes(div.id));
            const otherName = inOther ? GameData.warCampaigns.find(c => c.id === inOther.campaignId)?.name : null;

            body += `<div class="decision-item ${isAssigned ? '' : 'available'}" 
                onclick="${isAssigned
                    ? `Engine.unassignDivisionFromCampaign('${campaignId}','${div.id}');UI.closeModal()`
                    : `Engine.assignDivisionToCampaign('${campaignId}','${div.id}');UI.closeModal()`}">
                <span class="decision-icon">${div.icon || '🎖'}</span>
                <div class="decision-info">
                    <div class="decision-title">${div.name} <span style="color:var(--text-gold)">⚔${power}</span></div>
                    <div class="decision-desc">${isAssigned ? '✅ Bu cephede atanmış — tıkla geri çek' : (otherName ? `⚠ ${otherName} cephesinde — tıkla buraya taşı` : '🔵 Müsait — tıkla ata')}</div>
                </div>
            </div>`;
        }
        body += '</div>';

        const campData = GameData.warCampaigns.find(c => c.id === campaignId);
        this.showModal({
            title: `🎖 ${campData ? campData.name : ''} — Tümen Ata`,
            body: body,
            buttons: [{ text: 'Kapat', class: '', action: () => this.closeModal() }]
        });
    },

    // ═══════════════ STATS ═══════════════
    updateStats() {
        const s = State.current;
        const el = document.getElementById('stats-content');

        // Streak display at top
        const streakHtml = s.streak ? `
            <div class="stat-card streak-card">
                <h4>🔥 Günlük Seri</h4>
                <div class="stat-value-big streak-value">${s.streak.current || 0}</div>
                <div class="stat-label">gün üst üste | En iyi: ${s.streak.best || 0}</div>
                <div class="streak-fire">${'🔥'.repeat(Math.min(s.streak.current || 0, 10))}</div>
            </div>` : '';

        el.innerHTML = `
            ${streakHtml}
            <div class="stat-card">
                <h4>📅 Geçen Gün</h4>
                <div class="stat-value-big">${State.getTotalDays()}</div>
                <div class="stat-label">${s.totalDaysProcessed || 0} gün işlendi</div>
            </div>
            <div class="stat-card">
                <h4>🎯 Odaklar</h4>
                <div class="stat-value-big">${s.stats.focusesCompleted}</div>
                <div class="stat-label">tamamlanan odak</div>
            </div>
            <div class="stat-card">
                <h4>🔬 Araştırmalar</h4>
                <div class="stat-value-big">${s.stats.techsResearched}</div>
                <div class="stat-label">tamamlanan araştırma</div>
            </div>
            <div class="stat-card">
                <h4>📜 Kararlar</h4>
                <div class="stat-value-big">${s.stats.decisionsExecuted}</div>
                <div class="stat-label">uygulanan karar</div>
            </div>
            <div class="stat-card">
                <h4>📰 Olaylar</h4>
                <div class="stat-value-big">${s.stats.eventsHandled}</div>
                <div class="stat-label">karşılaşılan olay</div>
            </div>
            <div class="stat-card">
                <h4>💰 Toplam Kazanç</h4>
                <div class="stat-value-big">${s.stats.totalMoneyEarned.toLocaleString()}₺</div>
                <div class="stat-label">kazanılan para</div>
            </div>
            <div class="stat-card">
                <h4>⚖ En Yüksek İstikrar</h4>
                <div class="stat-value-big">${s.stats.bestStability}%</div>
                <div class="stat-label">en iyi istikrar</div>
            </div>
            <div class="stat-card">
                <h4>❤ En Yüksek Sağlık</h4>
                <div class="stat-value-big">${s.stats.bestHealth}%</div>
                <div class="stat-label">en iyi sağlık</div>
            </div>
            <div class="stat-card">
                <h4>🏭 Fabrikalar</h4>
                <div class="stat-value-big">${s.factories.civilian + s.factories.military}</div>
                <div class="stat-label">${s.factories.civilian} sivil + ${s.factories.military} askeri</div>
            </div>
            <div class="stat-card">
                <h4>🎖 Tümenler</h4>
                <div class="stat-value-big">${s.divisions.length}</div>
                <div class="stat-label">${s.divisions.filter(d => d.active).length} aktif</div>
            </div>
            <div class="stat-card">
                <h4>🤝 Diplomasi</h4>
                <div class="stat-value-big">${s.diplomacy.length}</div>
                <div class="stat-label">ilişki</div>
            </div>
            <div class="stat-card">
                <h4>✨ Ruhlar</h4>
                <div class="stat-value-big">${s.spirits.length}</div>
                <div class="stat-label">aktif ruh</div>
            </div>
            <div class="stat-card">
                <h4>⚔ Bölge Fetihleri</h4>
                <div class="stat-value-big">${s.stats.provincesConquered || 0}</div>
                <div class="stat-label">fethedilen bölge</div>
            </div>
            <div class="stat-card">
                <h4>🏆 Kazanılan Seferler</h4>
                <div class="stat-value-big">${s.stats.campaignsWon || 0}</div>
                <div class="stat-label">tamamlanan sefer</div>
            </div>
            <div class="stat-card">
                <h4>⭐ Seviye</h4>
                <div class="stat-value-big">Lv.${s.level}</div>
                <div class="stat-label">${Engine.getLevelInfo().title} — ${s.totalXpEarned} XP</div>
            </div>
            <div class="stat-card">
                <h4>🏆 Başarımlar</h4>
                <div class="stat-value-big">${s.achievements.length}/${GameData.achievements.length}</div>
                <div class="stat-label">açılan başarım</div>
            </div>
            <div class="stat-card">
                <h4>🔥 En İyi Seri</h4>
                <div class="stat-value-big">${s.stats.bestStreak}</div>
                <div class="stat-label">gün üst üste</div>
            </div>
            <div class="stat-card">
                <h4>🍅 Pomodoro</h4>
                <div class="stat-value-big">${s.stats.totalPomodoros}</div>
                <div class="stat-label">tamamlanan pomodoro</div>
            </div>
            <div class="stat-card">
                <h4>📓 Günlük</h4>
                <div class="stat-value-big">${s.stats.journalEntries}</div>
                <div class="stat-label">günlük girişi</div>
            </div>
            <div class="stat-card">
                <h4>🏋 Meydan Okuma</h4>
                <div class="stat-value-big">${s.stats.challengesCompleted}</div>
                <div class="stat-label">tamamlanan</div>
            </div>
        `;

        // Resource Charts
        this.renderResourceCharts();

        // Weekly Reports
        this.updateWeeklyReports();

        // Calendar
        this.renderCalendar();
    },

    // ═══════════════ RESOURCE CHARTS (Canvas) ═══════════════
    renderResourceCharts() {
        const container = document.getElementById('resource-charts');
        if (!container) return;
        const history = State.current.resourceHistory || [];
        if (history.length < 2) {
            container.innerHTML = '<div style="color:var(--text-dim);font-size:13px;padding:10px">Grafik için en az 2 günlük veri gerekli. Günler ilerledikçe burada kaynak değişim grafiği görünecek.</div>';
            return;
        }

        const resources = [
            { key: 'health', label: 'Sağlık', color: '#e53935' },
            { key: 'stability', label: 'İstikrar', color: '#4caf50' },
            { key: 'energy', label: 'Enerji', color: '#ffc107' },
            { key: 'money', label: 'Para', color: '#2196f3' },
            { key: 'socialEnergy', label: 'Sosyal', color: '#9c27b0' },
            { key: 'politicalPower', label: 'İrade', color: '#ff9800' }
        ];

        let html = '<div class="chart-grid">';
        for (const res of resources) {
            const canvasId = `chart-${res.key}`;
            html += `<div class="chart-card">
                <div class="chart-title" style="color:${res.color}">${res.label}</div>
                <canvas id="${canvasId}" width="280" height="120"></canvas>
            </div>`;
        }
        html += '</div>';
        container.innerHTML = html;

        // Draw charts
        for (const res of resources) {
            this._drawLineChart(`chart-${res.key}`, history, res.key, res.color);
        }
    },

    _drawLineChart(canvasId, history, key, color) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        const padding = 20;
        const data = history.map(h => h.resources[key] || 0);
        const last30 = data.slice(-30);

        ctx.clearRect(0, 0, w, h);

        if (last30.length < 2) return;

        const maxVal = Math.max(...last30, 1);
        const minVal = Math.min(...last30, 0);
        const range = maxVal - minVal || 1;

        // Grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.07)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= 4; i++) {
            const y = padding + ((h - padding * 2) * i / 4);
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(w - padding, y);
            ctx.stroke();
        }

        // Line
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        for (let i = 0; i < last30.length; i++) {
            const x = padding + (i / (last30.length - 1)) * (w - padding * 2);
            const y = h - padding - ((last30[i] - minVal) / range) * (h - padding * 2);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Area fill
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = color;
        ctx.lineTo(w - padding, h - padding);
        ctx.lineTo(padding, h - padding);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;

        // Current value label
        const lastVal = last30[last30.length - 1];
        ctx.fillStyle = color;
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(lastVal.toString(), w - 5, 14);

        // Min label
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '9px Inter, sans-serif';
        ctx.fillText(minVal.toString(), w - 5, h - 4);
    },

    // ═══════════════ CALENDAR VIEW ═══════════════
    renderCalendar() {
        const container = document.getElementById('calendar-view');
        if (!container) return;

        const s = State.current;
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startWeekDay = (firstDay.getDay() + 6) % 7; // Mon=0

        // Collect data for this month
        const journalDates = new Set(s.journal.map(j => j.date));
        const historyDates = new Set((s.resourceHistory || []).map(h => h.date));

        let html = `<div class="calendar-header">
            <span class="calendar-month">${GameData.months[month]} ${year}</span>
        </div>`;

        html += '<div class="calendar-weekdays">';
        for (const wd of ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']) {
            html += `<div class="cal-wd">${wd}</div>`;
        }
        html += '</div>';

        html += '<div class="calendar-days">';
        // Empty cells for days before month starts
        for (let i = 0; i < startWeekDay; i++) {
            html += '<div class="cal-day empty"></div>';
        }

        for (let d = 1; d <= lastDay.getDate(); d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isToday = d === today.getDate();
            const hasJournal = journalDates.has(dateStr);
            const wasActive = historyDates.has(dateStr);
            const classes = ['cal-day'];
            if (isToday) classes.push('today');
            if (hasJournal) classes.push('has-journal');
            if (wasActive) classes.push('was-active');

            const dots = [];
            if (hasJournal) dots.push('<span class="cal-dot journal" title="Günlük">📓</span>');
            if (wasActive) dots.push('<span class="cal-dot active" title="Aktif gün">✓</span>');

            html += `<div class="${classes.join(' ')}">
                <span class="cal-num">${d}</span>
                <div class="cal-dots">${dots.join('')}</div>
            </div>`;
        }
        html += '</div>';

        container.innerHTML = html;
    },

    // ═══════════════ EVENTS ═══════════════
    showEvent(event) {
        const popup = document.getElementById('event-popup');
        document.getElementById('event-header').textContent = event.title;
        document.getElementById('event-image').textContent = event.icon;
        document.getElementById('event-description').textContent = event.description;

        const optionsEl = document.getElementById('event-options');
        optionsEl.innerHTML = event.options.map((opt, idx) => 
            `<button class="event-option-btn" onclick="UI.handleEventChoice('${event.id}', ${idx})">
                ${opt.text}
                <div class="event-option-effects">${opt.effectText}</div>
            </button>`
        ).join('');

        popup.classList.remove('hidden');
    },

    handleEventChoice(eventId, optionIndex) {
        Engine.handleEventOption(eventId, optionIndex);
        document.getElementById('event-popup').classList.add('hidden');
        
        const event = GameData.events.find(e => e.id === eventId);
        if (event && event.options[optionIndex]) {
            this.toast(`${event.icon} ${event.options[optionIndex].text}`, 'info');
        }
    },

    // ═══════════════ MODAL SYSTEM ═══════════════
    showModal({ title, body, buttons }) {
        const overlay = document.getElementById('modal-overlay');
        const content = document.getElementById('modal-content');

        let html = `<div class="modal-header">
            <h3>${title}</h3>
            <button class="modal-close" onclick="UI.closeModal()">✕</button>
        </div>
        <div class="modal-body">${body}</div>`;

        if (buttons && buttons.length) {
            html += `<div class="modal-footer">`;
            buttons.forEach((btn, idx) => {
                html += `<button class="hoi-btn ${btn.class}" id="modal-btn-${idx}">${btn.text}</button>`;
            });
            html += `</div>`;
        }

        content.innerHTML = html;
        overlay.classList.remove('hidden');

        // Attach button handlers
        if (buttons) {
            buttons.forEach((btn, idx) => {
                const el = document.getElementById(`modal-btn-${idx}`);
                if (el && btn.action) {
                    el.addEventListener('click', btn.action);
                }
            });
        }
    },

    closeModal() {
        document.getElementById('modal-overlay').classList.add('hidden');
    },

    // ═══════════════ ONBOARDING WIZARD ═══════════════
    showOnboardingWizard() {
        const body = `
        <div class="onboarding-wizard">
            <p class="onboarding-intro">⚔ Hoş geldin, Komutan! Hayatını yönetmeye başlamadan önce birkaç bilgiye ihtiyacım var.</p>

            <div class="onboarding-step">
                <h4>👤 Sen Kimsin?</h4>
                <label>İsmin: <input type="text" id="ob-name" placeholder="Adın" class="onboarding-input"></label>
                <label>Unvanın: <input type="text" id="ob-title" placeholder="ör: Hayatının Lideri" class="onboarding-input"></label>
            </div>

            <div class="onboarding-step">
                <h4>🏛 İdeolojin</h4>
                <div class="onboarding-ideology-grid">
                    <label class="ideology-option"><input type="radio" name="ob-ideology" value="Demokratik" checked> 🗳 Demokratik</label>
                    <label class="ideology-option"><input type="radio" name="ob-ideology" value="Komünist"> ☭ Komünist</label>
                    <label class="ideology-option"><input type="radio" name="ob-ideology" value="Faşist"> ⚡ Faşist</label>
                    <label class="ideology-option"><input type="radio" name="ob-ideology" value="Tarafsız"> ⚖ Tarafsız</label>
                </div>
            </div>

            <div class="onboarding-step">
                <h4>💰 Ekonomin</h4>
                <label>Aylık Gelirin (₺): <input type="number" id="ob-income" value="0" min="0" class="onboarding-input"></label>
                <small style="color:var(--text-dim)">Günlük para kazancın bu değere göre hesaplanır</small>
            </div>

            <div class="onboarding-step">
                <h4>⏰ Zamanın</h4>
                <label>Günlük Serbest Saatin: <input type="number" id="ob-hours" value="8" min="1" max="24" class="onboarding-input"></label>
                <small style="color:var(--text-dim)">Günde kaç saat kendi işlerin için ayırabilirsin?</small>
            </div>

            <div class="onboarding-step">
                <h4>🏭 Başlangıç Kaynakların</h4>
                <div class="onboarding-resources-grid">
                    <label>Stabilite (0-100): <input type="number" id="ob-stability" value="50" min="0" max="100" class="onboarding-input"></label>
                    <label>Enerji (0-100): <input type="number" id="ob-energy" value="50" min="0" max="100" class="onboarding-input"></label>
                    <label>Sağlık (0-100): <input type="number" id="ob-health" value="50" min="0" max="100" class="onboarding-input"></label>
                    <label>Sosyal Enerji (0-100): <input type="number" id="ob-social" value="50" min="0" max="100" class="onboarding-input"></label>
                </div>
                <small style="color:var(--text-dim)">Şu anki durumuna göre kendini değerlendir (50 = ortalama)</small>
            </div>
        </div>`;

        this.showModal({
            title: '⚔ Hearts of Life — Kurulum',
            body: body,
            buttons: [
                { text: '🚀 Hayata Başla!', class: 'primary', action: () => {
                    this._completeOnboarding();
                }}
            ]
        });

        // Prevent closing by clicking overlay during onboarding
        document.getElementById('modal-overlay').onclick = (e) => {
            if (e.target.id === 'modal-overlay') return; // block close
        };
        // Hide close button
        const closeBtn = document.querySelector('.modal-close');
        if (closeBtn) closeBtn.style.display = 'none';
    },

    _completeOnboarding() {
        const s = State.current;

        // Profile
        s.profile.name = document.getElementById('ob-name').value.trim() || 'Komutan';
        s.profile.title = document.getElementById('ob-title').value.trim() || 'Hayatının Lideri';
        const ideology = document.querySelector('input[name="ob-ideology"]:checked');
        s.profile.ideology = ideology ? ideology.value : 'Demokratik';
        s.profile.monthlyIncome = parseInt(document.getElementById('ob-income').value) || 0;
        s.profile.freeHoursPerDay = parseInt(document.getElementById('ob-hours').value) || 8;

        // Starting resources
        s.resources.stability = Math.min(100, Math.max(0, parseInt(document.getElementById('ob-stability').value) || 50));
        s.resources.energy = Math.min(100, Math.max(0, parseInt(document.getElementById('ob-energy').value) || 50));
        s.resources.health = Math.min(100, Math.max(0, parseInt(document.getElementById('ob-health').value) || 50));
        s.resources.socialEnergy = Math.min(100, Math.max(0, parseInt(document.getElementById('ob-social').value) || 50));

        // Mark onboarding complete
        s.onboardingDone = true;
        State.save();

        // Restore overlay click behaviour
        document.getElementById('modal-overlay').onclick = (e) => {
            if (e.target.id === 'modal-overlay') UI.closeModal();
        };

        this.closeModal();

        // Process first day with correct values
        Engine.checkAndProcessDays();

        this.updateAll();
        App.loadSettingsForm();
        UI.toast(`⚔ Hoş geldin, ${s.profile.name}! Hayatını yönetmeye başla!`, 'success');
    },

    // ═══════════════ AI GENERAL — ADVISOR PANEL ═══════════════
    updateAdvisor() {
        const container = document.getElementById('advisor-content');
        if (!container) return;

        const advices = Engine.getAdvisorBriefing();
        const summary = Engine.getAdvisorSummary();
        const s = State.current;

        // General portrait & summary
        let html = `<div class="advisor-header">
            <div class="advisor-portrait">🎖</div>
            <div class="advisor-summary">
                <div class="advisor-name">Kurmay General</div>
                <div class="advisor-greeting">Komutan ${this.escapeHtml(s.profile.name)}, işte brifing:</div>
                <div class="advisor-status">${summary.split('\n').map(l => `<p>${l}</p>`).join('')}</div>
            </div>
        </div>`;

        if (advices.length === 0) {
            html += `<div class="advisor-empty">
                <span style="font-size:40px">⭐</span>
                <p>Her şey yolunda, Komutan! Devam et.</p>
            </div>`;
        } else {
            // Group by category
            const categories = {};
            for (const a of advices) {
                if (!categories[a.category]) categories[a.category] = [];
                categories[a.category].push(a);
            }

            html += '<div class="advisor-orders">';
            for (const [cat, items] of Object.entries(categories)) {
                const priorityClass = items[0].priority <= 1 ? 'urgent' : items[0].priority <= 2 ? 'important' : items[0].priority <= 3 ? 'normal' : 'low';
                html += `<div class="advisor-category ${priorityClass}">`;
                html += `<h4 class="advisor-cat-title">${cat}</h4>`;
                for (const a of items) {
                    html += `<div class="advisor-order" onclick="App.switchTab('${a.action}')">
                        <div class="advisor-order-header">
                            <span class="advisor-order-icon">${a.icon}</span>
                            <span class="advisor-order-title">${a.title}</span>
                            <span class="advisor-order-go">→</span>
                        </div>
                        <p class="advisor-order-text">${a.text}</p>
                    </div>`;
                }
                html += `</div>`;
            }
            html += '</div>';
        }

        // Quick action buttons
        html += `<div class="advisor-actions">
            <h4>⚡ Hızlı Emirler</h4>
            <div class="advisor-action-grid">
                <button class="hoi-btn primary small" onclick="App.switchTab('dashboard')">🍅 Pomodoro Başlat</button>
                <button class="hoi-btn small" onclick="App.switchTab('focus')">🎯 Odak Seç</button>
                <button class="hoi-btn small" onclick="App.switchTab('research')">🔬 Araştır</button>
                <button class="hoi-btn small" onclick="App.switchTab('journal')">📓 Günlük Yaz</button>
                <button class="hoi-btn small" onclick="App.switchTab('decisions')">📜 Karar Ver</button>
                <button class="hoi-btn small" onclick="App.switchTab('production')">🏭 İnşa Et</button>
            </div>
        </div>`;

        container.innerHTML = html;
    },

    // ═══════════════ TOAST NOTIFICATIONS ═══════════════
    toast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // ═══════════════ DAILY OBJECTIVES ═══════════════
    updateDailyObjectives() {
        const s = State.current;
        const el = document.getElementById('daily-objectives-list');
        if (!el) return;

        if (s.dailyObjectives.length === 0) {
            el.innerHTML = '<div style="color:var(--text-dim);font-size:13px;padding:6px">Henüz günlük görev eklenmedi</div>';
            return;
        }

        el.innerHTML = s.dailyObjectives.map(obj => {
            const done = obj.completedToday;
            return `<div class="daily-obj-item ${done ? 'completed' : ''}" onclick="${done ? '' : `Engine.completeDailyObjective('${obj.id}')`}">
                <span class="obj-check">${done ? '✅' : '⬜'}</span>
                <span class="obj-icon">${obj.icon}</span>
                <span class="obj-name">${this.escapeHtml(obj.name)}</span>
                <span class="obj-streak">${obj.streakCurrent > 0 ? `🔥${obj.streakCurrent}` : ''}</span>
                <button class="obj-remove" onclick="event.stopPropagation();Engine.removeDailyObjective('${obj.id}')" title="Sil">✕</button>
            </div>`;
        }).join('');
    },

    showAddObjectiveModal() {
        const body = `
            <label class="form-label">Görev Adı: <input type="text" id="obj-name" placeholder="Spor Yap" maxlength="50"></label>
            <label class="form-label">İkon: <input type="text" id="obj-icon" value="✅" maxlength="4" style="width:60px"></label>
        `;
        this.showModal({
            title: '✅ Günlük Görev Ekle',
            body: body,
            buttons: [
                { text: 'Ekle', class: 'primary', action: () => {
                    const name = document.getElementById('obj-name').value.trim();
                    const icon = document.getElementById('obj-icon').value || '✅';
                    if (name) {
                        Engine.addDailyObjective(name, icon);
                        this.closeModal();
                    } else {
                        this.toast('Görev adı girin!', 'warning');
                    }
                }},
                { text: 'İptal', class: '', action: () => this.closeModal() }
            ]
        });
    },

    // ═══════════════ POMODORO WIDGET ═══════════════
    updatePomodoroWidget() {
        const s = State.current;
        const el = document.getElementById('pomodoro-widget');
        if (!el) return;

        const remaining = Engine.getPomodoroRemaining();
        const isActive = s.pomodoro.active;

        if (isActive) {
            const mins = Math.floor(remaining / 60);
            const secs = remaining % 60;
            const typeLabel = s.pomodoro.type === 'work' ? '🍅 Çalışma' : '☕ Mola';
            const pct = Math.round(((s.pomodoro.duration - remaining) / s.pomodoro.duration) * 100);
            const linked = s.pomodoro.linkedItem;
            const linkedLabel = linked ? `<div class="pomo-linked">📎 ${this.escapeHtml(linked.name)}</div>` : '';

            el.innerHTML = `
                <div class="pomo-timer-display">
                    <div class="pomo-type">${typeLabel}</div>
                    ${linkedLabel}
                    <div class="pomo-time">${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}</div>
                    <div class="progress-bar-sm" style="margin:8px 0"><div class="fill red" style="width:${pct}%"></div></div>
                    <button class="hoi-btn danger small" onclick="Engine.stopPomodoro();UI.updatePomodoroWidget()">⏹ Durdur</button>
                </div>
                <div class="pomo-stats">Bugün: ${s.pomodoro.completedToday} 🍅 | Toplam: ${s.pomodoro.totalCompleted}</div>
            `;

            // Check completion
            if (remaining <= 0) {
                Engine.completePomodoro();
            }
        } else {
            el.innerHTML = `
                <div class="pomo-controls">
                    <button class="hoi-btn primary" onclick="UI.showPomodoroStartModal()">🍅 Çalış (25dk)</button>
                    <button class="hoi-btn secondary small" onclick="Engine.startPomodoro('break');App.startPomodoroTimer()">☕ Mola (5dk)</button>
                    <button class="hoi-btn secondary small" onclick="Engine.startPomodoro('longBreak');App.startPomodoroTimer()">🛋 Uzun Mola (15dk)</button>
                </div>
                <div class="pomo-stats" style="margin-top:8px">Bugün: ${s.pomodoro.completedToday} 🍅 | Toplam: ${s.pomodoro.totalCompleted}</div>
            `;
        }
    },

    showPomodoroStartModal() {
        const s = State.current;
        let options = [];

        // Active focus
        if (s.focus.current) {
            const f = Engine.findFocus(s.focus.current);
            if (f) options.push({ type: 'focus', id: f.id, name: f.name, icon: '🎯', desc: `${s.focus.daysRemaining} gün kaldı` });
        }

        // Active research
        for (const r of s.research.active) {
            const t = Engine.findTech(r.techId);
            if (t) options.push({ type: 'research', id: t.id, name: t.name, icon: '🔬', desc: `${Math.ceil(r.daysRemaining)} gün kaldı` });
        }

        // Active challenges
        for (const ch of s.challenges) {
            if (!ch.completed) {
                options.push({ type: 'challenge', id: ch.id, name: ch.name, icon: ch.icon || '🏋', desc: `${ch.current}/${ch.target}` });
            }
        }

        // Incomplete daily objectives
        for (const obj of s.dailyObjectives) {
            if (!obj.completedToday) {
                options.push({ type: 'objective', id: obj.id, name: obj.name, icon: '✅', desc: 'Günlük görev' });
            }
        }

        let body = '<div class="pomo-link-selector">';

        if (options.length === 0) {
            body += `<p style="color:var(--accent-red);font-size:13px;margin-bottom:10px">⚠ Aktif odak, araştırma, görev veya challenge yok. Önce bir hedef belirle!</p>`;
            body += '</div>';
            this.showModal({ title: '🍅 Pomodoro Başlat', body: body, buttons: [
                { text: 'Tamam', class: 'primary', action: () => this.closeModal() }
            ] });
            return;
        }

        body += `<p style="color:var(--text-dim);font-size:13px;margin-bottom:10px">Bu pomodoro ne için olacak?</p>`;

        for (const opt of options) {
            const data = JSON.stringify(opt).replace(/"/g, '&quot;');
            body += `<div class="pomo-link-option" onclick="UI._startLinkedPomodoro(this)" data-link="${data}">
                <span class="pomo-link-icon">${opt.icon}</span>
                <span class="pomo-link-info"><strong>${this.escapeHtml(opt.name)}</strong><small>${opt.desc}</small></span>
            </div>`;
        }

        body += '</div>';

        this.showModal({ title: '🍅 Pomodoro Başlat', body: body, buttons: [] });
    },

    _startLinkedPomodoro(el) {
        const data = JSON.parse(el.dataset.link);
        Engine.startPomodoro('work', { type: data.type, id: data.id, name: data.name });
        App.startPomodoroTimer();
        this.closeModal();
    },

    // ═══════════════ XP WIDGET ═══════════════
    updateXPWidget() {
        const el = document.getElementById('xp-widget');
        if (!el) return;
        const lvl = Engine.getLevelInfo();
        const s = State.current;

        el.innerHTML = `
            <div class="xp-level-display">
                <div class="xp-rank-badge">⭐</div>
                <div class="xp-info">
                    <div class="xp-title">${lvl.title} — Seviye ${lvl.level}</div>
                    <div class="xp-bar-big">
                        <div class="xp-bar-fill-big" style="width:${lvl.pct}%"></div>
                        <span class="xp-bar-text">${lvl.isMax ? 'MAX' : `${lvl.xpInLevel} / ${lvl.xpNeeded} XP`}</span>
                    </div>
                    <div class="xp-total">Toplam XP: ${s.totalXpEarned}</div>
                </div>
            </div>
        `;
    },

    // ═══════════════ JOURNAL ═══════════════
    updateJournal() {
        const s = State.current;
        const dateEl = document.getElementById('journal-date');
        if (!dateEl) return;
        dateEl.textContent = State.getDateString();

        // Load today's entry if exists
        const todayStr = State.getTodayString();
        const todayEntry = s.journal.find(j => j.date === todayStr);
        const textEl = document.getElementById('journal-text');
        if (textEl && todayEntry) {
            textEl.value = todayEntry.text;
        }

        // Highlight selected mood
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.classList.remove('selected');
            if (todayEntry && btn.dataset.mood === todayEntry.mood) {
                btn.classList.add('selected');
            }
        });

        // History
        const listEl = document.getElementById('journal-entries-list');
        if (!listEl) return;
        const entries = [...s.journal].reverse().slice(0, 30);

        if (entries.length === 0) {
            listEl.innerHTML = '<div style="color:var(--text-dim);font-size:13px;padding:10px">Henüz günlük girişi yok. Yukarıdan yazın!</div>';
            return;
        }

        const moodIcons = { great: '😄', good: '🙂', neutral: '😐', bad: '😟', terrible: '😩' };
        listEl.innerHTML = entries.map((e, _ji) => `
            <div class="journal-entry">
                <div class="journal-entry-header">
                    <span class="journal-entry-date">📅 ${e.date} — Gün ${e.day || '?'}</span>
                    <div style="display:flex;align-items:center;gap:6px">
                        <span class="journal-entry-mood">${moodIcons[e.mood] || '😐'}</span>
                        <button class="hoi-btn danger small" style="font-size:10px;padding:2px 5px" onclick="UI.deleteJournalEntry('${e.date}')" title="Sil">✕</button>
                    </div>
                </div>
                <div class="journal-entry-text">${this.escapeHtml(e.text)}</div>
            </div>
        `).join('');
    },

    saveJournalEntry() {
        const text = document.getElementById('journal-text').value.trim();
        if (!text) {
            this.toast('Bir şeyler yazın!', 'warning');
            return;
        }
        const selectedMood = document.querySelector('.mood-btn.selected');
        const mood = selectedMood ? selectedMood.dataset.mood : 'neutral';
        Engine.addJournalEntry(text, mood);
    },

    // ═══════════════ ACHIEVEMENTS & CHALLENGES ═══════════════
    updateAchievements() {
        const s = State.current;

        // Counts
        const countEl = document.getElementById('ach-unlocked-count');
        const totalEl = document.getElementById('ach-total-count');
        if (countEl) countEl.textContent = s.achievements.length;
        if (totalEl) totalEl.textContent = GameData.achievements.length;

        // Achievements grid
        const gridEl = document.getElementById('achievements-grid');
        if (gridEl) {
            gridEl.innerHTML = GameData.achievements.map(ach => {
                const unlocked = s.achievements.find(a => a.id === ach.id);
                return `<div class="achievement-card ${unlocked ? 'unlocked' : 'locked'}">
                    <div class="ach-icon">${ach.icon}</div>
                    <div class="ach-info">
                        <div class="ach-name">${ach.name}</div>
                        <div class="ach-desc">${ach.desc}</div>
                        ${unlocked ? `<div class="ach-date">Gün ${unlocked.unlockedDay}</div>` : this.renderAchievementProgress(ach)}
                    </div>
                </div>`;
            }).join('');
        }

        // Challenges
        const chEl = document.getElementById('challenges-list');
        if (!chEl) return;

        const active = s.challenges.filter(c => !c.completed && !c.failed);
        const completed = s.challenges.filter(c => c.completed);
        const failed = s.challenges.filter(c => c.failed);

        let html = '';
        if (active.length === 0 && completed.length === 0 && failed.length === 0) {
            html = '<div style="color:var(--text-dim);font-size:13px;padding:10px">Henüz meydan okuma yok. Bir tane oluşturun!</div>';
        }

        for (const ch of active) {
            const pct = Math.min(100, Math.round((ch.current / ch.target) * 100));
            const daysLeft = ch.deadlineDays - (s.totalDaysProcessed - ch.startDay);
            html += `<div class="challenge-card active">
                <div class="ch-header">
                    <span>${ch.icon} ${this.escapeHtml(ch.name)}</span>
                    <span class="ch-deadline">${daysLeft > 0 ? daysLeft + ' gün kaldı' : '⚠ Süre doluyor!'}</span>
                </div>
                <div class="ch-desc">${this.escapeHtml(ch.desc)}</div>
                <div class="ch-progress">
                    <div class="progress-bar-sm"><div class="fill yellow" style="width:${pct}%"></div></div>
                    <span>${ch.current}/${ch.target}</span>
                </div>
                <div class="ch-actions">
                    ${ch.type === 'manual' ? `<button class="hoi-btn primary small" onclick="Engine.incrementManualChallenge('${ch.id}')">+1</button>` : ''}
                    <button class="hoi-btn danger small" onclick="Engine.removeChallenge('${ch.id}')">Sil</button>
                </div>
            </div>`;
        }

        for (const ch of completed) {
            html += `<div class="challenge-card completed">
                <span>${ch.icon} ${this.escapeHtml(ch.name)}</span>
                <span class="ch-badge">✅ Tamamlandı</span>
            </div>`;
        }

        for (const ch of failed) {
            html += `<div class="challenge-card failed">
                <span>${ch.icon} ${this.escapeHtml(ch.name)}</span>
                <span class="ch-badge">❌ Başarısız</span>
            </div>`;
        }

        chEl.innerHTML = html;
    },

    renderAchievementProgress(ach) {
        const s = State.current;
        let value = 0;
        if (ach.check === 'level') value = s.level;
        else if (ach.check === 'bestStreak') value = s.stats.bestStreak;
        else if (ach.check === 'totalPomodoros') value = s.stats.totalPomodoros;
        else if (ach.check === 'journalEntries') value = s.stats.journalEntries;
        else if (ach.check === 'challengesCompleted') value = s.stats.challengesCompleted;
        else if (s.stats[ach.check] !== undefined) value = s.stats[ach.check];
        const pct = Math.min(100, Math.round((value / ach.target) * 100));
        return `<div class="ach-progress"><div class="progress-bar-sm"><div class="fill blue" style="width:${pct}%"></div></div><span style="font-size:10px;color:var(--text-dim)">${value}/${ach.target}</span></div>`;
    },

    showCreateChallengeModal() {
        const typeOptions = [
            { value: 'manual', label: 'Manuel (+1 butonu)' },
            { value: 'decisions', label: 'Karar sayısı' },
            { value: 'focuses', label: 'Odak tamamlama' },
            { value: 'techs', label: 'Araştırma tamamlama' },
            { value: 'pomodoros', label: 'Pomodoro tamamlama' },
            { value: 'provinces', label: 'Bölge fethi' },
            { value: 'days', label: 'Gün (otomatik)' }
        ];

        const body = `
            <label class="form-label">Meydan Okuma Adı: <input type="text" id="ch-name" placeholder="Bu hafta 5 karar al" maxlength="60"></label>
            <label class="form-label">Açıklama: <input type="text" id="ch-desc" placeholder="Detaylar..." maxlength="100"></label>
            <label class="form-label">İkon: <input type="text" id="ch-icon" value="🏋" maxlength="4" style="width:60px"></label>
            <label class="form-label">Takip Türü: 
                <select id="ch-type">
                    ${typeOptions.map(t => `<option value="${t.value}">${t.label}</option>`).join('')}
                </select>
            </label>
            <label class="form-label">Hedef Sayı: <input type="number" id="ch-target" value="5" min="1" max="999"></label>
            <label class="form-label">Süre (gün): <input type="number" id="ch-deadline" value="7" min="1" max="365"></label>
            <h4 style="margin-top:10px;margin-bottom:6px">Ödül</h4>
            <label class="form-label">Bonus XP: <input type="number" id="ch-reward-xp" value="20" min="0"></label>
            <label class="form-label">Bonus İrade: <input type="number" id="ch-reward-pp" value="10" min="0"></label>
        `;

        this.showModal({
            title: '🏋 Meydan Okuma Oluştur',
            body: body,
            buttons: [
                { text: 'Oluştur', class: 'primary', action: () => {
                    const name = document.getElementById('ch-name').value.trim();
                    if (!name) { this.toast('İsim girin!', 'warning'); return; }
                    const desc = document.getElementById('ch-desc').value.trim();
                    const icon = document.getElementById('ch-icon').value || '🏋';
                    const type = document.getElementById('ch-type').value;
                    const target = parseInt(document.getElementById('ch-target').value) || 5;
                    const deadline = parseInt(document.getElementById('ch-deadline').value) || 7;
                    const reward = {};
                    const xp = parseInt(document.getElementById('ch-reward-xp').value) || 0;
                    const pp = parseInt(document.getElementById('ch-reward-pp').value) || 0;
                    if (xp > 0) reward.xp = xp;
                    if (pp > 0) reward.politicalPower = pp;
                    Engine.addChallenge(name, desc, icon, type, target, deadline, reward);
                    this.closeModal();
                }},
                { text: 'İptal', class: '', action: () => this.closeModal() }
            ]
        });
    },

    // ═══════════════ DAILY REMINDERS MODAL ═══════════════
    showMandatoryBlockerModal(reminders) {
        let body = `<div class="blocker-intro">
            <p style="color:var(--accent-gold);font-size:15px;font-weight:600;margin-bottom:10px">📋 Bugün yapman gerekenler:</p>
        </div>`;

        body += '<div class="blocker-list">';
        for (const r of reminders) {
            body += `<div class="blocker-item" onclick="UI.closeModal();App.switchTab('${r.tab}')">
                <span class="blocker-icon">${r.icon}</span>
                <span class="blocker-text">${r.text}</span>
                <span class="blocker-go">→ Git</span>
            </div>`;
        }
        body += '</div>';

        body += `<p style="color:var(--text-dim);font-size:12px;margin-top:12px">Gün otomatik ilerledi. Bu hatırlatmaları tamamlamayı unutma!</p>`;

        this.showModal({
            title: '📌 Günlük Hatırlatma',
            body: body,
            buttons: [
                { text: 'Kapat', class: 'secondary', action: () => {
                    this.closeModal();
                }},
                { text: 'Tamam, Tamamlayayım', class: 'primary', action: () => {
                    this.closeModal();
                    // Navigate to first reminder's tab
                    if (reminders.length > 0 && reminders[0].tab) {
                        App.switchTab(reminders[0].tab);
                    }
                }}
            ]
        });
    },

    // ═══════════════ BOTTOM BAR ALERTS ═══════════════
    updateBottomAlerts() {
        const el = document.getElementById('bottom-alerts');
        if (!el) return;
        const s = State.current;

        // Show critical unfilled items in bottom bar
        const criticals = (s.alerts || []).filter(a => a.type === 'action' || a.type === 'warning');
        if (criticals.length === 0) {
            el.innerHTML = '';
            return;
        }

        const first3 = criticals.slice(0, 3);
        el.innerHTML = first3.map(a => {
            const clickAttr = a.tab ? ` onclick="App.switchTab('${a.tab}')"` : '';
            return `<span class="bottom-alert-chip ${a.type}"${clickAttr}>${a.icon} ${a.text}</span>`;
        }).join('');

        if (criticals.length > 3) {
            el.innerHTML += `<span class="bottom-alert-chip info" style="cursor:default">+${criticals.length - 3} daha</span>`;
        }
    },

    // ═══════════════ WEEKLY REPORTS ═══════════════
    updateWeeklyReports() {
        const el = document.getElementById('weekly-reports-list');
        if (!el) return;
        const reports = [...State.current.weeklyReports].reverse();

        if (reports.length === 0) {
            el.innerHTML = '<div style="color:var(--text-dim);font-size:13px;padding:10px">Henüz haftalık rapor yok. Her 7 günde bir otomatik oluşturulur.</div>';
            return;
        }

        el.innerHTML = reports.map(r => {
            const gradeColors = { S: '#ffd700', A: '#4caf50', B: '#2196f3', C: '#ff9800', D: '#f44336', F: '#9e9e9e' };
            return `<div class="weekly-report-card">
                <div class="wr-header">
                    <span>📋 Hafta #${r.weekNumber}</span>
                    <span class="wr-grade" style="color:${gradeColors[r.grade] || '#fff'}">${r.grade}</span>
                </div>
                <div class="wr-date">${r.date || ''} — Gün ${r.startDay}-${r.endDay}</div>
                <div class="wr-stats">
                    <span>📅 ${r.daysActive} gün aktif</span>
                    <span>🎯 ${r.focusesCompleted} odak</span>
                    <span>🔬 ${r.techsCompleted} araştırma</span>
                    <span>📜 ${r.decisionsExecuted} karar</span>
                    <span>🍅 ${r.pomodorosCompleted} pomodoro</span>
                    <span>✅ ${r.objectivesCompleted} görev</span>
                    <span>📓 ${r.journalEntries} günlük</span>
                    <span>⭐ +${r.xpEarned} XP</span>
                </div>
                <div class="wr-score">Puan: ${r.score}</div>
            </div>`;
        }).join('');
    },

    // ═══════════════ TEMPLATE SELECTOR ═══════════════
    showTemplateSelector() {
        let body = '<div class="template-grid">';
        for (const tmpl of GameData.templates) {
            body += `<div class="template-card" onclick="Engine.applyTemplate('${tmpl.id}');UI.closeModal()">
                <div class="template-name">${tmpl.name}</div>
                <div class="template-desc">${tmpl.desc}</div>
                <div class="template-contents">
                    <span>🎯 ${tmpl.focusBranches.length} dal</span>
                    <span>🔬 ${tmpl.techCategories.length} kategori</span>
                    <span>📜 ${tmpl.decisionCategories.length} karar grubu</span>
                    <span>✅ ${tmpl.dailyObjectives.length} günlük görev</span>
                </div>
            </div>`;
        }
        body += '</div>';
        body += '<p style="color:var(--text-dim);font-size:11px;margin-top:10px">Şablonlar mevcut içeriğinize eklenir, üzerine yazılmaz.</p>';

        this.showModal({
            title: '🏁 Hazır Şablonlar',
            body: body,
            buttons: [
                { text: 'Kapat', class: 'secondary', action: () => this.closeModal() }
            ]
        });
    },

    // ═══════════════ HELPERS ═══════════════
    resourceLabel(key) {
        const labels = {
            politicalPower: 'İrade',
            stability: 'İstikrar',
            warSupport: 'Motivasyon',
            energy: 'Enerji',
            money: 'Para',
            health: 'Sağlık',
            socialEnergy: 'Sosyal',
            civFactory: 'Sivil Fab.',
            milFactory: 'Askeri Fab.',
            researchSlot: 'Araştırma Slotu',
            researchSpeed: 'Araştırma Hızı'
        };
        return labels[key] || key;
    },

    escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    },

    // ═══════════════ MORNING BRIEFING ═══════════════
    showMorningBriefing() {
        if (!Engine.shouldShowBriefing()) return;
        Engine.markBriefingShown();

        const s = State.current;
        const todayStr = State.getTodayString();
        const score = Engine.calculateProductivityScore();
        const advices = Engine.getAdvisorBriefing().slice(0, 3);

        // Gather today's summary
        const uncompleted = s.dailyObjectives.filter(o => !o.completedToday).length;
        const totalObj = s.dailyObjectives.length;
        const focusInfo = s.focus.current ? `🎯 ${s.focus.current} (${s.focus.daysRemaining} gün kaldı)` : '❌ Odak seçilmedi';
        const researchInfo = `${s.research.active.length}/${s.researchSlots} araştırma aktif`;
        const pomosToday = s.pomodoro.completedToday || 0;
        const streakEmoji = s.streak.current > 0 ? '🔥'.repeat(Math.min(5, s.streak.current)) : '—';
        const weekDay = State.getWeekDay();

        // Yesterday's score
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = yesterday.toISOString().slice(0, 10);
        const yScore = s.activityLog[yStr] || 0;

        let body = `
            <div class="briefing-header">
                <div class="briefing-date">${weekDay}, ${State.getDateString()}</div>
                <div class="briefing-greeting">Günaydın, Komutan ${this.escapeHtml(s.profile.name)}!</div>
            </div>
            <div class="briefing-grid">
                <div class="briefing-stat">
                    <div class="briefing-stat-value">${s.streak.current}</div>
                    <div class="briefing-stat-label">${streakEmoji} Gün Seri</div>
                </div>
                <div class="briefing-stat">
                    <div class="briefing-stat-value">${yScore}</div>
                    <div class="briefing-stat-label">📊 Dünkü Skor</div>
                </div>
                <div class="briefing-stat">
                    <div class="briefing-stat-value">${uncompleted}/${totalObj}</div>
                    <div class="briefing-stat-label">✅ Görev Bekliyor</div>
                </div>
                <div class="briefing-stat">
                    <div class="briefing-stat-value">${pomosToday}</div>
                    <div class="briefing-stat-label">🍅 Bugünkü Pomo</div>
                </div>
            </div>
            <div class="briefing-info">
                <div>${focusInfo}</div>
                <div>🔬 ${researchInfo}</div>
            </div>`;

        if (advices.length > 0) {
            body += `<div class="briefing-advices"><h4>🎖 Kurmay Tavsiyeler:</h4>`;
            for (const a of advices) {
                body += `<div class="briefing-advice">${a.icon} <strong>${a.title}</strong> — ${a.text}</div>`;
            }
            body += `</div>`;
        }

        // Weekly goals reminder
        Engine.checkWeeklyGoalsReset();
        const wGoals = s.weeklyGoals;
        const wDone = wGoals.filter(g => g.done).length;
        if (wGoals.length > 0) {
            body += `<div class="briefing-weekly">📋 Haftalık Hedef: ${wDone}/${wGoals.length} tamamlandı</div>`;
        }

        this.showModal({
            title: '☀ Sabah Brifing',
            body: body,
            buttons: [
                { text: '🧘 Odak Moduna Geç', class: 'secondary', action: () => { UI.closeModal(); Engine.toggleFocusMode(); } },
                { text: 'Haydi Başlayalım!', class: 'primary', action: () => UI.closeModal() }
            ]
        });
    },

    // ═══════════════ PRODUCTIVITY SCORE WIDGET ═══════════════
    updateProductivityScore() {
        const el = document.getElementById('productivity-widget');
        if (!el) return;

        const result = Engine.calculateProductivityScore();
        const score = result.score;
        const bd = result.breakdown;

        let grade, gradeClass;
        if (score >= 80) { grade = 'S'; gradeClass = 'grade-s'; }
        else if (score >= 60) { grade = 'A'; gradeClass = 'grade-a'; }
        else if (score >= 40) { grade = 'B'; gradeClass = 'grade-b'; }
        else if (score >= 20) { grade = 'C'; gradeClass = 'grade-c'; }
        else { grade = 'D'; gradeClass = 'grade-d'; }

        el.innerHTML = `
            <div class="prod-score-ring">
                <svg viewBox="0 0 100 100" class="prod-svg">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="var(--border)" stroke-width="6"/>
                    <circle cx="50" cy="50" r="42" fill="none" stroke="var(--gold)" stroke-width="6"
                        stroke-dasharray="${score * 2.64} ${264 - score * 2.64}"
                        stroke-dashoffset="66" stroke-linecap="round"
                        style="transition: stroke-dasharray 0.8s ease"/>
                </svg>
                <div class="prod-score-center">
                    <span class="prod-score-num">${score}</span>
                    <span class="prod-score-grade ${gradeClass}">${grade}</span>
                </div>
            </div>
            <div class="prod-breakdown">
                <div class="prod-bar-row"><span>🍅 Pomodoro</span><div class="prod-bar"><div style="width:${bd.pomodoro * 4}%"></div></div><span>${bd.pomodoro}</span></div>
                <div class="prod-bar-row"><span>✅ Görevler</span><div class="prod-bar"><div style="width:${bd.objectives * 4}%"></div></div><span>${bd.objectives}</span></div>
                <div class="prod-bar-row"><span>📓 Günlük</span><div class="prod-bar"><div style="width:${bd.journal * 10}%"></div></div><span>${bd.journal}</span></div>
                <div class="prod-bar-row"><span>🎯 Odak</span><div class="prod-bar"><div style="width:${bd.focus * 10}%"></div></div><span>${bd.focus}</span></div>
                <div class="prod-bar-row"><span>🔬 Araştırma</span><div class="prod-bar"><div style="width:${bd.research * 10}%"></div></div><span>${bd.research}</span></div>
                <div class="prod-bar-row"><span>🔥 Seri</span><div class="prod-bar"><div style="width:${bd.streak * 10}%"></div></div><span>${bd.streak}</span></div>
            </div>
        `;
    },

    // ═══════════════ WEEKLY GOALS ═══════════════
    updateWeeklyGoals() {
        const el = document.getElementById('weekly-goals-widget');
        if (!el) return;

        Engine.checkWeeklyGoalsReset();
        const s = State.current;
        const goals = s.weeklyGoals;
        const weekStr = s.weeklyGoalsWeek || '';

        let html = `<div class="weekly-goals-header">
            <span class="weekly-goals-week">${weekStr}</span>
            <span class="weekly-goals-progress">${goals.filter(g => g.done).length}/${goals.length}</span>
        </div>`;

        if (goals.length === 0) {
            html += `<div style="color:var(--text-dim);font-size:13px;padding:6px">Bu hafta için hedef eklenmedi</div>`;
        } else {
            html += `<div class="weekly-goals-list">`;
            for (const g of goals) {
                html += `<div class="weekly-goal-item ${g.done ? 'done' : ''}">
                    <label style="display:flex;align-items:center;gap:6px;flex:1;cursor:pointer">
                        <input type="checkbox" ${g.done ? 'checked' : ''} onchange="Engine.toggleWeeklyGoal(${g.id}); UI.updateWeeklyGoals()">
                        <span>${this.escapeHtml(g.text)}</span>
                    </label>
                    <button class="delete-btn-small" onclick="Engine.removeWeeklyGoal(${g.id}); UI.updateWeeklyGoals()" title="Sil">✕</button>
                </div>`;
            }
            html += `</div>`;
        }

        html += `<div class="weekly-goal-add">
            <input type="text" id="weekly-goal-input" placeholder="Yeni haftalık hedef..." 
                   onkeydown="if(event.key==='Enter'){UI.addWeeklyGoalFromInput()}" maxlength="100">
            <button class="hoi-btn small" onclick="UI.addWeeklyGoalFromInput()">+</button>
        </div>`;

        el.innerHTML = html;
    },

    addWeeklyGoalFromInput() {
        const input = document.getElementById('weekly-goal-input');
        if (!input || !input.value.trim()) return;
        Engine.addWeeklyGoal(input.value);
        input.value = '';
        this.updateWeeklyGoals();
    },

    // ═══════════════ QUICK NOTES ═══════════════
    updateQuickNotes() {
        const el = document.getElementById('quick-notes-widget');
        if (!el) return;

        el.innerHTML = `
            <textarea id="quick-notes-textarea" rows="5" placeholder="Hızlı notlar, fikirler, yapılacaklar..."
                      style="width:100%;box-sizing:border-box;background:var(--bg-dark);color:var(--text);border:1px solid var(--border);border-radius:4px;padding:8px;font-size:13px;resize:vertical;font-family:inherit"
                      oninput="Engine.saveQuickNotes(this.value)">${this.escapeHtml(State.current.quickNotes || '')}</textarea>
            <div style="font-size:11px;color:var(--text-dim);margin-top:4px">💡 Otomatik kaydedilir</div>
        `;
    },

    // ═══════════════ ACTIVITY HEATMAP ═══════════════
    renderActivityHeatmap() {
        const el = document.getElementById('activity-heatmap');
        if (!el) return;

        const log = State.current.activityLog || {};
        const today = new Date();
        const weeks = 20; // Show ~5 months
        const totalDays = weeks * 7;

        // Build day cells going back from today
        let html = `<div class="heatmap-container">`;

        // Month labels
        html += `<div class="heatmap-months">`;
        const seenMonths = {};
        for (let i = totalDays - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const monthKey = d.getMonth();
            const weekIdx = Math.floor((totalDays - 1 - i) / 7);
            if (!seenMonths[monthKey]) {
                seenMonths[monthKey] = weekIdx;
            }
        }
        const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
        let lastMonthPx = -1;
        for (const [month, weekIdx] of Object.entries(seenMonths)) {
            const left = weekIdx * 14;
            if (left - lastMonthPx > 28) {
                html += `<span style="left:${left}px">${monthNames[parseInt(month)]}</span>`;
                lastMonthPx = left;
            }
        }
        html += `</div>`;

        // Grid
        html += `<div class="heatmap-grid" style="grid-template-columns:repeat(${weeks},12px)">`;
        for (let i = totalDays - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().slice(0, 10);
            const score = log[dateStr] || 0;

            let level;
            if (score === 0) level = 0;
            else if (score < 20) level = 1;
            else if (score < 40) level = 2;
            else if (score < 60) level = 3;
            else level = 4;

            const title = `${dateStr}: ${score} puan`;
            html += `<div class="heatmap-cell level-${level}" title="${title}"></div>`;
        }
        html += `</div>`;

        // Legend
        html += `<div class="heatmap-legend">
            <span>Az</span>
            <div class="heatmap-cell level-0"></div>
            <div class="heatmap-cell level-1"></div>
            <div class="heatmap-cell level-2"></div>
            <div class="heatmap-cell level-3"></div>
            <div class="heatmap-cell level-4"></div>
            <span>Çok</span>
        </div>`;

        html += `</div>`;
        el.innerHTML = html;
    },

    // ═══════════════ FOCUS MODE BUTTON ═══════════════
    updateFocusModeBtn() {
        const btn = document.getElementById('focus-mode-btn');
        if (!btn) return;
        const active = State.current.focusModeActive;
        btn.textContent = active ? '🔓 Odak Modundan Çık' : '🧘 Odak Modu';
        btn.className = active ? 'hoi-btn danger' : 'hoi-btn secondary';
    }
};
