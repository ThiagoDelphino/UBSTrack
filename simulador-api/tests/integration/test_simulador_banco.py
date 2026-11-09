"""simulador-api contra um PostgreSQL real, sobre o seed demo."""
import random
import threading
import time
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.exc import ProgrammingError

from app.core.database import SessionLocal, engine
from app.domain.automatico import Parametros
from app.main import app
from app.services.automatico_service import Simulacao, executar_rodada_da_unidade


@pytest.fixture
def cliente():
    return TestClient(app)


def em_paralelo(n, funcao):
    resultados = []
    threads = [threading.Thread(target=lambda: resultados.append(funcao())) for _ in range(n)]
    [t.start() for t in threads]
    [t.join() for t in threads]
    return resultados


def numero(codigo):
    return int(codigo.split("-")[1])


def test_health(cliente, unidades):
    assert cliente.get("/health").json() == {"status": "ok", "banco": "ok"}


def test_retirar_senha_continua_a_sequencia_do_dia(cliente, unidades):
    centro = unidades["UBS Demo Centro"]  # seed: aguardando A-011..A-014
    a = cliente.post(f"/unidades/{centro}/senhas")
    b = cliente.post(f"/unidades/{centro}/senhas")
    assert (a.status_code, a.json()["codigo_senha"]) == (201, "A-015")
    assert b.json()["codigo_senha"] == "A-016"
    assert cliente.get(f"/unidades/{centro}/fila").json()["aguardando"] == 6


def test_retiradas_simultaneas_nunca_repetem_codigo(unidades):
    norte = unidades["UBS Demo Norte"]
    respostas = em_paralelo(15, lambda: TestClient(app).post(f"/unidades/{norte}/senhas"))
    codigos = sorted(numero(r.json()["codigo_senha"]) for r in respostas)
    assert all(r.status_code == 201 for r in respostas)
    assert codigos == list(range(codigos[0], codigos[0] + 15))  # 15 códigos distintos e seguidos


def test_chamadas_simultaneas_nao_chamam_a_mesma_senha(unidades):
    leste = unidades["UBS Demo Leste"]  # seed: 8 aguardando
    respostas = em_paralelo(15, lambda: TestClient(app).post(f"/unidades/{leste}/chamar-proximo"))
    ok = [r.json()["codigo_senha"] for r in respostas if r.status_code == 200]
    assert len(ok) == 8 and len(set(ok)) == 8
    assert sorted(r.status_code for r in respostas if r.status_code != 200) == [404] * 7


def test_chamar_proximo_chama_a_mais_antiga(cliente, unidades):
    centro = unidades["UBS Demo Centro"]
    r = cliente.post(f"/unidades/{centro}/chamar-proximo")
    assert r.json()["codigo_senha"] == "A-011" and r.json()["status"] == "em_atendimento"
    assert r.json()["inicio_atendimento"] is not None


def test_fila_vazia_da_404(cliente, unidades):
    r = cliente.post(f"/unidades/{unidades['UBS Demo Norte']}/chamar-proximo")
    assert r.status_code == 404


def test_finalizar_so_uma_vez(unidades, cliente):
    chamada = cliente.post(f"/unidades/{unidades['UBS Demo Centro']}/chamar-proximo").json()
    url = f"/atendimentos/{chamada['id_atendimento']}/finalizar"
    respostas = em_paralelo(10, lambda: TestClient(app).post(url))
    assert sorted(r.status_code for r in respostas) == [200] + [409] * 9
    final = cliente.post(url)
    assert final.status_code == 409 and "finalizado" in final.json()["detail"]


def test_desistir_so_de_quem_aguarda(cliente, unidades):
    centro = unidades["UBS Demo Centro"]
    em_atendimento = cliente.post(f"/unidades/{centro}/chamar-proximo").json()
    assert cliente.post(f"/atendimentos/{em_atendimento['id_atendimento']}/desistir").status_code == 409
    aguardando = cliente.get(f"/unidades/{centro}/fila").json()["senhas_aguardando"][0]
    r = cliente.post(f"/atendimentos/{aguardando['id_atendimento']}/desistir")
    assert r.status_code == 200 and r.json()["status"] == "desistiu" and r.json()["fim_atendimento"]
    assert cliente.post("/atendimentos/999999/desistir").status_code == 404


def test_usuario_do_simulador_nao_apaga_dados(unidades):
    """O papel simulador_escrita só insere e atualiza: DELETE é recusado pelo banco."""
    with pytest.raises(ProgrammingError):
        with engine.begin() as conexao:
            conexao.execute(text("DELETE FROM atendimento"))


class RngFixo(random.Random):
    def random(self):
        return 0.0  # tudo que depende de sorteio acontece


def test_modo_automatico_uma_rodada_na_unidade(cliente, unidades):
    centro = unidades["UBS Demo Centro"]  # 4 aguardando, 0 em atendimento
    with SessionLocal() as db:
        feitas = executar_rodada_da_unidade(
            db, centro, Parametros(), RngFixo(), datetime.now(timezone.utc)
        )
    # 1 desistência (a mais recente), 2 chamadas (2 guichês livres), 1 chegada
    assert feitas == {"retirada": 1, "chamada": 2, "finalizacao": 0, "desistencia": 1}
    fila = cliente.get(f"/unidades/{centro}/fila").json()
    assert (fila["aguardando"], fila["em_atendimento"]) == (2, 2)


def test_modo_automatico_roda_sem_erros(cliente, unidades):
    sim = Simulacao()
    sim.iniciar(1)
    time.sleep(2.5)
    sim.parar()
    estado = sim.estado()
    assert estado["rodadas"] >= 2 and estado["erros"] == 0
    assert sum(estado["acoes"].values()) > 0
