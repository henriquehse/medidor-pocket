/* ═══════════════════════════════════════════════════════════════
   MEDIDOR POCKET v3.0 — Application Logic
   ═══════════════════════════════════════════════════════════════ */

let projects = [];
let currentProjectId = null;
let editingProjectId = null;
let envCounter = 0;
let currentFilter = 'all';
const STORAGE_KEY = 'medidor_pocket_projects';

// ═══ INIT ═══
document.addEventListener('DOMContentLoaded', () => {
    loadProjects();
    renderProjects();
    updateStats();

    // Splash
    setTimeout(() => document.getElementById('splash').classList.add('hidden'), 1400);

    // Sidebar toggle (mobile/tablet)
    document.getElementById('topbar-menu').addEventListener('click', toggleSidebar);
    document.getElementById('sb-close').addEventListener('click', closeSidebar);

    // Create backdrop element
    const backdrop = document.createElement('div');
    backdrop.className = 'sidebar-backdrop';
    backdrop.id = 'sb-backdrop';
    backdrop.addEventListener('click', closeSidebar);
    document.getElementById('app').appendChild(backdrop);
});

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sb-backdrop').classList.toggle('show');
}
function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sb-backdrop').classList.remove('show');
}

// ═══ NAVIGATION ═══
function navTo(page, btn, isMobile) {
    // Deactivate all
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.sb-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.bnav').forEach(n => n.classList.remove('active'));

    // Activate page
    document.getElementById('page-' + page).classList.add('active');

    // Update topbar title
    const titles = { dashboard: 'Dashboard', ref: 'Referência Técnica', form: 'Novo Projeto', detail: 'Projeto' };
    document.getElementById('topbar-title').textContent = titles[page] || 'Medidor Pocket';

    // Sidebar nav
    if (document.getElementById('snav-' + (page === 'dashboard' ? 'dash' : page))) {
        document.getElementById('snav-' + (page === 'dashboard' ? 'dash' : page)).classList.add('active');
    }

    // Bottom nav
    if (isMobile) {
        if (btn) btn.classList.add('active');
    } else {
        const bnavMap = { dashboard: 'bnav-dash', ref: 'bnav-ref' };
        if (bnavMap[page]) document.getElementById(bnavMap[page]).classList.add('active');
    }

    closeSidebar();
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ═══ PROJECTS CRUD ═══
function genId() { return Date.now().toString(36) + Math.random().toString(36).substring(2, 7); }

function openNewProject() {
    editingProjectId = null;
    clearForm();
    document.getElementById('form-title').textContent = 'Novo Projeto';
    document.getElementById('topbar-title').textContent = 'Novo Projeto';
    addEnvironment();

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-form').classList.add('active');
    document.querySelectorAll('.sb-item,.bnav').forEach(n => n.classList.remove('active'));
    closeSidebar();
    lucide.createIcons();
}

function clearForm() {
    ['f-client','f-contract','f-store','f-seller','f-address','f-vbpv','f-vbpf','f-notes'].forEach(id => {
        document.getElementById(id).value = '';
    });
    document.getElementById('f-finalizer').value = 'HENRIQUE SANTOS';
    document.getElementById('gap-value').textContent = 'R$ 0,00';
    document.getElementById('gap-value').classList.remove('negative');
    document.getElementById('env-list').innerHTML = '';
    envCounter = 0;
    ['chk-esquadro','chk-prumada','chk-eletros','chk-fixacao','chk-agua','chk-gas'].forEach(id => {
        document.getElementById(id).checked = false;
    });
}

function addEnvironment(data) {
    envCounter++;
    const el = document.createElement('div');
    el.className = 'env';
    const n = data?.name || '', pd = data?.pd || '', rod = data?.rodape || '', mol = data?.moldura || '', pei = data?.peitoril || '', no = data?.notes || '';
    el.innerHTML = `
        <div class="env-top"><span class="env-num">Ambiente ${envCounter}</span><button class="env-del" onclick="removeEnv(this)">×</button></div>
        <input class="env-inp full e-name" placeholder="Nome do ambiente (ex: Cozinha)" value="${esc(n)}">
        <div class="env-row">
            <input class="env-inp e-pd" placeholder="PD (ex: 2573)" value="${esc(pd)}">
            <input class="env-inp e-rod" placeholder="Rodapé (ex: 10x1.5)" value="${esc(rod)}">
        </div>
        <div class="env-row">
            <input class="env-inp e-mol" placeholder="Moldura (cm)" value="${esc(mol)}">
            <input class="env-inp e-pei" placeholder="Peitoril (cm)" value="${esc(pei)}">
        </div>
        <input class="env-inp full e-notes" placeholder="Obs: ponto de água, gás, tomadas..." value="${esc(no)}">
    `;
    document.getElementById('env-list').appendChild(el);
}

function removeEnv(btn) {
    const card = btn.closest('.env');
    card.style.animation = 'envOut .25s ease forwards';
    setTimeout(() => card.remove(), 250);
}

function collectEnvs() {
    return [...document.querySelectorAll('.env')].map(c => ({
        name: c.querySelector('.e-name').value.trim(),
        pd: c.querySelector('.e-pd').value.trim(),
        rodape: c.querySelector('.e-rod').value.trim(),
        moldura: c.querySelector('.e-mol').value.trim(),
        peitoril: c.querySelector('.e-pei').value.trim(),
        notes: c.querySelector('.e-notes').value.trim()
    })).filter(e => e.name);
}

function saveProject() {
    const client = document.getElementById('f-client').value.trim();
    if (!client) {
        const el = document.getElementById('f-client');
        el.style.animation = 'none'; el.offsetHeight; el.style.animation = 'shake .4s ease';
        el.style.borderColor = 'var(--danger)';
        el.focus();
        setTimeout(() => { el.style.borderColor = ''; el.style.animation = ''; }, 1000);
        return;
    }

    const project = {
        id: editingProjectId || genId(),
        client,
        contract: document.getElementById('f-contract').value.trim(),
        store: document.getElementById('f-store').value.trim(),
        seller: document.getElementById('f-seller').value.trim(),
        finalizer: document.getElementById('f-finalizer').value.trim(),
        address: document.getElementById('f-address').value.trim(),
        environments: collectEnvs(),
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
        createdAt: editingProjectId ? (projects.find(p => p.id === editingProjectId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    if (editingProjectId) {
        const existing = projects.find(p => p.id === editingProjectId);
        if (existing) project.status = existing.status;
        const idx = projects.findIndex(p => p.id === editingProjectId);
        if (idx >= 0) projects[idx] = project;
    } else {
        projects.unshift(project);
    }

    persist();
    renderProjects();
    updateStats();
    navTo('dashboard', document.getElementById('snav-dash'));
}

function deleteCurrentProject() {
    if (!currentProjectId || !confirm('Excluir este projeto?')) return;
    projects = projects.filter(p => p.id !== currentProjectId);
    currentProjectId = null;
    persist(); renderProjects(); updateStats();
    navTo('dashboard', document.getElementById('snav-dash'));
}

function editCurrentProject() {
    const p = projects.find(x => x.id === currentProjectId);
    if (!p) return;
    editingProjectId = p.id;
    document.getElementById('form-title').textContent = 'Editar Projeto';
    document.getElementById('f-client').value = p.client;
    document.getElementById('f-contract').value = p.contract;
    document.getElementById('f-store').value = p.store;
    document.getElementById('f-seller').value = p.seller;
    document.getElementById('f-finalizer').value = p.finalizer;
    document.getElementById('f-address').value = p.address;
    document.getElementById('f-vbpv').value = p.vbpv;
    document.getElementById('f-vbpf').value = p.vbpf;
    document.getElementById('f-notes').value = p.notes;
    ['esquadro','prumada','eletros','fixacao','agua','gas'].forEach(k => {
        document.getElementById('chk-' + k).checked = p.checklist?.[k] || false;
    });
    document.getElementById('env-list').innerHTML = '';
    envCounter = 0;
    (p.environments || []).forEach(e => addEnvironment(e));
    calcGap();
    document.querySelectorAll('.page').forEach(pg => pg.classList.remove('active'));
    document.getElementById('page-form').classList.add('active');
    document.getElementById('topbar-title').textContent = 'Editar Projeto';
    lucide.createIcons();
}

// ═══ RENDER ═══
function renderProjects() {
    const grid = document.getElementById('project-grid');
    const empty = document.getElementById('empty-state');
    let filtered = projects;
    if (currentFilter === 'pending') filtered = projects.filter(p => p.status === 'pending');
    if (currentFilter === 'done') filtered = projects.filter(p => p.status === 'done');

    if (filtered.length === 0) { grid.innerHTML = ''; empty.style.display = 'block'; return; }
    empty.style.display = 'none';

    grid.innerHTML = filtered.map((p, i) => {
        const initials = p.client.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
        const envCount = p.environments?.length || 0;
        const date = new Date(p.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        const sc = p.status === 'done' ? 'done' : 'pending';
        const st = p.status === 'done' ? 'Concluído' : 'Pendente';
        return `<div class="pcard" onclick="openProject('${p.id}')" style="animation-delay:${i * 0.03}s">
            <div class="pavatar ${sc}">${initials}</div>
            <div class="pinfo"><div class="pname">${esc(p.client)}</div><div class="pmeta"><span>${p.contract || '—'}</span><span>${envCount} amb.</span><span>${date}</span></div></div>
            <span class="pstatus ${sc}">${st}</span>
        </div>`;
    }).join('');
}

function openProject(id) {
    const p = projects.find(x => x.id === id);
    if (!p) return;
    currentProjectId = id;
    document.getElementById('detail-title').textContent = p.client;
    document.getElementById('topbar-title').textContent = p.client;

    const sc = p.status === 'done' ? 'done' : 'pending';
    const st = p.status === 'done' ? '✅ Concluído' : '⏳ Pendente';
    const vbpv = parseCur(p.vbpv), vbpf = parseCur(p.vbpf), gap = vbpv - vbpf;
    const gc = gap >= 0 ? 'pos' : 'neg';
    const chkLabels = { esquadro: 'Esquadro', prumada: 'Prumada', eletros: 'Eletros', fixacao: 'Fixação', agua: 'Água', gas: 'Gás' };

    let checksHtml = Object.entries(chkLabels).map(([k, l]) => {
        const checked = p.checklist?.[k];
        return `<span class="d-check ${checked ? 'yes' : 'no'}">${l}</span>`;
    }).join('');

    let envsHtml = (p.environments?.length > 0)
        ? p.environments.map(e => `<div class="d-env"><div class="d-env-name">${esc(e.name)}</div><div class="d-env-info">
            ${e.pd ? `<span>PD: ${esc(e.pd)}</span>` : ''}${e.rodape ? `<span>Rpé: ${esc(e.rodape)}</span>` : ''}
            ${e.moldura ? `<span>Mold: ${esc(e.moldura)}</span>` : ''}${e.peitoril ? `<span>Peit: ${esc(e.peitoril)}</span>` : ''}
        </div>${e.notes ? `<div style="font-size:.68rem;color:var(--text-3);margin-top:4px">${esc(e.notes)}</div>` : ''}</div>`).join('')
        : '<p style="font-size:.78rem;color:var(--text-4)">Nenhum ambiente.</p>';

    document.getElementById('detail-content').innerHTML = `
        <button class="detail-status ${sc}" onclick="toggleStatus('${p.id}')">${st} — toque para alterar</button>
        <div class="d-card">
            <div class="d-card-title"><i data-lucide="user"></i>Dados do Cliente</div>
            <div class="d-row"><span class="lbl">Cliente</span><span class="val">${esc(p.client)}</span></div>
            <div class="d-row"><span class="lbl">Contrato</span><span class="val">${esc(p.contract || '—')}</span></div>
            <div class="d-row"><span class="lbl">Loja</span><span class="val">${esc(p.store || '—')}</span></div>
            <div class="d-row"><span class="lbl">Vendedor</span><span class="val">${esc(p.seller || '—')}</span></div>
            <div class="d-row"><span class="lbl">Finalizador</span><span class="val">${esc(p.finalizer || '—')}</span></div>
            <div class="d-row"><span class="lbl">Endereço</span><span class="val">${esc(p.address || '—')}</span></div>
        </div>
        <div class="d-card">
            <div class="d-card-title"><i data-lucide="layout-grid"></i>Ambientes (${p.environments?.length || 0})</div>
            <div style="display:flex;flex-direction:column;gap:8px">${envsHtml}</div>
        </div>
        <div class="d-card">
            <div class="d-card-title"><i data-lucide="trending-up"></i>Financeiro</div>
            <div class="d-row"><span class="lbl">Vendido (VBPV)</span><span class="val">${esc(p.vbpv || 'R$ 0,00')}</span></div>
            <div class="d-row"><span class="lbl">Finalizado (VBPF)</span><span class="val">${esc(p.vbpf || 'R$ 0,00')}</span></div>
            <div class="d-gap"><span class="d-gap-lbl">GAP</span><span class="d-gap-val ${gc}">${fmtCur(gap)}</span></div>
        </div>
        <div class="d-card">
            <div class="d-card-title"><i data-lucide="check-square"></i>Checklist</div>
            <div class="d-checks">${checksHtml}</div>
        </div>
        ${p.notes ? `<div class="d-card"><div class="d-card-title"><i data-lucide="file-text"></i>Observações</div><div class="d-notes">${esc(p.notes)}</div></div>` : ''}
        <div class="d-meta">Criado: ${new Date(p.createdAt).toLocaleString('pt-BR')}${p.updatedAt !== p.createdAt ? ' · Atualizado: ' + new Date(p.updatedAt).toLocaleString('pt-BR') : ''}</div>
    `;

    document.querySelectorAll('.page').forEach(pg => pg.classList.remove('active'));
    document.getElementById('page-detail').classList.add('active');
    document.querySelectorAll('.sb-item,.bnav').forEach(n => n.classList.remove('active'));
    lucide.createIcons();
}

function toggleStatus(id) {
    const p = projects.find(x => x.id === id);
    if (p) { p.status = p.status === 'done' ? 'pending' : 'done'; p.updatedAt = new Date().toISOString(); persist(); updateStats(); openProject(id); }
}

// ═══ FILTERS ═══
function filterProjects(f, btn) {
    currentFilter = f;
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    renderProjects();
}

// ═══ STATS ═══
function updateStats() {
    const t = projects.length, pe = projects.filter(p => p.status === 'pending').length, d = projects.filter(p => p.status === 'done').length;
    document.getElementById('dash-total').textContent = t;
    document.getElementById('dash-pending').textContent = pe;
    document.getElementById('dash-done').textContent = d;
    document.getElementById('sb-badge-total').textContent = t;
    document.getElementById('sb-pending').textContent = pe;
    document.getElementById('sb-done').textContent = d;
}

// ═══ FINANCIAL ═══
function parseCur(s) { if (!s) return 0; const v = parseFloat(s.replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.').trim()); return isNaN(v) ? 0 : v; }
function fmtCur(v) { const f = Math.abs(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); return v < 0 ? '-' + f : '+' + f; }
function calcGap() {
    const g = parseCur(document.getElementById('f-vbpv').value) - parseCur(document.getElementById('f-vbpf').value);
    const el = document.getElementById('gap-value');
    el.textContent = fmtCur(g); el.classList.toggle('negative', g < 0);
}

// ═══ PERSISTENCE ═══
function persist() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(projects)); } catch {}  }
function loadProjects() { try { const s = localStorage.getItem(STORAGE_KEY); if (s) projects = JSON.parse(s); } catch { projects = []; } }

// ═══ UTIL ═══
function esc(s) { if (!s) return ''; const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
