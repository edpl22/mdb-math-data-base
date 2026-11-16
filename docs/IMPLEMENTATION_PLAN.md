# MDB — Math Data Base — Plano de Implementação

## 1. Arquitetura final

```
frontend-web (HTML/CSS/JS puro, servido por nginx no docker-compose)
      |
      +---- backend-java (Spring Boot)  /api/...   -> PostgreSQL (fonte da verdade)
      |
      +---- backend-python (Flask)      /tools/...  -> consome /api/... do backend-java via HTTP (httpx)

mobile/ (Android nativo em Java) -> consome backend-java /api/... diretamente
  (funcionalidades de CSV/sorteio/simulado ficam no backend-python; o app mobile
   também pode chamar /tools/... quando expostos publicamente pelo compose)
```

- **backend-java**: núcleo do domínio — usuários, autenticação (JWT + Spring Security + BCrypt),
  problemas, áreas, tags, avaliações de dificuldade, favoritos/status. CRUD completo, DTOs,
  validação (Bean Validation), tratamento global de exceções, Flyway, springdoc-openapi.
- **backend-python**: ferramentas de processamento — import/export de CSV, sorteio de questão,
  geração de simulados. Não duplica regras de negócio: ele consulta o backend-java pela API REST
  (`JavaApiClient` em `app/clients`) para ler/gravar problemas, evitando duas aplicações escrevendo
  diretamente nas mesmas tabelas. Para import/export de CSV o Python chama os endpoints
  administrativos do Java (POST /api/problems, GET /api/problems) autenticando com um JWT de admin
  repassado pelo cliente (o usuário loga no Java e usa o mesmo token ao chamar o Python).
- **database**: PostgreSQL único, gerenciado via Flyway (migrations em `backend-java/src/main/resources/db/migration`).
- **frontend-web**: HTML/CSS/JS puro, sem framework. Consome `/api` e `/tools` via `fetch`. MathJax
  para LaTeX.
- **mobile**: Android nativo (Java), cliente simplificado (Retrofit) consumindo `/api`.

## 2. Decisões técnicas (autonomia de baixo impacto)

- Java 17 (LTS mínima suportada pelo Spring Boot 3), Spring Boot 3.3.x, Maven + Maven Wrapper.
- Testes Java rodam contra H2 em memória (perfil `test`) para não exigir Postgres/Docker no CI/local;
  runtime real usa Postgres (Docker).
- JWT stateless, `Authorization: Bearer <token>`, expiração 24h, segredo via `.env`/`JWT_SECRET`.
- Papéis: `USER` e `ADMIN`. Primeiro admin de desenvolvimento semeado via migration Flyway (`admin@mdb.dev` / `admin123`, documentado como não-produção).
- Dificuldade comunitária = média aritmética das `DifficultyRating` do problema (arredondada a 1 casa).
- `UserProblemStatus.status` é um enum único por (user, problem): `WANT_TO_DO`, `DONE`, `FAVORITE`
  não são mutuamente exclusivos na vida real, mas para simplificar o MVP tratamos cada um como uma
  linha própria (tabela permite múltiplas linhas por par usuário/problema, uma por tipo de status,
  com UNIQUE(user_id, problem_id, status)) — assim o usuário pode ao mesmo tempo favoritar E marcar
  "quero fazer".
- CSV: delimitador vírgula, aspas duplas, cabeçalho `id,titulo,enunciado,area,dificuldade,dica,solucao,fonte`;
  `id` do CSV é ignorado na importação (o banco gera o id); linhas inválidas são reportadas, não abortam o lote.
- Backend-python NÃO acessa o Postgres diretamente — apenas via API Java (documentado em docs/ARCHITECTURE.md).

## 3. Fases e checklist

- [x] Fase 1 — estrutura de repositório, plano, docs base
- [x] Fase 1 — banco: modelagem + migrations Flyway + seed
- [x] Fase 2 — CRUD Java: Area, Tag, Problem + testes
- [x] Fase 3 — autenticação JWT + usuários + permissões (ADMIN/USER)
- [x] Fase 4 — dificuldade, status (favorito/quero fazer/já fiz), filtros de busca
- [x] Fase 5 — API Python (inicialmente FastAPI, migrada para Flask): cliente Java, CSV import/export, random, mock-exam + testes
- [x] Fase 6 — frontend web completo integrado às APIs reais
- [x] Fase 7 — mobile Android (código-fonte completo; build não validado localmente — sem Android SDK)
- [x] Fase 8 — Docker Compose, .env.example, documentação final (README, ARCHITECTURE, API, DATABASE, SETUP)

## 4. Limitações conhecidas do ambiente desta sessão

