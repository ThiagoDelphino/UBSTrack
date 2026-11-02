"""Regra 6 do guia: distância em linha reta e tempo de deslocamento."""
import pytest

from app.domain import geo


def test_distancia_entre_o_mesmo_ponto_e_zero():
    assert geo.distancia_km(-23.5, -47.45, -23.5, -47.45) == 0


def test_um_grau_de_latitude_tem_cerca_de_111_km():
    assert geo.distancia_km(0, 0, 1, 0) == pytest.approx(111.19, abs=0.1)


def test_distancia_e_simetrica():
    ida = geo.distancia_km(-23.50, -47.45, -23.45, -47.40)
    volta = geo.distancia_km(-23.45, -47.40, -23.50, -47.45)
    assert ida == pytest.approx(volta)


def test_deslocamento_a_25_kmh():
    assert geo.deslocamento_min(25, 25) == 60
    assert geo.deslocamento_min(5, 25) == pytest.approx(12)


def test_deslocamento_sem_distancia_e_zero():
    assert geo.deslocamento_min(0, 25) == 0


@pytest.mark.parametrize("velocidade", [0, -10])
def test_velocidade_invalida_e_recusada(velocidade):
    with pytest.raises(ValueError):
        geo.deslocamento_min(5, velocidade)
