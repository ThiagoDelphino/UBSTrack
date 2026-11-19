"""Testes dos endpoints de unidades, sem banco: o service é trocado por um falso."""
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient

from app.core.database import get_db
from app.main import app
from app.schemas.senha import FilaResponse, SenhaResponse, UnidadeResumo
from app.services import simulador_service


@pytest.fixture
def cliente():
    def db_falso():
        yield None

    app.dependency_overrides[get_db] = db_falso
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_listar_unidades(cliente, monkeypatch):
    monkeypatch.setattr(
        simulador_service,
        "listar_unidades",
        lambda db: [UnidadeResumo(id=1, nome="UPA Teste", endereco="Rua A, 1")],
    )
    resposta = cliente.get("/unidades")
    assert resposta.status_code == 200
    assert resposta.json() == [{"id": 1, "nome": "UPA Teste", "endereco": "Rua A, 1"}]


def test_estado_da_fila(cliente, monkeypatch):
    fila = FilaResponse(
        id_ubs=1, nome="UPA Teste", aguardando=0, em_atendimento=0,
        senhas_aguardando=[], senhas_em_atendimento=[],
    )
    monkeypatch.setattr(simulador_service, "estado_da_fila", lambda db, id_ubs: fila)
    resposta = cliente.get("/unidades/1/fila")
    assert resposta.status_code == 200
    assert resposta.json()["nome"] == "UPA Teste"


def test_fila_de_unidade_inexistente_da_404(cliente, monkeypatch):
    def nao_existe(db, id_ubs):
        raise simulador_service.UnidadeNaoEncontrada(id_ubs)

    monkeypatch.setattr(simulador_service, "estado_da_fila", nao_existe)
    resposta = cliente.get("/unidades/99/fila")
    assert resposta.status_code == 404
    assert resposta.json()["detail"] == "Unidade não encontrada."


def test_retirar_senha_devolve_201(cliente, monkeypatch):
    criada = SenhaResponse(
        id_atendimento=10, id_ubs=1, codigo_senha="A-001", status="aguardando",
        entrada=datetime(2026, 11, 2, 12, 0, tzinfo=timezone.utc),
    )
    monkeypatch.setattr(simulador_service, "retirar_senha", lambda db, id_ubs: criada)
    resposta = cliente.post("/unidades/1/senhas")
    assert resposta.status_code == 201
    assert resposta.json()["codigo_senha"] == "A-001"
    assert resposta.json()["status"] == "aguardando"


def test_retirar_senha_em_unidade_inexistente_da_404(cliente, monkeypatch):
    def nao_existe(db, id_ubs):
        raise simulador_service.UnidadeNaoEncontrada(id_ubs)

    monkeypatch.setattr(simulador_service, "retirar_senha", nao_existe)
    assert cliente.post("/unidades/99/senhas").status_code == 404


def test_retirar_senha_em_unidade_sem_servico_da_409(cliente, monkeypatch):
    def sem_servico(db, id_ubs):
        raise simulador_service.UnidadeSemServico(id_ubs)

    monkeypatch.setattr(simulador_service, "retirar_senha", sem_servico)
    assert cliente.post("/unidades/1/senhas").status_code == 409


@pytest.mark.parametrize("caminho", ["/unidades/0/fila", "/unidades/-3/fila", "/unidades/abc/fila"])
def test_id_invalido_da_422(cliente, caminho):
    assert cliente.get(caminho).status_code == 422
