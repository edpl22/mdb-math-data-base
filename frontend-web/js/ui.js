// Helpers de UI compartilhados: toasts, loading, estado vazio, escape de HTML,
// componentes de dificuldade/tags, selo de API e a linha de problema (ProblemRow).

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function plural(n, singular, pluralForm) {
    return `${n} ${n === 1 ? singular : (pluralForm || singular + 's')}`;
}

function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.setAttribute('role', 'status');
        container.setAttribute('aria-live', 'polite');
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4200);
}

function renderLoading(el, label = 'Carregando…') {
    el.innerHTML = `<div class="loading-row"><span class="spinner"></span><span>${escapeHtml(label)}</span></div>`;
}

function renderEmpty(el, title, message, actionHtml = '') {
    el.innerHTML = `
        <div class="empty-state">
            <h3>${escapeHtml(title)}</h3>
            <p>${escapeHtml(message)}</p>
            ${actionHtml}
        </div>`;
}

function renderErrorAlert(el, message) {
    el.innerHTML = `<div class="alert alert-error" role="alert">${escapeHtml(message)}</div>`;
}

/** Selo que identifica visualmente qual backend atende uma funcionalidade. */
function apiBadgeHtml(api, extra = '') {
    const label = api === 'python' ? 'API Python · :8000' : 'API Java · :8080';
    const title = api === 'python'
        ? 'Funcionalidade atendida pela API Python (Flask)'
        : 'Funcionalidade atendida pela API Java (Spring Boot)';
    return `<span class="api-badge api-badge-${api}" title="${title}">${label}${extra ? ' · ' + escapeHtml(extra) : ''}</span>`;
}

/** Preenche todo elemento <span data-badge="java|python"> com o selo da API correspondente. */
function fillBadges(root = document) {
    root.querySelectorAll('[data-badge]').forEach((el) => {
        el.innerHTML = apiBadgeHtml(el.dataset.badge, el.dataset.badgeExtra || '');
    });
}

/** Botão com estado de carregamento: desabilita e troca o texto enquanto a promise roda. */
async function withButtonLoading(btn, loadingLabel, fn) {
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = loadingLabel;
    try {
        return await fn();
    } finally {
        btn.disabled = false;
        btn.innerHTML = original;
    }
}

const DIFFICULTY_LABELS = { 1: 'Fundamental', 2: 'Fácil', 3: 'Intermediário', 4: 'Avançado', 5: 'Muito avançado' };

function difficultyLabel(value) {
    return DIFFICULTY_LABELS[Math.round(value)] || '—';
}

function formatDecimal(value, digits = 1) {
    return Number(value).toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/** Barra técnica de 5 segmentos representando a dificuldade arredondada. */
function difficultyBarsHtml(value) {
    const rounded = value === null || value === undefined ? 0 : Math.round(value);
    let bars = '';
    for (let i = 1; i <= 5; i++) {
        bars += `<span class="${i <= rounded ? 'filled' : ''}"></span>`;
    }
    return `<span class="difficulty-bars" aria-label="Dificuldade ${rounded} de 5">${bars}</span>`;
}

/** Versão compacta usada em linhas de listagem: "3,8/5" + N avaliações. */
function difficultyCompactHtml(value, count, initial) {
    if (value === null || value === undefined) {
        const fallback = initial ? `${initial}<span class="of-five">/5</span>` : '—';
        return `<div class="difficulty-inline"><span class="difficulty-value">${fallback}</span></div>
                <div class="difficulty-meta">${initial ? 'dif. inicial' : 'sem avaliações'}</div>`;
    }
    return `<div class="difficulty-inline"><span class="difficulty-value">${formatDecimal(value)}<span class="of-five">/5</span></span></div>
            <div class="difficulty-meta">${plural(count, 'avaliação', 'avaliações')}</div>`;
}

/** Versão completa usada na página do problema: valor + barra + label + contagem. */
function difficultyFullHtml(value, count) {
    if (value === null || value === undefined) {
        return `<div class="difficulty-inline">
                    <span class="difficulty-value">—<span class="of-five">/5</span></span>
                    ${difficultyBarsHtml(null)}
                </div>
                <div class="difficulty-meta">Ainda sem avaliações</div>`;
    }
    return `<div class="difficulty-inline">
                <span class="difficulty-value">${formatDecimal(value)}<span class="of-five">/5</span></span>
                ${difficultyBarsHtml(value)}
            </div>
            <div class="difficulty-meta">${difficultyLabel(value)} · ${plural(count, 'avaliação', 'avaliações')}</div>`;
}

/** DifficultySelector: cinco botões [1][2][3][4][5]; onSelect(value) por clique. */
function renderDifficultySelector(containerId, selectedValue, onSelect) {
    const el = document.getElementById(containerId);
    el.setAttribute('role', 'group');
    el.innerHTML = [1, 2, 3, 4, 5].map((v) =>
        `<button type="button" data-value="${v}" class="${v === selectedValue ? 'selected' : ''}"
                 title="${v} · ${difficultyLabel(v)}" aria-pressed="${v === selectedValue}">${v}</button>`
    ).join('');
    el.querySelectorAll('button').forEach((btn) => {
        btn.addEventListener('click', () => onSelect(parseInt(btn.dataset.value, 10)));
    });
}

function typesetMath(scopeEl, attempt = 0) {
    if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise(scopeEl ? [scopeEl] : undefined).catch(() => {});
    } else if (window.MathJax && attempt < 20) {
        // MathJax ainda carregando (script defer/CDN): tenta de novo em instantes.
        setTimeout(() => typesetMath(scopeEl, attempt + 1), 300);
    }
}

/** Linha densa de problema usada em catálogo, home, perfil e simulados. */
function problemRowHtml(problem) {
    const tags = (problem.tags || []).slice(0, 3)
        .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
        .join('');
    return `
        <div class="problem-row">
            <div class="row-id">#${problem.id}</div>
            <div class="row-main">
                <a class="row-title" href="/pages/problem.html?id=${problem.id}">${escapeHtml(problem.title)}</a>
                <div class="row-meta">${tags}</div>
            </div>
            <div class="row-area"><span class="area-label">${escapeHtml(problem.area || '')}</span></div>
            <div class="row-difficulty">${difficultyCompactHtml(problem.communityDifficulty, problem.ratingsCount, problem.initialDifficulty)}</div>
        </div>`;
}

function problemListHtml(problems) {
    return `<div class="problem-list">${problems.map(problemRowHtml).join('')}</div>`;
}
