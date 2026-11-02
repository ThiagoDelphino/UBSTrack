"""Regra 11 do guia: código da senha sequencial por unidade e por dia."""
import pytest

from app.domain import senha


def test_primeira_senha_do_dia_e_a_001():
    assert senha.formatar_codigo(senha.proximo_numero(None)) == "A-001"


def test_proxima_senha_soma_um_ao_maior_do_dia():
    assert senha.proximo_numero(9) == 10
    assert senha.formatar_codigo(10) == "A-010"


def test_codigo_tem_tres_digitos_ate_999_e_depois_cresce():
    assert senha.formatar_codigo(7) == "A-007"
    assert senha.formatar_codigo(999) == "A-999"
    assert senha.formatar_codigo(1000) == "A-1000"


@pytest.mark.parametrize("numero", [0, -1])
def test_numero_invalido_e_recusado(numero):
    with pytest.raises(ValueError):
        senha.formatar_codigo(numero)
