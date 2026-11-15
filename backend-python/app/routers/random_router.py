from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.clients.java_client import JavaApiClient, get_java_client
from app.core.config import Settings, get_settings
from app.services.random_service import NoProblemsFoundError, pick_random_problem

router = APIRouter(prefix="/tools", tags=["Random"])


@router.get("/random-problem")
def random_problem(
    area: Optional[str] = Query(default=None),
    tag: Optional[str] = Query(default=None),
    minDifficulty: Optional[int] = Query(default=None, ge=1, le=5),
    maxDifficulty: Optional[int] = Query(default=None, ge=1, le=5),
    client: JavaApiClient = Depends(get_java_client),
    settings: Settings = Depends(get_settings),
):
    """Sorteia um problema que respeite os filtros opcionais informados."""
    try:
        return pick_random_problem(client, settings, area, tag, minDifficulty, maxDifficulty)
    except NoProblemsFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
