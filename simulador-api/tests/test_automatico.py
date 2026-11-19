import random
import time
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from app.domain.automatico import Parametros, duracao_da_senha_s
from app.main import app
from app.services import atendimento_service, automatico_service, simulador_service
from app.services.automatico_service import Simulacao, executar_rodada_da_unidade

AGORA = datetime(2026, 11, 8, 12, 0, tzinfo=timezone.utc)


class RngFixo(random.Random):
    def __init__(self, valor):
        super().__init__()
        self.valor = valor

    def random(self):
        return self.valor


def _senha(i, status, inicio=None):
    return {"id_atendimento": i, "codigo_senha": f"A-{i:03d}", "status": status,
            "entrada": AGORA, "inicio_atendimento": inicio}


def test_rodada_aplica_as_acoes_decididas(monkeypatch):
    p = Parametros()
    inicio = AGORA - timedelta(seconds=duracao_da_senha_s(1, p) + 1)
    fila = [_senha(1, "em_atendimento", inicio), _senha(5, "aguardando"), _senha(6, "aguardando")]
    chamadas = []
    monkeypatch.setattr(automatico_service.atendimento_repo, "listar_fila", lambda db, i: fila)
    monkeypatch.setattr(atendimento_service, "finalizar", lambda db, i: chamadas.append(("fin", i)))
    monkeypatch.setattr(atendimento_service, "desistir", lambda db, i: chamadas.append(("des", i)))
    monkeypatch.setattr(atendimento_service, "chamar_proximo", lambda db, i: chamadas.append(("cha", i)))
    monkeypatch.setattr(simulador_service, "retirar_senha", lambda db, i: chamadas.append(("ret", i)))

    feitas = executar_rodada_da_unidade(None, 7, p, RngFixo(0.0), AGORA)  # tudo dispara

    assert ("fin", 1) in chamadas and ("des", 6) in chamadas and ("ret", 7) in chamadas
    assert feitas == {"retirada": 1, "chamada": 1, "finalizacao": 1, "desistencia": 1}


def test_rodada_tolera_fila_vazia_e_transicao_invalida(monkeypatch):
    fila = [_senha(5, "aguardando")]
    monkeypatch.setattr(automatico_service.atendimento_repo, "listar_fila", lambda db, i: fila)

    def fila_vazia(db, i):
        raise atendimento_service.FilaVazia(i)

    monkeypatch.setattr(atendimento_service, "chamar_proximo", fila_vazia)
    feitas = executar_rodada_da_unidade(None, 7, Parametros(prob_chegada=0), RngFixo(0.99), AGORA)
    assert feitas["chamada"] == 0


def test_simulacao_inicia_roda_e_para(monkeypatch):
    s = Simulacao()
    contagem = []
    monkeypatch.setattr(Simulacao, "_rodada", lambda self, rng: contagem.append(1))
    s.iniciar(1)
    s.iniciar(1)  # segunda chamada não cria outra thread
    assert s.ativo
    time.sleep(0.2)
    s.parar()
    assert not s.ativo and len(contagem) >= 1
    n = len(contagem)
    time.sleep(0.2)
    assert len(contagem) == n  # parou de verdade
    s.parar()  # idempotente


def test_rodada_conta_erro_e_continua(monkeypatch):
    class FakeSessao:
        def __enter__(self): return self
        def __exit__(self, *a): return False
        def rollback(self): pass

    monkeypatch.setattr(automatico_service.database, "SessionLocal", lambda: FakeSessao())
    monkeypatch.setattr(automatico_service.unidade_repo, "listar",
                        lambda db: [{"id_ubs": 1}, {"id_ubs": 2}])

    def quebra(db, id_ubs, p, rng, agora):
        if id_ubs == 1:
            raise RuntimeError("falha")
        return {"retirada": 1, "chamada": 0, "finalizacao": 0, "desistencia": 0}

    monkeypatch.setattr(automatico_service, "executar_rodada_da_unidade", quebra)
    s = Simulacao()
    s._rodada(random.Random(1))
    e = s.estado()
    assert e["erros"] == 1 and e["rodadas"] == 1 and e["acoes"]["retirada"] == 1


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setattr(Simulacao, "_rodada", lambda self, rng: None)
    monkeypatch.setattr(automatico_service, "simulacao", Simulacao())
    yield TestClient(app)
    automatico_service.simulacao.parar()


def test_api_ciclo_completo(client):
    r = client.get("/automatico")
    assert r.status_code == 200 and r.json()["ativo"] is False

    r = client.post("/automatico/iniciar?intervalo_s=2")
    assert r.status_code == 200 and r.json()["ativo"] is True and r.json()["intervalo_s"] == 2

    assert client.post("/automatico/iniciar").json()["intervalo_s"] == 2  # idempotente

    r = client.post("/automatico/parar")
    assert r.status_code == 200 and r.json()["ativo"] is False and r.json()["intervalo_s"] is None
    assert client.post("/automatico/parar").status_code == 200


@pytest.mark.parametrize("valor", ["0", "61", "abc"])
def test_api_rejeita_intervalo_invalido(client, valor):
    r = client.post(f"/automatico/iniciar?intervalo_s={valor}")
    assert r.status_code == 422 and r.json()["detail"] == "Parâmetros inválidos."
