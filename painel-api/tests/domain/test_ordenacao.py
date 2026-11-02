"""Regras 6, 7 e 8 do guia: ordenação numerada das unidades."""
from app.domain.ordenacao import ItemRanking, ordenar_e_numerar


def item(id, nome, tempo, aberta=True, desatualizada=False):
    return ItemRanking(id=id, nome=nome, aberta=aberta, desatualizada=desatualizada, tempo_min=tempo)


def test_menor_tempo_fica_em_primeiro():
    itens = [item(1, "A", 40), item(2, "B", 10), item(3, "C", 25)]
    assert ordenar_e_numerar(itens) == [(2, 1), (3, 2), (1, 3)]


def test_desatualizada_vai_para_o_fim_mas_continua_numerada():
    itens = [item(1, "A", 5, desatualizada=True), item(2, "B", 50), item(3, "C", 60)]
    assert ordenar_e_numerar(itens) == [(2, 1), (3, 2), (1, 3)]


def test_fechada_aparece_no_fim_sem_posicao():
    itens = [item(1, "A", 1, aberta=False), item(2, "B", 50), item(3, "C", 5, desatualizada=True)]
    assert ordenar_e_numerar(itens) == [(2, 1), (3, 2), (1, None)]


def test_empate_desempata_pelo_nome_sem_diferenciar_maiusculas():
    itens = [item(1, "beta", 20), item(2, "Alfa", 20)]
    assert ordenar_e_numerar(itens) == [(2, 1), (1, 2)]


def test_empate_total_desempata_pelo_id():
    itens = [item(9, "Igual", 20), item(4, "Igual", 20)]
    assert ordenar_e_numerar(itens) == [(4, 1), (9, 2)]


def test_lista_vazia():
    assert ordenar_e_numerar([]) == []


def test_so_fechadas_nao_recebem_posicao():
    itens = [item(1, "A", 5, aberta=False), item(2, "B", 5, aberta=False)]
    assert ordenar_e_numerar(itens) == [(1, None), (2, None)]
