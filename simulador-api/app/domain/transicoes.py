"""Regra 1 e 12 do guia: quais mudanças de status são permitidas (sem banco).

    aguardando     -> em_atendimento   (chamar próximo)
    em_atendimento -> finalizado       (finalizar)
    aguardando     -> desistiu         (desistir)
"""

AGUARDANDO = "aguardando"
EM_ATENDIMENTO = "em_atendimento"
FINALIZADO = "finalizado"
DESISTIU = "desistiu"

# novo status -> único status de onde se pode chegar nele
ORIGEM_PERMITIDA = {
    EM_ATENDIMENTO: AGUARDANDO,
    FINALIZADO: EM_ATENDIMENTO,
    DESISTIU: AGUARDANDO,
}


class TransicaoInvalida(Exception):
    """O status atual da senha não permite a mudança pedida."""

    def __init__(self, status_atual: str, status_exigido: str):
        self.status_atual = status_atual
        self.status_exigido = status_exigido
        super().__init__(
            f"A senha está '{status_atual}'; só é possível nesta ação se estiver '{status_exigido}'."
        )


def origem_de(novo: str) -> str:
    """Status em que a senha precisa estar para ir para `novo`."""
    return ORIGEM_PERMITIDA[novo]


def pode_transitar(atual: str, novo: str) -> bool:
    return ORIGEM_PERMITIDA.get(novo) == atual


def validar_transicao(atual: str, novo: str) -> None:
    if not pode_transitar(atual, novo):
        # novo status sem origem prevista (ex.: voltar para aguardando): nenhum serve
        raise TransicaoInvalida(atual, ORIGEM_PERMITIDA.get(novo, "(nenhum)"))
