"""Regra 7 do guia: unidade aberta ou fechada pelo horário."""
from datetime import time

from app.domain import horario

ABRE = time(7, 0)
FECHA = time(19, 0)


def test_unidade_24_horas_esta_sempre_aberta():
    assert horario.esta_aberta(time(3, 0), None, None) is True


def test_horario_comercial_abre_no_horario_e_fecha_no_horario():
    assert horario.esta_aberta(time(7, 0), ABRE, FECHA) is True
    assert horario.esta_aberta(time(12, 0), ABRE, FECHA) is True
    assert horario.esta_aberta(time(18, 59), ABRE, FECHA) is True
    assert horario.esta_aberta(time(19, 0), ABRE, FECHA) is False
    assert horario.esta_aberta(time(6, 59), ABRE, FECHA) is False


def test_horario_que_atravessa_a_meia_noite():
    abre, fecha = time(19, 0), time(7, 0)
    assert horario.esta_aberta(time(23, 0), abre, fecha) is True
    assert horario.esta_aberta(time(3, 0), abre, fecha) is True
    assert horario.esta_aberta(time(12, 0), abre, fecha) is False


def test_cadastro_com_so_um_horario_nao_e_considerado_aberto():
    assert horario.esta_aberta(time(12, 0), ABRE, None) is False
    assert horario.esta_aberta(time(12, 0), None, FECHA) is False
