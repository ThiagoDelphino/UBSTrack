"""Regras 3, 4, 5 e 8 do guia: tempo médio, espera, situação e dado desatualizado."""
from datetime import datetime, timedelta, timezone

from app.domain import estimativa

AGORA = datetime(2026, 11, 2, 12, 0, tzinfo=timezone.utc)


def test_tempo_medio_sem_historico_usa_o_padrao():
    assert estimativa.tempo_medio_min([], padrao_min=15) == 15


def test_tempo_medio_e_a_media_dos_atendimentos():
    assert estimativa.tempo_medio_min([10, 20, 30], padrao_min=15) == 20


def test_espera_e_fila_vezes_tempo_medio():
    assert estimativa.espera_estimada_min(4, 15) == 60


def test_espera_com_fila_vazia_e_zero():
    assert estimativa.espera_estimada_min(0, 15) == 0


def test_situacao_nos_limites():
    # Até 30 min é baixa; de 30 a 90 é moderada; acima de 90 é alta.
    def situacao(espera):
        return estimativa.situacao_fila(espera, limite_baixa=30, limite_moderada=90)

    assert situacao(0) == "baixa"
    assert situacao(30) == "baixa"
    assert situacao(30.1) == "moderada"
    assert situacao(90) == "moderada"
    assert situacao(90.1) == "alta"


def test_minutos_desde_sem_registro_e_none():
    assert estimativa.minutos_desde(None, AGORA) is None


def test_minutos_desde_conta_minutos_inteiros():
    assert estimativa.minutos_desde(AGORA - timedelta(minutes=7, seconds=40), AGORA) == 7


def test_minutos_desde_nunca_e_negativo():
    assert estimativa.minutos_desde(AGORA + timedelta(minutes=3), AGORA) == 0


def test_desatualizado_so_acima_do_limite():
    limite = 10
    no_limite = AGORA - timedelta(minutes=10)
    passou = AGORA - timedelta(minutes=11)
    assert estimativa.esta_desatualizado(no_limite, AGORA, limite) is False
    assert estimativa.esta_desatualizado(passou, AGORA, limite) is True


def test_sem_nenhum_movimento_conta_como_desatualizado():
    assert estimativa.esta_desatualizado(None, AGORA, 10) is True
