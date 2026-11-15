# Guia de instalação e execução — MDB

Este guia assume uma instalação "limpa" (apenas o repositório clonado).

## Pré-requisitos

- **Docker** e **Docker Compose** (caminho recomendado), **ou**:
  - Java 17+ e Maven (ou use o wrapper `./mvnw` incluso, que baixa o Maven sozinho)
  - Python 3.12+
  - PostgreSQL 16 (local ou em container)
- Um navegador moderno para o frontend web.
- (Opcional, para o app mobile) Android Studio.

## 1. Clonar e configurar variáveis de ambiente

```bash
git clone <url-do-repositorio> mdb
cd mdb
cp .env.example .env
```

Os valores padrão em `.env.example` já funcionam para desenvolvimento local — não é necessário
alterar nada para rodar com Docker Compose.

## 2. Subir tudo com Docker Compose

```bash
docker compose up --build
```

Isso sobe, nesta ordem (respeitando `depends_on`/healthcheck): PostgreSQL → backend Java (aplica as
migrations Flyway automaticamente no boot) → backend Python → frontend (nginx servindo
`frontend-web/`).

Acesse:
- Frontend: http://localhost:8081
- Swagger Java: http://localhost:8080/swagger-ui.html
- Docs Python: http://localhost:8000/docs

Pare tudo com `docker compose down` (adicione `-v` para também apagar o volume do Postgres e
recomeçar do zero).

## 3. Alternativa: rodando cada serviço manualmente (sem Docker)

### 3.1 PostgreSQL

Suba um Postgres 16 local (ou `docker compose up postgres` isoladamente) com um banco/usuário
`mdb`/`mdb`/`mdb` (ou ajuste `DB_URL`/`DB_USER`/`DB_PASSWORD`).

### 3.2 Backend Java

```bash
cd backend-java
./mvnw spring-boot:run
```

Variáveis relevantes (podem ser exportadas no shell ou via `.env` + ferramenta de sua preferência):
`DB_URL`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `JWT_EXPIRATION_MINUTES`,
`CORS_ALLOWED_ORIGINS`, `SERVER_PORT`. As migrations Flyway rodam automaticamente no startup.

### 3.3 Backend Python

```bash
cd backend-python
python -m venv .venv
# Windows: .venv\Scripts\activate  |  Linux/Mac: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Variável relevante: `MDB_JAVA_API_BASE_URL` (padrão `http://localhost:8080`).

### 3.4 Frontend web

Qualquer servidor estático **cuja raiz seja a pasta `frontend-web/`** (o frontend usa caminhos
absolutos como `/css/style.css`, `/js/api.js`):

```bash
cd frontend-web
python -m http.server 8081
```

Se os backends não estiverem em `localhost:8080`/`localhost:8000`, ajuste
`frontend-web/js/config.js` (ou defina `window.MDB_JAVA_API_BASE`/`window.MDB_PYTHON_API_BASE`
antes de carregar os scripts).

### 3.5 Mobile

Ver [mobile/README.md](../mobile/README.md).

## 4. Primeiro acesso

Use as credenciais de desenvolvimento (ver README principal) ou cadastre um novo usuário pela
tela de cadastro — todo novo cadastro recebe o papel `USER`; para operações de administrador,
utilize `admin@mdb.dev` / `admin123`.

## 5. Rodando os testes

```bash
# Java
cd backend-java && ./mvnw test

# Python
cd backend-python && pytest -q
```

## 6. Resetando o banco de desenvolvimento

Com Docker Compose: `docker compose down -v` remove o volume do Postgres; na próxima subida as
migrations e o seed rodam do zero.