- Sem `mvn` nem Android SDK instalados; `./mvnw` incluso mas build Java só pôde ser validado se houver
  acesso à internet para baixar dependências (registrado no README o resultado real obtido).
- Sem `psql`/Postgres local; Postgres roda via Docker Compose.

## 5. Resultado final (fim da sessão)

- **backend-java**: compila e passa **35/35 testes** (`./mvnw test`), rodando contra H2 no perfil
  `test` com as mesmas migrations Flyway usadas em produção. Precisou sobrescrever a versão do
  Mockito/ByteBuddy gerenciada pelo Spring Boot 3.3.4 (desatualizada para o JDK 25 instalado no
  ambiente) — ver `mockito.version`/`byte-buddy.version` em `backend-java/pom.xml`. Também foi
  necessário renomear as classes de teste HTTP de `*IT` para `*Test`: o Maven Surefire (rodado por
  `mvn test`) só reconhece o padrão `*Test`/`Test*`/`*Tests` por convenção — `*IT` é convenção do
  plugin Failsafe (fase `verify`), que não estava configurado, então esses 16 testes de integração
  nunca chegavam a rodar até essa correção.
- **backend-python**: passa **17/17 testes** (`pytest -q`), com a API Java mockada via
  `httpx.MockTransport`. Precisou atualizar as versões do `requirements.txt` (as originalmente
  planejadas não publicam wheels para Python 3.14, a versão instalada no ambiente).
- **frontend-web**: todos os `.js` passam em `node --check` (sem erros de sintaxe). Não foi
  possível testar em navegador real nesta sessão (sem ferramenta de browser disponível) — validar
  manualmente antes da apresentação é a recomendação principal de próximo passo.
- **mobile**: código-fonte Android completo (Java + Gradle); build não validado (sem Android SDK
  no ambiente) — detalhes e como validar em `mobile/README.md`.
- **docker-compose.yml**: executado de ponta a ponta com sucesso (`docker compose up --build`),
  após o usuário iniciar o Docker Desktop. Os 4 containers (postgres, backend-java, backend-python,
  frontend-web/nginx) sobem saudáveis. Essa validação real revelou e permitiu corrigir **dois bugs
  que os testes com H2/mocks não capturavam**:
  1. **Incompatibilidade de tipo de coluna**: as migrations declaravam `initial_difficulty` e
     `difficulty` como `SMALLINT`, mas as entidades JPA usam `Integer` (mapeado por padrão para
     `INTEGER`); o Hibernate valida o schema no boot e falhava contra PostgreSQL real
     (`SchemaManagementException: wrong column type... found int2, expecting integer`) — o H2 em
     modo PostgreSQL não distingue os dois tipos na validação, por isso os testes passavam mesmo
     com o bug presente. Corrigido trocando `SMALLINT` por `INTEGER` nas migrations
     (`V1__init_schema.sql` e a cópia de referência em `database/schema_reference.sql`).
  2. **Parâmetro de busca nulo mal tipado pelo driver JDBC**: a busca por texto usava
     `:text IS NULL OR LOWER(...)`; quando `:text` chegava `null` (sem filtro de texto), o driver do
     PostgreSQL não conseguia inferir o tipo do parâmetro dentro de `LOWER()`/`CONCAT()` e o
     PostgreSQL real rejeitava com `function lower(bytea) does not exist` — o H2 não reproduz esse
     comportamento de tipagem de parâmetros do protocolo do PostgreSQL. Corrigido usando `""` como
     sentinela de "sem filtro" em vez de `null` (`:text = ''` em `ProblemRepository.search`), já que
     o driver sempre consegue tipar uma string concreta.
  Depois da correção, foram testados via HTTP real contra o stack em Docker: registro/login,
  catálogo com filtro de texto/área, avaliação de dificuldade (create+duplicidade), favoritar/
  status, `GET /api/users/me/problems`, sorteio de questão, gerador de simulado, importação de CSV
  (3 linhas válidas persistidas no Postgres, 2 inválidas rejeitadas com mensagem correta),
  exportação de CSV, CORS entre as origens do frontend e dos dois backends, Swagger UI, `/docs` do
  FastAPI, e todas as páginas/assets estáticos do frontend servidos pelo nginx.
- Checklist de aceitação (seção 27 do prompt original): itens 1–20 confirmados — pela suíte
  automatizada (services, validação de DTOs, permissões) e pela validação manual via HTTP contra o
  stack real em Docker descrita acima. Item 21 (instalação limpa) segue como responsabilidade do
  usuário reproduzir seguindo o README, mas o próprio processo desta sessão (`.env.example` →
  `docker compose up --build`, sem nenhum ajuste manual) já é essa reprodução.
