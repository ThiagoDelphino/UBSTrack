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


def test_rotas_de_atendimento_registradas():
    caminhos = TestClient(app).get("/openapi.json").json()["paths"]
    assert "/unidades/{id_ubs}/chamar-proximo" in caminhos
    assert "/atendimentos/{id_atendimento}/finalizar" in caminhos
    assert "/atendimentos/{id_atendimento}/desistir" in caminhos


def test_rotas_de_unidades_continuam_registradas():
    caminhos = TestClient(app).get("/openapi.json").json()["paths"]
    assert "/unidades" in caminhos
    assert "/unidades/{id_ubs}/fila" in caminhos
    assert "/unidades/{id_ubs}/senhas" in caminhos
