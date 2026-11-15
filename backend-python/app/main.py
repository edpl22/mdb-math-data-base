import logging
import os

import httpx
from fastapi import Depends, FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.clients.java_client import JavaApiClient, JavaApiError, get_java_client
from app.routers import csv_router, mock_exam_router, random_router, stats_router

logger = logging.getLogger("mdb.tools")

app = FastAPI(
    title="MDB - Math Data Base - API Python (ferramentas)",
    description=(
        "Microsserviço FastAPI responsável por importação/exportação de CSV, sorteio de "
        "questão, geração de simulados e estatísticas do catálogo. Consome a API Java "
        "(/api/...) como fonte dos dados — nunca acessa o PostgreSQL diretamente."
    ),
    version="1.0.0",
)

allowed_origins = os.getenv(
    "CORS_ALLOWED_ORIGINS", "http://localhost:5500,http://localhost:8081,http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(csv_router.router)
app.include_router(random_router.router)
app.include_router(mock_exam_router.router)
app.include_router(stats_router.router)


# ---------------------------------------------------------------------------
# Tratamento global de erros: toda falha vira JSON {"detail": "..."} com o
# status HTTP adequado, sem derrubar o serviço nem expor stack traces.
# ---------------------------------------------------------------------------

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(_: Request, exc: StarletteHTTPException):
    detail = exc.detail
    if exc.status_code == 404 and detail == "Not Found":
        detail = "Rota não encontrada."
    elif exc.status_code == 405 and detail == "Method Not Allowed":
        detail = "Método não suportado nesta rota."
    return JSONResponse(status_code=exc.status_code, content={"detail": detail}, headers=exc.headers)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        field = ".".join(str(part) for part in err.get("loc", []) if part not in ("body", "query", "path"))
        message = str(err.get("msg", "valor inválido")).removeprefix("Value error, ")
        errors.append(f"{field}: {message}" if field else message)
    return JSONResponse(
        status_code=422,
        content={"detail": "Dados inválidos — " + "; ".join(errors), "errors": errors},
    )


@app.exception_handler(JavaApiError)
async def java_api_error_handler(_: Request, exc: JavaApiError):
    """Erros devolvidos pela API Java são repassados com o mesmo status e mensagem."""
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})


@app.exception_handler(httpx.HTTPError)
async def java_unreachable_handler(_: Request, exc: httpx.HTTPError):
    """API Java fora do ar ou lenta demais: responde 503 em vez de um 500 genérico."""
    logger.warning("Falha ao comunicar com a API Java: %s", exc)
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"detail": "A API Java está indisponível no momento. Verifique se ela está rodando na porta 8080."},
    )


@app.exception_handler(Exception)
async def unexpected_error_handler(_: Request, exc: Exception):
    logger.exception("Erro inesperado", exc_info=exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Ocorreu um erro inesperado na API Python."},
    )


@app.get("/health", tags=["Health"])
def health(client: JavaApiClient = Depends(get_java_client)):
    """Saúde do serviço Python e, de quebra, se ele consegue alcançar a API Java."""
    try:
        java_status = "ok" if client.ping() else "error"
    except httpx.HTTPError:
        java_status = "unreachable"
    return {"status": "ok", "service": "api-python", "framework": "FastAPI", "javaApi": java_status}
