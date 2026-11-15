// Cliente HTTP fino para as duas APIs:
//   - API Java   (Spring Boot, porta 8080) → JavaApi   → rotas /api/...
//   - API Python (FastAPI,     porta 8000) → PythonApi → rotas /tools/...
// Centraliza tratamento de erros, injeção do token JWT e o registro de cada chamada
// no "Inspetor de integração" (ver js/integration.js), que mostra qual API foi usada.

const Auth = {
    TOKEN_KEY: 'mdb_token',
    USER_KEY: 'mdb_user',

    getToken() {
        try { return localStorage.getItem(this.TOKEN_KEY); } catch { return null; }
    },
    getUser() {
        try {
            const raw = localStorage.getItem(this.USER_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    },
    isLoggedIn() {
        return !!this.getToken() && !!this.getUser();
    },
    isAdmin() {
        const user = this.getUser();
        return !!user && user.role === 'ADMIN';
    },
    setSession(token, user) {
        localStorage.setItem(this.TOKEN_KEY, token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    },
    clearSession() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
    },
};

class ApiError extends Error {
    constructor(status, message, details) {
        super(message);
        this.status = status;
        this.details = details || [];
    }
}

// ---------- Registro de chamadas (alimenta o Inspetor de integração) ----------

const ApiLog = {
    KEY: 'mdb_api_log',
    MAX: 80,

    read() {
        try { return JSON.parse(sessionStorage.getItem(this.KEY) || '[]'); } catch { return []; }
    },
    write(entries) {
        try { sessionStorage.setItem(this.KEY, JSON.stringify(entries.slice(-this.MAX))); } catch { /* ignora */ }
    },
    add(entry) {
        const entries = this.read();
        entries.push(entry);
        this.write(entries);
        window.dispatchEvent(new CustomEvent('mdb:api-call', { detail: entry }));

        // Também no console do navegador, útil para a demonstração (F12 → Console).
        const color = entry.api === 'java' ? '#A4511F' : '#5B3FA0';
        console.info(
            `%c ${entry.api === 'java' ? 'API JAVA :8080' : 'API PYTHON :8000'} %c ${entry.method} ${entry.path} → ${entry.status || 'falha'} (${entry.ms} ms)`,
            `background:${color};color:#fff;font-weight:600;border-radius:2px`,
            'color:inherit',
        );
    },
    clear() {
        this.write([]);
        window.dispatchEvent(new CustomEvent('mdb:api-call', { detail: null }));
    },
};

function apiNameFor(baseUrl) {
    return baseUrl === CONFIG.PYTHON_API_BASE ? 'python' : 'java';
}

function buildQuery(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') query.set(k, v);
    });
    const str = query.toString();
    return str ? `?${str}` : '';
}

/** Faz a requisição, registra no log e converte erros (Java: {message}; Python: {detail}) em ApiError. */
async function request(baseUrl, path, { method = 'GET', body, auth = false, isForm = false, raw = false } = {}) {
    const headers = {};
    if (!isForm && body !== undefined) {
        headers['Content-Type'] = 'application/json';
    }
    if (auth) {
        const token = Auth.getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
    }

    const api = apiNameFor(baseUrl);
    const started = performance.now();
    const logEntry = {
        api, method, path,
        status: 0, ok: false, ms: 0,
        at: new Date().toISOString(),
        page: window.location.pathname,
    };

    let response;
    try {
        response = await fetch(`${baseUrl}${path}`, {
            method,
            headers,
            body: isForm ? body : (body !== undefined ? JSON.stringify(body) : undefined),
        });
    } catch (networkError) {
        logEntry.ms = Math.round(performance.now() - started);
        ApiLog.add(logEntry);
        const port = api === 'java' ? '8080' : '8000';
        throw new ApiError(0, `Não foi possível conectar à API ${api === 'java' ? 'Java' : 'Python'} (porta ${port}). Verifique se ela está rodando.`);
    }

    logEntry.status = response.status;
    logEntry.ok = response.ok;
    logEntry.ms = Math.round(performance.now() - started);
    ApiLog.add(logEntry);

    // Token expirado/inválido em rota autenticada: encerra a sessão local.
    if (response.status === 401 && auth && Auth.getToken()) {
        Auth.clearSession();
        if (typeof showToast === 'function') showToast('Sua sessão expirou. Entre novamente.', 'error');
    }

    if (response.status === 204) return null;

    if (raw && response.ok) return response;

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const payload = isJson ? await response.json().catch(() => null) : await response.text();

    if (!response.ok) {
        let message = isJson && payload ? (payload.message || payload.detail) : null;
        if (Array.isArray(message)) message = message.map((m) => m.msg || m).join('; ');
        if (!message) message = typeof payload === 'string' && payload ? payload : `Erro inesperado (HTTP ${response.status}).`;
        const details = (isJson && payload && (payload.details || payload.errors)) || [];
        throw new ApiError(response.status, message, details);
    }

    return payload;
}

