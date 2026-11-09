"""painel-api contra um PostgreSQL real, sobre o seed demo."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.exc import ProgrammingError

from app.core.database import engine
from app.main import app

CENTRO = {"lat": -23.5015, "lon": -47.4526}  # mesmas coordenadas da UBS Demo Centro


@pytest.fixture
def cliente():
    return TestClient(app)


def por_nome(lista):
    return {u["nome"]: u for u in lista}


def test_health(cliente, unidades):
    assert cliente.get("/health").json() == {"status": "ok", "database": "ok"}


def test_situacao_e_fila_seguem_as_regras(cliente, unidades):
    u = por_nome(cliente.get("/unidades", params=CENTRO).json())
    assert (u["UBS Demo Norte"]["fila"], u["UBS Demo Norte"]["situacao"]) == (0, "baixa")
    assert (u["UBS Demo Centro"]["fila"], u["UBS Demo Centro"]["espera_min"]) == (4, 40)
    assert u["UBS Demo Centro"]["situacao"] == "moderada"
    assert (u["UBS Demo Leste"]["espera_min"], u["UBS Demo Leste"]["situacao"]) == (96, "alta")


def test_ordenacao_com_localizacao(cliente, unidades):
    lista = cliente.get("/unidades", params=CENTRO).json()
    ranqueadas = [u for u in lista if u["posicao"] is not None]
    assert [u["posicao"] for u in ranqueadas] == list(range(1, len(ranqueadas) + 1))
    totais = [u["tempo_total_min"] for u in ranqueadas if not u["desatualizado"]]
    assert totais == sorted(totais)  # ordenadas pelo tempo total


def test_unidade_fechada_fica_sem_posicao(cliente, unidades):
    u = por_nome(cliente.get("/unidades", params=CENTRO).json())["UBS Demo Fechada"]
    assert u["aberta"] is False and u["posicao"] is None


def test_dado_desatualizado_vai_para_o_fim_e_e_marcado(cliente, unidades):
    lista = cliente.get("/unidades", params=CENTRO).json()
    ranqueadas = [u for u in lista if u["posicao"] is not None]
    desatualizadas = [u for u in ranqueadas if u["desatualizado"]]
    assert [u["nome"] for u in desatualizadas] == ["UBS Demo Desatualizada"]
    assert ranqueadas[-1]["nome"] == "UBS Demo Desatualizada"


def test_sem_localizacao_ordena_so_pela_espera(cliente, unidades):
    lista = cliente.get("/unidades").json()
    assert all(u["tempo_total_min"] is None and u["distancia_km"] is None for u in lista)
    esperas = [u["espera_min"] for u in lista if u["posicao"] is not None and not u["desatualizado"]]
    assert esperas == sorted(esperas)


def test_detalhe_da_unidade(cliente, unidades):
    r = cliente.get(f"/unidades/{unidades['UBS Demo Centro']}", params=CENTRO)
    assert r.status_code == 200 and r.json()["nome"] == "UBS Demo Centro"
    assert cliente.get("/unidades/999999").status_code == 404


def test_parametros_invalidos(cliente, unidades):
    assert cliente.get("/unidades", params={"lat": -23.5}).status_code == 422


def test_usuario_do_painel_nao_consegue_escrever(unidades):
    """O papel painel_leitura é somente leitura: o banco recusa qualquer escrita."""
    with pytest.raises(ProgrammingError):
        with engine.begin() as conexao:
            conexao.execute(text("DELETE FROM atendimento"))
