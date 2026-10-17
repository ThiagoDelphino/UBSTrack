"""Teste de fumaça: garante que o app sobe e expõe a documentação.

Os testes de verdade virão com o domain/ (ex.: test_estimativa.py),
que não precisam de banco.
"""

from fastapi.testclient import TestClient

from app.main import app


def test_documentacao_disponivel():
    cliente = TestClient(app)
    resposta = cliente.get("/openapi.json")
    assert resposta.status_code == 200
    assert "/health" in resposta.json()["paths"]
