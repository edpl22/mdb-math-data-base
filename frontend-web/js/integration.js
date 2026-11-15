// Inspetor de integração: painel lateral que lista, em tempo real, cada requisição feita
// pelo frontend, identificando se ela foi para a API Java (:8080) ou para a API Python (:8000).
// Os dados vêm de ApiLog (js/api.js) e persistem durante a sessão do navegador, então é
// possível navegar entre páginas e continuar vendo o histórico.

(function () {
    const PREF_KEY = 'mdb_inspector_open';

    function formatTime(iso) {
        return new Date(iso).toLocaleTimeString('pt-BR', { hour12: false });
    }

    function buildPanel() {
        const panel = document.createElement('aside');
        panel.id = 'inspector';
        panel.className = 'inspector';
        panel.setAttribute('aria-label', 'Inspetor de integração');
        panel.hidden = true;
        panel.innerHTML = `
            <div class="inspector-header">
                <div>
                    <div class="inspector-title">Inspetor de integração</div>
                    <div class="inspector-sub">Cada requisição feita por esta interface</div>
                </div>
                <button type="button" class="btn btn-secondary btn-sm" id="inspector-close" aria-label="Fechar inspetor">✕</button>
            </div>
            <div class="inspector-summary" id="inspector-summary"></div>
            <div class="inspector-filters" role="group" aria-label="Filtrar por API">
                <button type="button" data-filter="all" class="active">Todas</button>
                <button type="button" data-filter="java">Java</button>
                <button type="button" data-filter="python">Python</button>
                <button type="button" class="inspector-clear" id="inspector-clear">Limpar</button>
            </div>
            <ol class="inspector-list" id="inspector-list"></ol>`;
        document.body.appendChild(panel);
        return panel;
    }

    let filter = 'all';

    function render() {
        const list = document.getElementById('inspector-list');
        const summary = document.getElementById('inspector-summary');
        if (!list) return;
        const entries = ApiLog.read();
        const javaCount = entries.filter((e) => e.api === 'java').length;
        const pythonCount = entries.length - javaCount;
        summary.innerHTML = `
            <div class="summary-cell summary-java"><span class="n">${javaCount}</span><span>API Java</span></div>
            <div class="summary-cell summary-python"><span class="n">${pythonCount}</span><span>API Python</span></div>`;

        const shown = entries.filter((e) => filter === 'all' || e.api === filter).reverse();
        if (shown.length === 0) {
            list.innerHTML = '<li class="inspector-empty">Nenhuma requisição ainda. Use o site e acompanhe aqui.</li>';
            return;
        }
        list.innerHTML = shown.map((e) => `
            <li class="inspector-item">
                <span class="api-badge api-badge-${e.api}">${e.api === 'java' ? 'JAVA' : 'PYTHON'}</span>
                <span class="inspector-method m-${e.method.toLowerCase()}">${e.method}</span>
                <span class="inspector-path" title="${escapeHtml(e.path)}">${escapeHtml(e.path)}</span>
                <span class="inspector-status ${e.ok ? 'ok' : 'err'}">${e.status || 'falha'}</span>
                <span class="inspector-meta">${formatTime(e.at)} · ${e.ms} ms · ${escapeHtml(e.page.replace('/pages/', '').replace('.html', '') || 'home')}</span>
            </li>`).join('');
    }

    function setOpen(open) {
        const panel = document.getElementById('inspector');
        panel.hidden = !open;
        document.body.classList.toggle('inspector-open', open);
        try { sessionStorage.setItem(PREF_KEY, open ? '1' : '0'); } catch { /* ignora */ }
        if (open) render();
    }

    document.addEventListener('DOMContentLoaded', () => {
        buildPanel();

        document.addEventListener('click', (evt) => {
            if (evt.target.closest('[data-open-inspector]')) {
                setOpen(document.getElementById('inspector').hidden);
            }
        });
        document.getElementById('inspector-close').addEventListener('click', () => setOpen(false));
        document.getElementById('inspector-clear').addEventListener('click', () => ApiLog.clear());
        document.querySelectorAll('.inspector-filters [data-filter]').forEach((btn) => {
            btn.addEventListener('click', () => {
                filter = btn.dataset.filter;
                document.querySelectorAll('.inspector-filters [data-filter]').forEach((b) => b.classList.toggle('active', b === btn));
                render();
            });
        });

        // Atalho: Ctrl+I abre/fecha o inspetor.
        document.addEventListener('keydown', (evt) => {
            if ((evt.ctrlKey || evt.metaKey) && evt.key.toLowerCase() === 'i' && !evt.shiftKey) {
                evt.preventDefault();
                setOpen(document.getElementById('inspector').hidden);
            }
            if (evt.key === 'Escape' && !document.getElementById('inspector').hidden) setOpen(false);
        });

        window.addEventListener('mdb:api-call', render);

        let wasOpen = false;
        try { wasOpen = sessionStorage.getItem(PREF_KEY) === '1'; } catch { /* ignora */ }
        if (wasOpen) setOpen(true);
    });
})();
