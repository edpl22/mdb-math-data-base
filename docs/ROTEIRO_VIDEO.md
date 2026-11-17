# Roteiro do vídeo de demonstração

Duração-alvo: **cerca de 9 minutos** (o limite do enunciado é de 5 a 10). As seis partes seguem
a ordem exigida pelo enunciado.

Como ler este roteiro:

- **Ação:** o que fazer na tela.
- **Fala:** texto sugerido para a narração. Não precisa ler palavra por palavra, mas cubra os
  pontos.
- **Aparece:** a requisição que deve surgir na aba Network do navegador.

| Parte | Tempo | Quem narra (sugestão) |
|---|---|---|
| 1. Apresentação | 0:00–0:50 | Palos |
| 2. Execução | 0:50–1:50 | Palos |
| 3. Funcionalidades | 1:50–4:50 | Davi Braga |
| 4. Integração | 4:50–6:50 | Davi Braga + Mendes |
| 5. Código | 6:50–8:40 | Oliveira (Java), Mendes (Python), Davi Braga (front-end) |
| 6. Divisão do trabalho | 8:40–9:10 | cada um fala de si |

---

## Antes de gravar (checklist)

- [ ] Rodar cada parte **uma vez antes**, para baixar as dependências (a primeira execução do
      Java demora).
- [ ] Apagar `backend-java/data/` para começar com o banco limpo (sem avaliações ou favoritos de
      testes anteriores).
- [ ] Usar uma janela anônima do navegador (sem sessão salva nem extensões) com zoom de 110–125%,
      para o texto ficar legível no vídeo.
- [ ] Deixar três terminais abertos na pasta do projeto, com fonte grande.
- [ ] Deixar abertos no editor: `ProblemController.java`, `backend-python/app/main.py`,
      `frontend-web/js/api.js` e `frontend-web/js/mock-exam.js`.
- [ ] Ter `database/sample_import.csv` à mão para o upload.

---

## 1. Apresentação (0:00–0:50)

**Ação:** tela inicial do site ou o README aberto no GitHub.

**Fala:**
> "Olá, somos Palos, Davi Braga, Mendes e Oliveira, e este é o nosso projeto final de
> Laboratório de Programação II: o **MDB, Math Data Base**. É um catálogo de problemas de
> matemática. O usuário busca problemas, filtra por área, tópico e dificuldade, avalia o quanto
> achou difícil, marca favoritos, sorteia questões e gera simulados prontos para imprimir.
>
> A plataforma tem três partes independentes: uma **API em Java com Spring Boot**, na porta
> 8080, que é o núcleo e cuida dos usuários, do login e dos problemas; uma **API em Python com
> Flask**, na porta 8000, que oferece as ferramentas de sorteio, simulado, estatísticas e CSV; e
> um **front-end em HTML, CSS e JavaScript**, na porta 8081, que consome as duas."

---

## 2. Execução (0:50–1:50)

**Ação (terminal 1):**

```bash
cd backend-java
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
```

**Fala:**
> "Primeiro subimos a API Java com o Maven Wrapper. O perfil `local` usa um banco H2 em
> arquivo, então não precisa instalar PostgreSQL. Ao iniciar, o **Flyway** roda os scripts SQL
> que criam as tabelas e inserem os dados de exemplo: 20 problemas, 7 áreas e 2 usuários."

**Ação:** espere aparecer `Started MdbBackendApplication` e `Tomcat started on port 8080` e
aponte para essas linhas.

**Ação (terminal 2):**

```bash
cd backend-python
.venv\Scripts\activate          # (ou source .venv/bin/activate)
flask --app app.main run --port 8000
```

**Fala:**
> "Agora a API Python, em Flask, na porta 8000. Ela não tem banco próprio: quando precisa de
> problemas, pede à API Java por HTTP. Por isso as duas são independentes e cada uma roda em
> seu próprio processo."

**Ação (terminal 3):**

```bash
cd frontend-web
python -m http.server 8081
```

**Fala:**
> "Por fim, o front-end é servido como arquivos estáticos na porta 8081."

**Ação:** abra http://localhost:8000/health em uma aba e depois http://localhost:8081.

