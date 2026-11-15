import httpx

from app.clients.java_client import JavaApiClient
from app.core.config import Settings


def make_mock_client(handler) -> JavaApiClient:
    """Cria um JavaApiClient cujo transporte HTTP e substituido por uma funcao fake,
    simulando respostas da API Java sem precisar subir o Spring Boot nos testes."""
    transport = httpx.MockTransport(handler)
    http_client = httpx.Client(base_url="http://fake-java-api", transport=transport)
    return JavaApiClient(client=http_client, settings=Settings(java_api_base_url="http://fake-java-api"))
