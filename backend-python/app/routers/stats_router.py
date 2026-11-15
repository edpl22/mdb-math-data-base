from fastapi import APIRouter, Depends

from app.clients.java_client import JavaApiClient, get_java_client
from app.core.config import Settings, get_settings
from app.schemas.stats import CatalogStats
from app.services.stats_service import build_stats

router = APIRouter(prefix="/tools", tags=["Estatísticas"])


@router.get("/stats", response_model=CatalogStats)
def catalog_stats(
    client: JavaApiClient = Depends(get_java_client),
    settings: Settings = Depends(get_settings),
):
    """Estatísticas do catálogo: total de problemas, distribuição por área e por dificuldade,
    tópicos mais frequentes e média de dificuldade. Calculado em Python a partir da API Java."""
    return build_stats(client, settings.max_pool_size_for_selection)