**Fala:**
> "O `GET /health` da API Python responde `javaApi: ok`, ou seja, ela já está conversando com a
> API Java. Agora o site está no ar."

---

## 3. Funcionalidades (1:50–4:50)

Nesta parte o foco é **usar** o site. As requisições aparecem em detalhe na parte 4, mas já
vale mencionar, de passagem, qual API responde cada tela (a tabela "Qual tela usa qual API" do
README ajuda).

### 3.1 Home (20 s)

**Ação:** role a página inicial devagar.

**Fala:**
> "Na home, o painel 'O catálogo em números' mostra o total de problemas, a distribuição por
> área e por dificuldade e os tópicos mais frequentes. Quem calcula esses números é a
> **API Python**. Logo abaixo, a lista de áreas e os problemas recentes vêm da **API Java**."

### 3.2 Catálogo, busca e filtros (40 s)

**Ação:** clique em **Problemas**. Digite `equation` no campo Texto e mostre o resultado.
Remova esse filtro clicando no "×" do chip. Depois clique na área **Algebra** e, na
dificuldade mínima, escolha **2**.

**Fala:**
> "No catálogo, a busca e os filtros podem ser combinados: texto, área, tópico e faixa de
> dificuldade. Cada mudança refaz a busca na API Java e os filtros ativos aparecem como chips,
> que podem ser removidos um a um. A paginação também é feita pelo servidor."

**Ação:** clique em **Sortear com estes filtros**.

**Fala:**
> "Este botão sorteia um problema que respeita os filtros atuais. Quem faz o sorteio é a API
> Python."

### 3.3 Página do problema (30 s)

**Ação:** abra o problema **#3 (Difference-of-squares factoring)**. Clique em **Mostrar dica**
e depois em **Mostrar solução**.

**Fala:**
> "Na página do problema, o enunciado aceita LaTeX, renderizado pelo MathJax. A dica e a
> solução ficam escondidas por padrão, para o aluno tentar resolver antes."

### 3.4 Login e ações do usuário (50 s)

**Ação:** clique em **Entrar** e depois no botão **Usuário comum** (demo@mdb.dev).

**Fala:**
> "O login é feito na API Java, que confere a senha, guardada com BCrypt, e devolve um **token
> JWT**. O front-end guarda esse token e o envia nas próximas requisições."

**Ação:** volte ao problema #3. Clique em **★ Favorito**, depois em **✓ Resolvido**. Na
escala de dificuldade, clique em **3** e depois em **4**.

**Fala:**
> "Logado, posso favoritar, marcar como resolvido e avaliar a dificuldade de 1 a 5. A
> dificuldade exibida é a **média da comunidade**. Na primeira avaliação o sistema **cria** o
> registro; quando mudo a nota, ele **atualiza**. Cada usuário tem só uma avaliação por
> problema, e isso é garantido no banco."

**Ação:** clique em **Meu perfil**.

**Fala:**
> "No perfil aparecem as listas de favoritos, quero resolver e resolvidos."

### 3.5 Simulado (40 s)

**Ação:** clique em **Simulado**. Escolha a área **Algebra**, dificuldade de **1** a **3** e
quantidade **3**. Mostre a prévia "Problemas disponíveis por dificuldade". Clique em **Gerar
simulado**, marque **Mostrar gabarito** e clique em **Imprimir / PDF** (cancele a impressão).

**Fala:**
> "O gerador de simulados mostra antes quantos problemas existem em cada nível. Essa prévia é
> consultada na API Java. Ao gerar, a **API Python** sorteia as questões **sem repetição** e
> devolve o enunciado de cada uma. A prova sai pronta para imprimir, com o gabarito em uma
> página separada."

### 3.6 Administração e CSV (40 s)

**Ação:** clique em **Sair**, entre com **Administrador** e abra **Admin**. Em **Problemas**,
clique em **Editar** em um problema e mude o título. Em **Importar CSV**, envie
`database/sample_import.csv`.

