import httpx
from fastapi.testclient import TestClient

from app.clients.java_client import get_java_client
from app.main import app
from tests.helpers import make_mock_client


def override_client(handler):
    client = make_mock_client(handler)
    app.dependency_overrides[get_java_client] = lambda: client
    return client


def teardown_function():
    app.dependency_overrides.clear()


def test_mock_exam_endpoint_returns_400_when_not_enough_problems():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"content": [], "page": 0, "size": 100, "totalElements": 0, "totalPages": 0})

    override_client(handler)
    with TestClient(app) as test_client:
        response = test_client.post("/tools/mock-exam", json={"quantity": 5})

    assert response.status_code == 400
    assert "disponíveis" in response.json()["detail"]


def test_random_problem_endpoint_returns_404_when_empty():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"content": [], "page": 0, "size": 100, "totalElements": 0, "totalPages": 0})

    override_client(handler)
    with TestClient(app) as test_client:
        response = test_client.get("/tools/random-problem")

    assert response.status_code == 404


def test_csv_import_requires_authorization_header():
    with TestClient(app) as test_client:
        response = test_client.post(
            "/tools/csv/import",
            files={"file": ("problemas.csv", b"id,titulo\n1,x\n", "text/csv")},
        )

    assert response.status_code == 401


def test_csv_import_rejects_non_admin_user():
    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/api/users/me":
            return httpx.Response(200, json={"id": 2, "name": "Demo", "role": "USER"})
        raise AssertionError("não deveria chamar outro endpoint")

    override_client(handler)
    with TestClient(app) as test_client:
        response = test_client.post(
            "/tools/csv/import",
            headers={"Authorization": "Bearer fake-user-token"},
            files={"file": ("problemas.csv", b"id,titulo\n1,x\n", "text/csv")},
        )

    assert response.status_code == 403


def test_csv_import_accepts_admin_user_and_imports_valid_rows():
    calls = {"created": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/api/users/me":
            return httpx.Response(200, json={"id": 1, "name": "Admin", "role": "ADMIN"})
        if request.url.path == "/api/problems" and request.method == "POST":
            calls["created"] += 1
            return httpx.Response(201, json={"id": calls["created"]})
        raise AssertionError(f"unexpected {request.method} {request.url.path}")

    override_client(handler)
    csv_content = (
        "id,titulo,enunciado,area,dificuldade,dica,solucao,fonte\n"
        '1,"Título","Enunciado","Álgebra",2,"Dica","Solução",\n'
    ).encode("utf-8")

    with TestClient(app) as test_client:
        response = test_client.post(
            "/tools/csv/import",
            headers={"Authorization": "Bearer fake-admin-token"},
            files={"file": ("problemas.csv", csv_content, "text/csv")},
        )

    assert response.status_code == 200
    body = response.json()
    assert body["imported"] == 1
    assert body["failed"] == 0
    assert calls["created"] == 1


def test_csv_export_requires_admin():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"id": 2, "name": "Demo", "role": "USER"})

    override_client(handler)
    with TestClient(app) as test_client:
        response = test_client.get("/tools/csv/export", headers={"Authorization": "Bearer fake-user-token"})

    assert response.status_code == 403


def _page(n: int) -> dict:
    content = [
        {"id": i, "title": f"P{i}", "area": "Algebra", "tags": ["t1"] if i % 2 else ["t2"],
         "initialDifficulty": (i % 5) + 1, "communityDifficulty": None, "ratingsCount": 0}
        for i in range(1, n + 1)
    ]
    return {"content": content, "page": 0, "size": 100, "totalElements": n, "totalPages": 1}


def test_mock_exam_with_statements_fetches_details():
    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/api/problems":
            return httpx.Response(200, json=_page(6))
        problem_id = int(request.url.path.rsplit("/", 1)[1])
        return httpx.Response(200, json={**_page(6)["content"][problem_id - 1],
                                         "statement": f"Enunciado {problem_id}", "hint": "h", "solution": "s"})

    override_client(handler)
    with TestClient(app) as test_client:
        response = test_client.post("/tools/mock-exam", json={"quantity": 3, "includeStatements": True})

    assert response.status_code == 200
    problems = response.json()["problems"]
    assert len(problems) == 3
    assert all(p["statement"].startswith("Enunciado") for p in problems)


def test_stats_endpoint_aggregates_catalog():
    override_client(lambda request: httpx.Response(200, json=_page(10)))
    with TestClient(app) as test_client:
        response = test_client.get("/tools/stats")

    assert response.status_code == 200
    body = response.json()
    assert body["totalProblems"] == 10
    assert sum(d["count"] for d in body["byDifficulty"]) == 10
    assert body["byArea"] == [{"area": "Algebra", "count": 10}]
    assert {t["tag"] for t in body["topTags"]} == {"t1", "t2"}


def test_returns_503_json_when_java_api_is_down():
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("connection refused", request=request)

    override_client(handler)
    with TestClient(app) as test_client:
        response = test_client.get("/tools/random-problem")

    assert response.status_code == 503
    assert "indisponível" in response.json()["detail"]


def test_validation_error_returns_readable_detail():
    override_client(lambda request: httpx.Response(200, json=_page(1)))
    with TestClient(app) as test_client:
        response = test_client.post("/tools/mock-exam", json={"quantity": 0})

    assert response.status_code == 422
    assert isinstance(response.json()["detail"], str)
    assert "quantity" in response.json()["detail"]


def test_health_reports_java_status():
    override_client(lambda request: httpx.Response(200, json={"status": "ok"}))
    with TestClient(app) as test_client:
        response = test_client.get("/health")

    assert response.json() == {"status": "ok", "service": "api-python", "framework": "FastAPI", "javaApi": "ok"}
