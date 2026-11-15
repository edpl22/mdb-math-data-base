from fastapi import APIRouter, Depends, HTTPException, status

from app.clients.java_client import JavaApiClient, get_java_client
from app.core.config import Settings, get_settings
from app.schemas.mock_exam import MockExamRequest, MockExamResponse
from app.services.mock_exam_service import InsufficientProblemsError, build_mock_exam

router = APIRouter(prefix="/tools", tags=["Mock Exams"])


@router.post("/mock-exam", response_model=MockExamResponse)
def mock_exam(
    request: MockExamRequest,
    client: JavaApiClient = Depends(get_java_client),
    settings: Settings = Depends(get_settings),
):
    """Gera um simulado selecionando aleatoriamente (sem repetição) problemas compatíveis com os filtros."""
    try:
        problems = build_mock_exam(client, settings, request)
    except InsufficientProblemsError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    if request.includeStatements:
        # Busca o detalhe completo de cada questão sorteada na API Java (enunciado/dica/solução).
        problems = [client.get_problem(p["id"]) for p in problems]

    return MockExamResponse(problems=problems)