**Fala:**
> "O administrador tem um painel com o CRUD de problemas e de áreas, feito na API Java e
> protegido: só o papel ADMIN consegue. Na importação, envio um CSV de exemplo com 5 linhas.
> A API Python valida linha por linha: **3 são importadas** e **2 são rejeitadas**, uma por
> dificuldade fora do intervalo e outra por campos vazios. As linhas inválidas não impedem as
> válidas."

**Ação:** em **Exportar CSV**, clique em **Exportar CSV** e mostre o download.

> "E a exportação gera o catálogo em CSV."

---

## 4. Integração: o que chama a API Python e o que chama a API Java (4:50–6:50)

Este é o item que o professor mais vai observar. Mostre as requisições **acontecendo** na aba
Network do navegador.

### 4.1 Aba Network: uma ação de cada vez (60 s)

**Ação:** abra **F12 → Network**, marque **Fetch/XHR** e clique no ícone de limpar. Faça as
ações da tabela uma por vez, apontando para a requisição que aparece. No campo de filtro da aba,
digite `8000` para ver só as chamadas da API Python e `8080` para ver só as da API Java.

| Ação no site | API | Requisição que aparece | Status |
|---|---|---|---|
| Abrir a home | Python | `GET /tools/stats` | 200 |
| (mesma tela) | Java | `GET /api/areas` e `GET /api/problems?size=6` | 200 |
| Clicar em **Sortear** | Python | `GET /tools/random-problem` | 200 |
| (abre o problema sorteado) | Java | `GET /api/problems/{id}` | 200 |
| Clicar em **★ Favorito** | Java | `PUT /api/problems/{id}/status` | 200 |
| Desmarcar **★ Favorito** | Java | `DELETE /api/problems/{id}/status?status=FAVORITE` | 200 |
| Primeira avaliação de dificuldade | Java | `POST /api/problems/{id}/difficulty` | **201** |
| Mudar a avaliação | Java | `PUT /api/problems/{id}/difficulty` | 200 |
| **Gerar simulado** | Python | `POST /tools/mock-exam` | 200 |

**Fala:**
> "Aqui na aba Network aparece cada requisição que o site faz. As que vão para a porta
> **8000** são da API Python: estatísticas, sorteio, simulado e CSV. As que vão para a porta
> **8080** são da API Java: login, busca, detalhe do problema, favoritos e avaliações.
>
> Repare nos **métodos HTTP**: usamos **GET** para consultar sem alterar nada, **POST** para
> criar algo novo (a primeira avaliação devolve **201 Created**), **PUT** para alterar ou
> marcar (mudar a nota, favoritar) e **DELETE** para remover (desfavoritar)."

### 4.2 Abrindo uma requisição de cada API (60 s)

**Ação:** clique em **Gerar simulado** novamente e clique na requisição `mock-exam`.

**Fala:**
> "Esta é a requisição para `localhost:8000/tools/mock-exam`, a API Python. Em **Headers**:
> método **POST** e `Content-Type: application/json`. Em **Payload**, o corpo que o front-end
> enviou: quantidade, área e faixa de dificuldade. Em **Response**, o JSON com a lista de
> problemas."

**Ação:** clique em **★ Favorito** e selecione a requisição `status`.

**Fala:**
> "E esta vai para `localhost:8080`, a API Java: um **PUT** em `/api/problems/3/status` com o
> corpo `{"status": "FAVORITE"}`. No header **Authorization** vai o token **Bearer** obtido no
> login. Sem ele, a API Java responderia **401**."

**Ação:** se aparecer uma requisição **OPTIONS** antes do POST/PUT, aponte para ela.

> "Esse OPTIONS antes é o **preflight de CORS**: como o site está na porta 8081 e as APIs em
> outras portas, o navegador pergunta antes se pode fazer a chamada. As duas APIs estão
> configuradas para liberar o front-end."

### 4.3 Tratamento de erros (opcional, 20 s, se sobrar tempo)

**Ação:** no simulado, peça **99** questões. Depois abra `/pages/problem.html?id=9999`.

**Fala:**
> "As APIs tratam erros sem cair. Pedindo 99 questões, a API Python responde **400** com a
> mensagem de que só há 20 disponíveis. Um problema que não existe faz a API Java responder
> **404**, e a tela mostra 'Problema não encontrado'. Todos os erros vêm em JSON."

