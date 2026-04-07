/* ========================================
   Medidor Pocket – App Logic
   ======================================== */

// ── Checklist Logic ─────────────────────
function toggleCheck(checkbox) {
    const item = checkbox.closest('.check-item');
    if (checkbox.checked) {
        item.classList.add('checked');
    } else {
        item.classList.remove('checked');
    }
    updateProgress();
    saveChecklist();
}

function updateProgress() {
    const total = document.querySelectorAll('.check-item').length;
    const checked = document.querySelectorAll('.check-item.checked').length;
    const percent = (checked / total) * 100;

    document.getElementById('progress-fill').style.width = percent + '%';
    document.getElementById('progress-text').textContent = checked + ' de ' + total;

    // Color feedback
    const fill = document.getElementById('progress-fill');
    if (percent === 100) {
        fill.style.background = 'linear-gradient(90deg, #22c55e, #10b981)';
    } else if (percent >= 50) {
        fill.style.background = 'linear-gradient(90deg, #22c55e, #22d3ee)';
    } else {
        fill.style.background = 'linear-gradient(90deg, #f59e0b, #22d3ee)';
    }
}

// ── Navigation ──────────────────────────
function navigateTo(sectionId, btn) {
    // Scroll to section
    if (sectionId === 'top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        const el = document.getElementById(sectionId);
        if (el) {
            const headerHeight = document.querySelector('.header').offsetHeight;
            const top = el.getBoundingClientRect().top + window.pageYOffset - headerHeight - 16;
            window.scrollTo({ top: top, behavior: 'smooth' });
        }
    }

    // Update active state
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
}

// ── Scroll Spy ──────────────────────────
function handleScrollSpy() {
    const sections = ['glossario', 'mapeamento', 'viabilidade', 'notas'];
    const navMap = {
        'glossario': 'nav-simbolos',
        'mapeamento': 'nav-mapa',
        'viabilidade': 'nav-check',
        'notas': 'nav-check'
    };
    const headerH = document.querySelector('.header').offsetHeight + 40;
    let currentSection = null;

    if (window.scrollY < 100) {
        currentSection = 'top';
    } else {
        for (const id of sections) {
            const el = document.getElementById(id);
            if (el) {
                const rect = el.getBoundingClientRect();
                if (rect.top <= headerH + 50) {
                    currentSection = id;
                }
            }
        }
    }

    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    if (currentSection === 'top' || !currentSection) {
        document.getElementById('nav-home').classList.add('active');
    } else {
        const navId = navMap[currentSection];
        if (navId) document.getElementById(navId).classList.add('active');
    }
}

let scrollTimeout;
window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(handleScrollSpy, 80);
}, { passive: true });

// ── Notes Persistence ───────────────────
function saveNotes() {
    const text = document.getElementById('notes-input').value;
    try {
        localStorage.setItem('medidor_pocket_notes', text);
    } catch (e) { /* storage full or unavailable */ }
}

function loadNotes() {
    try {
        const saved = localStorage.getItem('medidor_pocket_notes');
        if (saved) {
            document.getElementById('notes-input').value = saved;
        }
    } catch (e) { /* storage unavailable */ }
}

function clearNotes() {
    if (confirm('Limpar todas as notas?')) {
        document.getElementById('notes-input').value = '';
        try {
            localStorage.removeItem('medidor_pocket_notes');
        } catch (e) { /* noop */ }
    }
}

// ── Checklist Persistence ───────────────
function saveChecklist() {
    const items = document.querySelectorAll('.check-item');
    const state = [];
    items.forEach(item => {
        const cb = item.querySelector('input[type="checkbox"]');
        state.push(cb.checked);
    });
    try {
        localStorage.setItem('medidor_pocket_checklist', JSON.stringify(state));
    } catch (e) { /* noop */ }
}

function loadChecklist() {
    try {
        const saved = localStorage.getItem('medidor_pocket_checklist');
        if (saved) {
            const state = JSON.parse(saved);
            const items = document.querySelectorAll('.check-item');
            items.forEach((item, i) => {
                if (state[i]) {
                    const cb = item.querySelector('input[type="checkbox"]');
                    cb.checked = true;
                    item.classList.add('checked');
                }
            });
            updateProgress();
        }
    } catch (e) { /* noop */ }
}

// ── Initialize ──────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadNotes();
    loadChecklist();
    handleScrollSpy();
});
