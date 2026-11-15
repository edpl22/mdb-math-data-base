from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuracao central do microsservico Python (FastAPI).

    O servico Python nao acessa o PostgreSQL diretamente: ele consome a API
    Java (`java_api_base_url`) para ler e gravar problemas, evitando duas
    aplicacoes escrevendo nas mesmas tabelas.
    """

    java_api_base_url: str = "http://localhost:8080"
    request_timeout_seconds: float = 10.0
    max_pool_size_for_selection: int = 500

    model_config = SettingsConfigDict(env_prefix="MDB_", env_file=".env")


@lru_cache
def get_settings() -> Settings:
    return Settings()