---

## 5. Código (6:50–8:40)

Mostre **um endpoint de cada API** e **como o front-end faz a chamada**. Aproxime o zoom do
editor.

### 5.1 API Java: `ProblemController.java` (40 s), Oliveira

**Ação:** mostre o topo da classe e o método `search`.

```java
@RestController
@RequestMapping("/api/problems")
public class ProblemController {

    @GetMapping
    public ResponseEntity<PageResponse<ProblemSummaryResponse>> search(
            @RequestParam(required = false) String text,
            @RequestParam(required = false) String area, ... ) {
        return ResponseEntity.ok(PageResponse.from(problemService.search(text, area, ...)));
    }
```

**Fala:**
> "No Java, cada controller é uma classe anotada com **`@RestController`**, que faz os métodos
> devolverem JSON. O **`@RequestMapping("/api/problems")`** define o prefixo de todas as rotas
> da classe. Cada método recebe uma anotação com o verbo HTTP: **`@GetMapping`** para GET,
> **`@PostMapping`** para POST, **`@PutMapping`** e **`@DeleteMapping`**.
>
> Este `@GetMapping`, sem caminho extra, atende `GET /api/problems`. Os filtros chegam como
> **`@RequestParam`**, que são os parâmetros da URL, como `?area=Algebra`. O controller não tem
> regra de negócio: só repassa ao **service**, que consulta o banco pelo **repository**."

**Ação:** role até `createDifficulty`.

```java
@PostMapping("/{id}/difficulty")
public ResponseEntity<DifficultyRatingResponse> createDifficulty(
        @PathVariable Long id, @Valid @RequestBody DifficultyRatingRequest request, ...) {
    ...
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
}
```

**Fala:**
> "Já este é um **POST** em `/api/problems/{id}/difficulty`. O **`@PathVariable`** pega o `id`
> da URL, o **`@RequestBody`** converte o JSON enviado em objeto Java e o **`@Valid`** aplica
> as validações, como dificuldade entre 1 e 5. Se for inválido, nem entra no método e responde
> 400. Se der certo, devolve **201 Created**. Quem converte exceções em JSON de erro é o
> `GlobalExceptionHandler`."

### 5.2 API Python: `backend-python/app/main.py` (40 s), Mendes

**Ação:** mostre `@app.get("/tools/random-problem")` e `@app.post("/tools/mock-exam")`.

```python
@app.get("/tools/random-problem")
def random_problem():
    filters = problem_filters()                  # lê ?area=&tag=&minDifficulty=...
    problem = pick_random_problem(java_client(), get_settings(), **filters)
    return jsonify(problem)

@app.post("/tools/mock-exam")
def mock_exam():
    body = request.get_json(silent=True)          # corpo JSON do POST
    exam_request = MockExamRequest.model_validate(body)
    problems = build_mock_exam(java_client(), get_settings(), exam_request)
    ...
    return jsonify(MockExamResponse(problems=problems).model_dump())
```

**Fala:**
> "Na API Python usamos **Flask**. Cada rota é uma função com um decorator: **`@app.get`**
> registra a função para requisições **GET** e **`@app.post`** para **POST**. É o equivalente
> ao `@GetMapping` e ao `@PostMapping` do Java.
>
> No GET do sorteio, os filtros vêm da URL com `request.args`. No POST do simulado, o corpo
> JSON vem com `request.get_json()` e é validado com Pydantic: quantidade de 1 a 100, por
> exemplo. As duas funções devolvem JSON com **`jsonify`**."

**Ação:** abra `app/clients/java_client.py` no método `search_problems`.

> "E é aqui que a API Python chama a API Java: com a biblioteca **httpx**, ela faz um
> `GET http://localhost:8080/api/problems` com os filtros. Ou seja, a Python é cliente da Java,
> e só a Java acessa o banco."

**Ação:** role até o fim de `main.py`, nos `@app.errorhandler`.

> "No final, os **`@app.errorhandler`** convertem qualquer erro em JSON com o status certo. Se
> a API Java estiver fora do ar, por exemplo, a Python responde **503** em vez de quebrar."

### 5.3 Front-end: como a chamada é feita (30 s), Davi Braga

