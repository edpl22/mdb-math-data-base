from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, status
from fastapi.responses import StreamingResponse

from app.clients.java_client import JavaApiClient, get_java_client
from app.core.config import Settings, get_settings
from app.core.security import extract_bearer_token, require_admin
from app.schemas.csv_import import CsvImportResult
from app.services.csv_service import export_rows, import_rows, parse_csv
from app.services.selection_service import fetch_pool

router = APIRouter(prefix="/tools/csv", tags=["CSV"])


@router.post("/import", response_model=CsvImportResult)
def import_csv(
    file: UploadFile,
    token: str = Depends(extract_bearer_token),
    client: JavaApiClient = Depends(get_java_client),
):
    """Importa problemas a partir de um CSV (id,titulo,enunciado,area,dificuldade,dica,solucao,fonte).

    Requer um token de administrador (o mesmo emitido pelo login da API Java). Linhas
    invalidas sao reportadas mas nao interrompem a importacao das linhas validas.
    """
    require_admin(token, client)

    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="O arquivo enviado deve ser um .csv")

    content = file.file.read()
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Arquivo CSV vazio.")

    try:
        rows = parse_csv(content)
    except UnicodeDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Não foi possível ler o arquivo como texto UTF-8."
        ) from exc

    if not rows:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="O CSV não contém linhas de dados.")

    return import_rows(rows, token, client)


@router.get("/export")
def export_csv(
    area: Optional[str] = Query(default=None),
    tag: Optional[str] = Query(default=None),
    minDifficulty: Optional[int] = Query(default=None),
    maxDifficulty: Optional[int] = Query(default=None),
    token: str = Depends(extract_bearer_token),
    client: JavaApiClient = Depends(get_java_client),
    settings: Settings = Depends(get_settings),
):
    """Exporta o catálogo de problemas (com filtros opcionais) para CSV. Apenas administradores."""
    require_admin(token, client)

    summaries = fetch_pool(client, area, tag, minDifficulty, maxDifficulty, settings.max_pool_size_for_selection)
    details = [client.get_problem(summary["id"], token) for summary in summaries]
    csv_content = export_rows(details)

    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=mdb_problemas_export.csv"},
    )
