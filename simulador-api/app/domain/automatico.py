"""Regras do modo automático (funções puras, sem banco).

A cada rodada, para cada unidade, decide quais ações simular:
finalizar atendimentos que já duraram o suficiente, uma desistência
ocasional, chamar a próxima senha enquanto houver guichê livre e uma
nova chegada. Os sorteios entram como argumento para o teste ser
determinístico.
"""
from dataclasses import dataclass


@dataclass(frozen=True)
class Parametros:
    prob_chegada: float = 0.5  # chance de chegar uma pessoa por rodada
    prob_desistencia: float = 0.05  # chance de alguém aguardando desistir por rodada
    guiches: int = 2  # atendimentos simultâneos por unidade
    fila_maxima: int = 30  # acima disso ninguém novo chega
    atendimento_min_s: int = 60  # duração de um atendimento (comprimida para a demo)
    atendimento_max_s: int = 180


@dataclass(frozen=True)
class Acoes:
    finalizar: tuple[int, ...]  # ids em atendimento a finalizar
    desistir: tuple[int, ...]  # ids aguardando que desistem
    chamar: int  # quantas senhas chamar
    retirar: bool  # chega uma nova pessoa?


def duracao_da_senha_s(id_atendimento: int, p: Parametros) -> int:
    """Duração (em segundos) do atendimento dessa senha; fixa por id, variando entre min e max."""
    faixa = p.atendimento_max_s - p.atendimento_min_s
    return p.atendimento_min_s + (id_atendimento * 2654435761 % 2**32) % (faixa + 1)


def decidir_acoes(
    p: Parametros,
    aguardando: list[int],
    em_atendimento: list[tuple[int, float]],
    sorteio_chegada: float,
    sorteio_desistencia: float,
) -> Acoes:
    """`aguardando`: ids da mais antiga para a mais nova.
    `em_atendimento`: (id, segundos desde o início). Sorteios entre 0 e 1."""
    finalizar = tuple(i for i, seg in em_atendimento if seg >= duracao_da_senha_s(i, p))
    em_restante = len(em_atendimento) - len(finalizar)

    desistir: tuple[int, ...] = ()
    if aguardando and sorteio_desistencia < p.prob_desistencia:
        desistir = (aguardando[-1],)  # a mais recente desiste
    aguardando_restante = len(aguardando) - len(desistir)

    chamar = min(max(p.guiches - em_restante, 0), aguardando_restante)
    aguardando_restante -= chamar

    retirar = sorteio_chegada < p.prob_chegada and aguardando_restante < p.fila_maxima
    return Acoes(finalizar=finalizar, desistir=desistir, chamar=chamar, retirar=retirar)