**Ação:** abra `frontend-web/js/api.js` e mostre os objetos `JavaApi` e `PythonApi`.

```js
const PythonApi = {
    mockExam: (payload) => request(CONFIG.PYTHON_API_BASE, '/tools/mock-exam', { method: 'POST', body: payload }),
};
const JavaApi = {
    setStatus: (id, status) =>
        request(CONFIG.JAVA_API_BASE, `/api/problems/${id}/status`, { method: 'PUT', auth: true, body: { status } }),
};
```

**Fala:**
> "No front-end, toda chamada passa pelo arquivo `api.js`. O objeto **`JavaApi`** aponta para a
> porta 8080 e o **`PythonApi`** para a 8000, então dá para ver no código qual API atende cada
> função. Todas usam a função **`request()`**, que faz o `fetch`, coloca o
> `Content-Type: application/json`, adiciona o token JWT quando `auth: true` e transforma erros
> em mensagens."

**Ação:** abra `frontend-web/js/mock-exam.js` na linha com `PythonApi.mockExam(payload)`.

> "Na página do simulado, basta chamar `PythonApi.mockExam(payload)` com `await` e desenhar o
> resultado na tela."

---

## 6. Divisão do trabalho (8:40–9:10)

**Fala (cada integrante fala da sua parte):**

> **Palos:** "Fiquei com o back-end de forma geral: a arquitetura, a integração entre as duas
> APIs, o banco de dados com as migrations e o Docker Compose."
>
> **Oliveira:** "Desenvolvi a API Java em Spring Boot: autenticação com JWT, CRUD de problemas,
> áreas, tags, avaliações de dificuldade e status."
>
> **Mendes:** "Desenvolvi a API Python em Flask: sorteio, gerador de simulados, estatísticas e
> a importação e exportação de CSV."
>
> **Davi Braga:** "Desenvolvi o front-end: as páginas, o consumo das duas APIs e o layout
> responsivo."

**Encerramento:**
> "O código está no GitHub e o README tem o passo a passo para rodar. Obrigado!"

---

## Cola: conceitos para explicar com segurança

| Conceito | Explicação curta |
|---|---|
| **GET** | Consulta dados, não altera nada. Ex.: `GET /api/problems`, `GET /tools/stats` |
| **POST** | Cria algo ou envia dados para processar. Ex.: `POST /api/auth/login`, `POST /tools/mock-exam` |
| **PUT** | Altera algo que já existe. Ex.: `PUT /api/problems/3/difficulty` |
| **DELETE** | Remove. Ex.: `DELETE /api/problems/3/status?status=FAVORITE` |
| **`@RestController`** (Java) | Classe que atende requisições e responde JSON |
| **`@RequestMapping("/api/x")`** (Java) | Prefixo comum das rotas da classe |
| **`@GetMapping` / `@PostMapping` / `@PutMapping` / `@DeleteMapping`** (Java) | Ligam um método a um verbo HTTP + caminho |
| **`@PathVariable`** | Valor que vem do caminho: `/problems/{id}` |
| **`@RequestParam`** | Valor da query string: `?area=Algebra` |
| **`@RequestBody` + `@Valid`** | Corpo JSON convertido em objeto e validado |
| **`@app.get` / `@app.post`** (Flask) | Decorators que registram uma função como rota GET ou POST |
| **`request.args` / `request.get_json()`** (Flask) | Parâmetros da URL / corpo JSON |
| **`jsonify`** (Flask) | Transforma `dict` em resposta JSON |
| **`@app.errorhandler`** (Flask) | Converte erros em JSON com o status correto |
| **`fetch`** (JS) | Função do navegador que faz a requisição HTTP |
| **JWT / Bearer** | Token do login enviado no header `Authorization: Bearer <token>` |
| **CORS / OPTIONS** | O navegador pergunta antes (preflight) se pode chamar outra porta |
| **200 / 201 / 204** | OK / criado / OK sem conteúdo |
| **400 / 401 / 403 / 404 / 409 / 422 / 503** | Dado inválido / sem login / sem permissão / não encontrado / conflito (duplicado) / validação / serviço indisponível |
