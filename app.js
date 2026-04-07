/* ========================================
   MEDIDOR POCKET — Application Logic
   Finalização Técnica de Móveis Planejados
   ======================================== */

// ═══ STATE ═══
let projects = [];
let currentProjectId = null;
let editingProjectId = null;
let envCounter = 0;
let currentFilter = 'all';

const STORAGE_KEY = 'medidor_pocket_projects';

// ═══ INITIALIZATION ═══
document.addEventListener('DOMContentLoaded', () => {
    loadProjects();
    renderProjects();
    updateStats();

    // Splash
    setTimeout(() => {
        document.getElementById('splash').classList.add('hidden');
    }, 1500);
});

// ═══ NAVIGATION ═══
function showView(viewId, navBtn) {
    // Hide header for sub-views
    const header = document.querySelector('.header');
    if (viewId === 'home') {
        header.style.display = 'flex';
    } else {
        header.style.display = 'none';
    }

    // Toggle views
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + viewId).classList.add('active');

    // Update nav
    if (navBtn) {
        showNavActive(navBtn);
    }
}

function showNavActive(btn) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    btn.classList.add('active');
}

// ═══ PROJECTS CRUD ═══
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

function openNewProject() {
    editingProjectId = null;
    clearForm();
    document.getElementById('form-title').textContent = 'Novo Projeto';
    addEnvironment(); // Start with one environment
    showView('new');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
}

function clearForm() {
    document.getElementById('f-client').value = '';
    document.getElementById('f-contract').value = '';
    document.getElementById('f-store').value = '';
    document.getElementById('f-seller').value = '';
    document.getElementById('f-finalizer').value = 'HENRIQUE SANTOS';
    document.getElementById('f-address').value = '';
    document.getElementById('f-vbpv').value = '';
    document.getElementById('f-vbpf').value = '';
    document.getElementById('gap-value').textContent = 'R$ 0,00';
    document.getElementById('gap-value').classList.remove('negative');
    document.getElementById('f-notes').value = '';
    document.getElementById('environments-list').innerHTML = '';
    envCounter = 0;

    // Reset checkboxes
    ['chk-esquadro', 'chk-prumada', 'chk-eletros', 'chk-fixacao', 'chk-agua', 'chk-gas'].forEach(id => {
        document.getElementById(id).checked = false;
    });
}

function addEnvironment(data) {
    envCounter++;
    const list = document.getElementById('environments-list');
    const div = document.createElement('div');
    div.className = 'env-card';
    div.dataset.envId = envCounter;

    const name = data ? data.name : '';
    const pd = data ? data.pd : '';
    const rodape = data ? data.rodape : '';
    const moldura = data ? data.moldura : '';
    const peitoril = data ? data.peitoril : '';
    const notes = data ? data.notes : '';

    div.innerHTML = `
        <div class="env-header">
            <span class="env-num">Ambiente ${envCounter}</span>
            <button class="env-remove" onclick="removeEnvironment(this)" title="Remover">×</button>
        </div>
        <input class="env-input full env-name" placeholder="Nome do ambiente (ex: Cozinha, Dormitório Casal)" value="${escapeHtml(name)}">
        <div class="env-row">
            <input class="env-input env-pd" placeholder="PD (ex: 2573)" value="${escapeHtml(pd)}">
            <input class="env-input env-rodape" placeholder="Rodapé (ex: 10x1.5)" value="${escapeHtml(rodape)}">
        </div>
        <div class="env-row">
            <input class="env-input env-moldura" placeholder="Moldura (cm)" value="${escapeHtml(moldura)}">
            <input class="env-input env-peitoril" placeholder="Peitoril (cm)" value="${escapeHtml(peitoril)}">
        </div>
        <input class="env-input full env-notes" placeholder="Obs: ponto de água, gás, tomadas..." value="${escapeHtml(notes)}">
    `;

    list.appendChild(div);
}

function removeEnvironment(btn) {
    const card = btn.closest('.env-card');
    card.style.animation = 'fadeOut 0.2s ease forwards';
    setTimeout(() => card.remove(), 200);
}

