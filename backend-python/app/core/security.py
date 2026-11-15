from typing import Optional

from fastapi import Header, HTTPException, status

from app.clients.java_client import JavaApiClient, JavaApiError


def extract_bearer_token(authorization: Optional[str] = Header(default=None)) -> str:
    """Extrai o token JWT do header Authorization (mesmo token emitido pelo login Java)."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="É necessário o header Authorization com um token Bearer (faça login).",
        )
    return authorization.split(" ", 1)[1].strip()


def require_admin(token: str, client: JavaApiClient) -> dict:
    """Valida junto a API Java que o token pertence a um usuário ADMIN.

    A checagem de papel (role) fica centralizada no Java (fonte da verdade); aqui
    apenas consultamos /api/users/me e recusamos a requisição caso o usuário não
    seja administrador, evitando duplicar a lógica de autorização.
    """
    try:
        user = client.get_current_user(token)
    except JavaApiError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=exc.message) from exc

    if user.get("role") != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem realizar esta operação.",
        )
    return user
