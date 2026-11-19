from app.domain.automatico import Parametros, decidir_acoes, duracao_da_senha_s

P = Parametros()
NUNCA = 0.99  # sorteio que não dispara nada
SEMPRE = 0.0  # sorteio que dispara tudo


def test_duracao_fica_dentro_da_faixa_e_e_estavel():
    for i in range(1, 200):
        d = duracao_da_senha_s(i, P)
        assert P.atendimento_min_s <= d <= P.atendimento_max_s
        assert d == duracao_da_senha_s(i, P)


def test_finaliza_apenas_quem_ja_cumpriu_a_duracao():
    d1 = duracao_da_senha_s(1, P)
    a = decidir_acoes(P, [], [(1, d1), (2, 0.0)], NUNCA, NUNCA)
    assert a.finalizar == (1,)


def test_chama_ate_encher_os_guiches():
    a = decidir_acoes(P, [10, 11, 12], [(1, 0.0)], NUNCA, NUNCA)
    assert a.chamar == 1  # 2 guichês, 1 ocupado
    a = decidir_acoes(P, [10, 11, 12], [], NUNCA, NUNCA)
    assert a.chamar == 2


def test_guiche_liberado_na_mesma_rodada_e_reaproveitado():
    d1 = duracao_da_senha_s(1, P)
    a = decidir_acoes(P, [10], [(1, d1), (2, 0.0)], NUNCA, NUNCA)
    assert a.finalizar == (1,) and a.chamar == 1


def test_nao_chama_mais_do_que_ha_aguardando():
    assert decidir_acoes(P, [10], [], NUNCA, NUNCA).chamar == 1
    assert decidir_acoes(P, [], [], NUNCA, NUNCA).chamar == 0


def test_desistencia_so_da_mais_recente_e_se_houver_aguardando():
    a = decidir_acoes(P, [10, 11, 12], [], NUNCA, SEMPRE)
    assert a.desistir == (12,)
    assert decidir_acoes(P, [], [], NUNCA, SEMPRE).desistir == ()


def test_desistente_nao_pode_ser_chamado():
    a = decidir_acoes(P, [10], [], NUNCA, SEMPRE)
    assert a.desistir == (10,) and a.chamar == 0


def test_chegada_respeita_probabilidade_e_limite_da_fila():
    assert decidir_acoes(P, [], [], SEMPRE, NUNCA).retirar is True
    assert decidir_acoes(P, [], [], NUNCA, NUNCA).retirar is False
    cheia = list(range(100, 100 + P.fila_maxima + 5))
    assert decidir_acoes(P, cheia, [], SEMPRE, NUNCA).retirar is False
