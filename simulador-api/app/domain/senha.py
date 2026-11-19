"""Código da senha (regra 11 do guia): sequencial por unidade e por dia, A-001, A-002..."""

PREFIXO = "A"


def formatar_codigo(numero: int) -> str:
    """1 -> 'A-001'. Passando de 999, o número simplesmente cresce: 'A-1000'."""
    if numero < 1:
        raise ValueError("numero deve ser maior ou igual a 1")
    return f"{PREFIXO}-{numero:03d}"


def proximo_numero(maior_do_dia: int | None) -> int:
    """Próximo número da unidade no dia. Sem senhas hoje, começa em 1."""
    return (maior_do_dia or 0) + 1
