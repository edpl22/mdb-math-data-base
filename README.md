# MDB — Math Data Base

Plataforma web para entusiastas de matemática para estudar ou treinar uma área específica: busca com
filtros combináveis, avaliação comunitária de dificuldade, favoritos, sorteio de questões,
gerador de simulados imprimíveis (com gabarito) e importação/exportação em CSV.

Projeto da disciplina **Laboratório de Programação II** — integra **duas APIs REST**
(Java/Spring Boot e Python/Flask) consumidas por **um front-end web**.

## Integrantes

| Nome | Responsabilidades |
|---|---|
| Palos | Back-end: arquitetura geral, integração entre as APIs, banco de dados (migrations Flyway), Docker Compose |
| Oliveira | API Java (Spring Boot): autenticação JWT, CRUD de problemas, áreas, tags, avaliações de dificuldade e status |
| Mendes | API Python (Flask): sorteio, gerador de simulados, estatísticas do catálogo, importação/exportação de CSV |
| Davi Braga | Front-end (HTML/CSS/JS): páginas, consumo das duas APIs, inspetor de integração, layout responsivo |

## Sumário

- [Visão geral](#visão-geral)
- [Tecnologias](#tecnologias)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Como executar](#como-executar)
- [Endpoints — API Java (porta 8080)](#endpoints--api-java-porta-8080)
- [Endpoints — API Python (porta 8000)](#endpoints--api-python-porta-8000)
- [Qual tela chama qual API](#qual-tela-chama-qual-api)
- [Tratamento de erros](#tratamento-de-erros)
- [Testes](#testes)
- [Credenciais de demonstração](#credenciais-de-demonstração)

Explicação do código, passo a passo (back-end e front-end): [docs/PASSO_A_PASSO.md](docs/PASSO_A_PASSO.md).

## Visão geral

```
                        ┌──────────────────────────────┐
                        │  Front-end (HTML/CSS/JS)     │  http://localhost:8081
                        └──────────┬────────────┬──────┘
               /api/... (JSON+JWT) │            │ /tools/... (JSON)
                                   ▼            ▼
   ┌──────────────────────────────────┐   ┌──────────────────────────────────┐
   │ API Java — Spring Boot  :8080    │◄──│ API Python — Flask    :8000      │
   │ usuários, login JWT, problemas,  │   │ sorteio, simulados, estatísticas,│
   │ áreas, tags, avaliações, status  │   │ importação/exportação de CSV     │
   └───────────────┬──────────────────┘   └──────────────────────────────────┘
                   ▼                        (lê/grava problemas pela API Java,
        PostgreSQL (ou H2 local)             nunca acessa o banco diretamente)
```

- **API Java** é o núcleo (cadastro, login, CRUD, avaliações e listas do usuário).
- **API Python** oferece as ferramentas: sorteio, geração de simulados, estatísticas do
  catálogo e CSV. Ela consome a API Java via HTTP, então as duas rodam de forma independente, cada uma na sua porta.
- **Front-end** consome as duas APIs.
- **Inspetor de integração**:`Ctrl+I` abre um painel que lista em tempo real
  **cada requisição** feita pelo front-end, com API, método, rota, status e
  tempo. As mesmas chamadas também aparecem no console (F12) e na aba Network do navegador.

Fora do escopo, por decisão de projeto: fórum, chat, correção automática e ranking.

## Tecnologias

| Parte | Tecnologias |
|---|---|
| API Java (`backend-java/`) | Java 17+, Spring Boot 3.3, Spring Web, Spring Data JPA, Spring Security (JWT + BCrypt), Bean Validation, Flyway, springdoc-openapi (Swagger), Maven Wrapper |
| API Python (`backend-python/`) | Python 3.11+, Flask (rotas com `@app.get` / `@app.post`), Flask-CORS, httpx, Pydantic |
| Front-end (`frontend-web/`) | HTML5, CSS3, JavaScript puro (sem framework), MathJax para LaTeX |
| Banco de dados | PostgreSQL 16 (Docker) **ou** H2 em arquivo (perfil `local`, sem instalar nada) |
| Testes | JUnit 5, Mockito, MockMvc (Java) · pytest (Python) |
| Extra | Docker Compose; app Android em `mobile/` (opcional, fora dos requisitos) |

## Estrutura de pastas

```
mdb-main/
├── backend-java/     # API Java (Spring Boot)    → porta 8080
├── backend-python/   # API Python (Flask)        → porta 8000
├── frontend-web/     # Front-end (HTML/CSS/JS)   → porta 8081
├── database/         # Modelo de dados de referência + CSV de exemplo
├── docs/             # Documentação detalhada (arquitetura, API, banco, roteiro do vídeo)
├── mobile/           # App Android (extra, opcional)
├── docker-compose.yml
├── .env.example
└── README.md
```

## Como executar

Há duas formas. A **opção A** não precisa de Docker nem de PostgreSQL. A **opção B** sobe tudo
com um comando.

### Opção A — cada parte em um terminal (sem Docker)

Pré-requisitos: **JDK 17 ou superior** (testado com 17 e 25) e **Python 3.11 ou superior**. O
Maven não precisa estar instalado: o projeto usa o Maven Wrapper (`mvnw`).

Abra **três terminais** na pasta do projeto, um para cada parte, nesta ordem:

**Terminal 1 — API Java (porta 8080)**

```bash
cd backend-java
./mvnw spring-boot:run -Dspring-boot.run.profiles=local        # No Linux/macOS/Git Bash
mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=local"     # No Windows (PowerShell/CMD)
```

O perfil `local` usa um banco **H2 em arquivo** (`backend-java/data/`). Na primeira execução, as
migrations Flyway criam as tabelas e inserem os dados de exemplo (7 áreas, 15 tags, 20
problemas e 2 usuários). A primeira execução baixa as dependências e leva alguns minutos. A API
está pronta quando aparecer `Started MdbBackendApplication`.
Teste rápido: http://localhost:8080/api/health · Swagger: http://localhost:8080/swagger-ui.html

> Para usar PostgreSQL em vez do H2, rode sem o perfil (`./mvnw spring-boot:run`) com um
> Postgres acessível em `localhost:5432` (banco/usuário/senha `mdb`), por exemplo com
> `docker compose up postgres`. Para recomeçar o H2 do zero, apague `backend-java/data/`.

**Terminal 2 — API Python (porta 8000)**

```bash
cd backend-python
python -m venv .venv
# ativar o ambiente virtual:
source .venv/bin/activate          # Linux/macOS
source .venv/Scripts/activate      # Git Bash (Windows)
.venv\Scripts\activate             # PowerShell/CMD (Windows)

pip install -r requirements.txt
flask --app app.main run --port 8000
```

Teste rápido: http://localhost:8000/health (deve responder `"javaApi": "ok"` quando a API Java
estiver no ar). Alternativa ao comando `flask`: `python -m app.main`.

**Terminal 3 — Front-end (porta 8081)**

```bash
cd frontend-web
python -m http.server 8081
```

Acesse **http://localhost:8081**. Os dois indicadores no rodapé devem aparecer verdes.

> O front-end usa caminhos absolutos (`/css`, `/js`), então o servidor precisa ser iniciado
> **dentro** de `frontend-web/`. As URLs das APIs ficam em `frontend-web/js/config.js`.
> As portas 8081, 5500 e 3000 já estão liberadas no CORS das duas APIs.

### Opção B — Docker Compose (tudo de uma vez, com PostgreSQL)

Pré-requisitos: Docker e Docker Compose.

```bash
cp .env.example .env          # Windows: copy .env.example .env
docker compose up --build
```

| Serviço | URL |
|---|---|
| Front-end (nginx) | http://localhost:8081 |
| API Java + Swagger | http://localhost:8080 · `/swagger-ui.html` |
| API Python | http://localhost:8000 · `/health` |
| PostgreSQL | `localhost:5432` |

As portas podem ser alteradas no `.env` (`JAVA_PORT`, `PYTHON_PORT`, `FRONTEND_PORT`, `DB_PORT`).

## Endpoints — API Java (porta 8080)

Base: `http://localhost:8080`. Todas as respostas são JSON. As rotas marcadas como
**autenticado** ou **ADMIN** exigem o header `Authorization: Bearer <token>`, com o token obtido no
login.

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/api/health` | público | Verifica se a API está no ar |
| POST | `/api/auth/register` | público | Cadastra usuário `{name, email, password}` → `{token, user}` |
| POST | `/api/auth/login` | público | Login `{email, password}` → `{token, user}` |
| GET | `/api/problems?text=&area=&tag=&minDifficulty=&maxDifficulty=&page=&size=` | público | Busca paginada com filtros combináveis |
| GET | `/api/problems/{id}` | público* | Detalhe do problema (enunciado, dica, solução, dificuldade comunitária) |
| POST | `/api/problems` | ADMIN | Cria problema |
| PUT | `/api/problems/{id}` | ADMIN | Atualiza problema |
| DELETE | `/api/problems/{id}` | ADMIN | Remove problema |
| GET | `/api/problems/{id}/difficulty` | público | Média comunitária e nº de avaliações |
| POST | `/api/problems/{id}/difficulty` | autenticado | Avalia a dificuldade `{difficulty: 1..5}` (`409` se já avaliou) |
| PUT | `/api/problems/{id}/difficulty` | autenticado | Altera a própria avaliação |
| PUT | `/api/problems/{id}/status` | autenticado | Marca `{status: FAVORITE \| WANT_TO_DO \| DONE}` |
| DELETE | `/api/problems/{id}/status?status=FAVORITE` | autenticado | Remove um status |
| GET | `/api/areas` | público | Lista as áreas |
| POST | `/api/areas` | ADMIN | Cria área `{name}` |
| GET | `/api/tags` | público | Lista os tópicos (tags) |
| GET | `/api/users/me` | autenticado | Dados do usuário logado |
| GET | `/api/users/me/problems` | autenticado | Listas `{favorites, wantToDo, done}` |

\* Se autenticado, a resposta também traz a avaliação e os status do próprio usuário.

## Endpoints — API Python (porta 8000)

Base: `http://localhost:8000`. Todas as respostas são JSON, exceto a exportação, que devolve um
arquivo CSV.

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/health` | público | Status do serviço e da conexão com a API Java |
| GET | `/tools/random-problem?area=&tag=&minDifficulty=&maxDifficulty=` | público | Sorteia um problema que respeite os filtros (`404` se nenhum) |
| POST | `/tools/mock-exam` | público | Gera simulado `{quantity, area?, minDifficulty?, maxDifficulty?, includeStatements?}` sem repetição (`400` se faltarem problemas) |
| GET | `/tools/stats` | público | Estatísticas: total, distribuição por área e por dificuldade, tópicos mais frequentes, média |
| POST | `/tools/csv/import` | ADMIN | Importa problemas de um CSV (multipart `file`). Linhas inválidas são reportadas sem interromper as válidas |
| GET | `/tools/csv/export?area=&tag=&minDifficulty=&maxDifficulty=` | ADMIN | Exporta o catálogo em CSV |

O CSV usa o cabeçalho `id,titulo,enunciado,area,dificuldade,dica,solucao,fonte` (exemplo pronto
em `database/sample_import.csv`). Mais detalhes, incluindo exemplos de corpo e de resposta, em
[docs/API.md](docs/API.md).

### Exemplos rápidos (terminal)

```bash
curl "http://localhost:8080/api/problems?area=Algebra&size=2"
curl -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" \
     -d '{"email":"demo@mdb.dev","password":"demo123"}'
curl "http://localhost:8000/tools/random-problem?minDifficulty=2"
curl -X POST http://localhost:8000/tools/mock-exam -H "Content-Type: application/json" \
     -d '{"quantity":3,"area":"Geometry"}'
curl http://localhost:8000/tools/stats
```

## Qual tela chama qual API

| Tela / ação no front-end | API | Endpoint |
|---|---|---|
| Home — "O catálogo em números" | **Python** | `GET /tools/stats` |
| Home — áreas e problemas recentes | Java | `GET /api/areas`, `GET /api/problems` |
| Botão/menu "Sortear" | **Python** | `GET /tools/random-problem` |
| Catálogo — busca e filtros | Java | `GET /api/problems`, `/api/areas`, `/api/tags` |
| Catálogo — "Sortear com estes filtros" | **Python** | `GET /tools/random-problem?area=…` |
| Página do problema | Java | `GET /api/problems/{id}` |
| Favoritar / quero resolver / resolvido | Java | `PUT`/`DELETE /api/problems/{id}/status` |
| Avaliar dificuldade | Java | `POST`/`PUT /api/problems/{id}/difficulty` |
| Problema — "Sortear outro da área" | **Python** | `GET /tools/random-problem?area=…` |
| Simulado — prévia de problemas disponíveis | Java | `GET /api/problems?…&size=1` |
| Simulado — "Gerar simulado" | **Python** | `POST /tools/mock-exam` |
| Login / cadastro | Java | `POST /api/auth/login`, `/api/auth/register` |
| Meu perfil | Java | `GET /api/users/me/problems` |
| Admin — CRUD de problemas e áreas | Java | `/api/problems`, `/api/areas` |
| Admin — importar / exportar CSV | **Python** | `POST /tools/csv/import`, `GET /tools/csv/export` |
| Rodapé — indicadores online/offline | Java + Python | `GET /api/health`, `GET /health` |

## Tratamento de erros

As duas APIs sempre respondem JSON com status HTTP adequado. Nenhuma entrada inválida derruba
a aplicação.

- **Java** devolve `{timestamp, status, error, message, details[]}`. Casos tratados: validação
  (`400`), JSON malformado (`400`), parâmetro com tipo errado como `/api/problems/abc` (`400`),
  não autenticado (`401`), sem permissão (`403`), recurso inexistente como `/api/problems/999`
  (`404`), duplicidade (`409`) e erro inesperado (`500`, sem expor stack trace).
- **Python** (handlers `@app.errorhandler`) devolve `{detail}`. Casos tratados: validação (`422`, com mensagem legível),
  filtros sem resultado (`404`), simulado maior que o disponível (`400`), erros repassados da
  API Java com o mesmo status, e **API Java fora do ar** (`503`, em vez de quebrar).
- **Front-end** mostra essas mensagens em alertas e avisos. Se uma API estiver desligada, a
  tela informa qual API e em qual porta, e o restante do site continua funcionando.

## Testes

```bash
# API Java — 35 testes (JUnit 5 + Mockito + MockMvc, banco H2 em memória)
cd backend-java && ./mvnw test

# API Python — 27 testes (pytest + test_client do Flask; a API Java é simulada com httpx.MockTransport)
cd backend-python && pytest -q
```

## Credenciais de demonstração

Criadas pela migration `V2__seed_data.sql`. Na tela de login há botões que preenchem esses dados
automaticamente.

| Papel | Email | Senha |
|---|---|---|
| Administrador | `admin@mdb.dev` | `admin123` |
| Usuário comum | `demo@mdb.dev` | `demo123` |

> Credenciais e o `JWT_SECRET` padrão servem **apenas para desenvolvimento local**.
