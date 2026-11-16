# Roteiro do vídeo de demonstração (5 a 10 min)

Segue a ordem exigida no enunciado. Os tempos são sugestões (total ≈ 8 min).

**Antes de gravar:** apague `backend-java/data/` para começar com o banco limpo, feche abas que
não serão usadas e deixe três terminais abertos na pasta do projeto.

## 1. Apresentação (até 1 min)

- Integrantes do grupo.
- Objetivo: "O MDB é um catálogo de problemas de matemática. O usuário busca, filtra, avalia a
  dificuldade, favorita, sorteia questões e gera simulados imprimíveis. A plataforma usa duas
  APIs independentes: a Java é o núcleo (usuários, problemas, avaliações) e a Python oferece as
  ferramentas (sorteio, simulados, estatísticas e CSV)."

## 2. Execução (≈ 1 min)

1. Terminal 1: `cd backend-java` e `./mvnw spring-boot:run -Dspring-boot.run.profiles=local`.
   Mostre `Started MdbBackendApplication` e a porta **8080**.
2. Terminal 2: `cd backend-python` e `flask --app app.main run --port 8000`. Mostre a porta **8000**.
3. Terminal 3: `cd frontend-web` e `python -m http.server 8081`.
4. Abra http://localhost:8081 e aponte os **dois indicadores verdes** no rodapé.

> Para não esperar o download de dependências durante a gravação, rode cada parte uma vez antes.

## 3. Funcionalidades (≈ 2–3 min)

1. **Home**: estatísticas do catálogo, áreas e problemas recentes.
2. **Catálogo**: busca por texto, filtro por área, dificuldade e tópico. Remova filtros pelos
   "chips".
3. **Sortear com estes filtros**, que abre um problema aleatório compatível.
4. **Página do problema**: LaTeX renderizado, mostrar dica e solução.
5. **Login** com o botão "Usuário comum". Depois favorite, marque "Resolvido" e avalie a
   dificuldade (a média muda na hora).
6. **Meu perfil**: o problema aparece nas listas.
7. **Simulado**: escolha área e faixa de dificuldade (a prévia mostra quantos há por nível),
   gere, ligue "Mostrar gabarito" e mostre "Imprimir / PDF".
8. **Admin** (saia e entre como "Administrador"): crie um problema, importe
   `database/sample_import.csv` (mostra linhas aceitas e rejeitadas) e exporte o CSV.
9. **Erro tratado**: peça um simulado com 99 questões e mostre a mensagem da API Python. Abra
   `/pages/problem.html?id=9999` e mostre o "Problema não encontrado".

## 4. Integração (≈ 1–2 min)

- Os **selos** laranja (API Java · :8080) e roxo (API Python · :8000) em cada tela indicam quem
  atende o quê.
- Abra o **Inspetor de integração** (botão no rodapé ou `Ctrl+I`). Repita algumas ações e mostre
  as requisições chegando, separadas por API, com método, rota, status e tempo. Use o filtro
  Java/Python.
- Abra **F12 → Network**, filtre por `8000` e depois por `8080`, e mostre uma requisição de cada
  (por exemplo `POST /tools/mock-exam` e `PUT /api/problems/3/status`) com o JSON de resposta.
- Opcional: mostre o Swagger da API Java (`:8080/swagger-ui.html`).
- Opcional: derrube a API Java, mostre o indicador vermelho no rodapé e `GET :8000/health`
  respondendo `"javaApi": "unreachable"`, sem que nada quebre.

## 5. Código (≈ 1–2 min)

- **Java**: `backend-java/.../controller/ProblemController.java`, o método `GET /api/problems`
  (busca com filtros). Mencione o `GlobalExceptionHandler`.
- **Python**: `backend-python/app/main.py`, a função decorada com `@app.post("/tools/mock-exam")`
  (e, para comparar, uma com `@app.get`). Mostre também `app/clients/java_client.py`, que é como
  o Python consulta a API Java.
- **Front-end**: `frontend-web/js/api.js`, nos objetos `JavaApi` e `PythonApi` e na função
  `request()`. Depois mostre uma chamada sendo usada, por exemplo `PythonApi.mockExam(payload)`
  em `js/mock-exam.js`.

## 6. Divisão do trabalho (≈ 30 s)

O que cada integrante desenvolveu, de acordo com a tabela "Integrantes" do README.
