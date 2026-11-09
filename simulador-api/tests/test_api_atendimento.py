"""Testes dos endpoints de atendimento, sem banco: o service é trocado por um falso."""
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient

from app.api import atendimento as api
from app.core.database import get_db
from app.main import app

AGORA = datetime(2026, 11, 8, 12, 0, tzinfo=timezone.utc)


def senha(status, inicio=None, fim=None):
    return {
        "id_atendimento": 7, "id_ubs": 1, "id_servico": 1, "codigo_senha": "A-007",
        "status": status, "entrada": AGORA, "inicio_atendimento": inicio, "fim_atendimento": fim,
    }


@pytest.fixture
def cliente():
    app.dependency_overrides[get_db] = lambda: iter([None])
    yield TestClient(app)
    app.dependency_overrides.clear()


def levanta(erro):
    def _falha(db, _id):
        raise erro

    return _falha


def test_chamar_proximo(cliente, monkeypatch):
    monkeypatch.setattr(api.service, "chamar_proximo", lambda db, i: senha("em_atendimento", AGORA))
    r = cliente.post("/unidades/1/chamar-proximo")
    assert r.status_code == 200
    assert r.json()["status"] == "em_atendimento"
    assert r.json()["inicio_atendimento"] is not None


def test_chamar_proximo_sem_fila_da_404(cliente, monkeypatch):
    monkeypatch.setattr(api.service, "chamar_proximo", levanta(api.service.FilaVazia(1)))
    r = cliente.post("/unidades/1/chamar-proximo")
    assert r.status_code == 404
    assert r.json() == {"detail": "Nenhuma senha aguardando nesta unidade."}


@pytest.mark.parametrize("rota", ["/unidades/0/chamar-proximo", "/unidades/abc/chamar-proximo"])
def test_chamar_proximo_id_invalido_da_422(cliente, rota):
    assert cliente.post(rota).status_code == 422


def test_finalizar(cliente, monkeypatch):
    monkeypatch.setattr(api.service, "finalizar", lambda db, i: senha("finalizado", AGORA, AGORA))
    r = cliente.post("/atendimentos/7/finalizar")
    assert r.status_code == 200
    assert r.json()["status"] == "finalizado"
    assert r.json()["fim_atendimento"] is not None


def test_finalizar_fora_de_atendimento_da_409(cliente, monkeypatch):
    erro = api.service.TransicaoInvalida("aguardando", "em_atendimento")
    monkeypatch.setattr(api.service, "finalizar", levanta(erro))
    r = cliente.post("/atendimentos/7/finalizar")
    assert r.status_code == 409
    assert "aguardando" in r.json()["detail"]


def test_finalizar_inexistente_da_404(cliente, monkeypatch):
    monkeypatch.setattr(api.service, "finalizar", levanta(api.service.AtendimentoNaoEncontrado(7)))
    r = cliente.post("/atendimentos/7/finalizar")
    assert r.status_code == 404
    assert r.json() == {"detail": "Senha não encontrada."}


def test_desistir(cliente, monkeypatch):
    monkeypatch.setattr(api.service, "desistir", lambda db, i: senha("desistiu", None, AGORA))
    r = cliente.post("/atendimentos/7/desistir")
    assert r.status_code == 200
    assert r.json()["status"] == "desistiu"
    assert r.json()["fim_atendimento"] is not None


def test_desistir_em_atendimento_da_409(cliente, monkeypatch):
    erro = api.service.TransicaoInvalida("em_atendimento", "aguardando")
    monkeypatch.setattr(api.service, "desistir", levanta(erro))
    r = cliente.post("/atendimentos/7/desistir")
    assert r.status_code == 409
    assert "em_atendimento" in r.json()["detail"]


def test_desistir_inexistente_da_404(cliente, monkeypatch):
    monkeypatch.setattr(api.service, "desistir", levanta(api.service.AtendimentoNaoEncontrado(7)))
    assert cliente.post("/atendimentos/7/desistir").status_code == 404


@pytest.mark.parametrize("rota", ["/atendimentos/0/finalizar", "/atendimentos/0/desistir"])
def test_id_zero_da_422(cliente, rota):
    assert cliente.post(rota).status_code == 422
