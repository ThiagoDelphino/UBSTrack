from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.exc import OperationalError

from app.core.erros import registrar_handlers


def _client() -> TestClient:
    app = FastAPI()
    registrar_handlers(app)

    @app.get("/valida")
    def valida(n: int):
        return {"n": n}

    @app.get("/banco")
    def banco():
        raise OperationalError("select 1", {}, Exception("conexão recusada"))

    @app.get("/bug")
    def bug():
        raise RuntimeError("boom")

    return TestClient(app, raise_server_exceptions=False)


def test_validacao_422_formato_padrao():
    r = _client().get("/valida?n=abc")
    assert r.status_code == 422
    corpo = r.json()
    assert corpo["detail"] == "Parâmetros inválidos."
    assert corpo["erros"][0]["campo"] == "n"


def test_banco_fora_503():
    r = _client().get("/banco")
    assert r.status_code == 503
    assert "indisponível" in r.json()["detail"]


def test_erro_inesperado_500_sem_vazar_detalhes():
    r = _client().get("/bug")
    assert r.status_code == 500
    assert r.json() == {"detail": "Erro interno. Tente novamente."}
