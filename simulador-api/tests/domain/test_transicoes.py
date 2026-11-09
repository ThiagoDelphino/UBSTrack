"""Regras 1 e 12 do guia: só as transições previstas são aceitas."""
import itertools

import pytest

from app.domain import transicoes

STATUS = ["aguardando", "em_atendimento", "finalizado", "desistiu"]
VALIDAS = {
    ("aguardando", "em_atendimento"),
    ("em_atendimento", "finalizado"),
    ("aguardando", "desistiu"),
}


@pytest.mark.parametrize("atual,novo", sorted(VALIDAS))
def test_transicoes_previstas_sao_aceitas(atual, novo):
    assert transicoes.pode_transitar(atual, novo) is True
    transicoes.validar_transicao(atual, novo)  # não levanta erro


@pytest.mark.parametrize(
    "atual,novo", [p for p in itertools.product(STATUS, STATUS) if p not in VALIDAS]
)
def test_qualquer_outra_transicao_e_recusada(atual, novo):
    assert transicoes.pode_transitar(atual, novo) is False
    with pytest.raises(transicoes.TransicaoInvalida):
        transicoes.validar_transicao(atual, novo)


def test_status_desconhecido_e_recusado():
    assert transicoes.pode_transitar("inventado", "finalizado") is False


@pytest.mark.parametrize("atual,novo", sorted(VALIDAS))
def test_origem_de_aponta_o_status_exigido(atual, novo):
    assert transicoes.origem_de(novo) == atual


def test_mensagem_de_erro_nao_mudou():
    with pytest.raises(transicoes.TransicaoInvalida) as erro:
        transicoes.validar_transicao("aguardando", "finalizado")
    assert erro.value.status_atual == "aguardando"
    assert erro.value.status_exigido == "em_atendimento"
    assert str(erro.value) == (
        "A senha está 'aguardando'; só é possível nesta ação se estiver 'em_atendimento'."
    )
