from typing import Optional

from app.clients.java_client import JavaApiClient, JavaApiError
from app.core.errors import ApiError


def extract_bearer_token(authorization: Optional[str]) -> str:
    """Extrai o token JWT do header Authorization (o mesmo token emitido pelo login da API Java)."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise ApiError(401, "É necessário o header Authorization com um token Bearer (faça login).")
    return authorization.split(" ", 1)[1].strip()


def require_admin(token: str, client: JavaApiClient) -> dict:
    """Confere junto à API Java se o token pertence a um usuário ADMIN.

    A checagem de papel (role) fica centralizada no Java (fonte da verdade): aqui apenas
    consultamos GET /api/users/me e recusamos a requisição se o usuário não for administrador.
    """
    try:
        user = client.get_current_user(token)
    except JavaApiError as exc:
        raise ApiError(401, exc.message) from exc

    if user.get("role") != "ADMIN":
        raise ApiError(403, "Apenas administradores podem realizar esta operação.")
    return user