// ---------- API Java (Spring Boot) — núcleo: usuários, problemas, áreas, tags, avaliações ----------

const JavaApi = {
    health: () => request(CONFIG.JAVA_API_BASE, '/api/health'),

    register: (name, email, password) =>
        request(CONFIG.JAVA_API_BASE, '/api/auth/register', { method: 'POST', body: { name, email, password } }),
    login: (email, password) =>
        request(CONFIG.JAVA_API_BASE, '/api/auth/login', { method: 'POST', body: { email, password } }),

    listAreas: () => request(CONFIG.JAVA_API_BASE, '/api/areas'),
    createArea: (name) => request(CONFIG.JAVA_API_BASE, '/api/areas', { method: 'POST', auth: true, body: { name } }),
    listTags: () => request(CONFIG.JAVA_API_BASE, '/api/tags'),

    searchProblems: (params = {}) =>
        request(CONFIG.JAVA_API_BASE, `/api/problems${buildQuery(params)}`, { auth: true }),
    getProblem: (id) => request(CONFIG.JAVA_API_BASE, `/api/problems/${encodeURIComponent(id)}`, { auth: true }),
    createProblem: (payload) => request(CONFIG.JAVA_API_BASE, '/api/problems', { method: 'POST', auth: true, body: payload }),
    updateProblem: (id, payload) => request(CONFIG.JAVA_API_BASE, `/api/problems/${id}`, { method: 'PUT', auth: true, body: payload }),
    deleteProblem: (id) => request(CONFIG.JAVA_API_BASE, `/api/problems/${id}`, { method: 'DELETE', auth: true }),

    getDifficulty: (problemId) => request(CONFIG.JAVA_API_BASE, `/api/problems/${problemId}/difficulty`, { auth: true }),
    rateDifficultyCreate: (problemId, difficulty) =>
        request(CONFIG.JAVA_API_BASE, `/api/problems/${problemId}/difficulty`, { method: 'POST', auth: true, body: { difficulty } }),
    rateDifficultyUpdate: (problemId, difficulty) =>
        request(CONFIG.JAVA_API_BASE, `/api/problems/${problemId}/difficulty`, { method: 'PUT', auth: true, body: { difficulty } }),

    setStatus: (problemId, status) =>
        request(CONFIG.JAVA_API_BASE, `/api/problems/${problemId}/status`, { method: 'PUT', auth: true, body: { status } }),
    removeStatus: (problemId, status) =>
        request(CONFIG.JAVA_API_BASE, `/api/problems/${problemId}/status?status=${status}`, { method: 'DELETE', auth: true }),

    me: () => request(CONFIG.JAVA_API_BASE, '/api/users/me', { auth: true }),
    myProblems: () => request(CONFIG.JAVA_API_BASE, '/api/users/me/problems', { auth: true }),
};

// ---------- API Python (FastAPI) — ferramentas: sorteio, simulado, estatísticas, CSV ----------

const PythonApi = {
    health: () => request(CONFIG.PYTHON_API_BASE, '/health'),

    randomProblem: (params = {}) =>
        request(CONFIG.PYTHON_API_BASE, `/tools/random-problem${buildQuery(params)}`),
    mockExam: (payload) => request(CONFIG.PYTHON_API_BASE, '/tools/mock-exam', { method: 'POST', body: payload }),
    stats: () => request(CONFIG.PYTHON_API_BASE, '/tools/stats'),

    importCsv: (file) => {
        const form = new FormData();
        form.append('file', file);
        return request(CONFIG.PYTHON_API_BASE, '/tools/csv/import', { method: 'POST', auth: true, isForm: true, body: form });
    },
    exportCsv: async (params = {}) => {
        const response = await request(CONFIG.PYTHON_API_BASE, `/tools/csv/export${buildQuery(params)}`, { auth: true, raw: true });
        return response.blob();
    },
};
