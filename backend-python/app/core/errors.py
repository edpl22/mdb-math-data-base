class ApiError(Exception):
    """Erro "esperado" da API Python (dado inválido, item não encontrado, sem permissão...).

    Qualquer rota pode lançar ApiError(status, mensagem); o handler registrado em
    app/main.py transforma em uma resposta JSON {"detail": mensagem} com o status HTTP.
    """

    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail
        super().__init__(detail)