function collectEnvironments() {
    const envCards = document.querySelectorAll('.env-card');
    const envs = [];
    envCards.forEach(card => {
        const name = card.querySelector('.env-name').value.trim();
        if (name) {
            envs.push({
                name: name,
                pd: card.querySelector('.env-pd').value.trim(),
                rodape: card.querySelector('.env-rodape').value.trim(),
                moldura: card.querySelector('.env-moldura').value.trim(),
                peitoril: card.querySelector('.env-peitoril').value.trim(),
                notes: card.querySelector('.env-notes').value.trim()
            });
        }
    });
    return envs;
}

function saveProject() {
    const client = document.getElementById('f-client').value.trim();
    if (!client) {
        shakeElement(document.getElementById('f-client'));
        document.getElementById('f-client').focus();
        return;
    }

    const project = {
        id: editingProjectId || generateId(),
        client: client,
        contract: document.getElementById('f-contract').value.trim(),
        store: document.getElementById('f-store').value.trim(),
        seller: document.getElementById('f-seller').value.trim(),
        finalizer: document.getElementById('f-finalizer').value.trim(),
        address: document.getElementById('f-address').value.trim(),
        environments: collectEnvironments(),
        vbpv: document.getElementById('f-vbpv').value.trim(),
        vbpf: document.getElementById('f-vbpf').value.trim(),
        checklist: {
            esquadro: document.getElementById('chk-esquadro').checked,
            prumada: document.getElementById('chk-prumada').checked,
            eletros: document.getElementById('chk-eletros').checked,
            fixacao: document.getElementById('chk-fixacao').checked,
            agua: document.getElementById('chk-agua').checked,
            gas: document.getElementById('chk-gas').checked
        },
        notes: document.getElementById('f-notes').value.trim(),
        status: 'pending',
        createdAt: editingProjectId
            ? projects.find(p => p.id === editingProjectId)?.createdAt || new Date().toISOString()
            : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    if (editingProjectId) {
        // Keep existing status
        const existing = projects.find(p => p.id === editingProjectId);
        if (existing) project.status = existing.status;

        const idx = projects.findIndex(p => p.id === editingProjectId);
        if (idx >= 0) projects[idx] = project;
    } else {
        projects.unshift(project);
    }

    persistProjects();
    renderProjects();
    updateStats();
    showView('home', document.getElementById('nav-home'));
}

function deleteCurrentProject() {
    if (!currentProjectId) return;
    if (!confirm('Tem certeza que deseja excluir este projeto?')) return;

    projects = projects.filter(p => p.id !== currentProjectId);
    currentProjectId = null;
    persistProjects();
    renderProjects();
    updateStats();
    showView('home', document.getElementById('nav-home'));
}

function editCurrentProject() {
    if (!currentProjectId) return;
    const project = projects.find(p => p.id === currentProjectId);
    if (!project) return;

    editingProjectId = project.id;
    document.getElementById('form-title').textContent = 'Editar Projeto';

    // Populate form
    document.getElementById('f-client').value = project.client;
    document.getElementById('f-contract').value = project.contract;
    document.getElementById('f-store').value = project.store;
    document.getElementById('f-seller').value = project.seller;
    document.getElementById('f-finalizer').value = project.finalizer;
    document.getElementById('f-address').value = project.address;
    document.getElementById('f-vbpv').value = project.vbpv;
    document.getElementById('f-vbpf').value = project.vbpf;
    document.getElementById('f-notes').value = project.notes;

    // Checklist
    document.getElementById('chk-esquadro').checked = project.checklist?.esquadro || false;
    document.getElementById('chk-prumada').checked = project.checklist?.prumada || false;
    document.getElementById('chk-eletros').checked = project.checklist?.eletros || false;
    document.getElementById('chk-fixacao').checked = project.checklist?.fixacao || false;
    document.getElementById('chk-agua').checked = project.checklist?.agua || false;
    document.getElementById('chk-gas').checked = project.checklist?.gas || false;

    // Environments
    document.getElementById('environments-list').innerHTML = '';
    envCounter = 0;
    if (project.environments && project.environments.length > 0) {
        project.environments.forEach(env => addEnvironment(env));
    }

    calcGap();
    showView('new');
}

// ═══ RENDERING ═══
function renderProjects() {
    const list = document.getElementById('project-list');
    const empty = document.getElementById('empty-state');

    let filtered = projects;
    if (currentFilter === 'pending') filtered = projects.filter(p => p.status === 'pending');
    if (currentFilter === 'done') filtered = projects.filter(p => p.status === 'done');

    if (filtered.length === 0) {
        list.innerHTML = '';
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';
    list.innerHTML = filtered.map((p, i) => {
        const initials = p.client.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
        const envCount = p.environments ? p.environments.length : 0;
        const date = new Date(p.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        const statusClass = p.status === 'done' ? 'done' : 'pending';
        const statusText = p.status === 'done' ? 'Concluído' : 'Pendente';

        return `
            <div class="project-card" onclick="openProject('${p.id}')" style="animation-delay: ${i * 0.05}s">
                <div class="project-avatar ${statusClass}">${initials}</div>
                <div class="project-info">
                    <div class="project-name">${escapeHtml(p.client)}</div>
                    <div class="project-meta">
                        <span>${p.contract || '—'}</span>
                        <span>${envCount} amb.</span>
                        <span>${date}</span>
                    </div>
                </div>
                <span class="project-status ${statusClass}">${statusText}</span>
            </div>
        `;
    }).join('');
}

function openProject(id) {
    const project = projects.find(p => p.id === id);
    if (!project) return;

    currentProjectId = id;
    document.getElementById('detail-title').textContent = project.client;

    const content = document.getElementById('detail-content');
    const statusClass = project.status === 'done' ? 'done' : 'pending';
    const statusText = project.status === 'done' ? '✅ Concluído' : '⏳ Pendente';

    // Calculate GAP
    const vbpv = parseCurrency(project.vbpv);
    const vbpf = parseCurrency(project.vbpf);
    const gap = vbpv - vbpf;
    const gapClass = gap >= 0 ? 'positive' : 'negative';
    const gapFormatted = formatCurrency(gap);

    // Checklist tags
    const checkLabels = {
        esquadro: 'Esquadro',
        prumada: 'Prumada',
        eletros: 'Eletros',
        fixacao: 'Fixação',
        agua: 'Água',
        gas: 'Gás'
    };

    let checksHtml = '';
    if (project.checklist) {
        for (const [key, label] of Object.entries(checkLabels)) {
            const checked = project.checklist[key];
            checksHtml += `<span class="detail-check-tag ${checked ? 'checked' : 'unchecked'}">${label}</span>`;
        }
    }

    // Environments
    let envsHtml = '';
    if (project.environments && project.environments.length > 0) {
        envsHtml = project.environments.map(env => `
            <div class="detail-env">
                <div class="detail-env-name">${escapeHtml(env.name)}</div>
                <div class="detail-env-info">
                    ${env.pd ? `<span>PD: ${escapeHtml(env.pd)}</span>` : ''}
                    ${env.rodape ? `<span>Rodapé: ${escapeHtml(env.rodape)}</span>` : ''}
                    ${env.moldura ? `<span>Moldura: ${escapeHtml(env.moldura)}</span>` : ''}
                    ${env.peitoril ? `<span>Peitoril: ${escapeHtml(env.peitoril)}</span>` : ''}
                </div>
                ${env.notes ? `<div style="font-size:0.72rem;color:#94a3b8;margin-top:6px;">${escapeHtml(env.notes)}</div>` : ''}
            </div>
        `).join('');
    } else {
        envsHtml = '<p style="font-size:0.8rem;color:#64748b;">Nenhum ambiente cadastrado.</p>';
    }

    content.innerHTML = `
        <button class="detail-status-badge ${statusClass}" onclick="toggleStatus('${project.id}')">
            ${statusText} — toque para alterar
        </button>

        <div class="detail-card">
            <div class="detail-card-title">👤 Dados do Cliente</div>
            <div class="detail-row"><span class="label">Cliente</span><span class="value">${escapeHtml(project.client)}</span></div>
            <div class="detail-row"><span class="label">Contrato</span><span class="value">${escapeHtml(project.contract || '—')}</span></div>
            <div class="detail-row"><span class="label">Loja</span><span class="value">${escapeHtml(project.store || '—')}</span></div>
            <div class="detail-row"><span class="label">Vendedor</span><span class="value">${escapeHtml(project.seller || '—')}</span></div>
            <div class="detail-row"><span class="label">Finalizador</span><span class="value">${escapeHtml(project.finalizer || '—')}</span></div>
            <div class="detail-row"><span class="label">Endereço</span><span class="value">${escapeHtml(project.address || '—')}</span></div>
        </div>

        <div class="detail-card">
            <div class="detail-card-title">🏠 Ambientes (${project.environments?.length || 0})</div>
            <div class="detail-env-list">
                ${envsHtml}
            </div>
        </div>

        <div class="detail-card">
            <div class="detail-card-title">💰 Financeiro</div>
            <div class="detail-row"><span class="label">Vendido (VBPV)</span><span class="value">${escapeHtml(project.vbpv || 'R$ 0,00')}</span></div>
            <div class="detail-row"><span class="label">Finalizado (VBPF)</span><span class="value">${escapeHtml(project.vbpf || 'R$ 0,00')}</span></div>
            <div class="detail-gap">
                <span class="detail-gap-label">GAP Operacional</span>
                <span class="detail-gap-value ${gapClass}">${gapFormatted}</span>
            </div>
        </div>

        <div class="detail-card">
            <div class="detail-card-title">✅ Checklist Técnico</div>
            <div class="detail-checks">${checksHtml}</div>
        </div>

        ${project.notes ? `
        <div class="detail-card">
            <div class="detail-card-title">📝 Observações</div>
            <div class="detail-notes">${escapeHtml(project.notes)}</div>
        </div>
        ` : ''}

        <div style="text-align:center;padding:8px;font-size:0.6rem;color:#475569;">
            Criado em ${new Date(project.createdAt).toLocaleString('pt-BR')}
            ${project.updatedAt !== project.createdAt ? '<br>Atualizado em ' + new Date(project.updatedAt).toLocaleString('pt-BR') : ''}
        </div>
    `;

    showView('detail');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
}

function toggleStatus(id) {
    const project = projects.find(p => p.id === id);
    if (project) {
        project.status = project.status === 'done' ? 'pending' : 'done';
        project.updatedAt = new Date().toISOString();
        persistProjects();
        updateStats();
        openProject(id); // Refresh
    }
}

// ═══ FILTERS ═══
function filterProjects(filter, btn) {
    currentFilter = filter;
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    renderProjects();
}

// ═══ STATS ═══
function updateStats() {
    document.getElementById('stat-total').textContent = projects.length;
    document.getElementById('stat-pending').textContent = projects.filter(p => p.status === 'pending').length;
    document.getElementById('stat-done').textContent = projects.filter(p => p.status === 'done').length;
}

// ═══ FINANCIAL ═══
function parseCurrency(str) {
    if (!str) return 0;
    // Remove "R$", spaces, dots (thousands sep), replace comma with dot
    const cleaned = str.replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.').trim();
    const val = parseFloat(cleaned);
    return isNaN(val) ? 0 : val;
}

function formatCurrency(value) {
    const abs = Math.abs(value);
    const formatted = abs.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    return value < 0 ? '-' + formatted : '+' + formatted;
}

function calcGap() {
    const vbpv = parseCurrency(document.getElementById('f-vbpv').value);
    const vbpf = parseCurrency(document.getElementById('f-vbpf').value);
    const gap = vbpv - vbpf;
    const el = document.getElementById('gap-value');
    el.textContent = formatCurrency(gap);
    el.classList.toggle('negative', gap < 0);
}

// ═══ PERSISTENCE ═══
function persistProjects() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (e) {
        console.warn('Storage full or unavailable');
    }
}

function loadProjects() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            projects = JSON.parse(saved);
        }
    } catch (e) {
        projects = [];
    }
}

// ═══ UTILITIES ═══
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function shakeElement(el) {
    el.style.animation = 'none';
    el.offsetHeight; // trigger reflow
    el.style.animation = 'shake 0.4s ease';
    el.style.borderColor = '#ef4444';
    setTimeout(() => {
        el.style.borderColor = '';
        el.style.animation = '';
    }, 1000);
}

// Add shake keyframe dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-6px); }
        40% { transform: translateX(6px); }
        60% { transform: translateX(-4px); }
        80% { transform: translateX(4px); }
    }
    @keyframes fadeOut {
        to { opacity: 0; transform: translateY(-10px); height: 0; padding: 0; margin: 0; overflow: hidden; }
    }
`;
document.head.appendChild(style);
