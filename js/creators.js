/* ═══════════════════════════════════════════════════════════
   HEARTS OF LIFE — Content Creators
   UI forms for user-defined game content
   ═══════════════════════════════════════════════════════════ */

Object.assign(UI, {

    // ── Auto-Balance UI Helpers ──
    _abDebounce: null,

    autoBalancePowerHtml(prefix, defaultPower) {
        const p = defaultPower || 3;
        const stars = [1,2,3,4,5].map(n =>
            `<label class="ab-star-label"><input type="radio" name="${prefix}-power" value="${n}" ${n === p ? 'checked' : ''} onchange="UI.triggerAutoBalance('${prefix}')"><span class="ab-star">${'⭐'.repeat(n)}</span></label>`
        ).join('');
        return `<div class="ab-power-selector">
            <div class="ab-power-title">Etki Gücü:</div>
            <div class="ab-power-options">${stars}</div>
        </div>
        <div id="${prefix}-auto-preview" class="ab-preview"></div>`;
    },

    getAutoBalancePower(prefix) {
        const checked = document.querySelector(`input[name="${prefix}-power"]:checked`);
        return checked ? parseInt(checked.value) : 3;
    },

    triggerAutoBalance(prefix) {
        clearTimeout(this._abDebounce);
        this._abDebounce = setTimeout(() => this._runAutoBalance(prefix), 200);
    },

    _runAutoBalance(prefix) {
        const nameEl = document.getElementById(`${prefix}-name`) || document.getElementById(`${prefix}-title`);
        const descEl = document.getElementById(`${prefix}-desc`);
        const typeEl = document.getElementById(`${prefix}-type`);
        const text = (nameEl ? nameEl.value : '') + ' ' + (descEl ? descEl.value : '');
        const power = this.getAutoBalancePower(prefix);
        const container = document.getElementById(`${prefix}-auto-preview`);
        if (!container) return;

        if (prefix === 'spirit') {
            const type = typeEl ? typeEl.value : 'positive';
            const spiritFx = Engine.autoBalance.calculateSpirit(text, type, power);
            let html = '<div class="ab-preview-title">⚖ Hesaplanan Etkiler:</div><div class="ab-tags">';
            spiritFx.forEach(e => {
                html += `<span class="ab-tag ${e.value > 0 ? 'positive' : 'negative'}">${e.text}</span>`;
            });
            html += '</div>';
            container.innerHTML = html;
            return;
        }

        if (prefix === 'ev') {
            const options = Engine.autoBalance.calculateEventOptions(text, power);
            const weight = Math.max(1, Math.min(20, power * 4));
            let html = '<div class="ab-preview-title">⚖ Hesaplanan Olay:</div>';
            html += `<div class="ab-meta">🎲 Ağırlık: <b>${weight}</b></div>`;
            options.forEach((o, i) => {
                html += `<div class="ab-meta">${i + 1}. ${o.text}: <span class="ab-tag positive">${o.effectText}</span></div>`;
            });
            container.innerHTML = html;
            return;
        }

        const result = Engine.autoBalance.calculate(text, power);
        let html = '<div class="ab-preview-title">⚖ Hesaplanan Değerler:</div>';
        if (prefix !== 'tmpl') {
            html += `<div class="ab-meta">📅 Süre: <b>${result.days} gün</b></div>`;
        }
        html += '<div class="ab-tags">' + Engine.autoBalance.formatEffects(result.effects) + '</div>';
        if (prefix === 'dec') {
            html += '<div class="ab-meta" style="margin-top:4px">💰 Maliyet:</div>';
            html += '<div class="ab-tags">' + Engine.autoBalance.formatCost(result.cost) + '</div>';
            html += `<div class="ab-meta">⏳ Bekleme: <b>${result.cooldown} gün</b></div>`;
        }
        container.innerHTML = html;
    },

    // ── Save all GameData content back to state ──
    saveUserData() {
        if (!State.current.userData) State.current.userData = {};
        const ud = State.current.userData;
        ud.focusBranches = GameData.focusTree.branches;
        ud.techCategories = GameData.technologies.categories;
        ud.events = GameData.events;
        ud.decisionCategories = GameData.decisions.categories;
        ud.spirits = GameData.defaultSpirits;
        ud.divisionTemplates = GameData.divisionTemplates;
        ud.productionItems = GameData.productionItems;
        ud.constructionItems = GameData.constructionItems;
        ud.warCampaigns = GameData.warCampaigns;
        State.save();
    },

    // ── Helpers: Resource option HTML for dropdowns ──
    getResourceOptions() {
        return [
            ['politicalPower', 'İrade'],
            ['stability', 'İstikrar'],
            ['warSupport', 'Motivasyon'],
            ['energy', 'Enerji'],
            ['money', 'Para'],
            ['health', 'Sağlık'],
            ['socialEnergy', 'Sosyal Enerji'],
            ['civFactory', 'Sivil Fabrika'],
            ['milFactory', 'Askeri Fabrika'],
            ['researchSlot', 'Araştırma Slotu'],
            ['researchSpeed', 'Araştırma Hızı']
        ].map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
    },

    // Effects editor HTML block
    effectsEditorHtml(prefix) {
        return `<div id="${prefix}-effects-container" class="effects-editor"></div>
        <button type="button" class="hoi-btn small secondary" onclick="UI.addEffectRow('${prefix}')">+ Etki Ekle</button>`;
    },

    addEffectRow(prefix) {
        const container = document.getElementById(`${prefix}-effects-container`);
        if (!container) return;
        const row = document.createElement('div');
        row.className = 'effect-editor-row';
        row.innerHTML = `
            <select class="hoi-input effect-res"><option value="">Kaynak...</option>${this.getResourceOptions()}</select>
            <input type="number" class="hoi-input effect-val" placeholder="±miktar" style="width:90px">
            <button type="button" class="hoi-btn danger small" onclick="this.parentElement.remove()">✕</button>
        `;
        container.appendChild(row);
    },

    collectEffects(prefix) {
        const container = document.getElementById(`${prefix}-effects-container`);
        if (!container) return {};
        const effects = {};
        container.querySelectorAll('.effect-editor-row').forEach(row => {
            const res = row.querySelector('.effect-res').value;
            const val = parseInt(row.querySelector('.effect-val').value);
            if (res && !isNaN(val) && val !== 0) effects[res] = val;
        });
        return effects;
    },

    // Spirit effects editor (stat + value + text format)
    spiritEffectsEditorHtml(prefix) {
        return `<div id="${prefix}-seffects-container" class="effects-editor"></div>
        <button type="button" class="hoi-btn small secondary" onclick="UI.addSpiritEffectRow('${prefix}')">+ Etki Ekle</button>`;
    },

    addSpiritEffectRow(prefix) {
        const container = document.getElementById(`${prefix}-seffects-container`);
        if (!container) return;
        const row = document.createElement('div');
        row.className = 'effect-editor-row';
        row.innerHTML = `
            <select class="hoi-input effect-res"><option value="">Kaynak...</option>${this.getResourceOptions()}</select>
            <input type="number" class="hoi-input effect-val" placeholder="±" style="width:70px">
            <input type="text" class="hoi-input effect-text" placeholder="Açıklama" style="flex:1">
            <button type="button" class="hoi-btn danger small" onclick="this.parentElement.remove()">✕</button>
        `;
        container.appendChild(row);
    },

    collectSpiritEffects(prefix) {
        const container = document.getElementById(`${prefix}-seffects-container`);
        if (!container) return [];
        const effects = [];
        container.querySelectorAll('.effect-editor-row').forEach(row => {
            const stat = row.querySelector('.effect-res').value;
            const value = parseInt(row.querySelector('.effect-val').value);
            const textEl = row.querySelector('.effect-text');
            const text = textEl ? textEl.value : '';
            if (stat && !isNaN(value)) {
                effects.push({
                    stat, value,
                    text: text || `${UI.resourceLabel(stat)}: ${value > 0 ? '+' : ''}${value}`
                });
            }
        });
        return effects;
    },

    // ══════════════════════════════════════════════════
    //  FOCUS TREE CREATORS
    // ══════════════════════════════════════════════════

    showCreateBranchModal() {
        const body = `
            <label class="form-label">Dal Adı:
                <input type="text" id="branch-name" class="hoi-input" placeholder="💼 Kariyer Yolu">
            </label>
        `;
        this.showModal({
            title: '🌿 Yeni Odak Dalı',
            body,
            buttons: [
                { text: 'Oluştur', class: 'primary', action: () => this.createBranch() },
                { text: 'İptal', class: '', action: () => this.closeModal() }
            ]
        });
    },

    createBranch() {
        const name = document.getElementById('branch-name').value.trim();
        if (!name) { this.toast('Dal adı girin!', 'warning'); return; }
        GameData.focusTree.branches.push({
            id: 'branch_' + Date.now(),
            name,
            focuses: []
        });
        this.saveUserData();
        this.closeModal();
        this.updateAll();
        this.toast(`🌿 Dal oluşturuldu: ${name}`, 'success');
    },

    showCreateFocusModal() {
        if (GameData.focusTree.branches.length === 0) {
            this.toast('Önce bir dal oluşturun!', 'warning');
            return;
        }
        const branchOpts = GameData.focusTree.branches.map(b =>
            `<option value="${b.id}">${b.name}</option>`
        ).join('');

        const allFocuses = [];
        GameData.focusTree.branches.forEach(b => b.focuses.forEach(f => allFocuses.push(f)));
        const reqOpts = allFocuses.map(f =>
            `<label class="checkbox-label"><input type="checkbox" value="${f.id}"> ${f.icon || ''} ${f.name}</label>`
        ).join('');

        const body = `
            <label class="form-label">Dal:<select id="focus-branch" class="hoi-input">${branchOpts}</select></label>
            <label class="form-label">Adı:<input type="text" id="focus-name" class="hoi-input" placeholder="Kariyer Değerlendirmesi" oninput="UI.triggerAutoBalance('focus')"></label>
            <div class="form-row">
                <label class="form-label" style="flex:1">İkon:<input type="text" id="focus-icon" class="hoi-input" placeholder="🔍" maxlength="4"></label>
            </div>
            <label class="form-label">Açıklama:<textarea id="focus-desc" class="hoi-input" rows="2" placeholder="Bu odağın açıklaması..." oninput="UI.triggerAutoBalance('focus')"></textarea></label>
            ${allFocuses.length > 0 ? `<div class="form-label">Gereksinimler:<div class="checkbox-group" id="focus-reqs">${reqOpts}</div></div>` : ''}
            ${this.autoBalancePowerHtml('focus', 3)}
        `;

        this.showModal({
            title: '🎯 Yeni Odak',
            body,
            buttons: [
                { text: 'Oluştur', class: 'primary', action: () => this.createFocus() },
                { text: 'İptal', class: '', action: () => this.closeModal() }
            ]
        });
    },

    createFocus() {
        const branchId = document.getElementById('focus-branch').value;
        const name = document.getElementById('focus-name').value.trim();
        const icon = document.getElementById('focus-icon').value || '🎯';
        const desc = document.getElementById('focus-desc').value.trim();
        const power = this.getAutoBalancePower('focus');
        const calc = Engine.autoBalance.calculate(name + ' ' + desc, power);

        if (!name) { this.toast('Odak adı girin!', 'warning'); return; }

        const requires = [];
        const reqEls = document.querySelectorAll('#focus-reqs input:checked');
        if (reqEls) reqEls.forEach(cb => requires.push(cb.value));

        const branch = GameData.focusTree.branches.find(b => b.id === branchId);
        if (!branch) return;

        branch.focuses.push({
            id: 'focus_' + Date.now(),
            name, icon, days: calc.days, requires, tier: calc.tier,
            description: desc || name,
            effects: calc.effects
        });

        this.saveUserData();
        this.closeModal();
        this.updateAll();
        this.toast(`🎯 Odak oluşturuldu: ${name}`, 'success');
    },

    deleteFocus(focusId) {
        for (const branch of GameData.focusTree.branches) {
            const idx = branch.focuses.findIndex(f => f.id === focusId);
            if (idx >= 0) {
                const name = branch.focuses[idx].name;
                branch.focuses.splice(idx, 1);
                branch.focuses.forEach(f => {
                    f.requires = f.requires.filter(r => r !== focusId);
                });
                this.saveUserData();
                this.updateAll();
                this.toast(`🗑 Odak silindi: ${name}`, 'info');
                return;
            }
        }
    },

    deleteBranch(branchId) {
        const idx = GameData.focusTree.branches.findIndex(b => b.id === branchId);
        if (idx >= 0) {
            const name = GameData.focusTree.branches[idx].name;
            GameData.focusTree.branches.splice(idx, 1);
            this.saveUserData();
            this.updateAll();
            this.toast(`🗑 Dal silindi: ${name}`, 'info');
        }
    },

    // ══════════════════════════════════════════════════
    //  RESEARCH / TECHNOLOGY CREATORS
    // ══════════════════════════════════════════════════

    showCreateTechCategoryModal() {
        const body = `
            <label class="form-label">Kategori Adı:<input type="text" id="techcat-name" class="hoi-input" placeholder="🍳 Yaşam Becerileri"></label>
            <label class="form-label">İkon:<input type="text" id="techcat-icon" class="hoi-input" placeholder="🍳" maxlength="4"></label>
        `;
        this.showModal({
            title: '🔬 Yeni Araştırma Kategorisi',
            body,
            buttons: [
                { text: 'Oluştur', class: 'primary', action: () => this.createTechCategory() },
                { text: 'İptal', class: '', action: () => this.closeModal() }
            ]
        });
    },

    createTechCategory() {
        const name = document.getElementById('techcat-name').value.trim();
        const icon = document.getElementById('techcat-icon').value || '🔬';
        if (!name) { this.toast('Kategori adı girin!', 'warning'); return; }
        GameData.technologies.categories.push({ id: 'cat_' + Date.now(), name, icon, techs: [] });
        this.saveUserData();
        this.closeModal();
        this.updateAll();
        this.toast(`🔬 Kategori oluşturuldu: ${name}`, 'success');
    },

    showCreateTechModal() {
        if (GameData.technologies.categories.length === 0) {
            this.toast('Önce bir kategori oluşturun!', 'warning');
            return;
        }
        const catOpts = GameData.technologies.categories.map(c =>
            `<option value="${c.id}">${c.icon} ${c.name}</option>`
        ).join('');

        const allTechs = [];
        GameData.technologies.categories.forEach(c => c.techs.forEach(t => allTechs.push(t)));
        const reqOpts = allTechs.map(t =>
            `<label class="checkbox-label"><input type="checkbox" value="${t.id}"> ${t.icon || ''} ${t.name}</label>`
        ).join('');

        const body = `
            <label class="form-label">Kategori:<select id="tech-cat" class="hoi-input">${catOpts}</select></label>
            <label class="form-label">Adı:<input type="text" id="tech-name" class="hoi-input" placeholder="Temel Yemek Yapma" oninput="UI.triggerAutoBalance('tech')"></label>
            <div class="form-row">
                <label class="form-label" style="flex:1">İkon:<input type="text" id="tech-icon" class="hoi-input" placeholder="🍳" maxlength="4"></label>
            </div>
            <label class="form-label">Açıklama:<textarea id="tech-desc" class="hoi-input" rows="2" oninput="UI.triggerAutoBalance('tech')"></textarea></label>
            ${allTechs.length > 0 ? `<div class="form-label">Gereksinimler:<div class="checkbox-group" id="tech-reqs">${reqOpts}</div></div>` : ''}
            ${this.autoBalancePowerHtml('tech', 3)}
        `;

        this.showModal({
            title: '🔬 Yeni Teknoloji',
            body,
            buttons: [
                { text: 'Oluştur', class: 'primary', action: () => this.createTech() },
                { text: 'İptal', class: '', action: () => this.closeModal() }
            ]
        });
    },

    createTech() {
        const catId = document.getElementById('tech-cat').value;
        const name = document.getElementById('tech-name').value.trim();
        const icon = document.getElementById('tech-icon').value || '🔬';
        const desc = document.getElementById('tech-desc').value.trim();
        const power = this.getAutoBalancePower('tech');
        const calc = Engine.autoBalance.calculate(name + ' ' + desc, power);
        if (!name) { this.toast('Teknoloji adı girin!', 'warning'); return; }

        const requires = [];
        const reqEls = document.querySelectorAll('#tech-reqs input:checked');
        if (reqEls) reqEls.forEach(cb => requires.push(cb.value));

        const cat = GameData.technologies.categories.find(c => c.id === catId);
        if (!cat) return;

        cat.techs.push({
            id: 'tech_' + Date.now(),
            name, icon, days: calc.days, tier: calc.tier, requires,
            description: desc || name,
            effects: calc.effects
        });

        this.saveUserData();
        this.closeModal();
        this.updateAll();
        this.toast(`🔬 Teknoloji oluşturuldu: ${name}`, 'success');
    },

    deleteTech(techId) {
        for (const cat of GameData.technologies.categories) {
            const idx = cat.techs.findIndex(t => t.id === techId);
            if (idx >= 0) {
                cat.techs.splice(idx, 1);
                this.saveUserData();
                this.updateAll();
                return;
            }
        }
    },

    deleteTechCategory(catId) {
        const idx = GameData.technologies.categories.findIndex(c => c.id === catId);
        if (idx >= 0) {
            GameData.technologies.categories.splice(idx, 1);
            this.saveUserData();
            this.updateAll();
        }
    },

    // ══════════════════════════════════════════════════
    //  DECISION CREATORS
    // ══════════════════════════════════════════════════

    showCreateDecisionCategoryModal() {
        const body = `
            <label class="form-label">Kategori Adı:<input type="text" id="deccat-name" class="hoi-input" placeholder="🏠 Ev ve Yaşam"></label>
        `;
        this.showModal({
            title: '📜 Yeni Karar Kategorisi',
            body,
            buttons: [
                { text: 'Oluştur', class: 'primary', action: () => this.createDecisionCategory() },
                { text: 'İptal', class: '', action: () => this.closeModal() }
            ]
        });
    },

    createDecisionCategory() {
        const name = document.getElementById('deccat-name').value.trim();
        if (!name) { this.toast('Kategori adı girin!', 'warning'); return; }
        GameData.decisions.categories.push({ name, decisions: [] });
        this.saveUserData();
        this.closeModal();
        this.updateAll();
        this.toast(`📜 Kategori oluşturuldu: ${name}`, 'success');
    },

    showCreateDecisionModal() {
        if (GameData.decisions.categories.length === 0) {
            this.toast('Önce bir karar kategorisi oluşturun!', 'warning');
            return;
        }
        const catOpts = GameData.decisions.categories.map((c, i) =>
            `<option value="${i}">${c.name}</option>`
        ).join('');

        const body = `
            <label class="form-label">Kategori:<select id="dec-cat" class="hoi-input">${catOpts}</select></label>
            <label class="form-label">Adı:<input type="text" id="dec-name" class="hoi-input" placeholder="Derin Temizlik" oninput="UI.triggerAutoBalance('dec')"></label>
            <div class="form-row">
                <label class="form-label" style="flex:1">İkon:<input type="text" id="dec-icon" class="hoi-input" placeholder="🧹" maxlength="4"></label>
            </div>
            <label class="form-label">Açıklama:<textarea id="dec-desc" class="hoi-input" rows="2" oninput="UI.triggerAutoBalance('dec')"></textarea></label>
            ${this.autoBalancePowerHtml('dec', 2)}
        `;

        this.showModal({
            title: '📜 Yeni Karar',
            body,
            buttons: [
                { text: 'Oluştur', class: 'primary', action: () => this.createDecision() },
                { text: 'İptal', class: '', action: () => this.closeModal() }
            ]
        });
    },

    createDecision() {
        const catIdx = parseInt(document.getElementById('dec-cat').value);
        const name = document.getElementById('dec-name').value.trim();
        const icon = document.getElementById('dec-icon').value || '📜';
        const desc = document.getElementById('dec-desc').value.trim();
        if (!name) { this.toast('Karar adı girin!', 'warning'); return; }

        const power = this.getAutoBalancePower('dec');
        const calc = Engine.autoBalance.calculate(name + ' ' + desc, power);

        const cat = GameData.decisions.categories[catIdx];
        if (!cat) return;

        cat.decisions.push({
            id: 'dec_' + Date.now(),
            name, icon,
            description: desc || name,
            cost: calc.cost, effects: calc.effects, cooldown: calc.cooldown
        });

        this.saveUserData();
        this.closeModal();
        this.updateAll();
        this.toast(`📜 Karar oluşturuldu: ${name}`, 'success');
    },

    deleteDecision(decisionId) {
        for (const cat of GameData.decisions.categories) {
            const idx = cat.decisions.findIndex(d => d.id === decisionId);
            if (idx >= 0) {
                cat.decisions.splice(idx, 1);
                this.saveUserData();
                this.updateAll();
                return;
            }
        }
    },

    deleteDecisionCategory(catIdx) {
        if (catIdx >= 0 && catIdx < GameData.decisions.categories.length) {
            GameData.decisions.categories.splice(catIdx, 1);
            this.saveUserData();
            this.updateAll();
        }
    },

    // ══════════════════════════════════════════════════
    //  SPIRIT CREATOR
    // ══════════════════════════════════════════════════

    showCreateSpiritModal() {
        const body = `
            <label class="form-label">Adı:<input type="text" id="spirit-name" class="hoi-input" placeholder="Sabah İnsanı" oninput="UI.triggerAutoBalance('spirit')"></label>
            <div class="form-row">
                <label class="form-label" style="flex:1">İkon:<input type="text" id="spirit-icon" class="hoi-input" placeholder="🌅" maxlength="4"></label>
                <label class="form-label" style="flex:1">Tür:<select id="spirit-type" class="hoi-input" onchange="UI.triggerAutoBalance('spirit')">
                    <option value="positive">Pozitif</option>
                    <option value="negative">Negatif</option>
                    <option value="neutral">Nötr</option>
                </select></label>
            </div>
            <label class="form-label">Açıklama:<textarea id="spirit-desc" class="hoi-input" rows="2" oninput="UI.triggerAutoBalance('spirit')"></textarea></label>
            ${this.autoBalancePowerHtml('spirit', 3)}
        `;

        this.showModal({
            title: '✨ Yeni Ulusal Ruh',
            body,
            buttons: [
                { text: 'Oluştur', class: 'primary', action: () => this.createSpirit() },
                { text: 'İptal', class: '', action: () => this.closeModal() }
            ]
        });
    },

    createSpirit() {
        const name = document.getElementById('spirit-name').value.trim();
        const icon = document.getElementById('spirit-icon').value || '✨';
        const type = document.getElementById('spirit-type').value;
        const desc = document.getElementById('spirit-desc').value.trim();
        const power = this.getAutoBalancePower('spirit');
        const effects = Engine.autoBalance.calculateSpirit(name + ' ' + desc, type, power);
        if (!name) { this.toast('Ruh adı girin!', 'warning'); return; }

        GameData.defaultSpirits.push({
            id: 'spirit_' + Date.now(),
            name, icon, type,
            description: desc || name,
            effects
        });

        this.saveUserData();
        this.closeModal();
        this.updateAll();
        this.toast(`✨ Ruh oluşturuldu: ${name}`, 'success');
    },

    deleteSpiritDef(spiritId) {
        const idx = GameData.defaultSpirits.findIndex(s => s.id === spiritId);
        if (idx >= 0) {
            GameData.defaultSpirits.splice(idx, 1);
            this.saveUserData();
            this.updateAll();
        }
    },

    // ══════════════════════════════════════════════════
    //  EVENT CREATOR
    // ══════════════════════════════════════════════════

    showCreateEventModal() {
        const body = `
            <label class="form-label">Başlık:<input type="text" id="ev-title" class="hoi-input" placeholder="Beklenmedik Harcama!" oninput="UI.triggerAutoBalance('ev')"></label>
            <div class="form-row">
                <label class="form-label" style="flex:1">İkon:<input type="text" id="ev-icon-input" class="hoi-input" placeholder="💸" maxlength="4"></label>
            </div>
            <label class="form-label">Açıklama:<textarea id="ev-desc" class="hoi-input" rows="2" oninput="UI.triggerAutoBalance('ev')"></textarea></label>
            ${this.autoBalancePowerHtml('ev', 2)}
        `;

        this.showModal({
            title: '📰 Yeni Olay',
            body,
            buttons: [
                { text: 'Oluştur', class: 'primary', action: () => this.createEvent() },
                { text: 'İptal', class: '', action: () => this.closeModal() }
            ]
        });
    },

    createEvent() {
        const title = document.getElementById('ev-title').value.trim();
        const icon = document.getElementById('ev-icon-input').value || '📰';
        const desc = document.getElementById('ev-desc')?.value?.trim() || '';
        if (!title) { this.toast('Olay başlığı girin!', 'warning'); return; }

        const power = this.getAutoBalancePower('ev');
        const options = Engine.autoBalance.calculateEventOptions(title + ' ' + desc, power);
        const weight = Math.max(1, Math.min(20, power * 4));

        GameData.events.push({
            id: 'event_' + Date.now(),
            title, icon,
            description: desc || title,
            weight,
            conditions: {},
            options
        });

        this.saveUserData();
        this.closeModal();
        this.updateAll();
        this.toast(`📰 Olay oluşturuldu: ${title}`, 'success');
    },

    deleteEvent(eventId) {
        const idx = GameData.events.findIndex(e => e.id === eventId);
        if (idx >= 0) {
            GameData.events.splice(idx, 1);
            this.saveUserData();
        }
    },

    showManageEventsModal() {
        if (GameData.events.length === 0) {
            this.toast('Henüz olay tanımlanmadı', 'info');
            return;
        }
        let body = '<div style="display:flex;flex-direction:column;gap:8px">';
        for (const ev of GameData.events) {
            body += `<div class="decision-item available" style="justify-content:space-between">
                <div style="display:flex;align-items:center;gap:8px">
                    <span style="font-size:20px">${ev.icon}</span>
                    <div>
                        <div style="font-weight:600">${this.escapeHtml(ev.title)}</div>
                        <div style="font-size:12px;color:var(--text-dim)">${ev.options.length} seçenek | Ağırlık: ${ev.weight}</div>
                    </div>
                </div>
                <button class="hoi-btn danger small" onclick="UI.deleteEvent('${ev.id}');UI.closeModal();UI.showManageEventsModal()">🗑</button>
            </div>`;
        }
        body += '</div>';
        this.showModal({
            title: '📰 Olayları Yönet',
            body,
            buttons: [{ text: 'Kapat', class: '', action: () => this.closeModal() }]
        });
    },

    // ══════════════════════════════════════════════════
    //  PRODUCTION ITEM CREATOR
    // ══════════════════════════════════════════════════

    showCreateProductionItemModal() {
        const body = `
            <label class="form-label">Adı:<input type="text" id="proditem-name" class="hoi-input" placeholder="Günlük Görevler"></label>
            <div class="form-row">
                <label class="form-label" style="flex:1">İkon:<input type="text" id="proditem-icon" class="hoi-input" placeholder="✅" maxlength="4"></label>
                <label class="form-label" style="flex:1">Tür:<select id="proditem-type" class="hoi-input">
                    <option value="civilian">🏭 Sivil</option>
                    <option value="military">🏗 Askeri</option>
                </select></label>
            </div>
            <label class="form-label">Açıklama:<textarea id="proditem-desc" class="hoi-input" rows="2"></textarea></label>
            <p style="color:var(--text-dim);font-size:12px;margin-top:4px">⚖ Günlük çıktı otomatik hesaplanır (5).</p>
        `;
        this.showModal({
            title: '⚙ Yeni Üretim Öğesi',
            body,
            buttons: [
                { text: 'Oluştur', class: 'primary', action: () => this.createProductionItem() },
                { text: 'İptal', class: '', action: () => this.closeModal() }
            ]
        });
    },

    createProductionItem() {
        const name = document.getElementById('proditem-name').value.trim();
        const icon = document.getElementById('proditem-icon').value || '⚙';
        const type = document.getElementById('proditem-type').value;
        const desc = document.getElementById('proditem-desc').value.trim();
        if (!name) { this.toast('Öğe adı girin!', 'warning'); return; }

        GameData.productionItems.push({
            id: 'prod_' + Date.now(),
            name, icon, type, baseOutput: 5,
            description: desc || name
        });
        this.saveUserData();
        this.closeModal();
        this.updateAll();
        this.toast(`⚙ Üretim öğesi oluşturuldu: ${name}`, 'success');
    },

    // ══════════════════════════════════════════════════
    //  CONSTRUCTION ITEM CREATOR
    // ══════════════════════════════════════════════════

    showCreateConstructionItemModal() {
        const body = `
            <label class="form-label">Adı:<input type="text" id="constitem-name" class="hoi-input" placeholder="Sivil Fabrika İnşa Et"></label>
            <div class="form-row">
                <label class="form-label" style="flex:1">İkon:<input type="text" id="constitem-icon" class="hoi-input" placeholder="🏭" maxlength="4"></label>
                <label class="form-label" style="flex:1">Tür:<select id="constitem-type" class="hoi-input">
                    <option value="civilian">Sivil (+1 Fab.)</option>
                    <option value="military">Askeri (+1 Fab.)</option>
                    <option value="infra">Altyapı (+5 İstikrar)</option>
                </select></label>
            </div>
            <label class="form-label">Açıklama:<textarea id="constitem-desc" class="hoi-input" rows="2"></textarea></label>
            <p style="color:var(--text-dim);font-size:12px;margin-top:4px">⚖ İnşaat süresi türe göre otomatik hesaplanır.</p>
        `;
        this.showModal({
            title: '🏗 Yeni İnşaat Öğesi',
            body,
            buttons: [
                { text: 'Oluştur', class: 'primary', action: () => this.createConstructionItem() },
                { text: 'İptal', class: '', action: () => this.closeModal() }
            ]
        });
    },

    createConstructionItem() {
        const name = document.getElementById('constitem-name').value.trim();
        const icon = document.getElementById('constitem-icon').value || '🏗';
        const type = document.getElementById('constitem-type').value;
        const desc = document.getElementById('constitem-desc').value.trim();
        if (!name) { this.toast('Öğe adı girin!', 'warning'); return; }

        const daysByType = { civilian: 14, military: 10, infra: 7 };
        GameData.constructionItems.push({
            id: 'const_' + Date.now(),
            name, icon, type, days: daysByType[type] || 14,
            description: desc || name
        });
        this.saveUserData();
        this.closeModal();
        this.updateAll();
        this.toast(`🏗 İnşaat öğesi oluşturuldu: ${name}`, 'success');
    },

    // ══════════════════════════════════════════════════
    //  DIVISION TEMPLATE CREATOR
    // ══════════════════════════════════════════════════

    showCreateTemplateModal() {
        const body = `
            <label class="form-label">Şablon Adı:<input type="text" id="tmpl-name" class="hoi-input" placeholder="Sabah Rutini" oninput="UI.triggerAutoBalance('tmpl')"></label>
            <div class="form-row">
                <label class="form-label" style="flex:1">İkon:<input type="text" id="tmpl-icon" class="hoi-input" placeholder="🌅" maxlength="4"></label>
                <label class="form-label" style="flex:1">Tür:<select id="tmpl-type" class="hoi-input">
                    <option value="Hafif Tümen">Hafif Tümen</option>
                    <option value="Ana Tümen">Ana Tümen</option>
                    <option value="Zırhlı Tümen">Zırhlı Tümen</option>
                    <option value="Garnizon Tümeni">Garnizon Tümeni</option>
                </select></label>
            </div>
            <div class="form-label">Taburlar (her satır: İsim, Saat):
                <textarea id="tmpl-battalions" class="hoi-input" rows="5" placeholder="Erken Kalkış, 06:00&#10;Sabah Egzersizi, 06:30&#10;Kahvaltı, 07:00"></textarea>
            </div>
            ${this.autoBalancePowerHtml('tmpl', 3)}
        `;
        this.showModal({
            title: '📋 Yeni Tümen Şablonu',
            body,
            buttons: [
                { text: 'Oluştur', class: 'primary', action: () => this.createTemplate() },
                { text: 'İptal', class: '', action: () => this.closeModal() }
            ]
        });
    },

    createTemplate() {
        const name = document.getElementById('tmpl-name').value.trim();
        const icon = document.getElementById('tmpl-icon').value || '🎖';
        const type = document.getElementById('tmpl-type').value;
        const batsText = document.getElementById('tmpl-battalions').value;
        const power = this.getAutoBalancePower('tmpl');
        const calc = Engine.autoBalance.calculate(name, power);
        if (!name) { this.toast('Şablon adı girin!', 'warning'); return; }

        const battalions = batsText.split('\n').filter(l => l.trim()).map(line => {
            const parts = line.split(',').map(p => p.trim());
            return { name: parts[0] || 'Tabur', icon: '▪', time: parts[1] || '00:00' };
        });
        if (battalions.length === 0) {
            this.toast('En az bir tabur ekleyin!', 'warning');
            return;
        }

        GameData.divisionTemplates.push({
            id: 'tmpl_' + Date.now(),
            name, type, icon, battalions, effects: calc.effects
        });
        this.saveUserData();
        this.closeModal();
        this.updateAll();
        this.toast(`📋 Şablon oluşturuldu: ${name}`, 'success');
    },

    deleteTemplate(templateId) {
        const idx = GameData.divisionTemplates.findIndex(t => t.id === templateId);
        if (idx >= 0) {
            GameData.divisionTemplates.splice(idx, 1);
            this.saveUserData();
            this.updateAll();
        }
    },

    // ══════════════════════════════════════════════════
    //  WAR CAMPAIGN CREATOR
    // ══════════════════════════════════════════════════

    showCreateCampaignModal() {
        const terrainOpts = Object.entries(GameData.terrainMods).map(([k, v]) =>
            `<option value="${k}">${v.icon} ${v.label} (×${v.mod})</option>`
        ).join('');

        const resOpts = [
            ['health', 'Sağlık'], ['politicalPower', 'İrade'], ['stability', 'İstikrar'],
            ['money', 'Para'], ['socialEnergy', 'Sosyal Enerji'], ['energy', 'Enerji'],
            ['warSupport', 'Motivasyon']
        ].map(([v, l]) => `<option value="${v}">${l}</option>`).join('');

        const body = `
            <label class="form-label">Sefer Adı:<input type="text" id="camp-name" class="hoi-input" placeholder="Fitness Seferi"></label>
            <div class="form-row">
                <label class="form-label" style="flex:1">İkon:<input type="text" id="camp-icon" class="hoi-input" placeholder="💪" maxlength="4"></label>
                <label class="form-label" style="flex:1">Renk:<input type="color" id="camp-color" class="hoi-input" value="#e53935" style="height:36px"></label>
            </div>
            <label class="form-label">Açıklama:<textarea id="camp-desc" class="hoi-input" rows="2"></textarea></label>
            <div class="form-row">
                <label class="form-label" style="flex:1">Arazi:<select id="camp-terrain" class="hoi-input">${terrainOpts}</select></label>
                <label class="form-label" style="flex:1">Bonus Kaynak:<select id="camp-bonus" class="hoi-input">${resOpts}</select></label>
            </div>
            <p style="color:var(--text-dim);font-size:12px;margin-top:8px">Sefer oluşturduktan sonra "Özel Bölge Ekle" ile bölgeleri ekleyebilirsiniz.</p>
        `;
        this.showModal({
            title: '⚔ Yeni Sefer Oluştur',
            body,
            buttons: [
                { text: 'Oluştur', class: 'primary', action: () => this.createCampaign() },
                { text: 'İptal', class: '', action: () => this.closeModal() }
            ]
        });
    },

    createCampaign() {
        const name = document.getElementById('camp-name').value.trim();
        const icon = document.getElementById('camp-icon').value || '⚔';
        const color = document.getElementById('camp-color').value || '#e53935';
        const desc = document.getElementById('camp-desc').value.trim();
        const terrain = document.getElementById('camp-terrain').value;
        const attackBonus = document.getElementById('camp-bonus').value;
        if (!name) { this.toast('Sefer adı girin!', 'warning'); return; }

        GameData.warCampaigns.push({
            id: 'camp_' + Date.now(),
            name, icon,
            description: desc || name,
            color, terrain, attackBonus,
            provinces: []
        });
        this.saveUserData();
        this.closeModal();
        this.updateAll();
        this.toast(`⚔ Sefer oluşturuldu: ${name}`, 'success');
    },

    deleteCampaign(campaignId) {
        const idx = GameData.warCampaigns.findIndex(c => c.id === campaignId);
        if (idx >= 0) {
            const activeIdx = State.current.wars?.activeCampaigns?.findIndex(c => c.campaignId === campaignId);
            if (activeIdx >= 0) State.current.wars.activeCampaigns.splice(activeIdx, 1);
            GameData.warCampaigns.splice(idx, 1);
            this.saveUserData();
            this.updateAll();
        }
    },

    // ══════════════════════════════════════════════════
    //  ADDITIONAL DELETE FUNCTIONS
    // ══════════════════════════════════════════════════

    deleteProductionItem(itemId) {
        const idx = GameData.productionItems.findIndex(p => p.id === itemId);
        if (idx >= 0) {
            State.current.production.lines = State.current.production.lines.filter(l => l.itemId !== itemId);
            GameData.productionItems.splice(idx, 1);
            this.saveUserData();
            State.save();
            this.updateAll();
            this.toast('🗑 Üretim öğesi silindi', 'info');
        }
    },

    deleteConstructionItem(itemId) {
        const idx = GameData.constructionItems.findIndex(c => c.id === itemId);
        if (idx >= 0) {
            State.current.production.construction = State.current.production.construction.filter(c => c.itemId !== itemId);
            GameData.constructionItems.splice(idx, 1);
            this.saveUserData();
            State.save();
            this.updateAll();
            this.toast('🗑 İnşaat öğesi silindi', 'info');
        }
    },

    removeConstruction(idx) {
        if (idx >= 0 && idx < State.current.production.construction.length) {
            State.current.production.construction.splice(idx, 1);
            State.save();
            this.updateAll();
            this.toast('🗑 İnşaat iptal edildi', 'info');
        }
    },

    deleteJournalEntry(date) {
        const idx = State.current.journal.findIndex(e => e.date === date);
        if (idx >= 0) {
            State.current.journal.splice(idx, 1);
            State.save();
            this.updateAll();
            this.toast('🗑 Günlük girişi silindi', 'info');
        }
    }
});
